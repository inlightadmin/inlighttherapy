import { useAuth } from '@/context/AuthContext'
import {
  claimChat,
  closeChat,
  formatChatTime,
  sendChatMessage,
  setStaffAvailable,
  subscribeChatPresence,
  subscribeChatThread,
  subscribeMessages,
  subscribeStaffChats,
  type ChatMessage,
  type ChatPresence,
  type ChatThread,
} from '@/lib/chat'
import { CRISIS_DISCLAIMER_SHORT } from '@/lib/content'
import { useEffect, useRef, useState, type FormEvent } from 'react'

export function StaffChatPage() {
  const { user, profile } = useAuth()
  const [presence, setPresence] = useState<ChatPresence>({ available: false })
  const [threads, setThreads] = useState<ChatThread[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  /** Non-modal notice when a client ends the chat (or similar) */
  const [notice, setNotice] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const closingLocally = useRef(false)
  const activeMeta = useRef<{ id: string; clientName: string } | null>(null)

  useEffect(() => {
    return subscribeChatPresence(setPresence)
  }, [])

  useEffect(() => {
    return subscribeStaffChats(setThreads)
  }, [])

  useEffect(() => {
    if (!activeId) {
      setMessages([])
      activeMeta.current = null
      return
    }
    return subscribeMessages(activeId, setMessages)
  }, [activeId])

  // Detect remote close of the conversation staff is viewing
  useEffect(() => {
    if (!activeId) return
    return subscribeChatThread(activeId, (live) => {
      if (!live || live.status !== 'closed') return
      if (closingLocally.current) {
        closingLocally.current = false
        setActiveId(null)
        setDraft('')
        return
      }
      const name =
        live.clientName || activeMeta.current?.clientName || 'the client'
      if (live.closedBy === 'client') {
        setNotice(
          `${name} ended the chat. You have been returned to the Live chat desk.`,
        )
      } else if (live.closedBy === 'staff_offline') {
        setNotice('This chat was closed because you went offline.')
      } else {
        setNotice('This chat was closed.')
      }
      setActiveId(null)
      setDraft('')
    })
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const queued = threads.filter((t) => t.status === 'queued')
  const mine = threads.filter(
    (t) => t.status === 'active' && t.staffUid === user?.uid,
  )
  const others = threads.filter(
    (t) => t.status === 'active' && t.staffUid && t.staffUid !== user?.uid,
  )
  const active = threads.find((t) => t.id === activeId) ?? null

  async function toggleAvailable() {
    if (!user || !profile) return
    setBusy(true)
    setError(null)
    try {
      const goingOffline = presence.available
      await setStaffAvailable({
        available: !presence.available,
        uid: user.uid,
        displayName: profile.displayName || user.displayName || 'Staff',
      })
      if (goingOffline) {
        setActiveId(null)
        setDraft('')
        setNotice(
          'You are offline. Any chats you were handling were closed for clients.',
        )
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update availability')
    } finally {
      setBusy(false)
    }
  }

  async function onClaim(chatId: string) {
    if (!user || !profile) return
    setBusy(true)
    setError(null)
    setNotice(null)
    try {
      await claimChat({
        chatId,
        staffUid: user.uid,
        staffName: profile.displayName || user.displayName || 'Staff',
      })
      const t = threads.find((x) => x.id === chatId)
      activeMeta.current = {
        id: chatId,
        clientName: t?.clientName || 'Client',
      }
      setActiveId(chatId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not claim chat')
    } finally {
      setBusy(false)
    }
  }

  async function onSend(e: FormEvent) {
    e.preventDefault()
    if (!user || !profile || !activeId || !draft.trim()) return
    setBusy(true)
    setError(null)
    try {
      await sendChatMessage({
        chatId: activeId,
        senderUid: user.uid,
        senderName: profile.displayName || user.displayName || 'Staff',
        senderKind: 'staff',
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
    if (!activeId) return
    if (!confirm('Close this chat for the client? They will be notified.'))
      return
    setBusy(true)
    try {
      closingLocally.current = true
      await closeChat(activeId, 'staff')
      setActiveId(null)
      setDraft('')
    } catch (e) {
      closingLocally.current = false
      setError(e instanceof Error ? e.message : 'Could not close')
    } finally {
      setBusy(false)
    }
  }

  function selectMine(t: ChatThread) {
    setNotice(null)
    activeMeta.current = { id: t.id, clientName: t.clientName }
    setActiveId(t.id)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl">Live chat desk</h2>
          <p className="text-sm text-ink-muted">
            Claim queue conversations and reply in real time. Not for clinical
            care or PHI.
          </p>
        </div>
        <button
          type="button"
          className={presence.available ? 'btn-secondary' : 'btn-primary'}
          disabled={busy}
          onClick={() => void toggleAvailable()}
        >
          {presence.available ? 'Go offline' : 'I am available'}
        </button>
      </div>

      <p className="text-xs text-crisis">{CRISIS_DISCLAIMER_SHORT}</p>

      {notice ? (
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-sage/30 bg-sage/10 px-4 py-3 text-sm text-sage">
          <p>{notice}</p>
          <button
            type="button"
            className="shrink-0 text-xs font-semibold underline"
            onClick={() => setNotice(null)}
          >
            Dismiss
          </button>
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <section className="card p-4">
            <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
              Queue ({queued.length})
            </h3>
            <ul className="mt-3 space-y-2">
              {queued.length === 0 ? (
                <li className="text-sm text-ink-muted">No waiting chats</li>
              ) : (
                queued.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-xl border border-border bg-cream/50 p-3"
                  >
                    <p className="font-medium text-ink">{t.clientName}</p>
                    <p className="line-clamp-2 text-xs text-ink-muted">
                      {t.lastMessagePreview || 'New conversation'}
                    </p>
                    <button
                      type="button"
                      className="btn-primary mt-2 w-full"
                      disabled={busy}
                      onClick={() => void onClaim(t.id)}
                    >
                      Claim
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          <section className="card p-4">
            <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
              My active ({mine.length})
            </h3>
            <ul className="mt-3 space-y-2">
              {mine.length === 0 ? (
                <li className="text-sm text-ink-muted">None</li>
              ) : (
                mine.map((t) => (
                  <li key={t.id}>
                    <button
                      type="button"
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm transition ${
                        activeId === t.id
                          ? 'border-gold bg-gold/10'
                          : 'border-border hover:border-sage/40'
                      }`}
                      onClick={() => selectMine(t)}
                    >
                      <span className="font-medium">{t.clientName}</span>
                      <span className="mt-0.5 block line-clamp-1 text-xs text-ink-muted">
                        {t.lastMessagePreview}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </section>

          {others.length > 0 ? (
            <section className="card p-4">
              <h3 className="text-sm font-semibold tracking-wide text-ink-muted uppercase">
                With other staff
              </h3>
              <ul className="mt-2 space-y-1 text-xs text-ink-muted">
                {others.map((t) => (
                  <li key={t.id}>
                    {t.clientName} → {t.staffName || 'staff'}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <div className="card flex min-h-[420px] flex-col overflow-hidden p-0 lg:col-span-3">
          {!active ? (
            <div className="flex flex-1 items-center justify-center p-8 text-center text-sm text-ink-muted">
              Claim a queued chat or select one of your active conversations.
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 border-b border-border bg-cream-dark/40 px-4 py-3">
                <div>
                  <p className="font-semibold text-ink">{active.clientName}</p>
                  <p className="text-xs text-ink-muted">{active.clientEmail}</p>
                </div>
                <button
                  type="button"
                  className="btn-ghost text-sm text-danger"
                  disabled={busy}
                  onClick={() => void onClose()}
                >
                  Close chat
                </button>
              </div>

              <div className="flex max-h-[50vh] min-h-[280px] flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
                {messages.map((m) => {
                  const mineMsg = m.senderUid === user?.uid
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mineMsg ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                          mineMsg
                            ? 'bg-gold text-ink'
                            : 'bg-cream-dark text-ink'
                        }`}
                      >
                        <p className="text-[10px] font-semibold tracking-wide text-ink-muted uppercase">
                          {m.senderName} · {m.senderKind}
                        </p>
                        <p className="whitespace-pre-wrap">{m.text}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {formatChatTime(m.createdAt)}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={bottomRef} />
              </div>

              <form
                onSubmit={onSend}
                className="flex gap-2 border-t border-border p-3"
              >
                <input
                  className="input flex-1"
                  placeholder="Reply as staff…"
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
