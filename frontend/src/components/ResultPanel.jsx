import Box from './Box.jsx'
import HarnessTimeline from './HarnessTimeline.jsx'
import ResultTable from './ResultTable.jsx'
import Skeleton from './Skeleton.jsx'
import Spinner from './Spinner.jsx'
import SqlBlock from './SqlBlock.jsx'

const MODES = {
  bare: { title: 'Bare', blurb: 'model alone · one shot · no checks' },
  harness: { title: 'Harness', blurb: 'grounding → validate → execute → retry' },
}

function Verdict({ result, loading }) {
  if (loading) return <Spinner label="running" />
  if (!result) return <span className="text-faint">[ idle ]</span>
  return result.error ? (
    <span className="font-semibold text-err glow-err">[✗ FAILED]</span>
  ) : (
    <span className="font-semibold text-accent glow">[✓ SUCCESS]</span>
  )
}

function Divider({ label }) {
  return (
    <div className="my-3 flex items-center gap-2 text-[11px] tracking-[0.2em] text-faint uppercase">
      <span>──</span>
      {label}
      <span className="h-px flex-1 bg-line" />
    </div>
  )
}

export default function ResultPanel({ mode, result, loading }) {
  const { title, blurb } = MODES[mode]

  return (
    <Box title={title} right={<Verdict result={result} loading={loading} />} className="lg:min-h-80">
      <p className="mb-3 text-[11px] text-dim">{blurb}</p>

      {loading && <Skeleton lines={5} />}

      {!loading && !result && (
        <p className="text-faint">
          awaiting query<span className="animate-blink text-accent">_</span>
        </p>
      )}

      {!loading && result && (
        <div className="animate-fade-in">
          <SqlBlock sql={result.sql} />

          {result.error && (
            <div className="mt-3 border border-err/40 bg-err-soft px-3 py-2 text-[13px] text-err">
              <span className="font-semibold">ERR!</span> {result.error}
            </div>
          )}

          {!result.error && (
            <div className="mt-3">
              <ResultTable columns={result.columns} rows={result.rows} />
            </div>
          )}

          <dl className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-dim">
            <Stat label="latency" value={`${(result.latency_ms / 1000).toFixed(2)}s`} />
            <Stat label="attempts" value={result.attempts} />
            <Stat label="rows" value={result.rows?.length ?? 0} />
          </dl>

          <Divider label="trace" />
          <HarnessTimeline steps={result.steps} />
        </div>
      )}
    </Box>
  )
}

function Stat({ label, value }) {
  return (
    <div className="flex gap-1.5">
      <dt>{label}</dt>
      <dd className="text-fg tabular-nums">{value}</dd>
    </div>
  )
}
