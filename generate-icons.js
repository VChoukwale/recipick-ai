import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, 'public')

const BG    = '#E8713A'
const WHITE = '#ffffff'

// Design on a 100×100 unit grid, scaled by `size/100`.
// Bowl + two steam wisps — orange background, white artwork.
function generate(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const u      = size / 100   // 1 design unit → u canvas pixels

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, size, size)

  ctx.fillStyle  = WHITE
  ctx.strokeStyle = WHITE
  ctx.lineCap    = 'round'

  // ── Bowl rim (rounded rect x=16 y=49 w=68 h=9 r=4.5) ──
  const rx = 16*u, ry = 49*u, rw = 68*u, rh = 9*u, rr = 4.5*u
  ctx.beginPath()
  ctx.moveTo(rx + rr, ry)
  ctx.lineTo(rx + rw - rr, ry)
  ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr)
  ctx.lineTo(rx + rw, ry + rh - rr)
  ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr)
  ctx.lineTo(rx + rr, ry + rh)
  ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr)
  ctx.lineTo(rx, ry + rr)
  ctx.arcTo(rx, ry, rx + rr, ry, rr)
  ctx.closePath()
  ctx.fill()

  // ── Bowl body (cubic bezier arc, open at top) ──
  ctx.beginPath()
  ctx.moveTo(18*u, 56*u)
  ctx.bezierCurveTo(18*u, 79*u, 82*u, 79*u, 82*u, 56*u)
  ctx.closePath()
  ctx.fill()

  // ── Steam wisps (two wavy strokes) ──
  ctx.lineWidth = 3.8*u

  // Left wisp
  ctx.beginPath()
  ctx.moveTo(37*u, 46*u)
  ctx.bezierCurveTo(34*u, 40*u, 40*u, 34*u, 37*u, 28*u)
  ctx.bezierCurveTo(34*u, 22*u, 40*u, 17*u, 37*u, 12*u)
  ctx.stroke()

  // Right wisp
  ctx.beginPath()
  ctx.moveTo(63*u, 46*u)
  ctx.bezierCurveTo(60*u, 40*u, 66*u, 34*u, 63*u, 28*u)
  ctx.bezierCurveTo(60*u, 22*u, 66*u, 17*u, 63*u, 12*u)
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

const icons = [
  { file: 'icon-192.png',          size: 192 },
  { file: 'icon-512.png',          size: 512 },
  { file: 'icon-192-maskable.png', size: 192 },
  { file: 'icon-512-maskable.png', size: 512 },
  { file: 'apple-touch-icon.png',  size: 180 },
]

for (const { file, size } of icons) {
  const buf  = generate(size)
  const dest = join(PUBLIC, file)
  writeFileSync(dest, buf)
  console.log(`wrote ${file} — ${buf.length} bytes`)
}
