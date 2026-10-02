// Placeholder rows drawn with shade characters while a request is in flight.
export default function Skeleton({ lines = 4 }) {
  const widths = [92, 70, 84, 56, 76, 64]
  return (
    <div className="animate-pulse space-y-1.5 overflow-hidden text-faint" aria-hidden>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="truncate" style={{ width: `${widths[i % widths.length]}%` }}>
          {'░'.repeat(120)}
        </div>
      ))}
    </div>
  )
}
