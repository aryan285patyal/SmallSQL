const fmt = (v) => {
  if (v === null || v === undefined) return <span className="text-faint">NULL</span>
  if (typeof v === 'number') return v.toLocaleString(undefined, { maximumFractionDigits: 2 })
  return String(v)
}

export default function ResultTable({ columns, rows }) {
  if (!columns?.length) return null
  return (
    <div className="max-h-64 overflow-auto border border-dashed border-line">
      <table className="w-full border-collapse text-left text-[13px]">
        <thead className="sticky top-0 bg-panel">
          <tr>
            {columns.map((c) => (
              <th key={c} className="border-b border-dashed border-line px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-dim uppercase">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="transition-colors hover:bg-accent-soft">
              {row.map((v, j) => (
                <td
                  key={j}
                  className={`border-b border-dashed border-line/60 px-2.5 py-1 whitespace-nowrap ${typeof v === 'number' ? 'text-right tabular-nums' : ''}`}
                >
                  {fmt(v)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
