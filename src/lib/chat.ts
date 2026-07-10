import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Timestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Role } from './types'
import { hasMinRole } from './types'

export type ChatStatus = 'queued' | 'active' | 'closed'

/** Who closed the thread — used for client/staff notifications */
export type ChatClosedBy = 'client' | 'staff' | 'staff_offline'

export type ChatThread = {
  id: string
  clientUid: string
  clientName: string
  clientEmail: string
  status: ChatStatus
  staffUid?: string
  staffName?: string
  closedBy?: ChatClosedBy
  lastMessagePreview?: string
  createdAt?: Timestamp | null
  lastMessageAt?: Timestamp | null
}

export type ChatMessage = {
  id: string
  senderUid: string
  senderName: string
  senderKind: 'client' | 'staff'
  text: string
  createdAt?: Timestamp | null
}

export type ChatPresence = {
  available: boolean
  updatedAt?: Timestamp | null
  byUid?: string
  byName?: string
}

const PRESENCE_DOC = 'chatPresence'

function requireDb() {
  if (!db) throw new Error('Firestore is not configured')
  return db
}

function mapThread(id: string, data: Record<string, unknown>): ChatThread {
  const closedBy = data.closedBy as ChatClosedBy | undefined
  return {
    id,
    clientUid: String(data.clientUid ?? ''),
    clientName: String(data.clientName ?? 'Member'),
    clientEmail: String(data.clientEmail ?? ''),
    status: (data.status as ChatStatus) || 'queued',
    staffUid: data.staffUid ? String(data.staffUid) : undefined,
    staffName: data.staffName ? String(data.staffName) : undefined,
    closedBy:
      closedBy === 'client' ||
      closedBy === 'staff' ||
      closedBy === 'staff_offline'
        ? closedBy
        : undefined,
    lastMessagePreview: data.lastMessagePreview
      ? String(data.lastMessagePreview)
      : undefined,
    createdAt: (data.createdAt as Timestamp) ?? null,
    lastMessageAt: (data.lastMessageAt as Timestamp) ?? null,
  }
}

function mapMessage(id: string, data: Record<string, unknown>): ChatMessage {
  return {
    id,
    senderUid: String(data.senderUid ?? ''),
    senderName: String(data.senderName ?? ''),
    senderKind: data.senderKind === 'staff' ? 'staff' : 'client',
    text: String(data.text ?? ''),
    createdAt: (data.createdAt as Timestamp) ?? null,
  }
}

export function isStaffRole(role: Role | undefined): boolean {
  return hasMinRole(role, 'CLINICIAN')
}

export function canUseClientChat(
  profile: {
    role?: Role
    chatOptIn?: boolean
  } | null,
): boolean {
  if (!profile) return false
  if (isStaffRole(profile.role)) return true
  return hasMinRole(profile.role, 'CLIENT') && Boolean(profile.chatOptIn)
}

// ── Presence ────────────────────────────────────────────────────────

export async function getChatPresence(): Promise<ChatPresence> {
  const database = requireDb()
  const snap = await getDoc(doc(database, 'siteSettings', PRESENCE_DOC))
  if (!snap.exists()) return { available: false }
  const data = snap.data()
  return {
    available: Boolean(data.available),
    updatedAt: (data.updatedAt as Timestamp) ?? null,
    byUid: data.byUid ? String(data.byUid) : undefined,
    byName: data.byName ? String(data.byName) : undefined,
  }
}

export function subscribeChatPresence(
  onChange: (presence: ChatPresence) => void,
): Unsubscribe {
  const database = requireDb()
  return onSnapshot(doc(database, 'siteSettings', PRESENCE_DOC), (snap) => {
    if (!snap.exists()) {
      onChange({ available: false })
      return
    }
    const data = snap.data()
    onChange({
      available: Boolean(data.available),
      updatedAt: (data.updatedAt as Timestamp) ?? null,
      byUid: data.byUid ? String(data.byUid) : undefined,
      byName: data.byName ? String(data.byName) : undefined,
    })
  })
}

/**
 * Close every active (and claimed) chat owned by this staff member.
 * Clients receive closedBy so they can show a modal.
 */
export async function closeAllActiveChatsForStaff(
  staffUid: string,
  closedBy: ChatClosedBy = 'staff_offline',
): Promise<number> {
  const database = requireDb()
  const snap = await getDocs(collection(database, 'chats'))
  const targets = snap.docs.filter((d) => {
    const data = d.data()
    return (
      data.staffUid === staffUid &&
      (data.status === 'active' || data.status === 'queued')
    )
  })
  await Promise.all(
    targets.map((d) =>
      updateDoc(d.ref, {
        status: 'closed',
        closedBy,
        lastMessageAt: serverTimestamp(),
        lastMessagePreview:
          closedBy === 'staff_offline'
            ? 'Staff went offline — chat closed'
            : 'Chat closed',
      }),
    ),
  )
  return targets.length
}

export async function setStaffAvailable(input: {
  available: boolean
  uid: string
  displayName: string
}): Promise<void> {
  const database = requireDb()
  // Going offline: close all this staff member's open chats first
  if (!input.available) {
    await closeAllActiveChatsForStaff(input.uid, 'staff_offline')
  }
  await setDoc(
    doc(database, 'siteSettings', PRESENCE_DOC),
    {
      available: input.available,
      byUid: input.uid,
      byName: input.displayName,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/**
 * If this user is marked available for chat, go offline (also closes their chats).
 */
export async function goOfflineIfAvailable(uid: string): Promise<void> {
  if (!db) return
  try {
    const presence = await getChatPresence()
    // Always close this staff member's active chats on logout
    await closeAllActiveChatsForStaff(uid, 'staff_offline')
    if (!presence.available) return
    if (presence.byUid && presence.byUid !== uid) return
    await setDoc(
      doc(db, 'siteSettings', PRESENCE_DOC),
      {
        available: false,
        byUid: uid,
        byName: presence.byName || 'Staff',
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    )
  } catch {
    // Don't block logout
  }
}

// ── Client threads ──────────────────────────────────────────────────

export async function findOpenClientChat(
  clientUid: string,
): Promise<ChatThread | null> {
  const database = requireDb()
  const q = query(
    collection(database, 'chats'),
    where('clientUid', '==', clientUid),
    limit(20),
  )
  const snap = await getDocs(q)
  const open = snap.docs
    .map((d) => mapThread(d.id, d.data()))
    .filter((t) => t.status === 'queued' || t.status === 'active')
    .sort((a, b) => {
      const ta = a.lastMessageAt?.toMillis?.() ?? 0
      const tb = b.lastMessageAt?.toMillis?.() ?? 0
      return tb - ta
    })
  return open[0] ?? null
}

export async function startClientChat(input: {
  clientUid: string
  clientName: string
  clientEmail: string
  initialMessage?: string
}): Promise<string> {
  const database = requireDb()
  const existing = await findOpenClientChat(input.clientUid)
  if (existing) {
    if (input.initialMessage?.trim()) {
      await sendChatMessage({
        chatId: existing.id,
        senderUid: input.clientUid,
        senderName: input.clientName,
        senderKind: 'client',
        text: input.initialMessage.trim(),
      })
    }
    return existing.id
  }

  const preview = input.initialMessage?.trim().slice(0, 120) || 'New chat'
  const ref = await addDoc(collection(database, 'chats'), {
    clientUid: input.clientUid,
    clientName: input.clientName,
    clientEmail: input.clientEmail,
    status: 'queued',
    lastMessagePreview: preview,
    createdAt: serverTimestamp(),
    lastMessageAt: serverTimestamp(),
  })

  if (input.initialMessage?.trim()) {
    await addDoc(collection(database, 'chats', ref.id, 'messages'), {
      senderUid: input.clientUid,
      senderName: input.clientName,
      senderKind: 'client',
      text: input.initialMessage.trim(),
      createdAt: serverTimestamp(),
    })
  }

  return ref.id
}

export function subscribeClientChats(
  clientUid: string,
  onChange: (threads: ChatThread[]) => void,
): Unsubscribe {
  const database = requireDb()
  const q = query(
    collection(database, 'chats'),
    where('clientUid', '==', clientUid),
  )
  return onSnapshot(q, (snap) => {
    const threads = snap.docs
      .map((d) => mapThread(d.id, d.data()))
      .sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() ?? 0
        const tb = b.lastMessageAt?.toMillis?.() ?? 0
        return tb - ta
      })
    onChange(threads)
  })
}

/** Live updates for a single thread (detect close on either side). */
export function subscribeChatThread(
  chatId: string,
  onChange: (thread: ChatThread | null) => void,
): Unsubscribe {
  const database = requireDb()
  return onSnapshot(doc(database, 'chats', chatId), (snap) => {
    if (!snap.exists()) {
      onChange(null)
      return
    }
    onChange(mapThread(snap.id, snap.data()))
  })
}

// ── Staff queue ─────────────────────────────────────────────────────

export function subscribeStaffChats(
  onChange: (threads: ChatThread[]) => void,
): Unsubscribe {
  const database = requireDb()
  return onSnapshot(collection(database, 'chats'), (snap) => {
    const threads = snap.docs
      .map((d) => mapThread(d.id, d.data()))
      .filter((t) => t.status !== 'closed')
      .sort((a, b) => {
        const ta = a.lastMessageAt?.toMillis?.() ?? 0
        const tb = b.lastMessageAt?.toMillis?.() ?? 0
        return tb - ta
      })
    onChange(threads)
  })
}

export async function claimChat(input: {
  chatId: string
  staffUid: string
  staffName: string
}): Promise<void> {
  const database = requireDb()
  await updateDoc(doc(database, 'chats', input.chatId), {
    status: 'active',
    staffUid: input.staffUid,
    staffName: input.staffName,
    lastMessageAt: serverTimestamp(),
  })
}

export async function closeChat(
  chatId: string,
  closedBy: ChatClosedBy,
): Promise<void> {
  const database = requireDb()
  const preview =
    closedBy === 'client'
      ? 'Client ended the chat'
      : closedBy === 'staff_offline'
        ? 'Staff went offline — chat closed'
        : 'Staff ended the chat'

  await updateDoc(doc(database, 'chats', chatId), {
    status: 'closed',
    closedBy,
    lastMessageAt: serverTimestamp(),
    lastMessagePreview: preview,
  })
}

// ── Messages ────────────────────────────────────────────────────────

export function subscribeMessages(
  chatId: string,
  onChange: (messages: ChatMessage[]) => void,
): Unsubscribe {
  const database = requireDb()
  const q = query(
    collection(database, 'chats', chatId, 'messages'),
    orderBy('createdAt', 'asc'),
  )
  return onSnapshot(q, (snap) => {
    onChange(snap.docs.map((d) => mapMessage(d.id, d.data())))
  })
}

export async function sendChatMessage(input: {
  chatId: string
  senderUid: string
  senderName: string
  senderKind: 'client' | 'staff'
  text: string
}): Promise<void> {
  const database = requireDb()
  const text = input.text.trim()
  if (!text) throw new Error('Message cannot be empty.')
  if (text.length > 2000) throw new Error('Message is too long (max 2000).')

  await addDoc(collection(database, 'chats', input.chatId, 'messages'), {
    senderUid: input.senderUid,
    senderName: input.senderName,
    senderKind: input.senderKind,
    text,
    createdAt: serverTimestamp(),
  })

  await updateDoc(doc(database, 'chats', input.chatId), {
    lastMessagePreview: text.slice(0, 120),
    lastMessageAt: serverTimestamp(),
  })
}

export function formatChatTime(ts?: Timestamp | null): string {
  if (!ts?.toDate) return ''
  return ts.toDate().toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function clientCloseMessage(closedBy?: ChatClosedBy): string {
  if (closedBy === 'staff_offline') {
    return 'The team member you were chatting with went offline. This conversation has been closed.'
  }
  if (closedBy === 'staff') {
    return 'A team member ended this conversation. You can start a new chat anytime.'
  }
  return 'This conversation has been closed.'
}
