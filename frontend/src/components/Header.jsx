import { useEffect, useState } from 'react'
import { getHealth } from '../api/client.js'
import { BANNER } from '../banner.js'

const API_STATE = {
  ok: { dot: 'text-accent glow', label: 'api online' },
  mock: { dot: 'text-[#d6c08f]', label: 'mock data' },
  down: { dot: 'text-err glow-err', label: 'api offline' },
}

export default function Header({ tab, tabs, onTab }) {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch(() => setHealth({ status: 'down' }))
  }, [])

  const api = API_STATE[health?.status] ?? API_STATE.down

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <pre className="hidden text-[9px] leading-[1.05] text-accent glow select-none sm:block" aria-label="SmallSQL">
            {BANNER}
          </pre>
          <h1 className="font-display text-5xl text-accent glow sm:hidden">SmallSQL</h1>
          <p className="mt-2 text-[12px] text-dim">
            a tiny open-weight model, a harness, and proof it works<span className="animate-blink text-accent">_</span>
          </p>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 text-[11.5px] text-dim lg:text-right">
          <dt>model</dt>
          <dd className="text-fg">{health?.model ?? '—'}</dd>
          <dt>data</dt>
          <dd className="text-fg">{health?.dataset ?? '—'}</dd>
          <dt>status</dt>
          <dd>
            <span className={api.dot}>●</span> {api.label}
          </dd>
        </dl>
      </div>

      <nav className="mt-6 flex gap-1 border-b border-line text-[12px]" aria-label="pages">
        {Object.entries(tabs).map(([key, label], i) => {
          const active = tab === key
          return (
            <button
              key={key}
              onClick={() => onTab(key)}
              aria-current={active ? 'page' : undefined}
              className={`-mb-px border-b-2 px-3 py-2 tracking-[0.15em] uppercase transition-colors ${
                active ? 'border-accent text-accent glow' : 'border-transparent text-dim hover:text-fg'
              }`}
            >
              <span className="text-faint">[{i + 1}]</span> {label}
            </button>
          )
        })}
      </nav>
    </header>
  )
}
