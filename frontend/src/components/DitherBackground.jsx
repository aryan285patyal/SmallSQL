import { Dithering } from '@paper-design/shaders-react'

const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// The shader takes literal colors, so each theme gets its own pair.
const COLORS = {
  dark: { back: '#0c0a07', front: '#5a3e0c' },
  light: { back: '#f2ebdb', front: '#d9c49a' },
}

// Veil over the dither: calm in the centre so panels and text stay readable, fading out at the bottom.
const fade = (pct) => `color-mix(in srgb, var(--color-bg) ${pct}%, transparent)`
const VEIL = `radial-gradient(ellipse 70% 60% at 50% 40%, ${fade(92)} 0%, ${fade(60)} 60%, ${fade(35)} 100%)`

// Full-page animated dither (WebGL) sitting behind everything.
export default function DitherBackground({ theme = 'dark' }) {
  const { back, front } = COLORS[theme] ?? COLORS.dark
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden>
      <Dithering
        style={{ width: '100%', height: '100%' }}
        colorBack={back}
        colorFront={front}
        shape="warp"
        type="4x4"
        size={3}
        scale={0.9}
        speed={reducedMotion ? 0 : 0.12}
      />
      <div className="absolute inset-0" style={{ background: VEIL }} />
      <div className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-b from-transparent to-bg" />
    </div>
  )
}
