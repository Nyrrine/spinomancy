import { useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { CARD_RARITY, CARDS } from '../utils/gameConfig'
import { sfx } from '../utils/sounds'

// ── Rarity config ──
const RARITY_CONFIG = {
  [CARD_RARITY.COMMON]: {
    border: 'rarity-common',
    label: 'COMMON',
    labelColor: 'text-text-muted',
    glowColor: null,
  },
  [CARD_RARITY.UNCOMMON]: {
    border: 'rarity-uncommon',
    label: 'UNCOMMON',
    labelColor: 'text-accent-blue',
    glowColor: 'rgba(59, 130, 246, 0.15)',
  },
  [CARD_RARITY.RARE]: {
    border: 'rarity-rare',
    label: 'RARE',
    labelColor: 'text-accent-purple',
    glowColor: 'rgba(168, 85, 247, 0.15)',
  },
  [CARD_RARITY.LEGENDARY]: {
    border: 'rarity-legendary',
    label: 'LEGEND',
    labelColor: 'text-gold',
    glowColor: 'rgba(251, 191, 36, 0.2)',
  },
  [CARD_RARITY.CURSED]: {
    border: 'rarity-cursed',
    label: 'CURSED',
    labelColor: 'text-accent-red',
    glowColor: 'rgba(200, 30, 30, 0.2)',
  },
}

// ── Category icons (tiny ASCII badge) ──
const CATEGORY_BADGE = {
  chips: { label: 'CHIP', color: 'text-accent-blue' },
  mult: { label: 'MULT', color: 'text-accent-red' },
  xmult: { label: 'xMUL', color: 'text-accent-pink' },
  probability: { label: 'PROB', color: 'text-accent-green' },
  utility: { label: 'UTIL', color: 'text-text-dim' },
  scaling: { label: 'SCAL', color: 'text-accent-purple' },
}

export default function Card({
  card: cardProp,
  cardId,
  count,
  stackCount,
  scalingState,
  size,
  onClick,
  disabled = false,
  selected = false,
  highlighted = false,
  compact: compactProp = false,
  sellMode = false,
  sellPrice = 0,
}) {
  // Support both APIs: direct card object or cardId lookup
  const card = cardProp || (cardId ? CARDS[cardId] : null)
  count = count ?? stackCount ?? 1
  const compact = compactProp || size === 'small'
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef(null)

  // ── 3D tilt on hover ──
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), { stiffness: 300, damping: 20 })
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), { stiffness: 300, damping: 20 })

  function handleMouseMove(e) {
    if (!cardRef.current || disabled) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  function handleMouseEnter() {
    setIsHovered(true)
    if (!disabled) sfx.cardFocus()
  }

  function handleMouseLeave() {
    mouseX.set(0)
    mouseY.set(0)
    setIsHovered(false)
  }

  function handleClick() {
    if (disabled) return
    sfx.cardSelect()
    if (onClick) onClick()
  }

  if (!card) return null

  const rarity = RARITY_CONFIG[card.rarity] || RARITY_CONFIG[CARD_RARITY.COMMON]
  const category = CATEGORY_BADGE[card.category] || CATEGORY_BADGE.utility
  const isStackable = card.stackable && count > 1

  const cardW = compact ? 'clamp(85px, 6vw, 120px)' : 'clamp(100px, 7vw, 145px)'
  const cardH = compact ? 'clamp(118px, 8.3vw, 165px)' : 'clamp(140px, 9.8vw, 200px)'

  return (
    <motion.div
      ref={cardRef}
      className="relative select-none"
      style={{
        width: cardW,
        minWidth: compact ? '70px' : '85px',
        height: cardH,
        minHeight: compact ? '95px' : '115px',
        flexShrink: 0,
        perspective: 600,
        transformStyle: 'preserve-3d',
      }}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      whileTap={disabled ? undefined : { scale: 0.95 }}
    >
      {/* ── Stack shadow cards behind ── */}
      {isStackable && count >= 3 && (
        <div
          className={`absolute inset-0 bg-panel border-2 ${rarity.border} opacity-20`}
          style={{ width: cardW, height: cardH, transform: 'translate(4px, 4px)', zIndex: 0 }}
        />
      )}
      {isStackable && count >= 2 && (
        <div
          className={`absolute inset-0 bg-panel border-2 ${rarity.border} opacity-35`}
          style={{ width: cardW, height: cardH, transform: 'translate(2px, 2px)', zIndex: 1 }}
        />
      )}

      {/* ── Main card body ── */}
      <motion.div
        className={`
          relative bg-panel border-2 ${rarity.border}
          card-shine cursor-pointer overflow-hidden
          ${disabled ? 'opacity-40 saturate-0 cursor-not-allowed' : ''}
          ${selected ? 'ring-1 ring-gold ring-offset-1 ring-offset-black -translate-y-2' : ''}
          ${highlighted ? 'ring-1 ring-gold' : ''}
        `}
        style={{
          width: cardW,
          height: cardH,
          rotateX: disabled ? 0 : rotateX,
          rotateY: disabled ? 0 : rotateY,
          transformStyle: 'preserve-3d',
          zIndex: 2,
          background: rarity.glowColor
            ? `radial-gradient(ellipse at 50% 0%, ${rarity.glowColor}, var(--color-panel) 70%)`
            : undefined,
        }}
        animate={selected ? { y: -8 } : { y: 0 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        {/* ── Card inner content ── */}
        <div className="flex flex-col h-full relative" style={{ padding: 'clamp(5px, 0.45vw, 10px)' }}>
          {/* Top row: category badge + cost */}
          <div className="flex justify-between items-start">
            <span className={`text-[clamp(5px,0.42vw,9px)] ${category.color} uppercase`}>{category.label}</span>
            <span className="text-[clamp(6px,0.48vw,10px)] text-gold">${card.cost}</span>
          </div>

          {/* ASCII art icon — the centerpiece */}
          <div className="flex-1 flex items-center justify-center">
            <motion.span
              className="text-[clamp(14px,1.2vw,26px)] text-text leading-none tracking-tight select-none"
              animate={isHovered && !disabled ? {
                textShadow: [
                  '0 0 4px rgba(255,255,255,0.3)',
                  '0 0 8px rgba(255,255,255,0.5)',
                  '0 0 4px rgba(255,255,255,0.3)',
                ],
              } : {}}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {card.ascii}
            </motion.span>
          </div>

          {/* Card name */}
          <div className="text-center mb-[2px]">
            <div className="text-[clamp(6px,0.48vw,10px)] text-text leading-tight truncate" title={card.name}>
              {card.name}
            </div>
          </div>

          {/* Effect description */}
          <div className="text-center">
            <div className="text-[clamp(5px,0.4vw,8px)] text-text-dim leading-tight line-clamp-2">
              {card.description}
            </div>
          </div>

          {/* Rarity label */}
          <div className="text-center mt-auto pt-[2px]">
            <span className={`text-[clamp(4px,0.35vw,7px)] ${rarity.labelColor} uppercase tracking-widest`}>
              {rarity.label}
            </span>
          </div>
        </div>

        {/* ── Stack count badge ── */}
        {isStackable && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-[8px] -right-[8px] z-10 bg-accent-red border-2 border-black flex items-center justify-center rounded-sm"
            style={{ minWidth: 'clamp(20px, 1.5vw, 30px)', height: 'clamp(16px, 1.2vw, 24px)', padding: '0 clamp(3px, 0.3vw, 6px)' }}
          >
            <span className="text-[clamp(7px,0.55vw,11px)] text-white font-bold">x{count}</span>
          </motion.div>
        )}

        {/* ── Sell overlay ── */}
        {sellMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-accent-red/20 flex items-center justify-center z-20"
          >
            <div className="bg-black/80 px-2 py-1 border border-accent-red/50">
              <span className="text-[clamp(5px,0.42vw,9px)] text-gold">SELL ${sellPrice}</span>
            </div>
          </motion.div>
        )}

        {/* ── Disabled X overlay ── */}
        {disabled && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <span className="text-[clamp(16px,1.3vw,28px)] text-accent-red/50">X</span>
          </div>
        )}
      </motion.div>

      {/* ── Hover tooltip with live contribution ── */}
      {isHovered && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-[60] pointer-events-none"
        >
          <div className="bg-[#0a1820] border-2 border-[var(--color-border)]" style={{ padding: 'clamp(6px,0.5vw,12px)', minWidth: 'clamp(140px, 11vw, 240px)', maxWidth: 'clamp(180px, 14vw, 300px)' }}>
            <div className="text-text" style={{ fontSize: 'clamp(7px,0.5vw,11px)', marginBottom: '2px' }}>{card.name}</div>
            <div className="text-text-dim leading-relaxed" style={{ fontSize: 'clamp(5px,0.4vw,9px)' }}>{card.description}</div>

            {/* Stack info */}
            {isStackable && (
              <div className="text-accent-purple" style={{ fontSize: 'clamp(5px,0.38vw,8px)', marginTop: '3px' }}>
                STACKED x{count}
              </div>
            )}

            {/* Live accumulated value for scaling cards */}
            {card.effect && scalingState && (card.effect.type === 'scaling_mult' || card.effect.type === 'scaling_xmult' || card.effect.type === 'scaling_xmult_blind') && (
              <div style={{ marginTop: '4px', padding: '3px 0', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                {card.effect.type === 'scaling_mult' && (
                  <div className="text-accent-blue" style={{ fontSize: 'clamp(5px,0.4vw,9px)' }}>
                    +{((card.effect.baseValue + card.effect.growth * (scalingState.roundsSurvived || 0)) * (count || 1)).toFixed(1)} Mult
                    <span className="text-text-muted"> ({scalingState.roundsSurvived || 0} rounds)</span>
                  </div>
                )}
                {card.effect.type === 'scaling_xmult' && (
                  <div className="text-accent-red" style={{ fontSize: 'clamp(5px,0.4vw,9px)' }}>
                    x{(card.effect.baseValue + card.effect.growth * (scalingState.roundsSurvived || 0)).toFixed(2)}
                    {count > 1 ? ` each (x${count})` : ''}
                    <span className="text-text-muted"> ({scalingState.roundsSurvived || 0} rounds)</span>
                  </div>
                )}
                {card.effect.type === 'scaling_xmult_blind' && (
                  <div className="text-accent-pink" style={{ fontSize: 'clamp(5px,0.4vw,9px)' }}>
                    x{(card.effect.baseValue + card.effect.growth * (scalingState.blindsBeaten || 0)).toFixed(2)}
                    {count > 1 ? ` each (x${count})` : ''}
                    <span className="text-text-muted"> ({scalingState.blindsBeaten || 0} blinds)</span>
                  </div>
                )}
              </div>
            )}

            {/* Chip/mult contribution for non-scaling cards */}
            {card.effect && !card.effect.type?.startsWith('scaling') && (
              <div style={{ marginTop: '3px' }}>
                {(card.effect.type === 'add_chips' || card.effect.type === 'per_hit_chips' || card.effect.type === 'wall_bounce_chips') && (
                  <div className="text-accent-blue" style={{ fontSize: 'clamp(5px,0.38vw,8px)' }}>
                    +{(card.effect.value || 0) * (count || 1)} chips{card.effect.trigger === 'per_spin' ? '/spin' : card.effect.trigger === 'always' ? '' : ` on ${card.effect.trigger?.replace('on_', '')}`}
                  </div>
                )}
                {card.effect.type === 'add_mult' && (
                  <div className="text-accent-red" style={{ fontSize: 'clamp(5px,0.38vw,8px)' }}>
                    +{(card.effect.value || 0) * (count || 1)} Mult
                  </div>
                )}
                {card.effect.type === 'x_mult' && (
                  <div className="text-accent-pink" style={{ fontSize: 'clamp(5px,0.38vw,8px)' }}>
                    x{card.effect.value} Mult on {card.effect.trigger?.replace('on_', '').replace('final_spin', 'last spin')}
                  </div>
                )}
              </div>
            )}

            {card.stackable && !isStackable && (
              <div className="text-text-muted" style={{ fontSize: 'clamp(4px,0.32vw,7px)', marginTop: '2px' }}>[ STACKABLE ]</div>
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
