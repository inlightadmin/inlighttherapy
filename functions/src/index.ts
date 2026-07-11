/**
 * Cloud Functions for In-Light Therapy.
 * - syncUserRoleClaims: 1st gen Firestore trigger (custom claims)
 * - sendContactEmail: 2nd gen callable (SendGrid)
 */
import * as functions from "firebase-functions/v1";
import {onCall, HttpsError} from "firebase-functions/v2/https";
import {defineSecret} from "firebase-functions/params";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import {getFirestore, FieldValue} from "firebase-admin/firestore";
import * as logger from "firebase-functions/logger";
import sgMail from "@sendgrid/mail";

initializeApp();

const VALID_ROLES = new Set([
  "USER",
  "CLIENT",
  "CLINICIAN",
  "PUBLICIST",
  "ADMIN",
]);

const sendgridApiKey = defineSecret("SENDGRID_API_KEY");

/**
 * Practice inbox (Sean) receives contact form messages.
 * SendGrid From stays on the verified developer sender until domain auth
 * (hello@in-lighttherapy.com) is configured.
 */
const CONTACT_TO = "s3an1amb@gmail.com";
const CONTACT_FROM = "inlightadmin@gmail.com";
const CONTACT_FROM_NAME = "In-Light Therapy Website";

/**
 * Mirror Firestore users/{uid}.role into Auth custom claims.
 */
export const syncUserRoleClaims = functions
  .region("us-west2")
  .firestore.document("users/{uid}")
  .onWrite(async (change, context) => {
    const uid = context.params.uid as string;

    if (!change.after.exists) {
      logger.info("User profile deleted; clearing claims", {uid});
      await getAuth().setCustomUserClaims(uid, {role: "USER"});
      return;
    }

    const role = change.after.get("role") as string | undefined;
    if (!role || !VALID_ROLES.has(role)) {
      logger.warn("Invalid or missing role; defaulting to USER", {uid, role});
      await getAuth().setCustomUserClaims(uid, {role: "USER"});
      return;
    }

    const user = await getAuth().getUser(uid);
    const current = (user.customClaims?.role as string | undefined) ?? null;
    if (current === role) {
      return;
    }

    await getAuth().setCustomUserClaims(uid, {role});
    logger.info("Synced custom claims", {uid, role});
  });

type ContactPayload = {
  name?: unknown;
  email?: unknown;
  message?: unknown;
};

function asTrimmedString(value: unknown, field: string, max: number): string {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }
  const trimmed = value.trim();
  if (!trimmed) {
    throw new HttpsError("invalid-argument", `${field} is required.`);
  }
  if (trimmed.length > max) {
    throw new HttpsError(
      "invalid-argument",
      `${field} must be at most ${max} characters.`,
    );
  }
  return trimmed;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Contact form: email practice inbox via SendGrid and store a Firestore copy.
 */
export const sendContactEmail = onCall(
  {
    region: "us-west2",
    secrets: [sendgridApiKey],
    invoker: "public",
    cors: true,
  },
  async (request) => {
    const data = (request.data ?? {}) as ContactPayload;

    const name = asTrimmedString(data.name, "Name", 120);
    const email = asTrimmedString(data.email, "Email", 200).toLowerCase();
    const message = asTrimmedString(data.message, "Message", 5000);

    if (!isValidEmail(email)) {
      throw new HttpsError("invalid-argument", "Please enter a valid email.");
    }

    const key = sendgridApiKey.value();
    if (!key) {
      logger.error("SENDGRID_API_KEY secret is empty");
      throw new HttpsError("failed-precondition", "Email is not configured.");
    }

    sgMail.setApiKey(key);

    const subject = `Website contact from ${name}`;
    const textBody = [
      "New message from the In-Light Therapy website",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Auth UID: ${request.auth?.uid ?? "(guest)"}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const htmlBody = `
      <p><strong>New message from the In-Light Therapy website</strong></p>
      <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
      <strong>Email:</strong> ${escapeHtml(email)}<br/>
      <strong>Auth UID:</strong> ${escapeHtml(request.auth?.uid ?? "(guest)")}</p>
      <p><strong>Message:</strong></p>
      <p>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
    `;

    try {
      await sgMail.send({
        to: CONTACT_TO,
        from: {email: CONTACT_FROM, name: CONTACT_FROM_NAME},
        replyTo: {email, name},
        subject,
        text: textBody,
        html: htmlBody,
      });
    } catch (err) {
      logger.error("SendGrid send failed", err);
      throw new HttpsError(
        "internal",
        "Could not send your message. Please try again or email us directly.",
      );
    }

    try {
      await getFirestore().collection("contactMessages").add({
        name,
        email,
        message,
        fromUid: request.auth?.uid ?? null,
        createdAt: FieldValue.serverTimestamp(),
        source: "contact-form",
      });
    } catch (err) {
      // Email already sent — log but still return success
      logger.warn("contactMessages write failed after email send", err);
    }

    logger.info("Contact email sent", {email, name});
    return {ok: true};
  },
);

const STAFF_ROLES = new Set(["PUBLICIST", "ADMIN"]);

/**
 * Email a published newsletter issue to all users with newsletterConsent.agreed.
 * Callable by PUBLICIST / ADMIN only.
 */
export const sendNewsletterBlast = onCall(
  {
    region: "us-west2",
    secrets: [sendgridApiKey],
    invoker: "public",
    cors: true,
    timeoutSeconds: 300,
    memory: "512MiB",
  },
  async (request) => {
    try {
      if (!request.auth?.uid) {
        throw new HttpsError("unauthenticated", "Sign in required.");
      }

      const db = getFirestore();
      const callerSnap = await db
        .collection("users")
        .doc(request.auth.uid)
        .get();
      const callerRole = callerSnap.data()?.role as string | undefined;
      if (!callerRole || !STAFF_ROLES.has(callerRole)) {
        throw new HttpsError(
          "permission-denied",
          "Only PUBLICIST or ADMIN can send newsletters.",
        );
      }

      const newsletterId = asTrimmedString(
        (request.data as {newsletterId?: unknown})?.newsletterId,
        "newsletterId",
        128,
      );

      const issueSnap = await db
        .collection("newsletters")
        .doc(newsletterId)
        .get();
      if (!issueSnap.exists) {
        throw new HttpsError("not-found", "Newsletter issue not found.");
      }
      const issue = issueSnap.data()!;
      if (issue.status === "archived") {
        throw new HttpsError(
          "failed-precondition",
          "Unarchive the issue before sending a blast.",
        );
      }
      if (issue.status !== "published") {
        throw new HttpsError(
          "failed-precondition",
          "Publish the issue before sending a blast.",
        );
      }

      const title = String(issue.title ?? "In-Light Therapy Newsletter");
      const body = String(issue.body ?? "");
      if (!body.trim()) {
        throw new HttpsError("failed-precondition", "Issue body is empty.");
      }

      const key = sendgridApiKey.value();
      if (!key) {
        throw new HttpsError("failed-precondition", "Email is not configured.");
      }
      sgMail.setApiKey(key);

      const usersSnap = await db.collection("users").get();
      const recipients: {email: string; name: string}[] = [];
      for (const userDoc of usersSnap.docs) {
        const data = userDoc.data();
        const agreed = data.newsletterConsent?.agreed === true;
        const email = typeof data.email === "string" ? data.email.trim() : "";
        if (!agreed || !email || !isValidEmail(email)) continue;
        recipients.push({
          email: email.toLowerCase(),
          name: String(data.displayName || "Friend"),
        });
      }

      const unique = new Map<string, string>();
      for (const r of recipients) {
        if (!unique.has(r.email)) unique.set(r.email, r.name);
      }

      const list = [...unique.entries()].map(([email, name]) => ({
        email,
        name,
      }));
      if (list.length === 0) {
        throw new HttpsError(
          "failed-precondition",
          "No subscribed members with valid emails.",
        );
      }

      const siteUrl = "https://in-lighttherapy.web.app";
      const textBody = [
        title,
        "",
        body,
        "",
        "—",
        "In-Light Therapy",
        "Manage subscription: " + siteUrl + "/account",
        "Recent newsletters: " + siteUrl + "/newsletter",
      ].join("\n");

      const htmlBody = `
      <div style="font-family:Georgia,serif;max-width:640px;margin:0 auto;color:#1f2933">
        <h1 style="font-size:28px;font-weight:600">${escapeHtml(title)}</h1>
        <div style="font-size:16px;line-height:1.6;white-space:pre-wrap">${escapeHtml(body).replace(/\n/g, "<br/>")}</div>
        <hr style="border:none;border-top:1px solid #e8dfd2;margin:28px 0"/>
        <p style="font-size:13px;color:#5c6b7a">
          In-Light Therapy ·
          <a href="${siteUrl}/account">Manage subscription</a> ·
          <a href="${siteUrl}/newsletter">Recent newsletters</a>
        </p>
      </div>
    `;

      const CHUNK = 500;
      let sent = 0;
      for (let i = 0; i < list.length; i += CHUNK) {
        const chunk = list.slice(i, i + CHUNK);
        try {
          // Send one-by-one within chunk fallbacks if batch personalizations fail
          await sgMail.sendMultiple({
            to: chunk.map((r) => r.email),
            from: {email: CONTACT_FROM, name: "In-Light Therapy"},
            subject: title,
            text: textBody,
            html: htmlBody,
          });
          sent += chunk.length;
        } catch (err) {
          logger.error("Newsletter blast chunk failed", {
            i,
            err: serializeErr(err),
          });
          // Fallback: send individually so one bad address doesn't kill all
          for (const r of chunk) {
            try {
              await sgMail.send({
                to: r.email,
                from: {email: CONTACT_FROM, name: "In-Light Therapy"},
                subject: title,
                text: textBody,
                html: htmlBody,
              });
              sent += 1;
            } catch (oneErr) {
              logger.warn("Skip recipient", {
                email: r.email,
                err: serializeErr(oneErr),
              });
            }
          }
        }
      }

      if (sent === 0) {
        throw new HttpsError(
          "internal",
          "SendGrid rejected all recipients. Verify sender authentication and API key Mail Send access.",
        );
      }

      await issueSnap.ref.update({
        sentAt: FieldValue.serverTimestamp(),
        sentCount: sent,
        updatedAt: FieldValue.serverTimestamp(),
      });

      logger.info("Newsletter blast complete", {newsletterId, sent});
      return {sent, skipped: Math.max(0, list.length - sent)};
    } catch (err) {
      if (err instanceof HttpsError) throw err;
      logger.error("sendNewsletterBlast failed", serializeErr(err));
      const detail =
        err && typeof err === "object" && "message" in err
          ? String((err as {message: string}).message)
          : "Unknown error";
      throw new HttpsError(
        "internal",
        `Newsletter blast failed: ${detail.slice(0, 200)}`,
      );
    }
  },
);

function serializeErr(err: unknown): unknown {
  if (!err || typeof err !== "object") return err;
  const e = err as {
    message?: string;
    code?: string | number;
    response?: {body?: unknown};
  };
  return {
    message: e.message,
    code: e.code,
    body: e.response?.body,
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
