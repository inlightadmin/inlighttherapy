import {setGlobalOptions} from "firebase-functions/v2";
import {onDocumentWritten} from "firebase-functions/v2/firestore";
import {initializeApp} from "firebase-admin/app";
import {getAuth} from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

initializeApp();
setGlobalOptions({maxInstances: 10, region: "us-west2"});

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
export const syncUserRoleClaims = onDocumentWritten(
  "users/{uid}",
  async (event) => {
    const uid = event.params.uid;
    const after = event.data?.after;
    if (!after?.exists) {
      logger.info("User profile deleted; clearing claims", {uid});
      await getAuth().setCustomUserClaims(uid, {role: "USER"});
      return;
    }

    const role = after.get("role") as string | undefined;
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
  },
);
