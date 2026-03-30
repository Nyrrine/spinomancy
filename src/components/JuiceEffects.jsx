import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// ═══════════════════════════════════════
// FIRE BORDER — intensifies with score
// ═══════════════════════════════════════
// 500+ : orange glow at edges
// 2000+ : flames (animated glow pulses)
// 10000+ : full inferno (intense, flickering)

export function FireBorder({ score = 0, className = '' }) {
  if (score < 500) return null

  const tier = score >= 10000 ? 'inferno' : score >= 2000 ? 'flames' : 'glow'

  const styles = {
    glow: {
      boxShadow: 'inset 0 0 30px rgba(224, 112, 48, 0.15), inset 0 0 60px rgba(224, 112, 48, 0.05)',
    },
    flames: {
      boxShadow: 'inset 0 0 40px rgba(224, 112, 48, 0.25), inset 0 0 80px rgba(200, 60, 20, 0.1)',
    },
    inferno: {
      boxShadow: 'inset 0 0 60px rgba(224, 80, 20, 0.35), inset 0 0 120px rgba(200, 40, 10, 0.15), inset 0 0 20px rgba(255, 200, 50, 0.1)',
    },
  }

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none z-40 ${className}`}
      animate={tier === 'inferno' ? {
        boxShadow: [
          'inset 0 0 60px rgba(224, 80, 20, 0.35), inset 0 0 120px rgba(200, 40, 10, 0.15)',
          'inset 0 0 80px rgba(255, 100, 30, 0.4), inset 0 0 140px rgba(220, 50, 10, 0.2)',
          'inset 0 0 50px rgba(200, 60, 20, 0.3), inset 0 0 100px rgba(180, 30, 10, 0.12)',
          'inset 0 0 60px rgba(224, 80, 20, 0.35), inset 0 0 120px rgba(200, 40, 10, 0.15)',
        ],
      } : tier === 'flames' ? {
        boxShadow: [
          'inset 0 0 40px rgba(224, 112, 48, 0.25), inset 0 0 80px rgba(200, 60, 20, 0.1)',
          'inset 0 0 55px rgba(240, 120, 40, 0.3), inset 0 0 90px rgba(210, 70, 25, 0.12)',
          'inset 0 0 40px rgba(224, 112, 48, 0.25), inset 0 0 80px rgba(200, 60, 20, 0.1)',
        ],
      } : {}}
      transition={tier !== 'glow' ? { duration: tier === 'inferno' ? 0.8 : 1.2, repeat: Infinity, ease: 'easeInOut' } : {}}
      style={tier === 'glow' ? styles.glow : undefined}
    />
  )
}

// ═══════════════════════════════════════
// ANIMATED BACKGROUND TINT
// ═══════════════════════════════════════
// Calm blue during idle, red pulse during spins, gold burst on cleared

export function BackgroundTint({ gameState = 'idle', className = '' }) {
  const tints = {
    idle: 'rgba(42, 93, 170, 0.03)',
    spinning: 'rgba(200, 50, 40, 0.06)',
    scoring: 'rgba(232, 184, 74, 0.05)',
    cleared: 'rgba(61, 155, 61, 0.08)',
    failed: 'rgba(208, 64, 64, 0.08)',
  }

  const color = tints[gameState] || tints.idle

  return (
    <motion.div
      className={`fixed inset-0 pointer-events-none z-[1] ${className}`}
      animate={{
        background: `radial-gradient(ellipse at center, ${color} 0%, transparent 70%)`,
      }}
      transition={{ duration: gameState === 'cleared' ? 0.3 : 0.8, ease: 'easeInOut' }}
    />
  )
}

// ═══════════════════════════════════════
// SCORE EXPLOSION SCALE
// ═══════════════════════════════════════
// Numbers grow bigger with digit count — Balatro style
// 3 digits: normal, 4 digits: +10%, 5 digits: +25%, 6+: +40%

export function ExplosiveScore({ value, className = '' }) {
  const digits = Math.max(1, String(Math.abs(value)).length)
  const scaleFactor = digits <= 3 ? 1 : digits === 4 ? 1.1 : digits === 5 ? 1.25 : digits === 6 ? 1.4 : 1.6
  const isHuge = digits >= 5

  return (
    <motion.span
      className={`tabular-nums inline-block ${className}`}
      animate={{
        scale: scaleFactor,
        textShadow: isHuge
          ? `0 0 ${digits * 3}px rgba(232, 184, 74, ${Math.min(0.5, digits * 0.08)})`
          : '0 0 0px transparent',
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      style={{ transformOrigin: 'center', display: 'inline-block' }}
    >
      {value.toLocaleString()}
    </motion.span>
  )
}

// ═══════════════════════════════════════
// GOLD BURST — brief flash on blind cleared
// ═══════════════════════════════════════

export function GoldBurst({ active = false }) {
  // Subtle version — just a faint glow, not a screen flash
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-[45]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.12, 0] }}
          style={{ background: 'radial-gradient(ellipse at center, rgba(232, 184, 74, 0.15) 0%, transparent 60%)' }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          exit={{ opacity: 0 }}
        />
      )}
    </AnimatePresence>
  )
}

export default { FireBorder, BackgroundTint, ExplosiveScore, GoldBurst }
