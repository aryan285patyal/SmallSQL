import { useEffect, useState } from 'react'

const FRAMES = '⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏'

export default function Spinner({ label }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % FRAMES.length), 80)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="text-accent" role="status">
      {FRAMES[i]} {label && <span className="text-dim">{label}</span>}
    </span>
  )
}
