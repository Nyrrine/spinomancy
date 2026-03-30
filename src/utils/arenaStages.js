// ═══════════════════════════════════════
// ARENA LAYOUT — Full-width shaped board
// ═══════════════════════════════════════
// Pins fill the ENTIRE playfield edge-to-edge.
// Pleasing geometric pattern — no empty sides.

const CANVAS_W = 700
const CANVAS_H = 830
const WALL_LEFT = 20
const WALL_RIGHT = CANVAS_W - 20
const SECTOR_Y = 760
const CX = CANVAS_W / 2
const CY = 360

function pin(x, y, radius = 7, type = 'normal') {
  return { x, y, radius, type, hitTime: 0, wasHit: false }
}

function rail(x1, y1, x2, y2) {
  return { x1, y1, x2, y2 }
}

function pipe(entryX, entryY, exitX, exitY, color = '#2a5daa') {
  return { entryX, entryY, exitX, exitY, radius: 18, color }
}

/**
 * Clean, full-width board with gentle curves of bonus pins.
 * Every row fills edge to edge — no empty sides.
 * Bonus pins form flowing wave patterns.
 * Multiplier pins at key intersections.
 */
export function generateArenaLayout() {
  const bumpers = []
  const placed = new Set()

  function addPin(x, y, radius, type) {
    const rx = Math.round(x), ry = Math.round(y)
    const key = `${rx},${ry}`
    if (placed.has(key)) return
    if (x < WALL_LEFT + 10 || x > WALL_RIGHT - 10) return
    if (y < 75 || y > SECTOR_Y - 30) return
    placed.add(key)
    bumpers.push(pin(x, y, radius, type))
  }

  // ── Full-width offset grid, 26 rows ──
  const rows = 26
  const spacing = 24
  const startY = 80

  for (let r = 0; r < rows; r++) {
    const y = startY + r * spacing
    if (y > SECTOR_Y - 35) continue

    const isOffset = r % 2 === 1
    // Full width — pins go edge to edge
    const cols = isOffset ? 14 : 15
    const usableW = WALL_RIGHT - WALL_LEFT - 20
    const colW = usableW / cols
    const xStart = WALL_LEFT + 10 + (isOffset ? colW / 2 : 0)

    for (let c = 0; c < cols; c++) {
      const x = xStart + colW * c + colW / 2

      // Distance from center for pattern
      const dx = (x - CX) / (usableW / 2)
      const dy = (y - CY) / ((SECTOR_Y - 60) / 2)
      const dist = Math.hypot(dx, dy)

      // ── Wave pattern: bonus pins in flowing S-curves ──
      const wave1 = Math.sin(y * 0.04 + x * 0.01) // slow horizontal wave
      const wave2 = Math.sin(x * 0.03 - y * 0.02) // crossing wave

      // Bonus pins where waves overlap (creates flowing curves)
      if (wave1 > 0.6 && wave2 > 0.3) {
        addPin(x, y, 8, 'bonus')
        continue
      }

      // ── Concentric diamond of bonus pins ──
      const diamondDist = Math.abs(dx) + Math.abs(dy)
      if (Math.abs(diamondDist - 0.6) < 0.06) {
        addPin(x, y, 8, 'bonus')
        continue
      }

      // ── Multiplier pins at center cross ──
      if (dist < 0.12) {
        addPin(x, y, 9, 'multiplier')
        continue
      }

      // ── Multiplier pins at 4 compass points on diamond ──
      if (diamondDist > 0.55 && diamondDist < 0.65) {
        if ((Math.abs(dx) < 0.06 || Math.abs(dy) < 0.06)) {
          addPin(x, y, 9, 'multiplier')
          continue
        }
      }

      // Normal pin
      addPin(x, y, 7, 'normal')
    }
  }

  // ── Wall pins (flush against left and right walls) ──
  for (let wy = 90; wy < SECTOR_Y - 40; wy += 30) {
    addPin(WALL_LEFT + 12, wy, 6, 'normal')
    addPin(WALL_RIGHT - 12, wy, 6, 'normal')
  }

  // ── Gentle funnel rails at top corners ──
  const rails = [
    rail(WALL_LEFT, 60, WALL_LEFT + 50, 150),
    rail(WALL_RIGHT, 60, WALL_RIGHT - 50, 150),
  ]

  // ── Cannons (replacement for vacuum pipes) ──
  const cannons = [
    pipe(35, 520, WALL_RIGHT - 50, 100, '#2a5daa'),
    pipe(WALL_RIGHT - 35, 500, 50, 120, '#7b4bb3'),
  ]

  // ── Spinning circles: clusters of pins that rotate around a center ──
  const spinners = [
    { cx: 180, cy: 250, radius: 35, pinCount: 5, speed: 0.02 },
    { cx: CANVAS_W - 180, cy: 380, radius: 35, pinCount: 5, speed: -0.02 },
    { cx: CX, cy: 480, radius: 30, pinCount: 4, speed: 0.015 },
  ]

  const cleanBumpers = bumpers.map(b => ({ ...b, hitTime: 0, wasHit: false }))

  return {
    bumpers: cleanBumpers,
    rails,
    pipes: cannons,
    spinners,
    launchSide: 'right',
    canvasW: CANVAS_W,
    canvasH: CANVAS_H,
    sectorY: SECTOR_Y,
    wallLeft: WALL_LEFT,
    wallRight: WALL_RIGHT,
    hasMovingPlatform: true,
    hasTopLauncher: true,
  }
}
