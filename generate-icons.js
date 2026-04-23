import { createCanvas } from 'canvas'
import { writeFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PUBLIC = join(__dirname, 'public')

const BG    = '#E8713A'
const WHITE = '#ffffff'
const INNER = '#D4622D'   // darker orange for pan interior

// Design on a 100×100 unit grid, scaled by size/100.
// Top-down frying pan: circle body + handle + inner ring for depth.
function generate(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const u      = size / 100

  // Background
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, size, size)

  // Pan body (white circle)
  ctx.fillStyle = WHITE
  ctx.beginPath()
  ctx.arc(43*u, 57*u, 27*u, 0, Math.PI * 2)
  ctx.fill()

  // Pan interior (darker inset — shows rim depth)
  ctx.fillStyle = INNER
  ctx.beginPath()
  ctx.arc(43*u, 57*u, 20*u, 0, Math.PI * 2)
  ctx.fill()

  // Handle (white rounded rect extending right)
  const hx = 68*u, hy = 52*u, hw = 24*u, hh = 10*u, hr = 5*u
  ctx.fillStyle = WHITE
  ctx.beginPath()
  ctx.moveTo(hx + hr, hy)
  ctx.lineTo(hx + hw - hr, hy)
  ctx.arcTo(hx + hw, hy, hx + hw, hy + hr, hr)
  ctx.lineTo(hx + hw, hy + hh - hr)
  ctx.arcTo(hx + hw, hy + hh, hx + hw - hr, hy + hh, hr)
  ctx.lineTo(hx + hr, hy + hh)
  ctx.arcTo(hx, hy + hh, hx, hy + hh - hr, hr)
  ctx.lineTo(hx, hy + hr)
  ctx.arcTo(hx, hy, hx + hr, hy, hr)
  ctx.closePath()
  ctx.fill()

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
