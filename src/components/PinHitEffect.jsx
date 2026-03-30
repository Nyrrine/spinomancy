import { memo, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Color presets per pin type
const HIT_COLORS = {
  bonus:  ['#fbbf24', '#fcd34d', '#fff7ed', '#f59e0b'],
  normal: ['#e2e8f0', '#cbd5e1', '#f8fafc', '#94a3b8'],
}

// Per-particle config — kept tiny for performance
const PARTICLE_COUNT = 5
const DURATION = 0.3

function Burst({ x, y, type, id }) {
  const colors = HIT_COLORS[type] || HIT_COLORS.normal
  const particles = useMemo(() =>
    Array.from({ length: PARTICLE_COUNT }, (_, i) => {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.6
      const dist = 8 + Math.random() * 10
      return {
        key: i,
        color: colors[i % colors.length],
        size: 2 + Math.random() * 2,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist,
      }
    }),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  [id])

  return (
    <div
      className="absolute pointer-events-none"
      style={{ left: x, top: y, zIndex: 20 }}
    >
      {particles.map(p => (
        <motion.div
          key={p.key}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: p.color,
            left: -p.size / 2,
            top: -p.size / 2,
            boxShadow: `0 0 ${p.size + 2}px ${p.color}`,
          }}
          initial={{ opacity: 1, x: 0, y: 0, scale: 1 }}
          animate={{ opacity: 0, x: p.dx, y: p.dy, scale: 0.2 }}
          transition={{ duration: DURATION, ease: 'easeOut' }}
        />
      ))}
      {/* Central flash */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 6,
          height: 6,
          left: -3,
          top: -3,
          background: type === 'bonus' ? '#fde68a' : '#f1f5f9',
          boxShadow: type === 'bonus'
            ? '0 0 8px #fbbf24, 0 0 16px #f59e0b'
            : '0 0 6px #e2e8f0',
        }}
        initial={{ opacity: 0.9, scale: 1.2 }}
        animate={{ opacity: 0, scale: 0.1 }}
        transition={{ duration: DURATION * 0.7, ease: 'easeOut' }}
      />
    </div>
  )
}

/**
 * Renders pin-hit particle bursts overlaid on the roulette arena.
 *
 * @param {Array} hits - Array of { id, x, y, type } where x/y are
 *   percentage positions (0-100) relative to the canvas container,
 *   and type is 'bonus' | 'normal'.
 * @param {function} onDone - Called with hit id when animation completes.
 */
function PinHitEffect({ hits, onDone, x, y, type, onComplete }) {
  // Single-burst mode (used by RouletteWheel)
  if (x !== undefined && y !== undefined) {
    return (
      <motion.div
        className="absolute pointer-events-none"
        style={{ left: typeof x === 'number' ? `${x}%` : x, top: typeof y === 'number' ? `${y}%` : y }}
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: DURATION }}
        onAnimationComplete={onComplete}
      >
        <Burst x={0} y={0} type={type || 'normal'} id={`single-${Date.now()}`} />
      </motion.div>
    )
  }

  // Multi-burst mode (array of hits)
  if (!hits || !Array.isArray(hits)) return null
  return (
    <AnimatePresence>
      {hits.map(hit => (
        <motion.div
          key={hit.id}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={() => onDone?.(hit.id)}
        >
          <Burst x={`${hit.x}%`} y={`${hit.y}%`} type={hit.type} id={hit.id} />
        </motion.div>
      ))}
    </AnimatePresence>
  )
}

export default memo(PinHitEffect)
