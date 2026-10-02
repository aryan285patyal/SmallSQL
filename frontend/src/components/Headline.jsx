import { pct } from './modeLabels.js'

// The one number judges should remember: Bare X% → Harness Y%.
export default function Headline({ modes }) {
  const first = modes[0]
  const last = modes[modes.length - 1]
  const delta = pct(last.accuracy) - pct(first.accuracy)

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-end sm:gap-8">
      <div className="font-display leading-[0.8]">
        <span className="text-[clamp(4rem,14vw,9rem)] text-dim">{pct(first.accuracy)}%</span>
        <span className="mx-3 text-[clamp(2.5rem,8vw,5rem)] text-faint">→</span>
        <span className="text-[clamp(4rem,14vw,9rem)] text-accent glow">{pct(last.accuracy)}%</span>
      </div>
      <div className="pb-2 text-[12px] leading-6 text-dim">
        <div>
          <span className="text-fg">bare</span> → <span className="text-accent">full harness</span>
        </div>
        <div>
          <span className="font-semibold text-accent">{delta >= 0 ? '+' : ''}{delta} pts</span> execution accuracy
        </div>
        <div>same model · same schema · same questions</div>
      </div>
    </div>
  )
}
