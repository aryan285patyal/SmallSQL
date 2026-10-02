// A terminal-style panel: a thin border with the title cut into the top edge.
//   ┌─ TITLE ───────────── right ─┐
export default function Box({ title, right, className = '', children }) {
  return (
    <section className={`relative border border-line bg-panel/85 backdrop-blur-[2px] px-4 pb-4 pt-5 ${className}`}>
      <Corners />
      {title && (
        <h2 className="absolute -top-[0.7em] left-3 bg-bg px-1.5 text-xs font-semibold tracking-[0.2em] text-accent uppercase">
          ─ {title} ─
        </h2>
      )}
      {right && <div className="absolute -top-[0.75em] right-3 bg-bg px-1.5 text-xs">{right}</div>}
      {children}
    </section>
  )
}

// Small accent ticks on each corner so boxes read as drawn, not just bordered.
function Corners() {
  const tick = 'pointer-events-none absolute size-2 border-accent/70'
  return (
    <>
      <span className={`${tick} -left-px -top-px border-l border-t`} />
      <span className={`${tick} -right-px -top-px border-r border-t`} />
      <span className={`${tick} -bottom-px -left-px border-b border-l`} />
      <span className={`${tick} -bottom-px -right-px border-b border-r`} />
    </>
  )
}
