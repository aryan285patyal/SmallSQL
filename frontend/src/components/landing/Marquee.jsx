// Endless ticker. Content is rendered twice and shifted by half, so the loop is seamless.
export default function Marquee({ items, className = '' }) {
  const row = items.map((item, i) => (
    <span key={i} className="flex items-center gap-6 pr-6">
      <span>{item}</span>
      <span className="text-faint">◆</span>
    </span>
  ))
  return (
    <div className={`overflow-hidden whitespace-nowrap [mask-image:linear-gradient(90deg,transparent,black_10%,black_90%,transparent)] ${className}`} aria-hidden>
      <div className="flex w-max animate-marquee">
        {row}
        {row}
      </div>
    </div>
  )
}
