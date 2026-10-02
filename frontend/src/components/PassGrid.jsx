import { MODE_LABELS } from './modeLabels.js'

// Questions × modes. ■ = passed, · = failed.
export default function PassGrid({ modes }) {
  const questions = modes[0]?.per_question ?? []
  const passed = modes.map((m) => new Map(m.per_question.map((q) => [q.id, q.passed])))

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">
        <thead>
          <tr className="text-[11px] tracking-wider text-dim uppercase">
            <th className="w-12 py-1.5 pr-2 text-left font-normal">id</th>
            <th className="hidden py-1.5 pr-4 text-left font-normal sm:table-cell">question</th>
            {modes.map((m) => (
              <th key={m.name} className="w-20 px-1 py-1.5 text-center font-normal">
                {MODE_LABELS[m.name] ?? m.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions.map((q) => (
            <tr key={q.id} className="border-t border-dashed border-line/70 transition-colors hover:bg-accent-soft">
              <td className="py-1.5 pr-2 text-dim" title={q.question}>{q.id}</td>
              <td className="hidden max-w-0 truncate py-1.5 pr-4 sm:table-cell" title={q.question}>{q.question}</td>
              {passed.map((map, i) => {
                const ok = map.get(q.id)
                return (
                  <td key={i} className="text-center" aria-label={ok ? 'pass' : 'fail'}>
                    {ok ? <span className="text-accent glow">■</span> : <span className="text-faint">·</span>}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-line text-[11px] text-dim">
            <td className="py-2 tracking-wider uppercase">passed</td>
            <td className="hidden sm:table-cell" />
            {modes.map((m) => (
              <td key={m.name} className="text-center tabular-nums text-fg">
                {m.per_question.filter((q) => q.passed).length}/{m.per_question.length}
              </td>
            ))}
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
