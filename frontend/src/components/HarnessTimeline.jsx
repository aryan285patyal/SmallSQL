import { useEffect, useState } from 'react'
import StatusTag from './StatusTag.jsx'

const STEP_MS = 180

// Replays steps[] one line at a time so the retry loop reads as it happened:
//   ├─ [ OK ] generate          attempt 1
//   ├─ [ERR!] execute           invalid identifier 'C_TOTAL'
//   ├─ [ OK ] ↻ retry           fed error back to model
//   └─ [ OK ] execute           5 rows
export default function HarnessTimeline({ steps = [] }) {
  const [visible, setVisible] = useState(0)

  useEffect(() => {
    let n = 0
    setVisible(0)
    const id = setInterval(() => {
      n += 1
      setVisible(n)
      if (n >= steps.length) clearInterval(id)
    }, STEP_MS)
    return () => clearInterval(id)
  }, [steps])

  if (!steps.length) return null

  return (
    <ol className="space-y-0.5 text-[12.5px] leading-6" aria-label="harness steps">
      {steps.slice(0, visible).map((step, i) => {
        const last = i === steps.length - 1
        const retry = step.name === 'retry'
        return (
          <li key={i} className="grid animate-step-in grid-cols-[auto_auto_minmax(0,9.5rem)_1fr] items-baseline gap-x-2">
            <span className="text-faint">{last ? '└─' : '├─'}</span>
            <StatusTag status={step.status} />
            <span className={`truncate ${retry ? 'font-semibold text-accent glow' : 'text-fg'}`}>
              {retry ? '↻ retry' : step.name}
            </span>
            <span className={`truncate ${step.status === 'error' ? 'text-err' : 'text-dim'}`} title={step.detail}>
              {step.detail}
            </span>
          </li>
        )
      })}
      {visible < steps.length && <li className="pl-1 text-accent animate-blink">│</li>}
    </ol>
  )
}
