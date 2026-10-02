import { useEffect, useState } from 'react'
import { getLatestEval } from '../api/client.js'

// TODO(frontend): headline number, Recharts accuracy bar chart, questions x modes grid.
export default function EvalPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    getLatestEval().then(setData).catch((e) => setError(e.message))
  }, [])

  if (error) return <p className="text-red-400">{error}</p>
  return <pre className="overflow-auto text-xs text-zinc-400">{JSON.stringify(data, null, 2)}</pre>
}
