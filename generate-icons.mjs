/**
 * generate-icons.mjs
 * Run: node generate-icons.mjs
 * Generates all required PWA icon sizes from an SVG.
 * Requires: npm install -D sharp
 */
import { createCanvas } from 'canvas'
import fs from 'fs'
import path from 'path'

const SIZES = [72, 96, 128, 144, 152, 180, 192, 512]
const OUT = './public/icons'

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true })

function drawIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx    = canvas.getContext('2d')
  const pad    = size * 0.12
  const r      = size * 0.22

  // Background
  const grad = ctx.createLinearGradient(0, 0, size, size)
  grad.addColorStop(0, '#7c63ff')
  grad.addColorStop(1, '#a855f7')
  ctx.fillStyle = grad

  // Rounded rect
  ctx.beginPath()
  ctx.roundRect(0, 0, size, size, r)
  ctx.fill()

  // Icon: stacked layers
  ctx.strokeStyle = 'rgba(255,255,255,0.95)'
  ctx.lineWidth   = size * 0.055
  ctx.lineCap     = 'round'
  ctx.lineJoin    = 'round'

  const cx = size / 2
  const cy = size / 2
  const w  = size * 0.52
  const h  = size * 0.14

  // Top layer
  ctx.beginPath()
  ctx.moveTo(cx - w/2, cy - h*1.6)
  ctx.lineTo(cx, cy - h*2.4)
  ctx.lineTo(cx + w/2, cy - h*1.6)
  ctx.lineTo(cx, cy - h*0.8)
  ctx.closePath()
  ctx.stroke()

  // Middle layer
  ctx.globalAlpha = 0.7
  ctx.beginPath()
  ctx.moveTo(cx - w/2, cy)
  ctx.lineTo(cx, cy - h*0.8)
  ctx.lineTo(cx + w/2, cy)
  ctx.lineTo(cx, cy + h*0.8)
  ctx.closePath()
  ctx.stroke()

  // Bottom layer
  ctx.globalAlpha = 0.45
  ctx.beginPath()
  ctx.moveTo(cx - w/2, cy + h*1.6)
  ctx.lineTo(cx, cy + h*0.8)
  ctx.lineTo(cx + w/2, cy + h*1.6)
  ctx.lineTo(cx, cy + h*2.4)
  ctx.closePath()
  ctx.stroke()

  return canvas.toBuffer('image/png')
}

for (const size of SIZES) {
  const buf  = drawIcon(size)
  const file = path.join(OUT, `icon-${size}.png`)
  fs.writeFileSync(file, buf)
  console.log(`✓ ${file}`)
}
console.log('\nDone! Icons generated in public/icons/')
