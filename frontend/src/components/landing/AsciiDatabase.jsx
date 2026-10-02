import { useEffect, useRef } from 'react'

// A real-time 3D ASCII renderer (donut.c style) drawing the classic "database"
// icon: three stacked cylinder disks with blinking drive LEDs, tumbling slowly.
// Geometry is sampled once; each frame only rotates, projects and z-buffers it.

const W = 64
const H = 30
const SHADES = '.,-~:;=!*#$@'
const K2 = 5 // camera distance
const K1 = 44 // projection scale

const DISKS = 3
const R = 1
const DISK_H = 0.42
const GAP = 0.2
const TOTAL = DISKS * DISK_H + (DISKS - 1) * GAP

function buildGeometry() {
  const pts = [] // [x, y, z, nx, ny, nz, led, shade]
  for (let d = 0; d < DISKS; d++) {
    const top = TOTAL / 2 - d * (DISK_H + GAP)
    const bottom = top - DISK_H
    // side wall, with a band of LEDs near the front of each disk
    for (let t = 0; t < Math.PI * 2; t += 0.035) {
      const c = Math.cos(t)
      const s = Math.sin(t)
      for (let y = bottom; y <= top; y += 0.028) {
        const mid = Math.abs(y - (top + bottom) / 2) < 0.05
        const led = mid && ((t > 0.25 && t < 0.4) || (t > 0.5 && t < 0.62)) ? d + 1 : 0
        pts.push([R * c, y, R * s, c, 0, s, led, 1])
      }
    }
    // top and bottom caps; lower disks' tops sit in shadow so the gaps read as dark bands
    const capShade = d === 0 ? 1 : 0.3
    for (const [yy, ny] of [[top, 1], [bottom, -1]]) {
      for (let r = 0.04; r <= R + 1e-9; r += 0.03) {
        for (let t = 0; t < Math.PI * 2; t += 0.025 / r + 0.01) {
          pts.push([r * Math.cos(t), yy, r * Math.sin(t), 0, ny, 0, 0, capShade])
        }
      }
    }
  }
  return pts
}

const LIGHT = (() => {
  const v = [-0.55, 0.45, -0.7]
  const n = Math.hypot(...v)
  return v.map((x) => x / n)
})()

function renderFrame(pts, time) {
  const out = new Array(W * H).fill(' ')
  const zbuf = new Float32Array(W * H)

  const A = time * 0.6 // spin around the disk axis
  const B = -(0.38 + 0.14 * Math.sin(time * 0.45)) // tilt the top towards the viewer
  const C = 0.18 * Math.sin(time * 0.3) // gentle roll
  const [cA, sA, cB, sB, cC, sC] = [Math.cos(A), Math.sin(A), Math.cos(B), Math.sin(B), Math.cos(C), Math.sin(C)]

  const rot = (x, y, z) => {
    // Y (spin)
    let x1 = x * cA + z * sA
    let z1 = -x * sA + z * cA
    // X (tilt)
    let y2 = y * cB - z1 * sB
    let z2 = y * sB + z1 * cB
    // Z (roll)
    return [x1 * cC - y2 * sC, x1 * sC + y2 * cC, z2]
  }

  for (const [x, y, z, nx, ny, nz, led, shade] of pts) {
    const [X, Y, Z] = rot(x, y, z)
    const ooz = 1 / (Z + K2)
    const xp = Math.floor(W / 2 + K1 * ooz * X * 2)
    const yp = Math.floor(H / 2 + 1 - K1 * ooz * Y) // +1: the tilt lifts the stack, recentre it
    if (xp < 0 || xp >= W || yp < 0 || yp >= H) continue
    const i = xp + yp * W
    if (ooz <= zbuf[i]) continue
    zbuf[i] = ooz

    if (led) {
      // LEDs blink out of phase per disk, like drive activity lights
      const on = Math.sin(time * 6 + led * 2.1) > -0.2
      out[i] = on ? '@' : 'o'
      continue
    }
    const [NX, NY, NZ] = rot(nx, ny, nz)
    const L = (NX * LIGHT[0] + NY * LIGHT[1] + NZ * LIGHT[2]) * shade
    out[i] = L > 0 ? SHADES[Math.min(SHADES.length - 1, Math.floor(L ** 1.4 * SHADES.length))] : '.'
  }

  let s = ''
  for (let r = 0; r < H; r++) s += out.slice(r * W, (r + 1) * W).join('') + '\n'
  return s
}

export default function AsciiDatabase({ className = '' }) {
  const preRef = useRef(null)

  useEffect(() => {
    const pre = preRef.current
    const pts = buildGeometry()
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    let frame
    let visible = true
    let last = 0
    const start = performance.now()

    const draw = (now) => {
      // ~30fps is plenty for ASCII and halves the work
      if (visible && now - last > 33) {
        pre.textContent = renderFrame(pts, (now - start) / 1000)
        last = now
      }
      frame = requestAnimationFrame(draw)
    }

    if (still) pre.textContent = renderFrame(pts, 2.2)
    else frame = requestAnimationFrame(draw)

    // stop rendering while scrolled off-screen
    const io = new IntersectionObserver(([e]) => (visible = e.isIntersecting))
    io.observe(pre)
    return () => {
      cancelAnimationFrame(frame)
      io.disconnect()
    }
  }, [])

  return (
    <pre
      ref={preRef}
      aria-hidden
      className={`select-none font-mono leading-[1.05] text-accent glow ${className}`}
    />
  )
}
