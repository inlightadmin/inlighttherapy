import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { auth, db, isFirebaseConfigured } from './firebase'
import type { Role, UserProfile } from './types'
import { hasMinRole } from './types'

const googleProvider = new GoogleAuthProvider()

export type SignupInput = {
  displayName: string
  email: string
  password: string
  phoneE164?: string
  smsConsent: boolean
  chatOptIn: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
}

function nowIso() {
  return new Date().toISOString()
}

/** Role after signup consents — CLIENT if chat or SMS opted in */
export function initialRoleFromConsents(input: {
  smsConsent: boolean
  chatOptIn: boolean
}): Role {
  if (input.smsConsent || input.chatOptIn) return 'CLIENT'
  return 'USER'
}

type ProfileExtras = {
  email?: string
  displayName?: string
  photoURL?: string
  phoneE164?: string
  role?: Role
  smsConsent?: boolean
  chatOptIn?: boolean
  termsAccepted?: boolean
  privacyAccepted?: boolean
  forceCreate?: boolean
}

export async function buildProfilePayload(
  user: User,
  extras: ProfileExtras = {},
): Promise<UserProfile> {
  const role =
    extras.role ??
    initialRoleFromConsents({
      smsConsent: Boolean(extras.smsConsent),
      chatOptIn: Boolean(extras.chatOptIn),
    })

  return {
    uid: user.uid,
    email: user.email ?? extras.email ?? '',
    displayName: extras.displayName ?? user.displayName ?? 'Member',
    photoURL: extras.photoURL ?? user.photoURL ?? undefined,
    phoneE164: extras.phoneE164 || undefined,
    role,
    smsConsent: extras.smsConsent
      ? {
          agreed: true,
          timestamp: nowIso(),
          marketing: true,
          reminders: true,
        }
      : { agreed: false },
    chatOptIn: Boolean(extras.chatOptIn),
    termsAcceptedAt: extras.termsAccepted ? nowIso() : undefined,
    privacyAcceptedAt: extras.privacyAccepted ? nowIso() : undefined,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
}

export async function ensureUserProfile(
  user: User,
  extras: ProfileExtras = {},
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')

  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)

  if (snap.exists() && !extras.forceCreate) {
    return snap.data() as UserProfile
  }

  const profile = await buildProfilePayload(user, extras)
  await setDoc(ref, {
    ...profile,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  return profile
}

export async function fetchUserProfile(
  uid: string,
): Promise<UserProfile | null> {
  if (!db) return null
  const snap = await getDoc(doc(db, 'users', uid))
  if (!snap.exists()) return null
  return snap.data() as UserProfile
}

export async function signUpWithEmail(input: SignupInput): Promise<UserProfile> {
  if (!auth || !db) throw new Error('Firebase is not configured')
  if (!input.termsAccepted || !input.privacyAccepted) {
    throw new Error('You must accept the Terms and Privacy Policy.')
  }
  if (input.smsConsent && !input.phoneE164?.trim()) {
    throw new Error('A mobile number is required when you consent to SMS.')
  }

  const cred = await createUserWithEmailAndPassword(
    auth,
    input.email.trim(),
    input.password,
  )
  await updateProfile(cred.user, { displayName: input.displayName.trim() })

  return ensureUserProfile(cred.user, {
    displayName: input.displayName.trim(),
    phoneE164: input.phoneE164?.trim(),
    smsConsent: input.smsConsent,
    chatOptIn: input.chatOptIn,
    termsAccepted: input.termsAccepted,
    privacyAccepted: input.privacyAccepted,
    forceCreate: true,
  })
}

export async function signInWithEmail(email: string, password: string) {
  if (!auth) throw new Error('Firebase is not configured')
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password)
  await ensureUserProfile(cred.user)
  return cred.user
}

export async function signInWithGoogle(options?: {
  termsAccepted?: boolean
  privacyAccepted?: boolean
  smsConsent?: boolean
  chatOptIn?: boolean
  phoneE164?: string
  requireConsents?: boolean
}) {
  if (!auth) throw new Error('Firebase is not configured')

  if (options?.requireConsents) {
    if (!options.termsAccepted || !options.privacyAccepted) {
      throw new Error('You must accept the Terms and Privacy Policy.')
    }
    if (options.smsConsent && !options.phoneE164?.trim()) {
      throw new Error('A mobile number is required when you consent to SMS.')
    }
  }

  const cred = await signInWithPopup(auth, googleProvider)
  const existing = await fetchUserProfile(cred.user.uid)

  if (!existing) {
    if (options?.requireConsents === false) {
      // Login path: create minimal USER if first Google login without signup form
      return ensureUserProfile(cred.user, {
        termsAccepted: true,
        privacyAccepted: true,
        forceCreate: true,
      })
    }
    return ensureUserProfile(cred.user, {
      displayName: cred.user.displayName ?? 'Member',
      phoneE164: options?.phoneE164,
      smsConsent: Boolean(options?.smsConsent),
      chatOptIn: Boolean(options?.chatOptIn),
      termsAccepted: Boolean(options?.termsAccepted),
      privacyAccepted: Boolean(options?.privacyAccepted),
      forceCreate: true,
    })
  }

  return existing
}

export async function signOut() {
  if (!auth) throw new Error('Firebase is not configured')
  await firebaseSignOut(auth)
}

/** Promote USER → CLIENT when opting into chat or SMS (idempotent for higher roles). */
export async function promoteToClient(
  uid: string,
  reason: 'chat' | 'sms',
  phoneE164?: string,
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  const current = snap.data() as UserProfile
  const nextRole: Role = hasMinRole(current.role, 'CLIENT')
    ? current.role
    : 'CLIENT'

  const patch: Record<string, unknown> = {
    role: nextRole,
    updatedAt: serverTimestamp(),
  }

  if (reason === 'chat') {
    patch.chatOptIn = true
  }
  if (reason === 'sms') {
    patch.smsConsent = {
      agreed: true,
      timestamp: nowIso(),
      marketing: true,
      reminders: true,
    }
    if (phoneE164) patch.phoneE164 = phoneE164
  }

  await updateDoc(ref, patch)
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

export function subscribeAuth(callback: (user: User | null) => void) {
  if (!auth || !isFirebaseConfigured) {
    callback(null)
    return () => undefined
  }
  return onAuthStateChanged(auth, callback)
}

export { hasMinRole }
