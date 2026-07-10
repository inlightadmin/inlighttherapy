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

/** Practice inbox + verified SendGrid single sender (or domain sender). */
const CONTACT_TO = "inlightadmin@gmail.com";
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

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
