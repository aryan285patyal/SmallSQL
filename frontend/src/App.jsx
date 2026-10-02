import { useState } from 'react'
import AskPage from './pages/AskPage.jsx'
import EvalPage from './pages/EvalPage.jsx'
import { USE_MOCKS } from './api/client.js'

const TABS = { ask: 'Ask', eval: 'Eval dashboard' }

export default function App() {
  const [tab, setTab] = useState('ask')

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">SmallSQL</h1>
        <nav className="flex gap-2">
          {Object.entries(TABS).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded px-3 py-1.5 text-sm ${tab === key ? 'bg-zinc-100 text-zinc-900' : 'text-zinc-400 hover:text-zinc-100'}`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>
      {USE_MOCKS && <p className="mb-4 text-xs text-amber-400">Using mock data (VITE_USE_MOCKS=true)</p>}
      {tab === 'ask' ? <AskPage /> : <EvalPage />}
    </div>
  )
}
