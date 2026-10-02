import { useEffect, useState } from 'react'

const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Reveals `text` character by character over at most `maxMs`, restarting when text changes.
export function useTypewriter(text = '', maxMs = 700) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!text || reducedMotion()) {
      setCount(text.length)
      return
    }
    const duration = Math.min(maxMs, text.length * 10)
    const start = performance.now()
    let frame
    const tick = (now) => {
      const n = Math.ceil((text.length * (now - start)) / duration)
      setCount(Math.min(n, text.length))
      if (n < text.length) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, maxMs])

  return { shown: text.slice(0, count), done: count >= text.length }
}
