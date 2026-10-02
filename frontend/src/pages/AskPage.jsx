import { useEffect, useRef, useState } from 'react'
import { ask } from '../api/client.js'
import ResultPanel from '../components/ResultPanel.jsx'

const EXAMPLES = [
  { label: 'top customers', question: 'Which 5 customers spent the most?' },
  { label: 'orders in 1995', question: 'How many orders were placed in 1995?' },
  { label: 'revenue by region', question: 'What is the total revenue per region?' },
  { label: 'late shipments', question: 'Which supplier nation ships the most line items late?' },
]

const MODES = ['bare', 'harness']

// A network failure still renders as a normal contract-shaped result with `error` set.
const failed = (mode, question, err) => ({
  mode, question, sql: null, columns: [], rows: [], attempts: 0, latency_ms: 0, error: err.message, steps: [],
})

export default function AskPage() {
  const [question, setQuestion] = useState('')
  const [results, setResults] = useState({})
  const [loading, setLoading] = useState({})
  const inputRef = useRef(null)
  const runId = useRef(0)

  // "/" focuses the question box from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && document.activeElement !== inputRef.current) {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  function run(q = question) {
    q = q.trim()
    if (!q) return
    const id = ++runId.current
    setResults({})
    setLoading({ bare: true, harness: true })
    // Fire both modes at once; each panel fills in as soon as its own answer lands.
    for (const mode of MODES) {
      ask(q, mode)
        .catch((err) => failed(mode, q, err))
        .then((res) => {
          if (id !== runId.current) return // a newer question was asked
          setResults((r) => ({ ...r, [mode]: res }))
          setLoading((l) => ({ ...l, [mode]: false }))
        })
    }
  }

  const busy = loading.bare || loading.harness

  return (
    <div className="space-y-6">
      <form
        onSubmit={(e) => {
          e.preventDefault()
          run()
        }}
        className="group flex items-center gap-3 border border-line bg-panel/90 px-4 py-3 transition-colors focus-within:border-accent/60"
      >
        <span className="text-accent glow select-none" aria-hidden>
          sql&gt;
        </span>
        <input
          ref={inputRef}
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="ask TPC-H anything, in plain english…"
          aria-label="question"
          autoFocus
          className="min-w-0 flex-1 bg-transparent text-[15px] text-fg caret-accent outline-none placeholder:text-faint"
        />
        <kbd className="hidden text-[11px] text-faint sm:inline">/ to focus</kbd>
        <button
          disabled={busy || !question.trim()}
          className="border border-accent/70 px-3 py-1 text-[12px] font-semibold tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg disabled:border-line disabled:text-faint disabled:hover:bg-transparent"
        >
          {busy ? 'running' : 'run ↵'}
        </button>
      </form>

      <div className="flex flex-wrap items-center gap-2 text-[12px]">
        <span className="text-dim">try:</span>
        {EXAMPLES.map(({ label, question: q }) => (
          <button
            key={label}
            type="button"
            title={q}
            disabled={busy}
            onClick={() => {
              setQuestion(q)
              run(q)
            }}
            className="text-dim transition-colors hover:text-accent disabled:opacity-40"
          >
            [ {label} ]
          </button>
        ))}
      </div>

      <Summary bare={results.bare} harness={results.harness} />

      <div className="grid gap-6 lg:grid-cols-2">
        {MODES.map((mode) => (
          <ResultPanel key={mode} mode={mode} result={results[mode]} loading={loading[mode]} />
        ))}
      </div>
    </div>
  )
}

// One-line verdict once both panels are in, e.g. "bare failed · harness recovered from 1 error in 2 attempts".
function Summary({ bare, harness }) {
  if (!bare || !harness) return null
  const errors = harness.steps.filter((s) => s.status === 'error').length
  const harnessText = harness.error
    ? <span className="text-err">harness failed after {harness.attempts} attempts</span>
    : errors
      ? <span className="text-accent glow">harness recovered from {errors} error{errors > 1 ? 's' : ''} in {harness.attempts} attempts</span>
      : <span className="text-accent">harness succeeded first try</span>

  return (
    <p className="animate-fade-in text-[12.5px] text-dim">
      <span className="text-faint">&gt;&gt; </span>
      {bare.error ? <span className="text-err">bare failed</span> : <span className="text-fg">bare succeeded</span>}
      <span className="text-faint"> · </span>
      {harnessText}
    </p>
  )
}
