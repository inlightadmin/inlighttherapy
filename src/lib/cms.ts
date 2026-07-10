import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore'
import { getDownloadURL, ref as storageRef, uploadBytes } from 'firebase/storage'
import { db, storage } from './firebase'
import type {
  BusinessHours,
  ClinicianProfile,
  Role,
  SiteQuote,
  Tool,
  UserProfile,
  WeeklyHours,
} from './types'
import {
  DAY_NAMES,
  PLACEHOLDER_CLINICIANS,
  PLACEHOLDER_HOURS,
  PLACEHOLDER_QUOTES,
  PLACEHOLDER_TOOLS,
} from './content'

function requireDb() {
  if (!db) throw new Error('Firestore is not configured')
  return db
}

function omitUndefined<T extends Record<string, unknown>>(value: T): T {
  const out: Record<string, unknown> = {}
  for (const [key, v] of Object.entries(value)) {
    if (v === undefined) continue
    if (
      v !== null &&
      typeof v === 'object' &&
      !Array.isArray(v) &&
      !(v instanceof Date)
    ) {
      out[key] = omitUndefined(v as Record<string, unknown>)
    } else {
      out[key] = v
    }
  }
  return out as T
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.map(String).filter(Boolean)
}

function asWeeklyHours(value: unknown): WeeklyHours | undefined {
  if (!Array.isArray(value)) return undefined
  return value as WeeklyHours
}

// ── Quotes ──────────────────────────────────────────────────────────

export async function listQuotes(): Promise<SiteQuote[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'quotes'))
  const items = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      text: String(data.text ?? ''),
      attribution: data.attribution ? String(data.attribution) : undefined,
      active: Boolean(data.active),
      order: typeof data.order === 'number' ? data.order : 0,
    } satisfies SiteQuote
  })
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function listActiveQuotes(): Promise<SiteQuote[]> {
  try {
    const all = await listQuotes()
    const active = all.filter((q) => q.active && q.text.trim())
    return active.length ? active : PLACEHOLDER_QUOTES
  } catch {
    return PLACEHOLDER_QUOTES
  }
}

export async function createQuote(
  input: Omit<SiteQuote, 'id'>,
): Promise<string> {
  const database = requireDb()
  const ref = await addDoc(
    collection(database, 'quotes'),
    omitUndefined({
      text: input.text.trim(),
      attribution: input.attribution?.trim() || null,
      active: input.active,
      order: input.order ?? 0,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }),
  )
  return ref.id
}

export async function updateQuote(
  id: string,
  input: Partial<Omit<SiteQuote, 'id'>>,
): Promise<void> {
  const database = requireDb()
  await updateDoc(
    doc(database, 'quotes', id),
    omitUndefined({
      ...(input.text !== undefined ? { text: input.text.trim() } : {}),
      ...(input.attribution !== undefined
        ? { attribution: input.attribution.trim() || null }
        : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      updatedAt: serverTimestamp(),
    }),
  )
}

export async function deleteQuote(id: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'quotes', id))
}

// ── Tools ───────────────────────────────────────────────────────────

export async function listTools(options?: {
  includeUnpublished?: boolean
}): Promise<Tool[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'tools'))
  let items = snap.docs.map((d) => {
    const data = d.data()
    return {
      id: d.id,
      title: String(data.title ?? ''),
      summary: String(data.summary ?? ''),
      body: String(data.body ?? ''),
      icon: data.icon ? String(data.icon) : undefined,
      order: typeof data.order === 'number' ? data.order : 0,
      published: Boolean(data.published),
    } satisfies Tool
  })
  if (!options?.includeUnpublished) {
    items = items.filter((t) => t.published)
  }
  return items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
}

export async function listPublishedTools(): Promise<Tool[]> {
  try {
    const tools = await listTools({ includeUnpublished: false })
    return tools.length ? tools : PLACEHOLDER_TOOLS.filter((t) => t.published)
  } catch {
    return PLACEHOLDER_TOOLS.filter((t) => t.published)
  }
}

export async function createTool(
  input: Omit<Tool, 'id'>,
): Promise<string> {
  const database = requireDb()
  const ref = await addDoc(
    collection(database, 'tools'),
    omitUndefined({
      title: input.title.trim(),
      summary: input.summary.trim(),
      body: input.body.trim(),
      icon: input.icon?.trim() || null,
      order: input.order ?? 0,
      published: input.published,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }),
  )
  return ref.id
}

export async function updateTool(
  id: string,
  input: Partial<Omit<Tool, 'id'>>,
): Promise<void> {
  const database = requireDb()
  await updateDoc(
    doc(database, 'tools', id),
    omitUndefined({
      ...(input.title !== undefined ? { title: input.title.trim() } : {}),
      ...(input.summary !== undefined ? { summary: input.summary.trim() } : {}),
      ...(input.body !== undefined ? { body: input.body.trim() } : {}),
      ...(input.icon !== undefined ? { icon: input.icon.trim() || null } : {}),
      ...(input.order !== undefined ? { order: input.order } : {}),
      ...(input.published !== undefined ? { published: input.published } : {}),
      updatedAt: serverTimestamp(),
    }),
  )
}

export async function deleteTool(id: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'tools', id))
}

// ── Business hours ──────────────────────────────────────────────────

const HOURS_DOC = 'businessHours'

export async function getBusinessHours(): Promise<BusinessHours> {
  try {
    const database = requireDb()
    const snap = await getDoc(doc(database, 'siteSettings', HOURS_DOC))
    if (!snap.exists()) return PLACEHOLDER_HOURS
    const data = snap.data()
    return {
      timezone: String(data.timezone ?? PLACEHOLDER_HOURS.timezone),
      note: data.note ? String(data.note) : undefined,
      weekly: (asWeeklyHours(data.weekly) ??
        PLACEHOLDER_HOURS.weekly) as WeeklyHours,
    }
  } catch {
    return PLACEHOLDER_HOURS
  }
}

export async function saveBusinessHours(hours: BusinessHours): Promise<void> {
  const database = requireDb()
  await setDoc(
    doc(database, 'siteSettings', HOURS_DOC),
    omitUndefined({
      timezone: hours.timezone,
      note: hours.note?.trim() || null,
      weekly: hours.weekly,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  )
}

export function defaultWeeklyHours(): WeeklyHours {
  return DAY_NAMES.map((_, day) => ({
    day,
    open: day === 0 || day === 6 ? '' : '09:00',
    close: day === 0 || day === 6 ? '' : day === 5 ? '15:00' : '17:00',
    closed: day === 0 || day === 6,
  }))
}

// ── Clinicians ──────────────────────────────────────────────────────

function mapClinician(id: string, data: DocumentData): ClinicianProfile {
  return {
    uid: id,
    slug: String(data.slug ?? id),
    displayName: String(data.displayName ?? 'Clinician'),
    title: data.title ? String(data.title) : undefined,
    bio: String(data.bio ?? ''),
    photoURL: data.photoURL ? String(data.photoURL) : undefined,
    modalities: asStringArray(data.modalities),
    populations: asStringArray(data.populations),
    insurance: asStringArray(data.insurance),
    expertise: asStringArray(data.expertise),
    focus: asStringArray(data.focus),
    services: asStringArray(data.services),
    calendlyUrl: data.calendlyUrl ? String(data.calendlyUrl) : undefined,
    selfAvailability: asWeeklyHours(data.selfAvailability),
    overrideAvailability: asWeeklyHours(data.overrideAvailability),
    published: data.published !== false,
  }
}

export async function listClinicians(options?: {
  includeUnpublished?: boolean
}): Promise<ClinicianProfile[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'clinicians'))
  let items = snap.docs.map((d) => mapClinician(d.id, d.data()))
  if (!options?.includeUnpublished) {
    items = items.filter((c) => c.published !== false)
  }
  return items.sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function listPublishedClinicians(): Promise<ClinicianProfile[]> {
  try {
    const items = await listClinicians({ includeUnpublished: false })
    return items.length ? items : PLACEHOLDER_CLINICIANS
  } catch {
    return PLACEHOLDER_CLINICIANS
  }
}

export async function getClinicianBySlug(
  slug: string,
): Promise<ClinicianProfile | null> {
  try {
    const all = await listClinicians({ includeUnpublished: true })
    const found = all.find((c) => c.slug === slug)
    if (found) return found
    return PLACEHOLDER_CLINICIANS.find((c) => c.slug === slug) ?? null
  } catch {
    return PLACEHOLDER_CLINICIANS.find((c) => c.slug === slug) ?? null
  }
}

export async function getClinician(uid: string): Promise<ClinicianProfile | null> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'clinicians', uid))
  if (!snap.exists()) return null
  return mapClinician(snap.id, snap.data())
}

export async function saveClinician(
  uid: string,
  input: Omit<ClinicianProfile, 'uid'> & { uid?: string },
): Promise<void> {
  const database = requireDb()
  const slug =
    input.slug?.trim() ||
    input.displayName
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') ||
    uid

  await setDoc(
    doc(database, 'clinicians', uid),
    omitUndefined({
      slug,
      displayName: input.displayName.trim(),
      title: input.title?.trim() || null,
      bio: input.bio.trim(),
      photoURL: input.photoURL || null,
      modalities: input.modalities ?? [],
      populations: input.populations ?? [],
      insurance: input.insurance ?? [],
      expertise: input.expertise ?? [],
      focus: input.focus ?? [],
      services: input.services ?? [],
      calendlyUrl: input.calendlyUrl?.trim() || null,
      selfAvailability: input.selfAvailability ?? null,
      overrideAvailability: input.overrideAvailability ?? null,
      published: input.published !== false,
      updatedAt: serverTimestamp(),
    }),
    { merge: true },
  )
}

export async function deleteClinician(uid: string): Promise<void> {
  const database = requireDb()
  await deleteDoc(doc(database, 'clinicians', uid))
}

const MAX_CLINICIAN_PHOTO_BYTES = 8 * 1024 * 1024

/** Upload clinician photo to Storage and return a cache-busted download URL. */
export async function uploadClinicianPhoto(
  uid: string,
  file: File,
): Promise<string> {
  if (!storage) throw new Error('Firebase Storage is not configured')
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, WebP, or GIF).')
  }
  if (file.size > MAX_CLINICIAN_PHOTO_BYTES) {
    throw new Error('Image must be smaller than 8 MB.')
  }

  const ext =
    file.type === 'image/png'
      ? 'png'
      : file.type === 'image/webp'
        ? 'webp'
        : file.type === 'image/gif'
          ? 'gif'
          : 'jpg'

  const path = `clinicians/${uid}/photo.${ext}`
  const objectRef = storageRef(storage, path)
  await uploadBytes(objectRef, file, {
    contentType: file.type,
    cacheControl: 'public,max-age=3600',
  })
  const baseUrl = await getDownloadURL(objectRef)
  return baseUrl.includes('?')
    ? `${baseUrl}&t=${Date.now()}`
    : `${baseUrl}?t=${Date.now()}`
}

// ── Users (admin) ───────────────────────────────────────────────────

export async function listUsers(): Promise<UserProfile[]> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'users'))
  return snap.docs
    .map((d) => {
      const data = d.data()
      return {
        uid: d.id,
        email: String(data.email ?? ''),
        displayName: String(data.displayName ?? 'Member'),
        photoURL: data.photoURL ? String(data.photoURL) : undefined,
        phoneE164: data.phoneE164 ? String(data.phoneE164) : undefined,
        role: (data.role as Role) || 'USER',
        chatOptIn: Boolean(data.chatOptIn),
        smsConsent: data.smsConsent as UserProfile['smsConsent'],
        newsletterConsent:
          data.newsletterConsent as UserProfile['newsletterConsent'],
      } satisfies UserProfile
    })
    .sort((a, b) => a.displayName.localeCompare(b.displayName))
}

export async function updateUserRole(uid: string, role: Role): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'users', uid), {
    role,
    updatedAt: serverTimestamp(),
  })
}

export const ALL_ROLES: Role[] = [
  'USER',
  'CLIENT',
  'CLINICIAN',
  'PUBLICIST',
  'ADMIN',
]

export function parseCommaList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
}

export function formatCommaList(items: string[] | undefined): string {
  return (items ?? []).join(', ')
}
