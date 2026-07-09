/**
 * 1st gen Firestore trigger — avoids Eventarc Service Agent setup required
 * by 2nd gen document triggers on first-time projects.
 */
import * as functions from "firebase-functions/v1";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

initializeApp();

const VALID_ROLES = new Set([
  "USER",
  "CLIENT",
  "CLINICIAN",
  "PUBLICIST",
  "ADMIN",
]);

/**
 * Mirror Firestore users/{uid}.role into Auth custom claims so security rules
 * and the client can trust request.auth.token.role.
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
