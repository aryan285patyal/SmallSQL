// API client. Shapes follow SMALLSQL.md Section 5 exactly.
import askBare from '../../mocks/ask_bare.json'
import askHarness from '../../mocks/ask_harness.json'
import evalLatest from '../../mocks/eval_latest.json'

export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === 'true'

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

async function request(path, options = {}) {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

/** POST /api/ask -> { mode, question, sql, columns, rows, attempts, latency_ms, error, steps[] } */
export async function ask(question, mode) {
  if (USE_MOCKS) {
    await delay(mode === 'harness' ? 1200 : 600)
    return { ...(mode === 'harness' ? askHarness : askBare), question }
  }
  return request('/api/ask', { method: 'POST', body: JSON.stringify({ question, mode }) })
}

/** POST /api/eval/run -> { status: "started" } */
export async function runEval() {
  if (USE_MOCKS) return { status: 'started' }
  return request('/api/eval/run', { method: 'POST' })
}

/** GET /api/eval/latest -> { generated_at, model, dataset, modes[] } */
export async function getLatestEval() {
  if (USE_MOCKS) {
    await delay(300)
    return evalLatest
  }
  return request('/api/eval/latest')
}
