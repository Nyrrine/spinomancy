// ═══════════════════════════════════════
// ARENA LAYOUT — Wide organized pachinko
// ═══════════════════════════════════════
// Wide horizontal layout, clean offset rows, geometric bonus patterns,
// 4 cannons, no corner rails, 16 sectors.

const CANVAS_W = 900
const CANVAS_H = 700
const WALL_LEFT = 20
const WALL_RIGHT = CANVAS_W - 20
const SECTOR_Y = 630
const CX = CANVAS_W / 2
const CY = 330

function pin(x, y, radius = 7, type = 'normal') {
  return { x, y, radius, type, hitTime: 0, wasHit: false }
}

function pipe(entryX, entryY, exitX, exitY, color = '#2a5daa') {
  return { entryX, entryY, exitX, exitY, radius: 18, color }
}

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

  // ── Full-width offset grid filling the tall arena ──
  const rows = 22
  const spacing = 24
  const startY = 70

  const usableW = WALL_RIGHT - WALL_LEFT - 20

  for (let r = 0; r < rows; r++) {
    const y = startY + r * spacing
    if (y > SECTOR_Y - 35) continue

    const isOffset = r % 2 === 1
    const cols = isOffset ? 18 : 19
    const colW = usableW / cols
    const xStart = WALL_LEFT + 10 + (isOffset ? colW / 2 : 0)

    for (let c = 0; c < cols; c++) {
      const x = xStart + colW * c + colW / 2

      // Normalized coords for patterns
      const dx = (x - CX) / (usableW / 2)
      const dy = (y - CY) / ((SECTOR_Y - 80) / 2)
      const dist = Math.hypot(dx, dy)

      // ── Diamond pattern: concentric bonus rings ──
      const diamondDist = Math.abs(dx) + Math.abs(dy)
      if (Math.abs(diamondDist - 0.4) < 0.05 || Math.abs(diamondDist - 0.8) < 0.05) {
        addPin(x, y, 8, 'bonus')
        continue
      }

      // ── Circular ring of bonus pins at mid-radius ──
      if (Math.abs(dist - 0.55) < 0.04) {
        addPin(x, y, 8, 'bonus')
        continue
      }

      // ── Multiplier pins at center cross ──
      if (dist < 0.08) {
        addPin(x, y, 9, 'multiplier')
        continue
      }

      // ── Multiplier pins at compass points on outer diamond ──
      if (diamondDist > 0.75 && diamondDist < 0.85) {
        if (Math.abs(dx) < 0.05 || Math.abs(dy) < 0.05) {
          addPin(x, y, 9, 'multiplier')
          continue
        }
      }

      // ── Multiplier pins at secondary centers (top and bottom) ──
      const topDist = Math.hypot(dx, dy + 0.5)
      const botDist = Math.hypot(dx, dy - 0.5)
      if (topDist < 0.06 || botDist < 0.06) {
        addPin(x, y, 9, 'multiplier')
        continue
      }

      // Normal pin
      addPin(x, y, 7, 'normal')
    }
  }

  // ── Wall pins flush against both walls ──
  for (let wy = 90; wy < SECTOR_Y - 40; wy += 28) {
    addPin(WALL_LEFT + 12, wy, 6, 'normal')
    addPin(WALL_RIGHT - 12, wy, 6, 'normal')
  }

  // ── 4 cannons at different heights ──
  const cannons = [
    pipe(35, 300, WALL_RIGHT - 50, 100, '#2a5daa'),       // left low → right high
    pipe(WALL_RIGHT - 35, 400, 50, 150, '#7b4bb3'),       // right mid → left high
    pipe(35, 500, WALL_RIGHT - 50, 250, '#c7332d'),       // left deep → right mid
    pipe(WALL_RIGHT - 35, 520, 50, 200, '#3d8b37'),       // right deep → left mid
  ]

  // ── Spinning circles at varied heights ──
  const spinners = [
    { cx: 200, cy: 180, radius: 35, pinCount: 5, speed: 0.02 },
    { cx: CANVAS_W - 200, cy: 180, radius: 35, pinCount: 5, speed: -0.02 },
    { cx: CX, cy: 330, radius: 40, pinCount: 6, speed: 0.015 },
    { cx: 160, cy: 420, radius: 30, pinCount: 4, speed: -0.018 },
    { cx: CANVAS_W - 160, cy: 420, radius: 30, pinCount: 4, speed: 0.018 },
    { cx: CX - 150, cy: 520, radius: 28, pinCount: 4, speed: -0.015 },
    { cx: CX + 150, cy: 520, radius: 28, pinCount: 4, speed: 0.015 },
  ]

  const cleanBumpers = bumpers.map(b => ({ ...b, hitTime: 0, wasHit: false }))

  return {
    bumpers: cleanBumpers,
    rails: [],  // no rails — removed to prevent corner trapping
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
