import { useRef, useEffect } from 'react'

// Animated pixel eye that looks around warily
// Drawn on canvas for crisp pixel rendering

const EYE_SIZE = 128
const PIXEL = 4 // size of each "pixel" block

const COLORS = {
  white: '#eaf0f4',
  iris: '#2a5daa',
  pupil: '#0a1a24',
  outline: '#183848',
  highlight: '#ffffff',
  lid: '#0c1e2c',
  red: '#c7332d',
}

// Eye shape — outer white (sclera)
const SCLERA = [
  // row, col positions relative to center (16x16 grid, center at 8,8)
  // Drawn as an almond/eye shape
]

function drawPixel(ctx, x, y, color) {
  ctx.fillStyle = color
  ctx.fillRect(x * PIXEL, y * PIXEL, PIXEL, PIXEL)
}

function drawEye(ctx, lookX, lookY, blinkFrame) {
  const w = EYE_SIZE
  const h = EYE_SIZE
  const grid = Math.floor(w / PIXEL)
  const cx = Math.floor(grid / 2)
  const cy = Math.floor(grid / 2)

  ctx.clearRect(0, 0, w, h)

  // Blink state (0 = open, 1-3 = closing/closed)
  const isBlinking = blinkFrame > 0
  const blinkHeight = isBlinking ? Math.min(blinkFrame, 3) : 0

  // Sclera (white of eye) — almond shape
  for (let y = -6; y <= 6; y++) {
    const maxWidth = Math.max(0, Math.floor(7 * Math.cos((y / 6) * Math.PI * 0.5)))
    for (let x = -maxWidth; x <= maxWidth; x++) {
      const gy = cy + y
      const gx = cx + x

      // Skip rows covered by blink
      if (blinkHeight > 0) {
        const distFromCenter = Math.abs(y)
        if (distFromCenter > (6 - blinkHeight * 2)) {
          drawPixel(ctx, gx, gy, COLORS.lid)
          continue
        }
      }

      // Outline
      if (Math.abs(x) === maxWidth || y === -6 || y === 6) {
        drawPixel(ctx, gx, gy, COLORS.outline)
      } else {
        drawPixel(ctx, gx, gy, COLORS.white)
      }
    }
  }

  if (blinkHeight >= 3) return // fully closed

  // Iris (colored circle, follows look direction)
  const irisOffX = Math.round(lookX * 2.5)
  const irisOffY = Math.round(lookY * 1.5)
  const irisCx = cx + irisOffX
  const irisCy = cy + irisOffY

  for (let y = -3; y <= 3; y++) {
    for (let x = -3; x <= 3; x++) {
      const dist = Math.sqrt(x * x + y * y)
      if (dist > 3.2) continue
      const gx = irisCx + x
      const gy = irisCy + y

      // Don't draw outside sclera bounds
      const eyeY = gy - cy
      const maxW = Math.max(0, Math.floor(7 * Math.cos((eyeY / 6) * Math.PI * 0.5)))
      if (Math.abs(gx - cx) >= maxW) continue

      // Check blink coverage
      if (blinkHeight > 0) {
        const distFromCenter = Math.abs(eyeY)
        if (distFromCenter > (6 - blinkHeight * 2)) continue
      }

      if (dist < 1.8) {
        drawPixel(ctx, gx, gy, COLORS.pupil)
      } else {
        drawPixel(ctx, gx, gy, COLORS.iris)
      }
    }
  }

  // Highlight (small white dot on iris)
  if (blinkHeight < 2) {
    drawPixel(ctx, irisCx - 1, irisCy - 1, COLORS.highlight)
  }

  // Red veins at corners (subtle, wary look)
  if (blinkHeight === 0) {
    drawPixel(ctx, cx - 6, cy, COLORS.red)
    drawPixel(ctx, cx + 6, cy, COLORS.red)
    drawPixel(ctx, cx - 5, cy - 1, COLORS.red)
    drawPixel(ctx, cx + 5, cy - 1, COLORS.red)
  }
}

export default function PixelEye({ className = '', style = {} }) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = EYE_SIZE
    canvas.height = EYE_SIZE

    // Look-around pattern: wary, suspicious movements
    const lookPattern = [
      { x: 0, y: 0, dur: 2000 },     // center
      { x: -0.8, y: -0.3, dur: 1500 }, // glance left-up
      { x: 0, y: 0, dur: 800 },       // snap back
      { x: 0.6, y: 0.2, dur: 2000 },  // look right
      { x: 0.9, y: -0.1, dur: 1200 }, // further right (suspicious)
      { x: 0, y: 0, dur: 600 },       // snap center
      { x: -0.5, y: 0.4, dur: 1800 }, // down-left
      { x: 0.3, y: -0.5, dur: 1500 }, // up-right
      { x: 0, y: 0, dur: 2500 },      // center, linger
      { x: -1, y: 0, dur: 800 },      // quick left
      { x: 0, y: 0, dur: 1000 },      // back
    ]

    let patternIndex = 0
    let patternStart = performance.now()
    let blinkTimer = performance.now() + 3000 + Math.random() * 4000
    let blinkFrame = 0
    let blinkDir = 1 // 1 = closing, -1 = opening

    function animate(now) {
      // Advance look pattern
      const elapsed = now - patternStart
      const current = lookPattern[patternIndex]
      const next = lookPattern[(patternIndex + 1) % lookPattern.length]

      if (elapsed >= current.dur) {
        patternIndex = (patternIndex + 1) % lookPattern.length
        patternStart = now
      }

      const t = Math.min(1, elapsed / current.dur)
      const ease = t * t * (3 - 2 * t) // smoothstep
      const lookX = current.x + (next.x - current.x) * ease
      const lookY = current.y + (next.y - current.y) * ease

      // Blink logic
      if (now > blinkTimer && blinkFrame === 0) {
        blinkFrame = 1
        blinkDir = 1
      }
      if (blinkFrame > 0) {
        if (blinkDir === 1) {
          blinkFrame += 0.15
          if (blinkFrame >= 3) {
            blinkDir = -1
          }
        } else {
          blinkFrame -= 0.15
          if (blinkFrame <= 0) {
            blinkFrame = 0
            blinkDir = 1
            blinkTimer = now + 2000 + Math.random() * 5000
          }
        }
      }

      drawEye(ctx, lookX, lookY, Math.floor(blinkFrame))
      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <canvas
      ref={canvasRef}
      width={EYE_SIZE}
      height={EYE_SIZE}
      className={className}
      style={{
        imageRendering: 'pixelated',
        width: '100%',
        height: '100%',
        ...style,
      }}
    />
  )
}
