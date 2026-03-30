import { useRef, useEffect, useCallback, useState, useMemo, useImperativeHandle, forwardRef } from 'react'
import { SECTORS, SECTOR_COLORS } from '../utils/gameConfig'
import { getSpecialBallEffects, getActiveVisuals } from '../utils/specialBalls'
import { generateArenaLayout } from '../utils/arenaStages'
import { sfx } from '../utils/sounds'
import PinHitEffect from './PinHitEffect'

// ── Physics ──
const GRAVITY = 0.17          // 40% reduced — ball DRIFTS
const FRICTION = 0.994
const BOUNCE_DAMPING = 0.6
const BUMPER_BOUNCE = 1.25
const BALL_RADIUS = 5
const SETTLE_THRESHOLD = 0.35
const SETTLE_FRAMES = 28
const TRAIL_LENGTH = 14
const SECTOR_HEIGHT = 34
const LAUNCH_SPEED = 7
const HIT_SLOWDOWN = 0.8     // slow on pin hit so player SEES impact
const SCALE_POP_FRAMES = 5
const PIPE_RADIUS = 18
const PIPE_EXIT_VY = -8      // cannons launch harder than old pipes
const MAX_SPEED = 10

// ── Rail distance ──
function segDist(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1
  const lenSq = dx * dx + dy * dy
  if (lenSq === 0) return { dist: Math.hypot(px - x1, py - y1), nx: 0, ny: -1 }
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / lenSq))
  const cx = x1 + t * dx, cy = y1 + t * dy
  const distX = px - cx, distY = py - cy
  const dist = Math.hypot(distX, distY)
  return { dist, nx: dist > 0 ? distX / dist : 0, ny: dist > 0 ? distY / dist : -1 }
}

function buildSlots(sectors, layout) {
  const usable = layout.wallRight - layout.wallLeft
  const slotW = usable / sectors.length
  return sectors.map((s, i) => ({
    x: layout.wallLeft + slotW * i,
    w: slotW,
    cx: layout.wallLeft + slotW * i + slotW / 2,
    sector: s,
  }))
}

// Ball colors for multi-ball (index 0 = default white, 1+ = tinted)
const BALL_COLORS = ['#eaf0f4', '#ff9966', '#66ccff', '#99ff99']

const RouletteWheel = forwardRef(function RouletteWheel({ onResult, onStatsUpdate, spinning, sectors: sectorOverride, stage = 1, resetKey = 0, ballCount = 1, hiddenSectors = false, reverseLaunch = false, blockerActive = false, specialBalls = [], attractBonus = false, splitThreshold = 0 }, ref) {
  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const ballsRef = useRef([])        // array of ball objects
  const trailsRef = useRef([])       // array of trail arrays (one per ball)
  const settleCountsRef = useRef([]) // per-ball settle counters
  const hasReportedRef = useRef(false)
  const landedRef = useRef(null)
  const flashRef = useRef(0)
  const frameRef = useRef(0)
  const scalePopRef = useRef(0)
  const statsRef = useRef({ bumperHits: 0, bonusHits: 0, multiplierHits: 0, pipeUses: 0 })
  const hitIdRef = useRef(0)
  const [landed, setLanded] = useState(null)
  const [pinHits, setPinHits] = useState([])
  const platformRef = useRef({ x: 0, dir: 1 }) // moving platform
  const launcherRef = useRef({ x: 0, dir: 1 }) // moving launch indicator

  const layout = useMemo(() => generateArenaLayout(), [])
  const bumpersRef = useRef(layout.bumpers)
  const activeSectors = sectorOverride || SECTORS
  const slots = buildSlots(activeSectors, layout)
  const pipes = layout.pipes || []
  const spinners = layout.spinners || []
  const spinnerAngleRef = useRef(0)
  const sbEffects = useMemo(() => getSpecialBallEffects(specialBalls), [specialBalls])
  const sbVisuals = useMemo(() => getActiveVisuals(specialBalls), [specialBalls])
  const ghostHitsRef = useRef(0)
  const screenFlashRef = useRef(0) // white flash frames on mult pin hit
  const comboTextRef = useRef(null) // { text, frames } for color combo display
  const shakeRef = useRef({ x: 0, y: 0 }) // screen shake offset
  const shakeIntensityRef = useRef(0)
  const fireParticlesRef = useRef([]) // fire trail behind ball at high mult
  const cannonBurstRef = useRef([]) // burst particles on cannon exit

  useEffect(() => {
    bumpersRef.current = layout.bumpers.map(b => ({ ...b, hitTime: 0, wasHit: false }))
  }, [layout])

  // Reset pins when a new blind starts (resetKey changes)
  useEffect(() => {
    if (resetKey > 0) {
      bumpersRef.current = layout.bumpers.map(b => ({ ...b, hitTime: 0, wasHit: false }))
    }
  }, [resetKey, layout])

  useEffect(() => {
    if (spinning) {
      setLanded(null)
      landedRef.current = null
      flashRef.current = 0
      trailsRef.current = []
      scalePopRef.current = 0
      statsRef.current = { bumperHits: 0, bonusHits: 0, multiplierHits: 0, pipeUses: 0 }
      ghostHitsRef.current = 0
      setPinHits([])
      // Don't reset wasHit — pins stay hit across spins in a round (like Peggle)
      // Only reset the glow timer so they stop pulsing
      for (const b of bumpersRef.current) { b.hitTime = 0 }
    }
  }, [spinning])

  const spawnSideRef = useRef(0)
  const startBall = useCallback(() => {
    spawnSideRef.current++
    const count = ballCount
    const balls = []
    const trails = []
    const settleCounts = []

    for (let bi = 0; bi < count; bi++) {
      // Spawn from the launcher indicator position
      const launcherX = launcherRef.current.x
      const spread = (bi - (count - 1) / 2) * 12
      const startX = Math.max(layout.wallLeft + BALL_RADIUS + 5, Math.min(layout.wallRight - BALL_RADIUS - 5, launcherX + spread))
      const angleJitter = (bi - (count - 1) / 2) * 0.15
      // Slight angle toward center based on spawn position
      const centerBias = ((layout.wallLeft + layout.wallRight) / 2 - startX) * 0.003
      const angle = Math.PI / 2 + centerBias + (Math.random() - 0.5) * 0.3 + angleJitter

      balls.push({
        x: Math.max(layout.wallLeft + BALL_RADIUS + 2, Math.min(layout.wallRight - BALL_RADIUS - 2, startX)),
        y: 22 + bi * 3,  // stagger vertically slightly
        vx: Math.cos(angle) * LAUNCH_SPEED + (Math.random() - 0.5),
        vy: Math.sin(angle) * LAUNCH_SPEED * 0.5 + 1,
        active: true,
        settled: false,
        landedSector: null,
      })
      trails.push([])
      settleCounts.push(0)
    }

    ballsRef.current = balls
    trailsRef.current = trails
    settleCountsRef.current = settleCounts
    hasReportedRef.current = false
    statsRef.current = { bumperHits: 0, bonusHits: 0, multiplierHits: 0, pipeUses: 0 }
  }, [layout, ballCount])

  // Infinite ball stacking — add a new ball without resetting existing ones
  const launchBall = useCallback(() => {
    const launcherX = launcherRef.current.x
    const startX = Math.max(layout.wallLeft + BALL_RADIUS + 5, Math.min(layout.wallRight - BALL_RADIUS - 5, launcherX))
    const centerBias = ((layout.wallLeft + layout.wallRight) / 2 - startX) * 0.003
    const angle = Math.PI / 2 + centerBias + (Math.random() - 0.5) * 0.3

    const newBall = {
      x: startX,
      y: 22,
      vx: Math.cos(angle) * LAUNCH_SPEED + (Math.random() - 0.5),
      vy: Math.sin(angle) * LAUNCH_SPEED * 0.5 + 1,
      active: true,
      settled: false,
      landedSector: null,
    }

    ballsRef.current = [...ballsRef.current, newBall]
    trailsRef.current = [...trailsRef.current, []]
    settleCountsRef.current = [...settleCountsRef.current, 0]
    // Don't reset hasReported — only report when ALL balls settle
    hasReportedRef.current = false
  }, [layout])

  // Expose launchBall to parent via ref
  useImperativeHandle(ref, () => ({
    launchBall,
    getStats: () => ({ ...statsRef.current }),
  }), [launchBall])

  useEffect(() => { if (spinning) startBall() }, [spinning, startBall])

  // ══════════════════════════
  // RENDER + PHYSICS LOOP
  // ══════════════════════════
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const { canvasW: W, canvasH: H, sectorY, wallLeft, wallRight } = layout
    const bumpers = bumpersRef.current
    const rails = layout.rails || []

    function drawFrame() {
      frameRef.current++
      const now = frameRef.current
      ctx.clearRect(0, 0, W, H)

      // ── Screen shake ──
      if (shakeIntensityRef.current > 0) {
        const si = shakeIntensityRef.current
        shakeRef.current.x = (Math.random() - 0.5) * si * 2
        shakeRef.current.y = (Math.random() - 0.5) * si * 2
        ctx.save()
        ctx.translate(shakeRef.current.x, shakeRef.current.y)
        shakeIntensityRef.current *= 0.92 // decay
        if (shakeIntensityRef.current < 0.3) shakeIntensityRef.current = 0
      }

      const balls = ballsRef.current
      const anyBallActive = balls.some(b => b.active)
      const landedSector = landedRef.current
      const pulse = Math.sin(now * 0.04) * 0.1 + 0.1

      // ══ CANNONS (was pipes) ══
      for (const p of pipes) {
        const nearEntry = balls.some(b => b.active && Math.hypot(b.x - p.entryX, b.y - p.entryY) < 55)
        const nearExit = balls.some(b => b.active && Math.hypot(b.x - p.exitX, b.y - p.exitY) < 55)
        const glow = (nearEntry || nearExit) ? 0.7 : 0.35

        // Helper: draw cannon barrel (thick rect + triangle nozzle)
        function drawCannon(cx, cy, aimAngle, color, label) {
          ctx.save()
          ctx.translate(cx, cy)
          ctx.rotate(aimAngle)
          // Barrel (thick rectangle)
          ctx.fillStyle = color
          ctx.globalAlpha = glow
          ctx.fillRect(-6, -14, 12, 22)
          // Nozzle (triangle)
          ctx.beginPath()
          ctx.moveTo(-8, -14)
          ctx.lineTo(8, -14)
          ctx.lineTo(0, -22)
          ctx.closePath()
          ctx.fill()
          // Base (circle)
          ctx.beginPath()
          ctx.arc(0, 5, 10, 0, Math.PI * 2)
          ctx.fillStyle = color + '60'
          ctx.fill()
          ctx.strokeStyle = color
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.globalAlpha = 1
          // Label
          ctx.fillStyle = color
          ctx.font = '5px "Press Start 2P", monospace'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(label, 0, 5)
          ctx.restore()
        }

        // Aim entry cannon toward exit
        const entryAngle = Math.atan2(p.exitY - p.entryY, p.exitX - p.entryX) - Math.PI / 2
        drawCannon(p.entryX, p.entryY, entryAngle, p.color, 'IN')

        // Aim exit cannon upward
        drawCannon(p.exitX, p.exitY, 0, p.color, 'OUT')

        // Dashed connector
        ctx.setLineDash([3, 5])
        ctx.strokeStyle = p.color + '20'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(p.entryX, p.entryY)
        ctx.lineTo(p.exitX, p.exitY)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // ══ SPINNING CIRCLES ══
      spinnerAngleRef.current += 1 // each spinner uses its own speed
      for (const sp of spinners) {
        const baseAngle = frameRef.current * sp.speed
        // Draw faint orbit circle
        ctx.beginPath()
        ctx.arc(sp.cx, sp.cy, sp.radius, 0, Math.PI * 2)
        ctx.strokeStyle = '#2e607833'
        ctx.lineWidth = 1
        ctx.stroke()
        // Center dot
        ctx.beginPath()
        ctx.arc(sp.cx, sp.cy, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#2e607855'
        ctx.fill()
        // Draw + collide spinner pins
        for (let i = 0; i < sp.pinCount; i++) {
          const a = baseAngle + (i / sp.pinCount) * Math.PI * 2
          const px = sp.cx + Math.cos(a) * sp.radius
          const py = sp.cy + Math.sin(a) * sp.radius
          const spRadius = 6
          // Draw pin
          ctx.beginPath()
          ctx.arc(px, py, spRadius, 0, Math.PI * 2)
          ctx.fillStyle = '#88aabb'
          ctx.fill()
          ctx.strokeStyle = '#2e6078'
          ctx.lineWidth = 1
          ctx.stroke()
          // Collide with balls
          for (const ball of balls) {
            if (!ball.active) continue
            const dx = ball.x - px, dy = ball.y - py
            const dist = Math.hypot(dx, dy)
            const minDist = BALL_RADIUS + spRadius
            if (dist < minDist && dist > 0) {
              const nx = dx / dist, ny = dy / dist
              ball.x = px + nx * minDist
              ball.y = py + ny * minDist
              const dot = ball.vx * nx + ball.vy * ny
              ball.vx -= 2 * dot * nx
              ball.vy -= 2 * dot * ny
              ball.vx *= BUMPER_BOUNCE
              ball.vy *= BUMPER_BOUNCE
              const cs = Math.hypot(ball.vx, ball.vy)
              if (cs > MAX_SPEED) { ball.vx = (ball.vx / cs) * MAX_SPEED; ball.vy = (ball.vy / cs) * MAX_SPEED }
              scalePopRef.current = SCALE_POP_FRAMES
              sfx.pinHit(statsRef.current.bumperHits)
              statsRef.current.bumperHits++
            }
          }
        }
      }

      // ══ RAILS ══
      for (const r of rails) {
        ctx.beginPath()
        ctx.moveTo(r.x1, r.y1)
        ctx.lineTo(r.x2, r.y2)
        ctx.strokeStyle = '#2e6078'
        ctx.lineWidth = 3
        ctx.lineCap = 'round'
        ctx.stroke()
      }

      // ══ PINS ══
      for (const b of bumpers) {
        const tSince = now - b.hitTime
        const recentHit = b.hitTime > 0 && tSince < 18
        const dimmed = b.wasHit && !recentHit

        if (b.type === 'multiplier') {
          const mp = dimmed ? 0 : (Math.sin(now * 0.08) * 0.15 + 0.85)
          if (recentHit) {
            const g = 1 - tSince / 18
            ctx.beginPath()
            ctx.arc(b.x, b.y, b.radius + 8 * g, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(199, 51, 45, ${g * 0.4})`
            ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
          ctx.fillStyle = dimmed ? '#2a1515' : `rgba(199, 51, 45, ${mp})`
          ctx.fill()
          ctx.strokeStyle = dimmed ? '#3a2020' : '#e04040'
          ctx.lineWidth = recentHit ? 2.5 : 1.5
          ctx.stroke()
          if (!dimmed) {
            ctx.fillStyle = '#fff'
            ctx.font = '5px "Press Start 2P", monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('x', b.x, b.y)
          }
        } else if (b.type === 'bonus') {
          if (recentHit) {
            const g = 1 - tSince / 18
            ctx.beginPath()
            ctx.arc(b.x, b.y, b.radius + 7 * g, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(232, 196, 74, ${g * 0.35})`
            ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
          ctx.fillStyle = dimmed ? '#2a2210' : '#e8c44a'
          ctx.fill()
          ctx.strokeStyle = dimmed ? '#3a3218' : '#c7a032'
          ctx.lineWidth = recentHit ? 2.5 : 1.5
          ctx.stroke()
          if (!dimmed) {
            ctx.fillStyle = '#0c1e2c'
            ctx.font = '4px "Press Start 2P", monospace'
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('+2', b.x, b.y)
          }
        } else {
          if (recentHit) {
            const g = 1 - tSince / 18
            ctx.beginPath()
            ctx.arc(b.x, b.y, b.radius + 4 * g, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(136, 170, 187, ${g * 0.2})`
            ctx.fill()
          }
          ctx.beginPath()
          ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
          ctx.fillStyle = dimmed ? '#1a2a35' : '#486878'
          ctx.fill()
          if (!dimmed) {
            ctx.strokeStyle = '#2e6078'
            ctx.lineWidth = 1
            ctx.stroke()
          }
        }
      }

      // ══ SECTORS ══
      // The Fog (hidden_sectors): hide colors/labels while balls are active, reveal on settle
      const fogActive = hiddenSectors && anyBallActive
      for (const slot of slots) {
        const realColor = SECTOR_COLORS[slot.sector.color] || '#888'
        const color = fogActive ? '#486878' : realColor
        const isLanded = landedSector && landedSector.id === slot.sector.id

        if (isLanded && flashRef.current > 0) {
          ctx.globalAlpha = Math.min(1, flashRef.current / 20) * 0.6
          ctx.fillStyle = realColor
          ctx.fillRect(slot.x, sectorY, slot.w, SECTOR_HEIGHT)
          ctx.globalAlpha = 1
        }

        ctx.globalAlpha = anyBallActive ? (0.2 + pulse * 0.1) : isLanded ? 1 : 0.2
        ctx.fillStyle = color
        ctx.fillRect(slot.x, sectorY, slot.w, SECTOR_HEIGHT)
        ctx.globalAlpha = 1

        ctx.strokeStyle = isLanded ? realColor : color + '55'
        ctx.lineWidth = isLanded ? 2 : 1
        ctx.strokeRect(slot.x, sectorY, slot.w, SECTOR_HEIGHT)

        // Label: show '?' during fog, reveal on settle
        ctx.fillStyle = isLanded ? '#0c1e2c' : color
        ctx.font = '7px "Press Start 2P", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(fogActive ? '?' : slot.sector.label, slot.cx, sectorY + SECTOR_HEIGHT / 2)
      }

      // Edge wash
      if (landedSector && flashRef.current > 0) {
        const wc = SECTOR_COLORS[landedSector.color] || '#888'
        ctx.globalAlpha = Math.min(0.12, flashRef.current / 80)
        const g1 = ctx.createLinearGradient(0, 0, 45, 0)
        g1.addColorStop(0, wc); g1.addColorStop(1, 'transparent')
        ctx.fillStyle = g1; ctx.fillRect(0, 0, 45, H)
        const g2 = ctx.createLinearGradient(W, 0, W - 45, 0)
        g2.addColorStop(0, wc); g2.addColorStop(1, 'transparent')
        ctx.fillStyle = g2; ctx.fillRect(W - 45, 0, 45, H)
        ctx.globalAlpha = 1
        flashRef.current = Math.max(0, flashRef.current - 0.4)
      }

      // ── BLOCKER barrier (full width, pulsing green) ──
      if (blockerActive) {
        const barrierY = sectorY - 10
        const pulse = Math.sin(now * 0.1) * 0.15 + 0.85
        ctx.fillStyle = `rgba(61, 139, 55, ${pulse * 0.8})`
        ctx.fillRect(wallLeft, barrierY, wallRight - wallLeft, 4)
        ctx.fillStyle = `rgba(80, 168, 72, ${pulse})`
        ctx.fillRect(wallLeft, barrierY + 1, wallRight - wallLeft, 2)
        ctx.fillStyle = '#50a84888'
        ctx.font = '7px "Press Start 2P", monospace'
        ctx.textAlign = 'center'
        ctx.fillText('BARRIER', (wallLeft + wallRight) / 2, barrierY - 4)
      }

      // ── Moving platform (Peggle bucket) ──
      const plat = platformRef.current
      const platW = 100
      const platSpeed = 1.5
      plat.x += platSpeed * plat.dir
      if (plat.x + platW > wallRight) { plat.dir = -1; plat.x = wallRight - platW }
      if (plat.x < wallLeft) { plat.dir = 1; plat.x = wallLeft }
      const platY = sectorY - 18
      // Draw platform
      ctx.fillStyle = '#3d8b37'
      ctx.fillRect(plat.x, platY, platW, 6)
      ctx.fillStyle = '#50a848'
      ctx.fillRect(plat.x + 1, platY + 1, platW - 2, 2) // highlight
      // Side bumpers
      ctx.fillStyle = '#2e6078'
      ctx.fillRect(plat.x - 2, platY - 2, 4, 10)
      ctx.fillRect(plat.x + platW - 2, platY - 2, 4, 10)

      // ── Pixel art border (Balatro panel style) ──
      const bw = 4 // border width
      const bTop = 2
      const bBot = sectorY + SECTOR_HEIGHT + 2
      const bLeft = wallLeft - bw - 1
      const bRight = wallRight + 1
      const bFullW = bRight - bLeft + bw

      // Main border (thick teal)
      ctx.fillStyle = '#2e6078'
      ctx.fillRect(bLeft, bTop, bFullW, bw)                 // Top
      ctx.fillRect(bLeft, bBot, bFullW, bw)                 // Bottom
      ctx.fillRect(bLeft, bTop, bw, bBot - bTop + bw)       // Left
      ctx.fillRect(bRight, bTop, bw, bBot - bTop + bw)      // Right

      // Inner highlight (1px lighter line inside border)
      ctx.fillStyle = '#3d7a95'
      ctx.fillRect(bLeft + bw, bTop + bw, bRight - bLeft - bw, 1)     // Top inner
      ctx.fillRect(bLeft + bw, bTop + bw, 1, bBot - bTop - bw)        // Left inner

      // Corner decorations (3x3 pixel art corners)
      ctx.fillStyle = '#88c0d0'
      // Top-left corner
      ctx.fillRect(bLeft, bTop, 3, 3)
      ctx.fillRect(bLeft + 1, bTop + 1, 1, 1)
      // Top-right corner
      ctx.fillRect(bRight + bw - 3, bTop, 3, 3)
      ctx.fillRect(bRight + bw - 2, bTop + 1, 1, 1)
      // Bottom-left corner
      ctx.fillRect(bLeft, bBot + bw - 3, 3, 3)
      ctx.fillRect(bLeft + 1, bBot + bw - 2, 1, 1)
      // Bottom-right corner
      ctx.fillRect(bRight + bw - 3, bBot + bw - 3, 3, 3)
      ctx.fillRect(bRight + bw - 2, bBot + bw - 2, 1, 1)

      // Dividers
      ctx.strokeStyle = '#2e607844'; ctx.lineWidth = 1
      for (const slot of slots) {
        ctx.beginPath(); ctx.moveTo(slot.x, sectorY - 5); ctx.lineTo(slot.x, sectorY + SECTOR_HEIGHT); ctx.stroke()
      }

      // ══════════════════
      // MULTI-BALL PHYSICS
      // ══════════════════
      if (scalePopRef.current > 0) scalePopRef.current--
      for (let bi = 0; bi < balls.length; bi++) {
        const ball = balls[bi]
        if (!ball.active) continue
        if (!trailsRef.current[bi]) trailsRef.current[bi] = []
        trailsRef.current[bi].push({ x: ball.x, y: ball.y })
        if (trailsRef.current[bi].length > TRAIL_LENGTH) trailsRef.current[bi].shift()
        ball.vy += GRAVITY
        ball.vx *= FRICTION
        // Magnet ball: attract toward gold sector positions at the bottom
        if (sbEffects.hasMagnet && ball.y > sectorY - 150) {
          const goldSlot = slots.find(s => s.sector.color === 'gold')
          if (goldSlot) {
            const pullX = goldSlot.cx - ball.x
            ball.vx += Math.sign(pullX) * sbEffects.magnetStrength * (1 + (ball.y - (sectorY - 150)) / 150)
          }
        }
        // Pin Magnet card: nudge ball toward nearest unhit bonus pin
        if (attractBonus) {
          let nearest = null
          let nearDist = Infinity
          for (const b of bumpers) {
            if (b.type !== 'bonus' || b.wasHit) continue
            const dx = b.x - ball.x
            const dy = b.y - ball.y
            const d = dx * dx + dy * dy
            if (d < nearDist) { nearDist = d; nearest = b }
          }
          if (nearest && nearDist < 120 * 120) {
            const d = Math.sqrt(nearDist)
            const strength = 0.12 * (1 - d / 120) // stronger when closer
            ball.vx += ((nearest.x - ball.x) / d) * strength
            ball.vy += ((nearest.y - ball.y) / d) * strength
          }
        }
        if (Math.abs(ball.vx) > MAX_SPEED) ball.vx = Math.sign(ball.vx) * MAX_SPEED
        if (Math.abs(ball.vy) > MAX_SPEED) ball.vy = Math.sign(ball.vy) * MAX_SPEED
        const preSpeed = Math.hypot(ball.vx, ball.vy)
        const SUB_STEPS = preSpeed > 6 ? 3 : preSpeed > 3 ? 2 : 1
        const stepVx = ball.vx / SUB_STEPS
        const stepVy = ball.vy / SUB_STEPS
        let pipeTeleported = false
        for (let step = 0; step < SUB_STEPS && !pipeTeleported; step++) {
          ball.x += stepVx
          ball.y += stepVy
          ball.x = Math.max(wallLeft + BALL_RADIUS + 1, Math.min(wallRight - BALL_RADIUS - 1, ball.x))
          ball.y = Math.max(BALL_RADIUS + 2, Math.min(sectorY + SECTOR_HEIGHT - BALL_RADIUS - 2, ball.y))
          if (ball.x <= wallLeft + BALL_RADIUS + 1) ball.vx = Math.abs(ball.vx) * BOUNCE_DAMPING
          if (ball.x >= wallRight - BALL_RADIUS - 1) ball.vx = -Math.abs(ball.vx) * BOUNCE_DAMPING
          if (ball.y <= BALL_RADIUS + 2) ball.vy = Math.abs(ball.vy) * 0.5
          for (const b of bumpers) {
            if (b.wasHit) continue // dead pins — ball passes through
            const dx = ball.x - b.x, dy = ball.y - b.y
            const dist = Math.hypot(dx, dy)
            const minDist = BALL_RADIUS + b.radius
            if (dist < minDist && dist > 0) {
              // Ghost ball: phase through first N pins (still trigger hit effects)
              const isGhosting = sbEffects.ghostPins > 0 && ghostHitsRef.current < sbEffects.ghostPins
              if (!isGhosting) {
                // Normal bounce
                const nx = dx / dist, ny = dy / dist
                ball.x = b.x + nx * minDist; ball.y = b.y + ny * minDist
                const dot = ball.vx * nx + ball.vy * ny
                ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny
                const spd = Math.hypot(ball.vx, ball.vy)
                if (spd < 3) { ball.vx = (ball.vx / (spd || 1)) * 3; ball.vy = (ball.vy / (spd || 1)) * 3 }
                // Heavy ball: more momentum on bounces
                const bounceForce = BUMPER_BOUNCE * sbEffects.heavyMult
                ball.vx *= bounceForce; ball.vy *= bounceForce
                ball.vx += (Math.random() - 0.5) * 1.5
                const cs = Math.hypot(ball.vx, ball.vy)
                if (cs > MAX_SPEED) { ball.vx = (ball.vx / cs) * MAX_SPEED; ball.vy = (ball.vy / cs) * MAX_SPEED }
                ball.vx *= HIT_SLOWDOWN; ball.vy *= HIT_SLOWDOWN
              } else {
                ghostHitsRef.current++
              }
              scalePopRef.current = SCALE_POP_FRAMES
              b.hitTime = now
              if (!b.wasHit) {
                b.wasHit = true; statsRef.current.bumperHits++
                if (b.type === 'bonus') statsRef.current.bonusHits++
                if (b.type === 'multiplier') {
                  statsRef.current.multiplierHits++
                }
              }
              sfx.pinHit(statsRef.current.bumperHits)
              const hid = ++hitIdRef.current
              setPinHits(prev => { const next = prev.length >= 8 ? prev.slice(-4) : prev; return [...next, { id: hid, x: (b.x / W) * 100, y: (b.y / H) * 100, type: b.type }] })

              // ── Chain split: ball splits after hitting threshold pins ──
              // Tracks per-ball hitCount since last split. Chains up to gen 3. Cap 20 balls.
              ball.hitCount = (ball.hitCount || 0) + 1
              const gen = ball.splitGen || 0
              const MAX_SPLIT_GEN = 3
              const MAX_BALLS = 20
              if (splitThreshold > 0 && ball.hitCount >= splitThreshold && gen < MAX_SPLIT_GEN && ballsRef.current.length < MAX_BALLS) {
                ball.hitCount = 0 // reset so this ball can split again at next threshold
                const splitAngle = Math.random() * Math.PI * 2
                const splitSpeed = 4 + Math.random() * 2
                const newBall = {
                  x: ball.x, y: ball.y,
                  vx: Math.cos(splitAngle) * splitSpeed,
                  vy: Math.sin(splitAngle) * splitSpeed,
                  active: true, settled: false, landedSector: null,
                  hitCount: 0, splitGen: gen + 1,
                }
                ballsRef.current.push(newBall)
                trailsRef.current.push([])
                settleCountsRef.current.push(0)
                sfx.pop()
              }
            }
          }
          for (const r of rails) {
            const { dist, nx, ny } = segDist(ball.x, ball.y, r.x1, r.y1, r.x2, r.y2)
            if (dist < BALL_RADIUS + 2 && dist > 0) {
              ball.x += nx * (BALL_RADIUS + 2 - dist); ball.y += ny * (BALL_RADIUS + 2 - dist)
              const dot = ball.vx * nx + ball.vy * ny
              ball.vx -= 2 * dot * nx; ball.vy -= 2 * dot * ny
              ball.vx *= BOUNCE_DAMPING; ball.vy *= BOUNCE_DAMPING
            }
          }
          for (const p of pipes) {
            if (Math.hypot(ball.x - p.entryX, ball.y - p.entryY) < PIPE_RADIUS - 2) {
              ball.x = p.exitX; ball.y = p.exitY - PIPE_RADIUS - 5
              ball.vx = (Math.random() - 0.5) * 3; ball.vy = PIPE_EXIT_VY
              statsRef.current.pipeUses++; sfx.pop(); pipeTeleported = true
              // Cannon burst particles at exit
              for (let bp = 0; bp < 8; bp++) {
                cannonBurstRef.current.push({
                  x: p.exitX, y: p.exitY - PIPE_RADIUS,
                  vx: (Math.random() - 0.5) * 4,
                  vy: -2 - Math.random() * 3,
                  life: 15 + Math.random() * 10,
                  color: p.color,
                })
              }
              break
            }
          }
          const platCur = platformRef.current
          const mplatW = 70, mplatY = sectorY - 18
          if (ball.y + BALL_RADIUS >= mplatY && ball.y - BALL_RADIUS <= mplatY + 6 &&
              ball.x >= platCur.x && ball.x <= platCur.x + mplatW && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy) * 1.1 - 2; ball.y = mplatY - BALL_RADIUS - 1; sfx.pinHit(99)
          }
          // BLOCKER barrier — full-width wall above sectors
          if (blockerActive && ball.y + BALL_RADIUS >= sectorY - 10 && ball.vy > 0) {
            ball.vy = -Math.abs(ball.vy) * 0.9 - 1; ball.y = sectorY - 10 - BALL_RADIUS - 1
          }
          if (ball.y >= sectorY + SECTOR_HEIGHT - BALL_RADIUS - 2) { ball.vy = -Math.abs(ball.vy) * BOUNCE_DAMPING * 0.3; ball.vx *= 0.7 }
          for (const slot of slots) {
            if (ball.y > sectorY - 5 && Math.abs(ball.x - slot.x) < BALL_RADIUS + 1) {
              ball.vx = ball.x < slot.x ? -Math.abs(ball.vx) * 0.35 : Math.abs(ball.vx) * 0.35
              ball.x = ball.x < slot.x ? slot.x - BALL_RADIUS - 1 : slot.x + BALL_RADIUS + 1
            }
          }
        }
        const speed = Math.hypot(ball.vx, ball.vy)
        if (ball.y > sectorY && speed < SETTLE_THRESHOLD) settleCountsRef.current[bi]++
        else settleCountsRef.current[bi] = 0
        if (settleCountsRef.current[bi] > SETTLE_FRAMES && !ball.settled) {
          ball.settled = true; ball.active = false
          const landedSlot = slots.find(s => ball.x >= s.x && ball.x < s.x + s.w) || slots[0]
          ball.landedSector = landedSlot.sector; sfx.pop()
          shakeIntensityRef.current = 4 // shake on landing
          // Green instant reset: reset ALL pins AND auto-respin the ball
          if (landedSlot && landedSlot.sector && landedSlot.sector.color === 'green') {
            try {
              for (const b of bumpers) { b.wasHit = false; b.hitTime = 0 }
              // Auto-respin: relaunch this ball
              ball.settled = false
              ball.active = true
              ball.x = Math.max(wallLeft + 40, Math.min(wallRight - 40, wallLeft + 40 + Math.random() * (wallRight - wallLeft - 80)))
              ball.y = 30
              ball.vx = (Math.random() - 0.5) * 2
              ball.vy = 1.5
              ball.landedSector = null
              if (bi < settleCountsRef.current.length) settleCountsRef.current[bi] = 0
            } catch (e) { /* safety — don't crash on green respin */ }
          }
        }
      }
      if (balls.length > 0 && balls.every(b => b.settled) && !hasReportedRef.current) {
        hasReportedRef.current = true
        const primarySector = balls[0].landedSector
        landedRef.current = primarySector; flashRef.current = 35; setLanded(primarySector)

        // ── Color combo: same-color landing bonus ──
        const colorCounts = {}
        for (const ball of balls) {
          if (ball.landedSector) {
            const c = ball.landedSector.color
            colorCounts[c] = (colorCounts[c] || 0) + 1
          }
        }
        let comboMult = 1
        let comboColor = null
        let comboCount = 0
        for (const [color, count] of Object.entries(colorCounts)) {
          if (count >= 2 && count > comboCount) {
            comboCount = count
            comboColor = color
            if (count === 2) comboMult = 1.5
            else if (count === 3) comboMult = 2.5
            else comboMult = 4
          }
        }
        if (comboMult > 1) {
          comboTextRef.current = {
            text: `${comboColor.toUpperCase()} COMBO x${comboMult}!`,
            color: SECTOR_COLORS[comboColor] || '#e8c44a',
            frames: 90,
          }
          shakeIntensityRef.current = 6
          sfx.xmult()
        }

        if (onResult) onResult(primarySector.id, { ...statsRef.current, comboMult, comboColor, comboCount })
      }
      for (let bi = 0; bi < balls.length; bi++) {
        const ball = balls[bi], trail = trailsRef.current[bi] || []
        // Special ball visuals
        const hasEmber = sbVisuals.has('ember')
        const hasGhost = sbVisuals.has('ghost')
        const hasHeavy = sbVisuals.has('heavy')
        const hasCrystal = sbVisuals.has('crystal')
        const trailColor = hasEmber ? 'rgba(255, 140, 50,' : 'rgba(232, 196, 74,'
        const bodyColor = hasGhost ? `rgba(200, 220, 240, 0.5)` : BALL_COLORS[bi % BALL_COLORS.length]
        const ballR = hasHeavy ? BALL_RADIUS * 1.3 : BALL_RADIUS

        if (ball.active) {
          // Trail
          for (let i = 0; i < trail.length; i++) {
            const a = (i / trail.length) * (hasEmber ? 0.35 : 0.2)
            const s = ballR * (0.2 + (i / trail.length) * 0.45)
            ctx.beginPath(); ctx.arc(trail[i].x, trail[i].y, s, 0, Math.PI * 2)
            ctx.fillStyle = `${trailColor} ${a})`; ctx.fill()
          }
          const scaleMult = scalePopRef.current > 0 ? 1 + 0.2 * (scalePopRef.current / SCALE_POP_FRAMES) : 1
          const r = ballR * scaleMult
          // Glow
          ctx.beginPath(); ctx.arc(ball.x, ball.y, r + 4, 0, Math.PI * 2)
          ctx.fillStyle = hasEmber ? 'rgba(255, 140, 50, 0.12)' : 'rgba(232, 196, 74, 0.1)'; ctx.fill()
          // Body
          ctx.beginPath(); ctx.arc(ball.x, ball.y, r, 0, Math.PI * 2)
          ctx.fillStyle = bodyColor; ctx.fill()
          ctx.strokeStyle = scalePopRef.current > 0 ? '#fff' : hasEmber ? '#ff8833' : '#e8c44a'
          ctx.lineWidth = scalePopRef.current > 0 ? 2 : 1.5; ctx.stroke()
          // Highlight
          ctx.beginPath(); ctx.arc(ball.x - 1.5, ball.y - 1.5, r * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fill()
          // Crystal sparkle
          if (hasCrystal && now % 8 < 4) {
            ctx.fillStyle = '#fff'
            ctx.fillRect(ball.x + r * 0.5, ball.y - r * 0.5, 2, 2)
            ctx.fillRect(ball.x - r * 0.7, ball.y + r * 0.3, 2, 2)
          }
        }
        if (ball.settled && ball.landedSector) {
          ctx.beginPath(); ctx.arc(ball.x, ball.y, BALL_RADIUS, 0, Math.PI * 2); ctx.fillStyle = bodyColor; ctx.fill()
          ctx.strokeStyle = SECTOR_COLORS[ball.landedSector.color] || '#888'; ctx.lineWidth = 2; ctx.stroke()
        }
      }

      // ── Moving launch indicator (Peggle-style aiming) ──
      const launcher = launcherRef.current
      // The Mirror (reverse_spin): launcher moves faster and in reverse
      const launcherSpeed = reverseLaunch ? 3.5 : 2.2
      const launcherMargin = 35
      launcher.x += launcherSpeed * launcher.dir
      if (launcher.x > wallRight - launcherMargin) { launcher.dir = -1; launcher.x = wallRight - launcherMargin }
      if (launcher.x < wallLeft + launcherMargin) { launcher.dir = 1; launcher.x = wallLeft + launcherMargin }

      // Always show launcher (persistent, even during ball bouncing)
      {
        const lx = launcher.x
        const ly = 14

        // Triangle arrow pointing down
        ctx.beginPath()
        ctx.moveTo(lx - 6, ly - 4)
        ctx.lineTo(lx + 6, ly - 4)
        ctx.lineTo(lx, ly + 6)
        ctx.closePath()
        ctx.fillStyle = '#e8c44a'
        ctx.fill()

        // Glow dot below
        ctx.beginPath()
        ctx.arc(lx, ly + 12, 3, 0, Math.PI * 2)
        ctx.fillStyle = '#e8c44a55'
        ctx.fill()

        // Dotted drop line
        ctx.setLineDash([2, 4])
        ctx.strokeStyle = '#e8c44a33'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(lx, ly + 15)
        ctx.lineTo(lx, ly + 60)
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Expose live stats to sidebar via callback
      // Expose live stats every frame — full card-aware chip/mult totals
      if (onStatsUpdate && anyBallActive) {
        const s = statsRef.current
        // Calculate running chip total from ALL sources
        const baseChipBonus = s.bumperHits * 2
        const emberBonus = sbEffects.extraChipsPerHit * s.bumperHits
        const crystalMult = sbEffects.bonusMultiplier
        const bonusChipValue = s.bonusHits * 2 * crystalMult
        const totalLiveChips = baseChipBonus + emberBonus + bonusChipValue
        const liveMult = s.multiplierHits > 0 ? Math.pow(1.5, s.multiplierHits) : 1
        onStatsUpdate({
          ...s,
          currentChips: Math.floor(totalLiveChips),
          currentMult: liveMult,
          baseChipBonus,
          emberBonus: Math.floor(emberBonus),
          bonusChipValue: Math.floor(bonusChipValue),
          wallBounces: s.wallBounces || 0,
          activeBalls: balls.filter(b => b.active).length,
        })
      }

      // ── Color combo text display ──
      if (comboTextRef.current && comboTextRef.current.frames > 0) {
        const ct = comboTextRef.current
        const alpha = Math.min(1, ct.frames / 30)
        const scale = ct.frames > 70 ? 1 + (ct.frames - 70) / 20 * 0.3 : 1
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.font = `${Math.floor(14 * scale)}px "Press Start 2P", monospace`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        // Shadow
        ctx.fillStyle = '#000'
        ctx.fillText(ct.text, W / 2 + 2, sectorY / 2 + 2)
        // Main text
        ctx.fillStyle = ct.color
        ctx.fillText(ct.text, W / 2, sectorY / 2)
        ctx.restore()
        ct.frames--
        if (ct.frames <= 0) comboTextRef.current = null
      }

      // ── Fire particles (when multiplier is x3+) ──
      const currentMult = 1.5 ** statsRef.current.multiplierHits
      if (anyBallActive && currentMult >= 3) {
        // Spawn fire particles behind active balls
        for (const ball of balls) {
          if (!ball.active) continue
          const particleCount = Math.min(3, Math.floor(currentMult / 3))
          for (let fp = 0; fp < particleCount; fp++) {
            if (Math.random() > 0.4) continue // throttle
            fireParticlesRef.current.push({
              x: ball.x + (Math.random() - 0.5) * 4,
              y: ball.y + (Math.random() - 0.5) * 4,
              vx: (Math.random() - 0.5) * 1.5,
              vy: -1 - Math.random() * 2,
              life: 10 + Math.random() * 8,
              size: 2 + Math.random() * 3,
            })
          }
        }
      }
      // Draw + update fire particles
      const fires = fireParticlesRef.current
      for (let i = fires.length - 1; i >= 0; i--) {
        const fp = fires[i]
        fp.x += fp.vx; fp.y += fp.vy; fp.life--
        if (fp.life <= 0) { fires.splice(i, 1); continue }
        const alpha = fp.life / 20
        const colors = ['#fbbf24', '#f97316', '#ef4444', '#dc2626']
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        ctx.globalAlpha = alpha
        ctx.fillRect(fp.x, fp.y, fp.size, fp.size)
        ctx.globalAlpha = 1
      }

      // ── Cannon burst particles ──
      const bursts = cannonBurstRef.current
      for (let i = bursts.length - 1; i >= 0; i--) {
        const bp = bursts[i]
        bp.x += bp.vx; bp.y += bp.vy; bp.vy += 0.15; bp.life--
        if (bp.life <= 0) { bursts.splice(i, 1); continue }
        const alpha = bp.life / 25
        ctx.fillStyle = bp.color
        ctx.globalAlpha = alpha
        ctx.fillRect(bp.x - 1.5, bp.y - 1.5, 3, 3)
        ctx.globalAlpha = 1
      }

      // ── Screen flash (multiplier pin hit) ──
      if (screenFlashRef.current > 0) {
        ctx.fillStyle = '#ffffff'
        ctx.globalAlpha = screenFlashRef.current / 8
        ctx.fillRect(0, 0, W, H)
        ctx.globalAlpha = 1
        screenFlashRef.current--
      }

      // ── Restore shake transform ──
      if (shakeIntensityRef.current > 0 || shakeRef.current.x !== 0 || shakeRef.current.y !== 0) {
        ctx.restore()
        if (shakeIntensityRef.current <= 0) { shakeRef.current.x = 0; shakeRef.current.y = 0 }
      }

      animRef.current = requestAnimationFrame(drawFrame)
    }

    animRef.current = requestAnimationFrame(drawFrame)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [slots, layout, pipes, onResult])

  return (
    <div className="flex flex-col items-center relative">
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={layout.canvasW}
          height={layout.canvasH}
          style={{
            imageRendering: 'pixelated',
            border: '2px solid #2e6078',
            background: '#0e2430',
            borderRadius: '4px',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
        {/* Pin hit particle effects overlay — absolute within canvas container */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {pinHits.map(h => (
            <PinHitEffect
              key={h.id}
              x={h.x}
              y={h.y}
              type={h.type}
              onComplete={() => setPinHits(prev => prev.filter(p => p.id !== h.id))}
            />
          ))}
        </div>
      </div>
      {landed && (
        <div className="mt-2 text-center">
          <span className="text-xs font-bold" style={{ color: SECTOR_COLORS[landed.color] }}>
            {landed.color.toUpperCase()} — {landed.baseChips} chips
          </span>
          {statsRef.current.bumperHits > 0 && (
            <span className="text-[7px] ml-2" style={{ color: '#88aabb' }}>
              ({statsRef.current.bumperHits} hits
              {statsRef.current.bonusHits > 0 && `, +${statsRef.current.bonusHits * 2} bonus`}
              {statsRef.current.multiplierHits > 0 && `, x${(1.5 ** statsRef.current.multiplierHits).toFixed(1)} mult`}
              {statsRef.current.pipeUses > 0 && `, ${statsRef.current.pipeUses} pipe`})
            </span>
          )}
        </div>
      )}
    </div>
  )
})

export default RouletteWheel
