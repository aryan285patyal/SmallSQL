import { useState } from 'react'
import { ask } from '../api/client.js'

const EXAMPLES = [
  'Which 5 customers spent the most?',
  'How many orders were placed in 1995?',
  'What is the total revenue per region?',
]

// TODO(frontend): replace the raw JSON with ResultPanel + HarnessTimeline components.
export default function AskPage() {
  const [question, setQuestion] = useState(EXAMPLES[0])
  const [results, setResults] = useState({ bare: null, harness: null })
  const [loading, setLoading] = useState(false)

  async function submit(q = question) {
    setLoading(true)
    const [bare, harness] = await Promise.all([ask(q, 'bare'), ask(q, 'harness')])
    setResults({ bare, harness })
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <form onSubmit={(e) => { e.preventDefault(); submit() }} className="flex gap-2">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          className="flex-1 rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
        />
        <button disabled={loading} className="rounded bg-zinc-100 px-4 py-2 text-zinc-900 disabled:opacity-50">
          {loading ? 'Running…' : 'Ask'}
        </button>
      </form>
      <div className="flex flex-wrap gap-2">
        {EXAMPLES.map((q) => (
          <button key={q} onClick={() => { setQuestion(q); submit(q) }} className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:text-zinc-100">
            {q}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {['bare', 'harness'].map((mode) => (
          <section key={mode} className="rounded border border-zinc-800 p-4">
            <h2 className="mb-2 font-medium capitalize">{mode}</h2>
            <pre className="overflow-auto text-xs text-zinc-400">{JSON.stringify(results[mode], null, 2)}</pre>
          </section>
        ))}
      </div>
    </div>
  )
}
