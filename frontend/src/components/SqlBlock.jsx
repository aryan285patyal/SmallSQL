import { useState } from 'react'
import { highlightSql } from '../lib/highlightSql.jsx'
import { useTypewriter } from '../lib/useTypewriter.js'

export default function SqlBlock({ sql }) {
  const { shown, done } = useTypewriter(sql ?? '')
  const [copied, setCopied] = useState(false)

  if (!sql) return <p className="text-faint">-- no sql generated</p>

  async function copy() {
    await navigator.clipboard.writeText(sql)
    setCopied(true)
    setTimeout(() => setCopied(false), 1200)
  }

  return (
    <div className="group relative border-l-2 border-accent/40 bg-bg/70 py-2 pl-3 pr-14">
      <pre className="overflow-x-auto text-[13px] leading-relaxed whitespace-pre-wrap break-words">
        <code>{highlightSql(shown)}</code>
        {!done && <span className="animate-blink text-accent">▌</span>}
      </pre>
      <button
        onClick={copy}
        className="absolute right-2 top-2 text-[11px] text-faint transition-colors hover:text-accent"
      >
        {copied ? '[copied]' : '[copy]'}
      </button>
    </div>
  )
}
