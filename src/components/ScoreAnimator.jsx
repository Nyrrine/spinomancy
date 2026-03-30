import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { sfx } from '../utils/sounds'

function playTickSound(progress, magnitude) {
  // Alternate between chips sounds for variety during counting
  if (progress < 0.5) {
    sfx.chipsAccum()
  } else {
    sfx.chips()
  }
}

function playFinalSound(magnitude) {
  sfx.pop()
}

// ── Fire particle component ──
function FireParticle({ x, delay }) {
  const size = 3 + Math.random() * 4
  const drift = (Math.random() - 0.5) * 30
  const colors = ['#fbbf24', '#f97316', '#ef4444', '#dc2626']
  const color = colors[Math.floor(Math.random() * colors.length)]

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: x,
        bottom: 0,
        width: size,
        height: size,
        background: color,
      }}
      initial={{ opacity: 1, y: 0, x: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 0],
        y: [0, -30 - Math.random() * 50, -60 - Math.random() * 40],
        x: [0, drift * 0.5, drift],
        scale: [1, 0.8, 0.2],
      }}
      transition={{
        duration: 0.6 + Math.random() * 0.4,
        delay: delay,
        ease: 'easeOut',
      }}
    />
  )
}

// ── Screen shake wrapper ──
function ShakeWrapper({ intensity = 0, children }) {
  const shakeX = useRef(0)
  const shakeY = useRef(0)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const frameRef = useRef(null)
  const intensityRef = useRef(intensity)
  intensityRef.current = intensity

  useEffect(() => {
    if (intensity === 0) {
      setOffset({ x: 0, y: 0 })
      return
    }

    let frame = 0
    function shake() {
      const i = intensityRef.current
      if (i <= 0) {
        setOffset({ x: 0, y: 0 })
        return
      }
      const decay = Math.max(0, 1 - frame * 0.04)
      const mag = i * decay
      shakeX.current = (Math.random() - 0.5) * mag * 2
      shakeY.current = (Math.random() - 0.5) * mag * 2
      setOffset({ x: shakeX.current, y: shakeY.current })
      frame++
      if (decay > 0.01) {
        frameRef.current = requestAnimationFrame(shake)
      } else {
        setOffset({ x: 0, y: 0 })
      }
    }
    shake()
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current)
    }
  }, [intensity])

  return (
    <div style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
      {children}
    </div>
  )
}

// ── Main ScoreAnimator component ──
export default function ScoreAnimator({
  targetScore,
  previousScore = 0,
  onComplete,
  label = '',
  className = '',
}) {
  const [displayValue, setDisplayValue] = useState(previousScore)
  const [isAnimating, setIsAnimating] = useState(false)
  const [shakeIntensity, setShakeIntensity] = useState(0)
  const [fireParticles, setFireParticles] = useState([])
  const [showFinal, setShowFinal] = useState(false)
  const animRef = useRef(null)
  const containerRef = useRef(null)
  const prevTargetRef = useRef(previousScore)

  const scoreDiff = targetScore - previousScore
  const magnitude = Math.abs(scoreDiff)

  // Determine animation duration based on score magnitude
  const duration = useMemo(() => {
    if (magnitude <= 0) return 0
    if (magnitude < 100) return 600
    if (magnitude < 1000) return 900
    if (magnitude < 10000) return 1200
    return 1600
  }, [magnitude])

  // Tick count — more ticks for bigger numbers (Balatro feel)
  const tickCount = useMemo(() => {
    if (magnitude <= 0) return 0
    if (magnitude < 50) return 8
    if (magnitude < 500) return 16
    if (magnitude < 5000) return 24
    return 32
  }, [magnitude])

  // Spawn fire particles for big scores
  const spawnFire = useCallback(() => {
    if (magnitude < 10000) return
    const count = Math.min(20, Math.floor(magnitude / 5000) + 5)
    const particles = Array.from({ length: count }).map((_, i) => ({
      id: Date.now() + i,
      x: `${20 + Math.random() * 60}%`,
      delay: Math.random() * 0.3,
    }))
    setFireParticles(particles)
  }, [magnitude])

  // Run the counting animation
  useEffect(() => {
    if (targetScore === prevTargetRef.current) return
    if (magnitude === 0) return
    prevTargetRef.current = targetScore

    setIsAnimating(true)
    setShowFinal(false)
    const startValue = previousScore
    const startTime = performance.now()
    let lastTickAt = 0

    // Calculate shake intensity based on score magnitude
    const shake = magnitude > 50000 ? 6 : magnitude > 10000 ? 4 : magnitude > 1000 ? 2 : 0
    if (shake > 0) setShakeIntensity(shake)

    function step(now) {
      const elapsed = now - startTime
      const progress = Math.min(1, elapsed / duration)

      // Easing: slow start, fast middle, dramatic slowdown at end
      const eased = progress < 0.1
        ? progress * progress * 50 // slow start (quadratic)
        : progress < 0.85
          ? 0.5 + (progress - 0.1) * 0.5 / 0.75 // fast linear middle
          : 1 - Math.pow(1 - progress, 3) // cubic ease-out end

      const current = Math.round(startValue + scoreDiff * eased)
      setDisplayValue(current)

      // Play tick sounds at intervals
      const tickInterval = duration / tickCount
      if (now - lastTickAt > tickInterval && progress < 0.95) {
        playTickSound(progress, magnitude)
        lastTickAt = now
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step)
      } else {
        // Final landing
        setDisplayValue(targetScore)
        setIsAnimating(false)
        setShowFinal(true)
        setShakeIntensity(0)
        playFinalSound(magnitude)
        spawnFire()

        // Clear final pop after a moment
        setTimeout(() => setShowFinal(false), 600)
        if (onComplete) setTimeout(onComplete, 300)
      }
    }

    animRef.current = requestAnimationFrame(step)
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current)
    }
  }, [targetScore, previousScore, scoreDiff, magnitude, duration, tickCount, spawnFire, onComplete])

  // Size class based on magnitude
  const sizeClass = magnitude > 50000
    ? 'text-4xl'
    : magnitude > 10000
      ? 'text-3xl'
      : magnitude > 1000
        ? 'text-2xl'
        : 'text-xl'

  // Color based on score positivity
  const colorClass = scoreDiff > 0 ? 'text-gold' : scoreDiff < 0 ? 'text-accent-red' : 'text-text'

  return (
    <ShakeWrapper intensity={shakeIntensity}>
      <div ref={containerRef} className={`relative inline-block ${className}`}>
        {/* Label */}
        {label && (
          <div className="text-[6px] text-text-muted uppercase tracking-widest text-center mb-1">
            {label}
          </div>
        )}

        {/* Score number */}
        <motion.div
          className={`${sizeClass} ${colorClass} tabular-nums text-center leading-none`}
          animate={showFinal ? {
            scale: [1, 1.15, 1],
            textShadow: [
              '0 0 0px transparent',
              `0 0 20px ${scoreDiff > 0 ? 'rgba(251, 191, 36, 0.6)' : 'rgba(220, 38, 38, 0.6)'}`,
              '0 0 0px transparent',
            ],
          } : {}}
          transition={{ duration: 0.4 }}
        >
          {displayValue.toLocaleString()}
        </motion.div>

        {/* Score delta popup */}
        <AnimatePresence>
          {showFinal && scoreDiff !== 0 && (
            <motion.div
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: 1, y: -16 }}
              exit={{ opacity: 0, y: -28 }}
              transition={{ duration: 0.5 }}
              className="absolute -top-2 right-0 pointer-events-none"
            >
              <span className={`text-[10px] ${scoreDiff > 0 ? 'text-accent-green' : 'text-accent-red'}`}>
                {scoreDiff > 0 ? '+' : ''}{scoreDiff.toLocaleString()}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Fire particles */}
        <div className="absolute inset-x-0 bottom-0 h-16 overflow-visible pointer-events-none">
          <AnimatePresence>
            {fireParticles.map(p => (
              <FireParticle key={p.id} x={p.x} delay={p.delay} />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </ShakeWrapper>
  )
}

// ── Standalone score delta popup (for inline use) ──
export function ScoreDelta({ value, className = '' }) {
  if (value === 0) return null
  const color = value > 0 ? 'text-accent-green' : 'text-accent-red'
  return (
    <motion.span
      initial={{ opacity: 0, y: 5, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10 }}
      className={`text-[9px] ${color} ${className}`}
    >
      {value > 0 ? '+' : ''}{value.toLocaleString()}
    </motion.span>
  )
}

// ── Chip + Mult breakdown display (Balatro style) ──
export function ScoreBreakdown({ chips = 0, addMult = 0, xMult = 1, className = '' }) {
  const finalScore = Math.round((chips) * (1 + addMult) * xMult)

  return (
    <div className={`flex items-center gap-2 justify-center ${className}`}>
      {/* Chips */}
      <div className="panel-inset px-2 py-1 text-center min-w-[50px]">
        <div className="text-[5px] text-text-muted uppercase">Chips</div>
        <div className="text-[12px] text-accent-blue tabular-nums">{chips}</div>
      </div>

      <span className="text-[8px] text-text-muted">x</span>

      {/* +Mult */}
      <div className="panel-inset px-2 py-1 text-center min-w-[50px]">
        <div className="text-[5px] text-text-muted uppercase">Mult</div>
        <div className="text-[12px] text-accent-red tabular-nums">{(1 + addMult).toFixed(1)}</div>
      </div>

      {xMult > 1 && (
        <>
          <span className="text-[8px] text-text-muted">x</span>
          {/* xMult */}
          <div className="panel-inset px-2 py-1 text-center min-w-[50px] border-accent-pink/30">
            <div className="text-[5px] text-text-muted uppercase">xMult</div>
            <div className="text-[12px] text-accent-pink tabular-nums">{xMult.toFixed(1)}</div>
          </div>
        </>
      )}

      <span className="text-[8px] text-text-muted">=</span>

      {/* Final */}
      <div className="panel-inset px-2 py-1 text-center min-w-[60px] border-gold/30">
        <div className="text-[5px] text-text-muted uppercase">Score</div>
        <div className="text-[14px] text-gold tabular-nums">{finalScore.toLocaleString()}</div>
      </div>
    </div>
  )
}
