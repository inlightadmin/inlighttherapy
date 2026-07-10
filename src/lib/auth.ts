import {
  createUserWithEmailAndPassword,
  deleteUser,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage'
import { auth, db, isFirebaseConfigured, storage } from './firebase'
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
  /** Defaults to true when omitted (member accounts are for the newsletter) */
  newsletterConsent?: boolean
  termsAccepted: boolean
  privacyAccepted: boolean
}

function nowIso() {
  return new Date().toISOString()
}

/** Firestore rejects `undefined` field values — strip them before writes. */
function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue
    if (v !== null && typeof v === 'object' && !Array.isArray(v) && !(v instanceof Date)) {
      out[key] = omitUndefined(v as Record<string, unknown>)
    } else {
      out[key] = v
    }
  }
  return out as T
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
  newsletterConsent?: boolean
  termsAccepted?: boolean
  privacyAccepted?: boolean
  /** When true, write/overwrite profile with signup preferences */
  forceCreate?: boolean
}

export function buildProfilePayload(
  user: User,
  extras: ProfileExtras = {},
): UserProfile {
  const role =
    extras.role ??
    initialRoleFromConsents({
      smsConsent: Boolean(extras.smsConsent),
      chatOptIn: Boolean(extras.chatOptIn),
    })

  const phone = extras.phoneE164?.trim() || undefined
  const photo = extras.photoURL ?? user.photoURL ?? undefined

  return {
    uid: user.uid,
    email: user.email ?? extras.email ?? '',
    displayName:
      extras.displayName?.trim() || user.displayName || 'Member',
    ...(photo ? { photoURL: photo } : {}),
    ...(phone ? { phoneE164: phone } : {}),
    role,
    smsConsent: extras.smsConsent
      ? {
          agreed: true,
          timestamp: nowIso(),
          marketing: true,
          reminders: true,
        }
      : { agreed: false },
    // New accounts default into the monthly newsletter unless explicitly declined
    newsletterConsent: {
      agreed: extras.newsletterConsent !== false,
      timestamp: nowIso(),
    },
    chatOptIn: Boolean(extras.chatOptIn),
    ...(extras.termsAccepted ? { termsAcceptedAt: nowIso() } : {}),
    ...(extras.privacyAccepted ? { privacyAcceptedAt: nowIso() } : {}),
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

  // Existing profile: only return as-is when not forcing a signup write
  if (snap.exists() && !extras.forceCreate) {
    return snap.data() as UserProfile
  }

  const profile = buildProfilePayload(user, extras)
  const payload = omitUndefined({
    ...profile,
    createdAt: snap.exists()
      ? (snap.data()?.createdAt ?? serverTimestamp())
      : serverTimestamp(),
    updatedAt: serverTimestamp(),
  } as Record<string, unknown>)

  // merge so a failed earlier write can be repaired on retry
  await setDoc(ref, payload, { merge: true })

  const saved = await getDoc(ref)
  return (saved.data() as UserProfile) ?? profile
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
    newsletterConsent: input.newsletterConsent !== false,
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
  displayName?: string
  termsAccepted?: boolean
  privacyAccepted?: boolean
  smsConsent?: boolean
  chatOptIn?: boolean
  newsletterConsent?: boolean
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

  // Signup with Google: always write preferences (merge) so opt-ins stick
  if (options?.requireConsents) {
    return ensureUserProfile(cred.user, {
      displayName: options.displayName || cred.user.displayName || 'Member',
      phoneE164: options.phoneE164,
      smsConsent: Boolean(options.smsConsent),
      chatOptIn: Boolean(options.chatOptIn),
      newsletterConsent: options.newsletterConsent !== false,
      termsAccepted: Boolean(options.termsAccepted),
      privacyAccepted: Boolean(options.privacyAccepted),
      forceCreate: true,
    })
  }

  if (!existing) {
    return ensureUserProfile(cred.user, {
      termsAccepted: true,
      privacyAccepted: true,
      forceCreate: true,
    })
  }

  return existing
}

export async function signOut() {
  if (!auth) throw new Error('Firebase is not configured')
  await firebaseSignOut(auth)
}

/** Permanently delete Auth user, Firestore profile, and profile storage files. */
export async function deleteUserAccount(user: User): Promise<void> {
  if (!db) throw new Error('Firestore is not configured')
  const uid = user.uid

  // Best-effort cleanup of profile files (avatar, etc.)
  if (storage) {
    try {
      const folder = storageRef(storage, `profiles/${uid}`)
      const listed = await listAll(folder)
      await Promise.all(listed.items.map((item) => deleteObject(item)))
    } catch {
      // Ignore missing folder / storage errors so Auth delete can still proceed
    }
  }

  try {
    await deleteDoc(doc(db, 'users', uid))
  } catch {
    // Profile may already be gone
  }

  try {
    await deleteUser(user)
  } catch (err) {
    const code =
      typeof err === 'object' && err && 'code' in err
        ? String((err as { code: string }).code)
        : ''
    if (code === 'auth/requires-recent-login') {
      throw new Error(
        'For security, please log out, log back in, then try removing your account again.',
      )
    }
    throw err instanceof Error ? err : new Error('Could not delete account.')
  }
}

const MAX_AVATAR_BYTES = 5 * 1024 * 1024

/** Update display name in Auth + Firestore profile. */
export async function updateUserDisplayName(
  user: User,
  displayName: string,
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const name = displayName.trim()
  if (!name) throw new Error('Name cannot be empty.')
  if (name.length > 80) throw new Error('Name must be 80 characters or fewer.')

  await updateProfile(user, { displayName: name })
  const ref = doc(db, 'users', user.uid)
  await setDoc(
    ref,
    omitUndefined({
      displayName: name,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  )
  await user.reload()
  const saved = await getDoc(ref)
  if (!saved.exists()) {
    return ensureUserProfile(user, { displayName: name, forceCreate: true })
  }
  return saved.data() as UserProfile
}

/** Upload avatar to Storage and sync Auth + Firestore photoURL. */
export async function updateUserPhoto(
  user: User,
  file: File,
): Promise<UserProfile> {
  if (!db || !storage) throw new Error('Firebase is not configured')
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, WebP, or GIF).')
  }
  if (file.size > MAX_AVATAR_BYTES) {
    throw new Error('Image must be smaller than 5 MB.')
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg'

  const path = `profiles/${user.uid}/avatar.${ext}`
  const objectRef = storageRef(storage, path)
  await uploadBytes(objectRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=3600',
  })
  // Cache-bust so the UI refreshes immediately after overwrite
  const baseUrl = await getDownloadURL(objectRef)
  const photoURL = baseUrl.includes('?')
    ? `${baseUrl}&t=${Date.now()}`
    : `${baseUrl}?t=${Date.now()}`

  await updateProfile(user, { photoURL })
  const ref = doc(db, 'users', user.uid)
  await setDoc(
    ref,
    omitUndefined({
      photoURL,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  )
  await user.reload()
  const saved = await getDoc(ref)
  if (!saved.exists()) {
    return ensureUserProfile(user, {
      displayName: user.displayName ?? 'Member',
      photoURL,
      forceCreate: true,
    })
  }
  return saved.data() as UserProfile
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

  const patch = omitUndefined({
    role: nextRole,
    updatedAt: serverTimestamp(),
    ...(reason === 'chat' ? { chatOptIn: true } : {}),
    ...(reason === 'sms'
      ? {
          smsConsent: {
            agreed: true,
            timestamp: nowIso(),
            marketing: true,
            reminders: true,
          },
          ...(phoneE164?.trim() ? { phoneE164: phoneE164.trim() } : {}),
        }
      : {}),
  } as Record<string, unknown>)

  await updateDoc(ref, patch)
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/**
 * If role is only CLIENT (not staff) and both chat + SMS are off, demote to USER.
 * CLINICIAN / PUBLICIST / ADMIN roles are never demoted by preference changes.
 */
function roleAfterPreferenceChange(
  current: UserProfile,
  nextChat: boolean,
  nextSms: boolean,
): Role {
  if (hasMinRole(current.role, 'CLINICIAN')) return current.role
  if (nextChat || nextSms) return 'CLIENT'
  return 'USER'
}

/** Opt out of live chat. May demote CLIENT → USER if SMS is also off. */
export async function optOutOfChat(uid: string): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  const current = snap.data() as UserProfile
  const nextSms = Boolean(current.smsConsent?.agreed)
  const nextRole = roleAfterPreferenceChange(current, false, nextSms)

  await updateDoc(
    ref,
    omitUndefined({
      chatOptIn: false,
      role: nextRole,
      updatedAt: serverTimestamp(),
    } as Record<string, unknown>),
  )
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/** Withdraw SMS consent. May demote CLIENT → USER if chat is also off. Keeps phone on file. */
export async function optOutOfSms(uid: string): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  const current = snap.data() as UserProfile
  const nextChat = Boolean(current.chatOptIn)
  const nextRole = roleAfterPreferenceChange(current, nextChat, false)

  await updateDoc(
    ref,
    omitUndefined({
      smsConsent: {
        agreed: false,
        timestamp: nowIso(),
        marketing: false,
        reminders: false,
      },
      role: nextRole,
      updatedAt: serverTimestamp(),
    } as Record<string, unknown>),
  )
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/** Opt in to the monthly email newsletter. */
export async function optInToNewsletter(uid: string): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  await updateDoc(ref, {
    newsletterConsent: {
      agreed: true,
      timestamp: nowIso(),
    },
    updatedAt: serverTimestamp(),
  })
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/** Opt out of the monthly email newsletter. Does not change role. */
export async function optOutOfNewsletter(uid: string): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  await updateDoc(ref, {
    newsletterConsent: {
      agreed: false,
      timestamp: nowIso(),
    },
    updatedAt: serverTimestamp(),
  })
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/** Save / update mobile number (does not by itself grant SMS consent). */
export async function updateUserPhone(
  uid: string,
  phoneE164: string,
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const phone = phoneE164.trim()
  if (!phone) throw new Error('Enter a phone number, or use Remove phone.')
  if (phone.length > 32) throw new Error('Phone number is too long.')

  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  await updateDoc(ref, {
    phoneE164: phone,
    updatedAt: serverTimestamp(),
  })
  const updated = await getDoc(ref)
  return updated.data() as UserProfile
}

/**
 * Remove phone from profile. Also withdraws SMS consent (can't message without a number)
 * and may demote CLIENT → USER if chat is also off.
 */
export async function removeUserPhone(uid: string): Promise<UserProfile> {
  if (!db) throw new Error('Firestore is not configured')
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) throw new Error('Profile not found')

  const current = snap.data() as UserProfile
  const nextChat = Boolean(current.chatOptIn)
  const nextRole = roleAfterPreferenceChange(current, nextChat, false)

  await updateDoc(ref, {
    phoneE164: deleteField(),
    smsConsent: {
      agreed: false,
      timestamp: nowIso(),
      marketing: false,
      reminders: false,
    },
    role: nextRole,
    updatedAt: serverTimestamp(),
  })
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
