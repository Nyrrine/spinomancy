// ═══════════════════════════════════════
// BLIND SELECT — Balatro GBA style
// ═══════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ANTES, BLIND_TYPES, getBossBlind } from '../utils/gameConfig'

const BLIND_META = {
  small: { label: 'SMALL BLIND', icon: '[ ]', tagColor: '#e07828' },
  big:   { label: 'BIG BLIND',   icon: '[+]', tagColor: '#e07828' },
  boss:  { label: 'BOSS BLIND',  icon: '[X]', tagColor: '#d040a0' },
}

function formatScore(n) {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K`
  return n.toString()
}

function BlindCard({ type, target, isCurrent, isCompleted, boss, onClick, tutorialHighlight = false }) {
  const meta = BLIND_META[type]
  const isBoss = type === 'boss'

  const tagColor = meta.tagColor
  const borderColor = isCompleted ? '#3d8b37'
    : isCurrent ? tagColor
    : 'var(--color-border)'

  return (
    <motion.button
      onClick={onClick}
      disabled={!isCurrent}
      initial={{ y: 60, opacity: 0, scale: 0.8 }}
      animate={{
        y: 0,
        opacity: 1,
        scale: 1,
        ...(tutorialHighlight ? {
          boxShadow: ['0 0 0px #e0782800', '0 0 20px #e0782860', '0 0 0px #e0782800'],
        } : {}),
      }}
      transition={tutorialHighlight
        ? { y: { delay: 0.1 }, opacity: { delay: 0.1 }, boxShadow: { duration: 1.5, repeat: Infinity } }
        : {
            delay: type === 'small' ? 0.15 : type === 'big' ? 0.35 : 0.55,
            type: 'spring',
            stiffness: 300,
            damping: 15,
          }
      }
      whileHover={isCurrent ? {
        scale: 1.06,
        y: -8,
        rotate: [0, -1.5, 1.5, -0.5, 0],
        transition: { rotate: { duration: 0.4 }, scale: { type: 'spring', stiffness: 400 } },
      } : {}}
      whileTap={isCurrent ? { scale: 0.94, y: 2 } : {}}
      className="flex flex-col items-center transition-all relative"
      style={{
        width: 'clamp(140px, 11vw, 220px)',
        background: isCompleted ? '#1a3d2a' : 'var(--color-panel)',
        border: `clamp(2px, 0.2vw, 4px) solid ${borderColor}`,
        borderRadius: '4px',
        opacity: !isCurrent && !isCompleted ? 0.45 : 1,
        cursor: isCurrent ? 'pointer' : 'not-allowed',
        padding: 0,
        overflow: 'hidden',
      }}
    >
      {/* Colored Tag */}
      <div
        className="w-full text-center relative"
        style={{
          padding: 'clamp(4px, 0.4vw, 8px) 0',
          background: isCompleted ? '#3d8b37' : tagColor,
        }}
      >
        <span className="text-[clamp(7px,0.55vw,12px)] tracking-wider text-white font-bold drop-shadow-sm">
          {isCompleted ? 'CLEAR' : meta.label}
        </span>
        {isCurrent && (
          <motion.span
            className="absolute right-2 top-1/2 -translate-y-1/2 text-white text-[clamp(5px,0.42vw,9px)]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity }}
          >
            {'>>'}
          </motion.span>
        )}
      </div>

      {/* Card Body */}
      <div className="w-full flex flex-col items-center" style={{ padding: 'clamp(8px, 0.7vw, 16px)', gap: 'clamp(6px, 0.5vw, 12px)' }}>
        <div
          className="tracking-widest"
          style={{
            fontSize: 'clamp(12px, 1vw, 20px)',
            color: isCompleted ? '#3d8b37' : isCurrent ? tagColor : '#7a9ab0',
          }}
        >
          {meta.icon}
        </div>

        <div className="text-center">
          <div
            className="tabular-nums"
            style={{
              fontSize: 'clamp(14px, 1.1vw, 24px)',
              color: isCompleted ? '#5aa854' : '#e0e8f0',
            }}
          >
            {formatScore(target)}
          </div>
          <div className="text-[clamp(4px,0.32vw,7px)] uppercase tracking-widest" style={{ color: 'var(--color-text-dim)' }}>
            Score Min
          </div>
        </div>

        {isBoss && boss && (
          <div
            className="w-full text-center mt-1"
            style={{
              padding: 'clamp(6px, 0.5vw, 12px)',
              background: '#0d2030',
              border: `1px solid ${isCurrent ? '#d040a060' : '#2e607840'}`,
              borderRadius: '2px',
            }}
          >
            <div
              className="text-[clamp(5px,0.42vw,9px)] tracking-wider mb-1"
              style={{ color: isCurrent ? '#d040a0' : '#7a9ab0' }}
            >
              {boss.name}
            </div>
            <div className="text-[clamp(4px,0.32vw,7px)] leading-relaxed" style={{ color: 'var(--color-text-dim)' }}>
              {boss.description}
            </div>
          </div>
        )}
      </div>
    </motion.button>
  )
}

export default function BlindSelect({ anteIndex, currentBlind, onSelectBlind, score, money, isFirstGame = false }) {
  const ante = ANTES[anteIndex]
  if (!ante) return null

  const boss = getBossBlind(anteIndex)

  const isNewAnte = currentBlind === 0
  const [showSplash, setShowSplash] = useState(isNewAnte)

  useEffect(() => {
    if (isNewAnte) {
      setShowSplash(true)
      const t = setTimeout(() => setShowSplash(false), 1500)
      return () => clearTimeout(t)
    }
  }, [anteIndex, isNewAnte])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-4"
      style={{ background: '#0a1a24ee' }}
    >
      {/* Ante Title Splash */}
      <AnimatePresence>
        {showSplash && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: '#0c1e2c' }}
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
          >
            <motion.div
              className="text-center"
              initial={{ opacity: 0, scale: 1.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.1 }}
            >
              <motion.div
                className="text-[clamp(7px,0.55vw,12px)] uppercase tracking-[0.4em] mb-3"
                style={{ color: '#88aabb' }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {anteIndex === 0 ? 'Begin Your Run' : 'Next Ante'}
              </motion.div>
              <motion.h1
                className="text-gold"
                style={{ fontSize: 'clamp(32px, 3vw, 64px)' }}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 250, damping: 15, delay: 0.3 }}
              >
                ANTE {ante.ante}
              </motion.h1>
              <motion.div
                className="mt-3 flex gap-0.5 justify-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                {ANTES.map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 'clamp(12px, 1vw, 20px)', height: 'clamp(3px, 0.25vw, 5px)',
                      background: i < anteIndex ? '#3d8b37' : i === anteIndex ? '#e8c44a' : '#183848',
                      borderRadius: '1px',
                    }}
                  />
                ))}
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-start w-full" style={{ gap: 'clamp(16px, 1.5vw, 32px)', maxWidth: 'clamp(600px, 55vw, 1000px)' }}>
        {/* Left Sidebar */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="hidden md:flex flex-col shrink-0"
          style={{ width: 'clamp(150px, 12vw, 240px)', gap: 'clamp(8px, 0.7vw, 16px)' }}
        >
          <div
            className="text-center"
            style={{
              padding: 'clamp(8px, 0.7vw, 16px)',
              background: 'var(--color-panel)',
              border: 'calc(2px * var(--game-scale)) solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            <div className="text-[clamp(4px,0.32vw,7px)] uppercase tracking-widest mb-1" style={{ color: 'var(--color-text-dim)' }}>
              Score
            </div>
            <div className="text-[clamp(14px,1.1vw,24px)] text-gold tabular-nums">
              {(score ?? 0).toLocaleString()}
            </div>
          </div>

          <div
            className="space-y-[clamp(6px,0.5vw,12px)]"
            style={{
              padding: 'clamp(8px, 0.7vw, 16px)',
              background: 'var(--color-panel)',
              border: 'calc(2px * var(--game-scale)) solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            <div className="flex justify-between items-center">
              <span className="text-[clamp(5px,0.38vw,8px)] uppercase" style={{ color: 'var(--color-text-dim)' }}>Ante</span>
              <span className="text-[clamp(11px,0.85vw,18px)] text-gold">{ante.ante}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[clamp(5px,0.38vw,8px)] uppercase" style={{ color: 'var(--color-text-dim)' }}>Round</span>
              <span className="text-[clamp(11px,0.85vw,18px)]" style={{ color: '#e0e8f0' }}>
                {currentBlind + 1} / 3
              </span>
            </div>
            {money !== undefined && (
              <div className="flex justify-between items-center">
                <span className="text-[clamp(5px,0.38vw,8px)] uppercase" style={{ color: 'var(--color-text-dim)' }}>Money</span>
                <span className="text-[clamp(11px,0.85vw,18px)] text-gold">${money}</span>
              </div>
            )}
          </div>

          <div
            style={{
              padding: 'clamp(8px, 0.7vw, 16px)',
              background: 'var(--color-panel)',
              border: 'calc(2px * var(--game-scale)) solid var(--color-border)',
              borderRadius: '4px',
            }}
          >
            <div className="text-[clamp(4px,0.32vw,7px)] uppercase tracking-widest mb-2 text-center" style={{ color: 'var(--color-text-dim)' }}>
              Ante Progress
            </div>
            <div className="flex gap-0.5">
              {ANTES.map((_, i) => (
                <div
                  key={i}
                  className="flex-1"
                  style={{
                    height: 'clamp(6px, 0.5vw, 10px)',
                    background: i < anteIndex ? '#3d8b37' : i === anteIndex ? '#e8c44a' : '#0d2030',
                    borderRadius: '1px',
                  }}
                />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Center: Blind Cards */}
        <div className="flex-1 flex flex-col items-center" style={{ gap: 'clamp(14px, 1.2vw, 28px)' }}>
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center"
          >
            <div className="text-[clamp(14px,1.1vw,24px)] text-gold tracking-wider">
              ANTE {ante.ante}
            </div>
            <div className="text-[clamp(5px,0.38vw,8px)] mt-1" style={{ color: 'var(--color-text-dim)' }}>
              Select a blind to begin
            </div>
          </motion.div>

          <div className="flex justify-center flex-wrap items-start" style={{ gap: 'clamp(8px, 0.7vw, 16px)' }}>
            {BLIND_TYPES.map((type, i) => (
              <div key={type} className="flex items-center" style={{ gap: 'clamp(8px, 0.7vw, 16px)' }}>
                <BlindCard
                  type={type}
                  target={ante[type]}
                  isCurrent={i === currentBlind}
                  isCompleted={i < currentBlind}
                  boss={type === 'boss' ? boss : null}
                  onClick={() => onSelectBlind(type)}
                  tutorialHighlight={isFirstGame && anteIndex === 0 && currentBlind === 0 && type === 'small'}
                />
                {i < BLIND_TYPES.length - 1 && (
                  <div
                    className="text-[clamp(6px,0.5vw,10px)] tracking-widest hidden sm:block"
                    style={{
                      color: i < currentBlind ? '#3d8b37' : '#2e607860',
                    }}
                  >
                    {i < currentBlind ? '===' : '---'}
                  </div>
                )}
              </div>
            ))}
          </div>

          <AnimatePresence>
            {isFirstGame && anteIndex === 0 && currentBlind === 0 && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -10, opacity: 0 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <motion.div
                  animate={{ scale: [1, 1.03, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="text-[clamp(5px,0.42vw,9px)] tracking-wider inline-block"
                  style={{
                    padding: 'clamp(6px, 0.5vw, 12px) clamp(12px, 1vw, 24px)',
                    background: '#e07828',
                    border: 'calc(2px * var(--game-scale)) solid #c06020',
                    borderRadius: '4px',
                    color: 'white',
                    boxShadow: '0 0 15px #e0782840',
                  }}
                >
                  Click the Small Blind to start your first spin!
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {!(isFirstGame && anteIndex === 0 && currentBlind === 0) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <div
                className="text-[clamp(5px,0.38vw,8px)] tracking-wider"
                style={{
                  padding: 'clamp(6px, 0.5vw, 12px) clamp(10px, 0.8vw, 20px)',
                  background: '#15314a',
                  border: '1px solid var(--color-border)',
                  borderRadius: '3px',
                  color: '#e8c44a',
                }}
              >
                {currentBlind === 2
                  ? 'Defeat the boss to reach the shop'
                  : 'Clear all 3 blinds to visit the Shop'}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
