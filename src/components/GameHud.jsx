// ═══════════════════════════════════════
// GAME HUD — In-game display components
// ═══════════════════════════════════════

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ── Animated Score Counter ──
// Smoothly counts from previous to current score over ~800ms
export function AnimatedScore({ value, className = '' }) {
  const [display, setDisplay] = useState(value)
  const prev = useRef(value)
  const raf = useRef(null)

  useEffect(() => {
    const from = prev.current
    const to = value
    if (from === to) return

    const duration = 800
    const start = performance.now()
    const diff = to - from

    function tick(now) {
      const elapsed = now - start
      const t = Math.min(elapsed / duration, 1)
      // Ease-out cubic for satisfying deceleration
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(Math.round(from + diff * eased))
      if (t < 1) {
        raf.current = requestAnimationFrame(tick)
      } else {
        prev.current = to
      }
    }

    raf.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf.current)
  }, [value])

  return (
    <motion.span
      key={value}
      className={`tabular-nums ${className}`}
      animate={value !== prev.current ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.3 }}
    >
      {display.toLocaleString()}
    </motion.span>
  )
}

// ── Spins Remaining Indicator ──
// Visual boxes: filled = available, dark = used. Pop animation when used.
export function SpinsIndicator({ total, remaining }) {
  const [poppedIndex, setPoppedIndex] = useState(-1)
  const prevRemaining = useRef(remaining)

  useEffect(() => {
    if (remaining < prevRemaining.current) {
      // A spin was just used — pop the one that went dark
      const usedIndex = remaining
      setPoppedIndex(usedIndex)
      const t = setTimeout(() => setPoppedIndex(-1), 400)
      prevRemaining.current = remaining
      return () => clearTimeout(t)
    }
    prevRemaining.current = remaining
  }, [remaining])

  return (
    <div className="flex items-center gap-1">
      <span className="text-[5px] text-text-dim tracking-wider mr-1">SPINS</span>
      {Array.from({ length: total }).map((_, i) => {
        const isAvailable = i < remaining
        const justUsed = i === poppedIndex

        return (
          <motion.div
            key={i}
            className="w-3 h-3"
            style={{
              background: isAvailable ? '#e8c44a' : '#0d2233',
              border: `1px solid ${isAvailable ? '#c7a030' : '#2a5570'}`,
              borderRadius: '2px',
            }}
            animate={justUsed ? {
              scale: [1, 1.6, 0.8, 1],
              opacity: [1, 1, 0.5, 0.3],
            } : {}}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          />
        )
      })}
    </div>
  )
}

// ── Blind Progress Indicator ──
// Shows "Blind 2/3" with small visual dots
export function BlindProgress({ currentBlind, totalBlinds = 3, anteNumber }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[6px] text-text-dim tracking-wider">
        ANTE {anteNumber}
      </span>
      <div className="flex items-center gap-1">
        {Array.from({ length: totalBlinds }).map((_, i) => (
          <div
            key={i}
            className="w-2 h-2"
            style={{
              background: i < currentBlind ? '#3d8b37'
                : i === currentBlind ? '#e07828'
                : '#0d2233',
              border: `1px solid ${
                i < currentBlind ? '#5aa854'
                : i === currentBlind ? '#f09040'
                : '#2a5570'
              }`,
              borderRadius: '1px',
            }}
          />
        ))}
      </div>
      <span className="text-[6px] text-text-dim">
        {currentBlind + 1}/{totalBlinds}
      </span>
    </div>
  )
}

// ── Score Milestone Celebration ──
// Brief gold flash text inside the score panel area (sidebar, not screen center)
const MILESTONES = [1000, 5000, 10000, 50000, 100000, 500000, 1000000]
const MILESTONE_LABELS = { 1000: '1K', 5000: '5K', 10000: '10K', 50000: '50K', 100000: '100K', 500000: '500K', 1000000: '1M' }

export function MilestoneCelebration({ totalScore }) {
  const [milestone, setMilestone] = useState(null)
  const crossedRef = useRef(new Set())

  useEffect(() => {
    for (const m of MILESTONES) {
      if (totalScore >= m && !crossedRef.current.has(m)) {
        crossedRef.current.add(m)
        setMilestone(m)
        const t = setTimeout(() => setMilestone(null), 1500)
        return () => clearTimeout(t)
      }
    }
  }, [totalScore])

  return (
    <AnimatePresence>
      {milestone && (
        <motion.div
          key={milestone}
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: [0.5, 1.3, 1.0], opacity: [0, 1, 1] }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="text-center py-1"
        >
          <span className="text-[clamp(14px,1.2vw,24px)] font-bold text-gold"
            style={{ textShadow: '0 0 12px #e8c44a66, 0 2px 0 #7a6020' }}>
            {MILESTONE_LABELS[milestone]}!
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ── Hot Streak Counter ──
// Shows consecutive spins scoring above average
export function HotStreakCounter({ history = [] }) {
  const [streak, setStreak] = useState(0)
  const prevLen = useRef(0)

  useEffect(() => {
    if (history.length <= prevLen.current) {
      prevLen.current = history.length
      return
    }
    prevLen.current = history.length

    if (history.length < 2) { setStreak(0); return }

    // Calculate running average (excluding latest spin)
    const pastScores = history.slice(0, -1)
    const avg = pastScores.reduce((s, h) => s + h.score, 0) / pastScores.length
    const latest = history[history.length - 1].score

    if (latest > avg) {
      setStreak(s => s + 1)
    } else {
      setStreak(0)
    }
  }, [history])

  if (streak < 2) return null

  return (
    <motion.div
      key={streak}
      initial={{ scale: 0.5, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="text-center"
    >
      <span className="text-[clamp(6px,0.45vw,9px)] text-accent-red">
        HOT x{streak}
      </span>
    </motion.div>
  )
}

// ── Pulsing Target Number ──
// Target score pulses and grows as player approaches it
export function PulsingTarget({ score, target }) {
  const progress = Math.min(1, score / Math.max(1, target))
  // Scale: 1.0 at 0%, 1.3 at 100%
  const scale = 1 + progress * 0.3
  // Pulse speed: faster as you approach (2s at 0%, 0.5s at 90%+)
  const pulseSpeed = Math.max(0.5, 2 - progress * 1.8)
  // Color shifts from dim to gold as approaching
  const color = progress > 0.8 ? '#e8c44a' : progress > 0.5 ? '#7a9ab0' : '#3d6580'

  return (
    <motion.span
      className="tabular-nums inline-block"
      animate={progress > 0.3 ? {
        scale: [scale, scale * 1.08, scale],
      } : {}}
      transition={{
        duration: pulseSpeed,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{ color, transformOrigin: 'center' }}
    >
      {target.toLocaleString()}
    </motion.span>
  )
}

// ── Score Delta Popup ──
// Shows "+1,234" floating up when score changes
export function ScoreDelta({ value }) {
  if (!value || value === 0) return null

  return (
    <AnimatePresence>
      <motion.div
        key={value + '-' + Date.now()}
        initial={{ y: 0, opacity: 1, scale: 0.8 }}
        animate={{ y: -30, opacity: 0, scale: 1.2 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute -top-6 left-1/2 -translate-x-1/2 pointer-events-none"
      >
        <span className={`text-[9px] font-bold ${
          value > 0 ? 'text-accent-green' : 'text-accent-red'
        }`}>
          {value > 0 ? '+' : ''}{value.toLocaleString()}
        </span>
      </motion.div>
    </AnimatePresence>
  )
}
