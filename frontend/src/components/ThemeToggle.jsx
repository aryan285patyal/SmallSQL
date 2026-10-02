// Pixel-art sun / moon toggle. Switching themes dissolves one icon into the other
// pixel by pixel, like a dither, instead of a plain swap.

const MOON = [
  '.............',
  '....##.......',
  '...##........',
  '..###....#...',
  '.####........',
  '.####........',
  '.####........',
  '.#####.......',
  '.#######...#.',
  '..#########..',
  '...#######...',
  '....#####....',
  '.............',
]

const SUN = [
  '.............',
  '.#....#....#.',
  '..#...#...#..',
  '.............',
  '.....###.....',
  '....#####....',
  '.##.#####.##.',
  '....#####....',
  '.....###.....',
  '.............',
  '..#...#...#..',
  '.#....#....#.',
  '.............',
]

const SIZE = MOON.length
const pixels = (rows) => rows.flatMap((row, y) => [...row].flatMap((c, x) => (c === '#' ? [[x, y]] : [])))
// Deterministic pseudo-random delay per pixel, so the dissolve looks scattered but never flickers.
const delay = (x, y) => ((x * 7 + y * 13) % 11) * 22

function PixelIcon({ rows, visible }) {
  return pixels(rows).map(([x, y]) => (
    <rect
      key={`${x}-${y}`}
      x={x}
      y={y}
      width="1"
      height="1"
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 120ms steps(2)',
        transitionDelay: `${visible ? 120 + delay(x, y) : delay(x, y)}ms`,
      }}
    />
  ))
}

export default function ThemeToggle({ theme, onToggle }) {
  const next = theme === 'light' ? 'dark (crt)' : 'light (paper)'
  return (
    <button
      onClick={onToggle}
      title={`switch to ${next} · press t`}
      aria-label={`Switch to ${next} theme`}
      className="group relative grid size-10 place-items-center border border-line bg-panel/85 text-accent transition-colors hover:border-accent/70 hover:bg-accent-soft"
    >
      {/* corner ticks, same as the panels */}
      <span className="pointer-events-none absolute -left-px -top-px size-1.5 border-l border-t border-accent/70" />
      <span className="pointer-events-none absolute -bottom-px -right-px size-1.5 border-b border-r border-accent/70" />
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="size-[22px] fill-current transition-[filter] group-hover:drop-shadow-[0_0_3px_var(--color-accent)]"
        shapeRendering="crispEdges"
        aria-hidden
      >
        {/* show the current theme: moon on crt, sun on paper */}
        <PixelIcon rows={MOON} visible={theme !== 'light'} />
        <PixelIcon rows={SUN} visible={theme === 'light'} />
      </svg>
    </button>
  )
}
