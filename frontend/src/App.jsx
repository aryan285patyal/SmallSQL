import { useEffect, useState } from 'react'
import DitherBackground from './components/DitherBackground.jsx'
import Header from './components/Header.jsx'
import AskPage from './pages/AskPage.jsx'
import EvalPage from './pages/EvalPage.jsx'
import { useTheme } from './lib/useTheme.js'

const TABS = { ask: 'ask', eval: 'benchmark' }

const isTyping = (el) => el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)

export default function App() {
  const [tab, setTab] = useState('ask')
  const [theme, toggleTheme] = useTheme()

  // 1 / 2 switch pages, t toggles the theme (ignored while typing in the question box).
  useEffect(() => {
    const onKey = (e) => {
      if (isTyping(document.activeElement) || e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 't') return toggleTheme()
      const key = Object.keys(TABS)[Number(e.key) - 1]
      if (key) setTab(key)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleTheme])

  return (
    <>
    <DitherBackground theme={theme} />
    <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-4 py-8 sm:px-6">
      <Header tab={tab} tabs={TABS} onTab={setTab} theme={theme} onToggleTheme={toggleTheme} />
      <main className="flex-1">{tab === 'ask' ? <AskPage /> : <EvalPage />}</main>
      <footer className="mt-12 flex flex-wrap gap-x-4 gap-y-1 border-t border-line pt-4 text-[11px] text-dim">
        <span>MIT license</span>
        <a className="hover:text-accent" href="https://www.llama.com/llama3_1/license/" target="_blank" rel="noreferrer">
          model license ↗
        </a>
        <a className="hover:text-accent" href="https://github.com/aryan285patyal/SmallSQL" target="_blank" rel="noreferrer">
          source ↗
        </a>
        <span className="ml-auto">served by snowflake cortex · data: TPCH_SF1</span>
      </footer>
    </div>
    </>
  )
}
