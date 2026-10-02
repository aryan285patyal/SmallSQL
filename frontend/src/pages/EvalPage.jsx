import { useCallback, useEffect, useState } from 'react'
import { getLatestEval, runEval } from '../api/client.js'
import AsciiBars from '../components/AsciiBars.jsx'
import Box from '../components/Box.jsx'
import Headline from '../components/Headline.jsx'
import PassGrid from '../components/PassGrid.jsx'
import Skeleton from '../components/Skeleton.jsx'
import Spinner from '../components/Spinner.jsx'

export default function EvalPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [runState, setRunState] = useState(null) // null | 'starting' | 'started' | 'failed'

  const load = useCallback(() => {
    setError(null)
    getLatestEval()
      .then(setData)
      .catch((e) => setError(e.message))
  }, [])

  useEffect(load, [load])

  async function startRun() {
    setRunState('starting')
    try {
      await runEval()
      setRunState('started')
    } catch {
      setRunState('failed')
    }
  }

  if (error) {
    return (
      <Box title="benchmark">
        <p className="text-err">ERR! could not load results: {error}</p>
        <p className="mt-2 text-dim">
          no cached <span className="text-fg">benchmark/results.json</span> yet? run the benchmark on the backend, then{' '}
          <button onClick={load} className="text-accent hover:underline">[ retry ]</button>
        </p>
      </Box>
    )
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <Spinner label="loading cached results" />
        <Skeleton lines={6} />
      </div>
    )
  }

  const nQuestions = data.modes[0]?.per_question.length ?? 0

  return (
    <div className="animate-fade-in space-y-8">
      <Headline modes={data.modes} />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-dim">
        <span>{nQuestions} questions</span>
        <span className="text-faint">·</span>
        <span>metric: execution accuracy</span>
        <span className="text-faint">·</span>
        <span>cached {new Date(data.generated_at).toLocaleString()}</span>
        <span className="ml-auto flex items-center gap-3">
          {runState === 'starting' && <Spinner label="starting" />}
          {runState === 'started' && <span className="text-accent">benchmark running in background · showing cached results</span>}
          {runState === 'failed' && <span className="text-err">could not start benchmark</span>}
          {runState === 'started' && (
            <button onClick={load} className="text-dim hover:text-accent">[ refresh ]</button>
          )}
          <button
            onClick={startRun}
            disabled={runState === 'starting'}
            className="border border-accent/70 px-3 py-1 font-semibold tracking-[0.15em] text-accent uppercase transition-colors hover:bg-accent hover:text-bg disabled:opacity-40"
          >
            run benchmark
          </button>
        </span>
      </div>

      <Box title="accuracy by harness stage">
        <AsciiBars modes={data.modes} />
      </Box>

      <Box title="questions × modes" right={<span className="text-dim"><span className="text-accent">■</span> pass  <span className="text-faint">·</span> fail</span>}>
        <PassGrid modes={data.modes} />
      </Box>
    </div>
  )
}
