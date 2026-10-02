import { useEffect, useState } from 'react'
import { MODE_LABELS, pct } from './modeLabels.js'

const CELLS = 30

// Accuracy staircase drawn with block characters. Bars fill in one after another.
//   +retry   ████████████████████████░░░░░░  80%  +15
export default function AsciiBars({ modes }) {
  const [grown, setGrown] = useState(false)
  useEffect(() => {
    const id = setTimeout(() => setGrown(true), 50)
    return () => clearTimeout(id)
  }, [])

  return (
    <div className="space-y-2.5" role="img" aria-label={modes.map((m) => `${m.name} ${pct(m.accuracy)}%`).join(', ')}>
      {modes.map((m, i) => {
        const filled = Math.round(m.accuracy * CELLS)
        const delta = i > 0 ? pct(m.accuracy) - pct(modes[i - 1].accuracy) : null
        const isLast = i === modes.length - 1
        return (
          <div key={m.name} className="grid grid-cols-[1fr_auto] items-center gap-x-3 gap-y-0.5 sm:grid-cols-[7rem_auto_1fr]">
            <span className={`col-span-2 text-[12px] sm:col-span-1 ${isLast ? 'text-accent' : 'text-dim'}`}>
              {MODE_LABELS[m.name] ?? m.name}
            </span>
            <span className="overflow-hidden whitespace-pre text-[15px] leading-none tracking-[-0.05em] sm:text-[20px]">
              <Bar filled={grown ? filled : 0} delayMs={i * 180} bright={isLast} />
            </span>
            <span className="text-[13px] tabular-nums">
              <span className={isLast ? 'font-semibold text-accent glow' : 'text-fg'}>{String(pct(m.accuracy)).padStart(3)}%</span>
              {delta !== null && <span className="ml-2 text-[11px] text-dim">{delta >= 0 ? '+' : ''}{delta}</span>}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Bar({ filled, delayMs, bright }) {
  // Each cell fades in on its own delay, so the bar "prints" left to right.
  return Array.from({ length: CELLS }, (_, c) => {
    const on = c < filled
    return (
      <span
        key={c}
        className={`transition-colors duration-150 ${on ? (bright ? 'text-accent glow' : 'text-accent/75') : 'text-faint/60'}`}
        style={{ transitionDelay: on ? `${delayMs + c * 18}ms` : '0ms' }}
      >
        {on ? '█' : '░'}
      </span>
    )
  })
}
