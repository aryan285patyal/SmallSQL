// Tiny SQL highlighter. Enough for model-generated SELECTs, no dependency needed.
const KEYWORDS = new Set(
  `SELECT FROM WHERE JOIN LEFT RIGHT INNER OUTER FULL CROSS ON USING GROUP BY ORDER HAVING LIMIT
   OFFSET AS AND OR NOT IN IS NULL DISTINCT CASE WHEN THEN ELSE END ASC DESC WITH UNION ALL
   BETWEEN LIKE ILIKE EXISTS OVER PARTITION QUALIFY TOP INTERVAL DATE TRUE FALSE`.split(/\s+/),
)

const TOKEN = /(--[^\n]*)|('(?:[^']|'')*'?)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z0-9_$]*)(\s*\()?/g

export function highlightSql(sql) {
  const out = []
  let last = 0
  let m
  while ((m = TOKEN.exec(sql))) {
    if (m.index > last) out.push(sql.slice(last, m.index))
    const [text, comment, string, number, word, call] = m
    const key = m.index
    if (comment) out.push(<span key={key} className="text-faint italic">{text}</span>)
    else if (string) out.push(<span key={key} className="text-sql-string">{text}</span>)
    else if (number) out.push(<span key={key} className="text-sql-number">{text}</span>)
    else if (KEYWORDS.has(word.toUpperCase())) out.push(<span key={key} className="font-semibold text-accent">{text}</span>)
    else if (call) out.push(<span key={key}><span className="text-sql-fn">{word}</span>{call}</span>)
    else out.push(<span key={key} className="text-fg">{text}</span>)
    last = TOKEN.lastIndex
  }
  if (last < sql.length) out.push(sql.slice(last))
  return out
}
