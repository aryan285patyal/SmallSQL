import { useEffect, useState } from 'react'

const GLYPHS = '!<>-_\\/[]{}=+*^?#$%&@01'
const still = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// Text that "decrypts" left to right from random glyphs when `play` turns true.
export default function Scramble({ text, play = true, duration = 900, className = '' }) {
  const [out, setOut] = useState(play && !still() ? '' : text)

  useEffect(() => {
    if (!play || still()) {
      setOut(text)
      return
    }
    const start = performance.now()
    let frame
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const solved = Math.floor(p * text.length)
      let s = text.slice(0, solved)
      for (let i = solved; i < text.length; i++) {
        s += text[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setOut(s)
      if (p < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, play, duration])

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{out || ' '}</span>
    </span>
  )
}
