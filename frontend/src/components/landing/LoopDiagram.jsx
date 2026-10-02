import { useEffect, useState } from 'react'
import StatusTag from '../StatusTag.jsx'

// The harness loop as box-drawing text. `{group:text}` marks a piece that lights up
// when its group is active, so the diagram can "run" through an attempt.
const sp = (n) => ' '.repeat(n)

const WIDE = [
  `{sc:┌────────────┐}${sp(6)}{ge:┌────────────┐}${sp(6)}{va:┌────────────┐}${sp(6)}{ex:┌────────────┐}`,
  `{sc:│   SCHEMA   │}{a1: ───▶ }{ge:│  GENERATE  │}{a2: ───▶ }{va:│  VALIDATE  │}{a3: ───▶ }{ex:│  EXECUTE   │}{a4: ───▶ }{ok:✓ ROWS}`,
  `{sc:│ grounding  │}${sp(6)}{ge:│   cortex   │}${sp(6)}{va:│  sqlglot   │}${sp(6)}{ex:│ snowflake  │}`,
  `{sc:└────────────┘}${sp(6)}{ge:└────────────┘}${sp(6)}{va:└────────────┘}${sp(6)}{ex:└────────────┘}`,
  `${sp(26)}{fb:▲}${sp(39)}{fb:│}`,
  `${sp(26)}{fb:│}${sp(39)}{fb:│}`,
  `${sp(26)}{fb:└────────◀ error + previous sql ────────┘}`,
  `${sp(37)}{fb:up to 3 attempts}`,
]

const TALL = [
  `{sc:┌────────────┐}`,
  `{sc:│   SCHEMA   │}`,
  `{sc:└────────────┘}`,
  `{a1:${sp(6)}▼}`,
  `{ge:┌────────────┐}`,
  `{ge:│  GENERATE  │}{fb: ◀────┐}`,
  `{ge:└────────────┘}{fb:${sp(6)}│}`,
  `{a2:${sp(6)}▼}${sp(13)}{fb:│}`,
  `{va:┌────────────┐}{fb:${sp(6)}│}`,
  `{va:│  VALIDATE  │}{fb:${sp(6)}│ error}`,
  `{va:└────────────┘}{fb:${sp(6)}│ + sql}`,
  `{a3:${sp(6)}▼}${sp(13)}{fb:│}`,
  `{ex:┌────────────┐}{fb:${sp(6)}│}`,
  `{ex:│  EXECUTE   │}{fb: ─────┘}`,
  `{ex:└────────────┘}`,
  `{a4:${sp(6)}▼}`,
  `{ok:${sp(3)}✓ ROWS}`,
]

// One harness run, frame by frame (mirrors a real steps[] trace).
const FRAMES = [
  { on: ['sc'], log: ['ok', 'schema_grounding', '8 tables · columns · keys'] },
  { on: ['a1', 'ge'], log: ['ok', 'generate', 'attempt 1'] },
  { on: ['a2', 'va'], log: ['ok', 'validate', 'single SELECT · known tables'] },
  { on: ['a3', 'ex'], err: ['ex', 'a3'], log: ['error', 'execute', "invalid identifier 'C_TOTAL'"] },
  { on: ['fb'], log: ['ok', '↻ retry', 'error + sql fed back to model'] },
  { on: ['ge'], log: ['ok', 'generate', 'attempt 2'] },
  { on: ['va'], log: ['ok', 'validate', 'single SELECT · known tables'] },
  { on: ['ex'], log: ['ok', 'execute', '5 rows'] },
  { on: ['a4', 'ok'], log: ['ok', 'answer', 'returned after 2 attempts'] },
]
const STEP_MS = 800
const HOLD_MS = 2600

function Line({ markup, state }) {
  const parts = []
  let last = 0
  for (const m of markup.matchAll(/\{(\w+):([^}]*)\}/g)) {
    if (m.index > last) parts.push(markup.slice(last, m.index))
    const g = m[1]
    const cls = state.err.has(g)
      ? 'text-err glow-err'
      : state.on.has(g)
        ? 'text-accent glow'
        : state.seen.has(g)
          ? 'text-dim'
          : 'text-faint'
    parts.push(
      <span key={m.index} className={`transition-colors duration-300 ${cls}`}>
        {m[2]}
      </span>,
    )
    last = m.index + m[0].length
  }
  if (last < markup.length) parts.push(markup.slice(last))
  return <div>{parts}</div>
}

export default function LoopDiagram({ play }) {
  const [frame, setFrame] = useState(-1)

  useEffect(() => {
    if (!play) return
    let f = -1
    let timer
    const next = () => {
      f = f + 1 >= FRAMES.length ? -1 : f + 1
      setFrame(f)
      timer = setTimeout(next, f === FRAMES.length - 1 ? HOLD_MS : f === -1 ? 500 : STEP_MS)
    }
    timer = setTimeout(next, 300)
    return () => clearTimeout(timer)
  }, [play])

  const current = FRAMES[frame]
  const state = {
    on: new Set(current?.on ?? []),
    err: new Set(current?.err ?? []),
    seen: new Set(FRAMES.slice(0, Math.max(frame, 0)).flatMap((f) => f.on)),
  }
  const log = FRAMES.slice(0, frame + 1).map((f) => f.log)

  return (
    <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-center">
      <pre className="hidden text-[12.5px] leading-[1.35] select-none md:block xl:text-[14px]" aria-hidden>
        {WIDE.map((l, i) => <Line key={i} markup={l} state={state} />)}
      </pre>
      <pre className="text-[12.5px] leading-[1.35] select-none md:hidden" aria-hidden>
        {TALL.map((l, i) => <Line key={i} markup={l} state={state} />)}
      </pre>

      <ol
        className="min-h-[13.5rem] border-l border-line pl-4 text-[12px] leading-6"
        aria-label="harness run: schema grounding, generate, validate, execute fails, error fed back, generate again, validate, execute succeeds"
      >
        <li className="mb-1 text-[11px] tracking-[0.2em] text-faint uppercase">steps[] · live</li>
        {log.map(([status, name, detail], i) => (
          <li key={i} className="grid animate-step-in grid-cols-[auto_minmax(0,8.5rem)_1fr] gap-x-2">
            <StatusTag status={status} />
            <span className={name.startsWith('↻') ? 'font-semibold text-accent glow' : 'text-fg'}>{name}</span>
            <span className={`truncate ${status === 'error' ? 'text-err' : 'text-dim'}`}>{detail}</span>
          </li>
        ))}
        {frame >= 0 && frame < FRAMES.length - 1 && <li className="animate-blink text-accent">▌</li>}
      </ol>
    </div>
  )
}
