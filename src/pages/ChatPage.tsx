import { ConfirmModal } from '@/components/ConfirmModal'
import { useAuth } from '@/context/AuthContext'
import {
  canUseClientChat,
  clientCloseMessage,
  closeChat,
  findOpenClientChat,
  formatChatTime,
  sendChatMessage,
  startClientChat,
  subscribeChatPresence,
  subscribeChatThread,
  subscribeMessages,
  type ChatMessage,
  type ChatPresence,
  type ChatThread,
} from '@/lib/chat'
import { CRISIS_DISCLAIMER_SHORT } from '@/lib/content'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'

export function ChatPage() {
  const { user, profile, loading } = useAuth()
  const [presence, setPresence] = useState<ChatPresence>({ available: false })
  const [thread, setThread] = useState<ChatThread | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [booting, setBooting] = useState(true)
  const [closedModal, setClosedModal] = useState<{
    open: boolean
    message: string
  }>({ open: false, message: '' })
  const bottomRef = useRef<HTMLDivElement>(null)
  /** Avoid treating our own End chat as a staff-closed notification */
  const closingLocally = useRef(false)

  const allowed = canUseClientChat(profile)

  useEffect(() => {
    try {
      return subscribeChatPresence(setPresence)
    } catch {
      setPresence({ available: false })
      return undefined
    }
  }, [])

  useEffect(() => {
    if (!user || !allowed) {
      setBooting(false)
      return
    }
    void (async () => {
      try {
        const open = await findOpenClientChat(user.uid)
        setThread(open)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not load chat')
      } finally {
        setBooting(false)
      }
    })()
  }, [user, allowed])

  // Live thread updates (detect staff close / offline)
  useEffect(() => {
    if (!thread?.id || thread.status === 'closed') return
    return subscribeChatThread(thread.id, (live) => {
      if (!live) {
        setThread(null)
        setMessages([])
        return
      }
      setThread(live)
      if (live.status === 'closed') {
        if (closingLocally.current) {
          closingLocally.current = false
          setThread(null)
          setMessages([])
          setDraft('')
          return
        }
        // Staff (or staff offline) closed — notify client with modal
        if (live.closedBy === 'staff' || live.closedBy === 'staff_offline') {
          setClosedModal({
            open: true,
            message: clientCloseMessage(live.closedBy),
          })
        } else {
          setThread(null)
          setMessages([])
          setDraft('')
        }
      }
    })
  }, [thread?.id, thread?.status])

  useEffect(() => {
    if (!thread?.id || thread.status === 'closed') {
      setMessages([])
      return
    }
    return subscribeMessages(thread.id, setMessages)
  }, [thread?.id, thread?.status])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (loading || booting) {
    return (
      <div className="container-page py-16 text-ink-muted">Loading chat…</div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: '/chat' }} />
  }

  if (!allowed) {
    return (
      <div className="container-page py-14 sm:py-16">
        <div className="card max-w-lg space-y-3">
          <h1 className="font-display text-3xl">Chat requires access</h1>
          <p className="text-sm text-ink-muted">
            Live chat is for members with chat enabled (CLIENT or higher). Opt
            in from your account — this is not crisis care or therapy.
          </p>
          <p className="text-xs text-crisis">{CRISIS_DISCLAIMER_SHORT}</p>
          <div className="flex flex-wrap gap-2">
            <Link to="/account" className="btn-primary no-underline">
              Open account
            </Link>
            <Link to="/contact" className="btn-secondary no-underline">
              Contact
            </Link>
          </div>
        </div>
      </div>
    )
  }

  function resetToStart() {
    setThread(null)
    setMessages([])
    setDraft('')
    setClosedModal({ open: false, message: '' })
  }

  async function onStart(e: FormEvent) {
    e.preventDefault()
    if (!user || !profile) return
    setBusy(true)
    setError(null)
    try {
      const id = await startClientChat({
        clientUid: user.uid,
        clientName: profile.displayName || user.displayName || 'Member',
        clientEmail: user.email || profile.email || '',
        initialMessage: draft.trim() || undefined,
      })
      const open = await findOpenClientChat(user.uid)
      setThread(
        open ?? {
          id,
          clientUid: user.uid,
          clientName: profile.displayName,
          clientEmail: user.email || '',
          status: 'queued',
        },
      )
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start chat')
    } finally {
      setBusy(false)
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!user || !profile || !thread || !draft.trim()) return
    setBusy(true)
    setError(null)
    try {
      await sendChatMessage({
        chatId: thread.id,
        senderUid: user.uid,
        senderName: profile.displayName || user.displayName || 'Member',
        senderKind: 'client',
        text: draft,
      })
      setDraft('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send')
    } finally {
      setBusy(false)
    }
  }

  async function onClose() {
    if (!thread) return
    if (!confirm('End this chat? You can start a new one later.')) return
    setBusy(true)
    try {
      closingLocally.current = true
      await closeChat(thread.id, 'client')
      setThread(null)
      setMessages([])
      setDraft('')
    } catch (err) {
      closingLocally.current = false
      setError(err instanceof Error ? err.message : 'Could not close chat')
    } finally {
      setBusy(false)
    }
  }

  const open = thread && thread.status !== 'closed' && !closedModal.open

  return (
    <div className="container-page py-10 sm:py-14">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Live chat
      </p>
      <h1 className="mt-2 font-display text-3xl sm:text-4xl">
        Chat with our team
      </h1>
      <p className="section-lead">
        General questions and scheduling only — not therapy, not crisis care,
        and please do not share private health information.
      </p>

      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-crisis sm:text-sm">
        {CRISIS_DISCLAIMER_SHORT}{' '}
        <a
          href="https://988lifeline.org/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold"
        >
          988 Lifeline
        </a>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3 text-sm">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 font-medium ${
            presence.available
              ? 'bg-sage/15 text-sage'
              : 'bg-cream-dark text-ink-muted'
          }`}
        >
          <span
            className={`h-2 w-2 rounded-full ${
              presence.available ? 'bg-sage' : 'bg-ink-muted/40'
            }`}
          />
          {presence.available
            ? 'A team member is available'
            : 'Team is offline — leave a message in queue'}
        </span>
        {thread?.status === 'queued' ? (
          <span className="text-ink-muted">Waiting in queue…</span>
        ) : null}
        {thread?.status === 'active' && thread.staffName ? (
          <span className="text-ink-muted">
            Chatting with {thread.staffName}
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!open ? (
        <form onSubmit={onStart} className="card mt-6 max-w-xl space-y-3">
          <h2 className="font-display text-2xl">Start a conversation</h2>
          <p className="text-sm text-ink-muted">
            {presence.available
              ? 'Send a message and a clinician or staff member will join when ready.'
              : 'No one is marked available right now. Your message will wait in the queue.'}
          </p>
          <textarea
            className="input min-h-[6rem] resize-y"
            placeholder="How can we help? (scheduling, general questions…)"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={2000}
          />
          <button type="submit" className="btn-primary" disabled={busy}>
            {busy ? 'Starting…' : 'Start chat'}
          </button>
        </form>
      ) : (
        <div className="card mt-6 flex max-w-2xl flex-col overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 border-b border-border bg-cream-dark/40 px-4 py-3">
            <div>
              <p className="font-semibold text-ink">Your conversation</p>
              <p className="text-xs text-ink-muted capitalize">
                Status: {thread.status}
              </p>
            </div>
            <button
              type="button"
              className="btn-ghost text-sm text-danger"
              disabled={busy}
              onClick={() => void onClose()}
            >
              End chat
            </button>
          </div>

          <div className="flex max-h-[50vh] min-h-[280px] flex-col gap-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 ? (
              <p className="text-sm text-ink-muted">
                No messages yet. Say hello below.
              </p>
            ) : (
              messages.map((m) => {
                const mine = m.senderUid === user.uid
                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                        mine ? 'bg-gold text-ink' : 'bg-cream-dark text-ink'
                      }`}
                    >
                      {!mine ? (
                        <p className="text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                          {m.senderName || 'Staff'}
                        </p>
                      ) : null}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                      <p className="mt-1 text-[10px] opacity-70">
                        {formatChatTime(m.createdAt)}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
            <div ref={bottomRef} />
          </div>

          <form
            onSubmit={onSend}
            className="flex gap-2 border-t border-border p-3"
          >
            <input
              className="input flex-1"
              placeholder="Type a message…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={2000}
              disabled={busy}
            />
            <button
              type="submit"
              className="btn-primary shrink-0"
              disabled={busy || !draft.trim()}
            >
              Send
            </button>
          </form>
        </div>
      )}

      <ConfirmModal
        open={closedModal.open}
        title="Chat closed"
        confirmLabel="OK"
        showCancel={false}
        onConfirm={resetToStart}
        onCancel={resetToStart}
      >
        <p>{closedModal.message}</p>
        <p>You can start a new conversation when you are ready.</p>
      </ConfirmModal>
    </div>
  )
}
