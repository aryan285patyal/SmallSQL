import { useEffect, useState } from 'react'

const KEY = 'smallsql-booted'

const LINES = [
  ['SMALLSQL BOOT v0.1', 'MIT'],
  ['harness', 'ground · generate · validate · retry'],
  ['model', 'open-weight ≤10B · snowflake cortex'],
  ['dataset', 'SNOWFLAKE_SAMPLE_DATA.TPCH_SF1'],
  ['guard', 'read-only · single SELECT'],
  ['console', 'ready'],
]

const seen = () => {
  try {
    return sessionStorage.getItem(KEY) === '1'
  } catch {
    return false
  }
}

// A one-second "boot screen" shown once per session. Any key or click skips it.
export default function BootSequence() {
  const [show, setShow] = useState(() => !seen() && !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches)
  const [lines, setLines] = useState(0)
  const [leaving, setLeaving] = useState(false)

  useEffect(() => {
    if (!show) return
    try {
      sessionStorage.setItem(KEY, '1')
    } catch {
      /* ignore */
    }
    const timers = LINES.map((_, i) => setTimeout(() => setLines(i + 1), 110 + i * 140))
    const leave = setTimeout(() => setLeaving(true), 110 + LINES.length * 140 + 350)
    const done = setTimeout(() => setShow(false), 110 + LINES.length * 140 + 750)
    const skip = () => setShow(false)
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      ;[...timers, leave, done].forEach(clearTimeout)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [show])

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-40 grid place-items-center bg-bg px-4 transition-opacity duration-400 ${leaving ? 'opacity-0' : 'opacity-100'}`}
      aria-hidden
    >
      <div className="w-full max-w-xl text-[12px] leading-6 sm:text-[13px]">
        {LINES.slice(0, lines).map(([k, v], i) => (
          <div key={i} className="grid animate-step-in grid-cols-[minmax(0,13rem)_1fr] gap-3 sm:grid-cols-[16rem_1fr]">
            <span className={`overflow-hidden whitespace-nowrap ${i === 0 ? 'text-accent glow' : 'text-dim'}`}>
              {i === 0 ? k : `${k} ${'.'.repeat(40)}`}
            </span>
            <span className={i === LINES.length - 1 ? 'text-accent glow' : 'text-fg'}>{v}</span>
          </div>
        ))}
        <span className="animate-blink text-accent">▌</span>
      </div>
    </div>
  )
}
