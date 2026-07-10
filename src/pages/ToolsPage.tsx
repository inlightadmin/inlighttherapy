import { ToolModal } from '@/components/ToolModal'
import { listPublishedTools } from '@/lib/cms'
import type { Tool } from '@/lib/types'
import { useEffect, useState } from 'react'

export function ToolsPage() {
  const [active, setActive] = useState<Tool | null>(null)
  const [tools, setTools] = useState<Tool[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void listPublishedTools()
      .then(setTools)
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container-page py-14 sm:py-16">
      <p className="text-sm font-semibold tracking-[0.18em] text-sage uppercase">
        Tools
      </p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">
        Practical tools for everyday resilience
      </h1>
      <p className="section-lead">
        Short, usable practices you can try between sessions. Tap a card to open
        a full guide.
      </p>

      {loading ? (
        <p className="mt-10 text-sm text-ink-muted">Loading tools…</p>
      ) : (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActive(tool)}
              className="card group text-left transition hover:-translate-y-0.5 hover:border-sage/40"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-gold/30 to-sage/30 text-lg font-bold text-ink">
                {tool.title.charAt(0)}
              </div>
              <h2 className="font-display text-2xl group-hover:text-gold-deep">
                {tool.title}
              </h2>
              <p className="mt-2 text-sm text-ink-muted">{tool.summary}</p>
              <p className="mt-4 text-xs font-semibold tracking-wide text-sage uppercase">
                Open guide →
              </p>
            </button>
          ))}
        </div>
      )}

      <ToolModal tool={active} onClose={() => setActive(null)} />
    </div>
  )
}
