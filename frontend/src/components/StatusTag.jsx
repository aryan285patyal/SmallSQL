// Fixed-width status tags so timeline columns line up: [ OK ] [ERR!] [SKIP]
const TAGS = {
  ok: { label: ' OK ', className: 'text-accent' },
  error: { label: 'ERR!', className: 'text-err glow-err' },
  skipped: { label: 'SKIP', className: 'text-faint' },
}

export default function StatusTag({ status }) {
  const tag = TAGS[status] ?? TAGS.skipped
  return (
    <span className={`whitespace-pre ${tag.className}`} aria-label={status}>
      [{tag.label}]
    </span>
  )
}
