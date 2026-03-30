import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import useGameEngine, { PHASE } from './hooks/useGameEngine'
import { CARDS, BLIND_TYPES, getBlindTarget, SECTOR_COLORS } from './utils/gameConfig'
import BalatroBackground from './components/BalatroBackground'
import PixelEye from './components/PixelEye'
import GameLayout from './components/GameLayout'
import { sfx, preloadAll } from './utils/sounds'
import RouletteWheel from './components/RouletteWheel'
import { getSplitBallCount, hasAttractBonus, getSplitThreshold, getSplitCount, getRecursiveSplitThreshold } from './utils/cardEngine'
import Card from './components/Card'
import ScoreAnimator, { ScoreBreakdown } from './components/ScoreAnimator'
import Shop from './components/Shop'
import BlindSelect from './components/BlindSelect'
import DraftScreen from './components/DraftScreen'
import RunStats from './components/RunStats'

// ── Confetti particle for celebrations ──
function ConfettiParticle({ delay, color, startX }) {
  const drift = (Math.random() - 0.5) * 200
  const size = 3 + Math.random() * 5
  const rotation = Math.random() * 360

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: startX,
        top: -10,
        width: size,
        height: size * (0.5 + Math.random() * 0.5),
        background: color,
        borderRadius: Math.random() > 0.5 ? '50%' : '0',
      }}
      initial={{ opacity: 1, y: 0, x: 0, rotate: 0, scale: 1 }}
      animate={{
        opacity: [1, 1, 1, 0],
        y: [0, 150, 350, 500],
        x: [0, drift * 0.3, drift * 0.7, drift],
        rotate: [0, rotation, rotation * 2, rotation * 3],
        scale: [1, 1, 0.8, 0.5],
      }}
      transition={{
        duration: 2 + Math.random() * 1.5,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
    />
  )
}

function ConfettiBurst({ count = 40, colors }) {
  const particles = useMemo(() =>
    Array.from({ length: count }).map((_, i) => ({
      id: i,
      delay: Math.random() * 0.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      startX: `${5 + Math.random() * 90}%`,
    })),
  [count, colors])

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      {particles.map(p => (
        <ConfettiParticle key={p.id} delay={p.delay} color={p.color} startX={p.startX} />
      ))}
    </div>
  )
}

// ── Boss Intro Screen ──
function BossIntroScreen({ bossBlind, blindTarget, onStart }) {
  const [stage, setStage] = useState(0) // 0=enter, 1=name, 2=debuff, 3=target, 4=button

  useEffect(() => {
    const timers = [
      setTimeout(() => setStage(1), 300),
      setTimeout(() => setStage(2), 900),
      setTimeout(() => setStage(3), 1500),
      setTimeout(() => setStage(4), 2100),
    ]
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden">
      {/* Solid dark background */}
      <div className="absolute inset-0" style={{ background: '#0c1e2cf0' }} />

      {/* Subtle red vignette */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{ opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(ellipse at center, rgba(199, 51, 45, 0.2) 0%, transparent 60%)',
        }}
      />

      {/* Solid teal center panel */}
      <motion.div
        className="panel border-accent-red relative z-10 w-full max-w-sm mx-4 text-center"
        style={{
          padding: '32px 24px',
          boxShadow: '0 0 30px rgba(199, 51, 45, 0.3), 0 4px 20px rgba(0,0,0,0.5)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18 }}
      >
        {/* Boss Blind label */}
        <AnimatePresence>
          {stage >= 0 && (
            <motion.div
              className="mx-auto mb-4 w-fit px-4 py-1"
              style={{ background: '#d040a0', borderRadius: '2px' }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              <span className="text-[9px] tracking-wider text-white font-bold">BOSS BLIND</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Boss name — SLAMS in */}
        <AnimatePresence>
          {stage >= 1 && (
            <motion.h2
              className="text-2xl md:text-3xl mb-5"
              style={{ color: '#eaf0f4', textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}
              initial={{ opacity: 0, y: -40, scale: 1.6 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 12,
                mass: 1.2,
              }}
            >
              {bossBlind?.name}
            </motion.h2>
          )}
        </AnimatePresence>

        {/* Debuff description */}
        <AnimatePresence>
          {stage >= 2 && (
            <motion.div
              className="mb-5 mx-auto max-w-xs px-4 py-3"
              style={{
                background: '#0e2430',
                border: '2px solid #c7332d50',
                borderRadius: '3px',
              }}
              initial={{ opacity: 0, scaleX: 0.3 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            >
              <p style={{ color: '#c7332d' }} className="text-[7px] uppercase tracking-widest mb-1">Debuff</p>
              <p style={{ color: '#eaf0f4' }} className="text-[9px] leading-relaxed">{bossBlind?.description}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Target score */}
        <AnimatePresence>
          {stage >= 3 && (
            <motion.div
              className="mb-6"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            >
              <p className="text-[7px] uppercase tracking-widest mb-1" style={{ color: '#88aabb' }}>Target</p>
              <p className="text-2xl text-gold tabular-nums">
                {blindTarget.toLocaleString()}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Button */}
        <AnimatePresence>
          {stage >= 4 && (
            <motion.button
              onClick={onStart}
              className="text-[11px] tracking-wider transition-colors px-8 py-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              style={{
                background: '#c7332d',
                color: '#fff',
                border: '2px solid #e04040',
                borderRadius: '3px',
                boxShadow: '0 0 15px rgba(199, 51, 45, 0.4)',
              }}
            >
              FACE THE BOSS
            </motion.button>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}

// ── Blind Cleared Screen ──
function BlindClearedScreen({ roundScore, blindTarget, blindType, ante, onAdvance }) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 400)
    return () => clearTimeout(t)
  }, [])

  const surplus = roundScore - blindTarget
  const blindLabel = blindType === 'boss' ? 'BOSS BLIND' : blindType === 'big' ? 'BIG BLIND' : 'SMALL BLIND'
  const confettiColors = blindType === 'boss'
    ? ['#fbbf24', '#f59e0b', '#fcd34d', '#fff', '#dc2626']
    : ['#fbbf24', '#e5e5e5', '#a855f7', '#3b82f6']

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      key="blind-cleared"
    >
      {/* Flash */}
      <motion.div
        className="absolute inset-0 bg-white pointer-events-none"
        initial={{ opacity: 0.5 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />

      {/* Solid background */}
      <div className="absolute inset-0" style={{ background: '#0c1e2cf0' }} />

      {/* Confetti */}
      {showConfetti && <ConfettiBurst count={50} colors={confettiColors} />}

      {/* Solid center panel */}
      <motion.div
        className="relative z-10 text-center max-w-sm w-full mx-4"
        style={{
          background: '#183848',
          border: '3px solid #e8c44a',
          borderRadius: '4px',
          padding: '28px 20px',
          boxShadow: '0 0 25px rgba(232, 196, 74, 0.2), 0 4px 20px rgba(0,0,0,0.5)',
        }}
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 18, delay: 0.2 }}
      >
        {/* Cleared label tag */}
        <motion.div
          className="mx-auto mb-3 w-fit px-4 py-1"
          style={{ background: blindType === 'boss' ? '#d040a0' : '#e07828', borderRadius: '2px' }}
          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <span className="text-[8px] tracking-wider text-white font-bold">{blindLabel}</span>
        </motion.div>

        {/* CLEARED slam */}
        <motion.h2
          className="text-3xl text-gold mb-5"
          initial={{ opacity: 0, y: -30, scale: 1.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: 'spring',
            stiffness: 250,
            damping: 14,
            delay: 0.4,
          }}
        >
          CLEARED!
        </motion.h2>

        {/* Score reveal */}
        <motion.div
          className="mb-4 space-y-2 p-3"
          style={{ background: '#0e2430', border: '2px solid #2e6078', borderRadius: '3px' }}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.4 }}
        >
          <div className="flex items-center justify-center gap-3">
            <div>
              <p className="text-[6px] uppercase" style={{ color: '#88aabb' }}>Score</p>
              <p className="text-xl text-gold tabular-nums">{roundScore.toLocaleString()}</p>
            </div>
            <span className="text-[10px]" style={{ color: '#486878' }}>/</span>
            <div>
              <p className="text-[6px] uppercase" style={{ color: '#88aabb' }}>Target</p>
              <p className="text-xl tabular-nums" style={{ color: '#88aabb' }}>{blindTarget.toLocaleString()}</p>
            </div>
          </div>
          {surplus > 0 && (
            <motion.p
              className="text-accent-green text-[9px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              +{surplus.toLocaleString()} surplus
            </motion.p>
          )}
        </motion.div>

        {/* Ante progress */}
        <motion.div
          className="mb-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <p className="text-[7px] mb-2" style={{ color: '#88aabb' }}>Ante {ante + 1} Progress</p>
          <div className="flex gap-1 justify-center">
            {['small', 'big', 'boss'].map((bt, i) => {
              const cleared = i <= BLIND_TYPES.indexOf(blindType)
              return (
                <motion.div
                  key={bt}
                  style={{
                    width: 32, height: 8,
                    background: cleared ? '#e8c44a' : '#0e2430',
                    border: '1px solid #2e607840',
                    borderRadius: '1px',
                  }}
                  initial={i === BLIND_TYPES.indexOf(blindType) ? { scale: 0 } : {}}
                  animate={{ scale: 1 }}
                  transition={{ delay: 1.2 + i * 0.1, type: 'spring' }}
                />
              )
            })}
          </div>
        </motion.div>

        {/* Continue button */}
        <motion.button
          onClick={onAdvance}
          className="text-[10px] tracking-wider transition-colors px-8 py-3"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 0.4 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          style={{
            background: '#1f4858',
            color: '#e8c44a',
            border: '2px solid #e8c44a50',
            borderRadius: '3px',
            boxShadow: '0 0 12px rgba(232, 196, 74, 0.15)',
          }}
        >
          {blindType === 'boss' ? 'TO THE SHOP' : 'NEXT BLIND'}
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Game Over Screen ──
function GameOverScreen({ game, onRestart }) {
  const blindLabel = BLIND_TYPES[game.blindIndex]
  const target = game.blindTarget
  const deficit = target - game.roundScore

  return (
    <div className="min-h-screen relative overflow-hidden bg-bg">
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-4 px-4 py-8">
        {/* Title + defeat panel */}
        <motion.div
          className="panel border-accent-red w-full max-w-sm text-center"
          style={{ padding: '24px 20px', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="text-3xl mb-3 text-accent-red">GAME OVER</h1>

          <div className="panel-inset p-3 mb-3">
            <p className="text-[7px] uppercase tracking-widest mb-1 text-center text-text-dim">Defeated By</p>
            <p className="text-[10px] text-center text-text">
              Ante {game.ante + 1} — {blindLabel === 'boss' ? (game.bossBlind?.name || 'Boss Blind') : `${blindLabel} blind`.toUpperCase()}
            </p>
            {game.bossBlind && blindLabel === 'boss' && (
              <p className="text-[7px] mt-1 text-center text-accent-red">{game.bossBlind.description}</p>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 mb-2">
            <div>
              <p className="text-[6px] uppercase text-text-dim">Your Score</p>
              <p className="text-lg tabular-nums text-accent-red">{game.roundScore.toLocaleString()}</p>
            </div>
            <span className="text-[10px] text-text-muted">/</span>
            <div>
              <p className="text-[6px] uppercase text-text-dim">Target</p>
              <p className="text-lg text-gold tabular-nums">{target.toLocaleString()}</p>
            </div>
          </div>

          <motion.p
            className="text-[9px] text-accent-red"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            {deficit > 0 ? `${deficit.toLocaleString()} short` : 'Balance empty'}
          </motion.p>
        </motion.div>

        {/* Run highlights */}
        <motion.div
          className="grid grid-cols-3 gap-3 max-w-sm mx-auto w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { label: 'Antes', value: game.ante, tw: 'text-gold' },
            { label: 'Best Spin', value: game.runStats.highestSpin.toLocaleString(), tw: 'text-accent-purple' },
            { label: 'Total Score', value: game.runStats.totalScore.toLocaleString(), tw: 'text-accent-blue' },
          ].map(stat => (
            <div
              key={stat.label}
              className="panel p-3 text-center"
            >
              <p className="text-[6px] uppercase tracking-wide text-text-dim">{stat.label}</p>
              <p className={`text-sm tabular-nums mt-1 ${stat.tw}`}>{stat.value}</p>
            </div>
          ))}
        </motion.div>

        {/* Card hand showcase */}
        {game.hand.length > 0 && (
          <motion.div
            className="max-w-md mx-auto w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-[7px] uppercase tracking-widest text-center mb-2 text-text-dim">Your Hand</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {game.hand.map((card, i) => (
                <motion.div
                  key={`${card.id}-${i}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 + i * 0.1 }}
                >
                  <Card
                    cardId={card.id}
                    stackCount={card.stackCount}
                    scalingState={card.scalingState}
                    size="small"
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        <motion.div
          className="max-w-lg mx-auto w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          <RunStats
            history={game.runStats.sectorHistory}
            hand={game.hand}
            isEndOfRun={true}
            totalScore={game.runStats.totalScore}
            antesCleared={game.ante}
            bestSpin={game.runStats.highestSpin}
            onClose={game.restart}
          />
        </motion.div>

        {/* Restart button */}
        <motion.button
          onClick={onRestart}
          className="btn-gold text-sm tracking-wider px-10 py-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          ONE MORE RUN
        </motion.button>
      </div>
    </div>
  )
}

// ── Victory Screen ──
function VictoryScreen({ game, onRestart }) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(true), 600)
    return () => clearTimeout(t)
  }, [])

  const goldColors = ['#fbbf24', '#f59e0b', '#fcd34d', '#fff7ed', '#fff', '#eab308']

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: '#0c1e2c' }}>
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      {showConfetti && <ConfettiBurst count={80} colors={goldColors} />}

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-5 px-4 py-8">
        {/* Title panel */}
        <motion.div
          className="panel border-gold text-center w-full max-w-sm"
          style={{ padding: '28px 24px', boxShadow: '0 0 30px rgba(232, 196, 74, 0.2), 0 4px 20px rgba(0,0,0,0.4)' }}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          <motion.div
            className="mx-auto mb-3 w-fit px-4 py-1 bg-gold"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <span className="text-[8px] tracking-[0.3em] font-bold text-bg">ALL 8 ANTES CONQUERED</span>
          </motion.div>

          <motion.h1
            className="text-4xl md:text-5xl text-gold mb-3"
            initial={{ opacity: 0, scale: 1.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.4,
            }}
          >
            VICTORY
          </motion.h1>

          <motion.p
            className="text-[8px] max-w-xs mx-auto leading-relaxed text-text-dim"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            The math bends to your will. Every card, every spin, every decision — calculated.
          </motion.p>
        </motion.div>

        {/* Run highlights */}
        <motion.div
          className="grid grid-cols-4 gap-3 max-w-md mx-auto w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          {[
            { label: 'Total Score', value: game.runStats.totalScore.toLocaleString(), tw: 'text-gold' },
            { label: 'Best Spin', value: game.runStats.highestSpin.toLocaleString(), tw: 'text-accent-pink' },
            { label: 'Spins', value: game.runStats.spinsPlayed, tw: 'text-accent-blue' },
            { label: 'Blinds Won', value: game.runStats.blindsBeaten, tw: 'text-accent-green' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              className="panel border-gold/20 p-3 text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
            >
              <p className="text-[6px] uppercase tracking-wide text-text-dim">{stat.label}</p>
              <p className={`text-xs tabular-nums mt-1 ${stat.tw}`}>{stat.value}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Card hand showcase — the winning build */}
        {game.hand.length > 0 && (
          <motion.div
            className="max-w-lg mx-auto w-full"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4 }}
          >
            <p className="text-[7px] text-gold uppercase tracking-widest text-center mb-3">
              The Winning Hand
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              {game.hand.map((card, i) => (
                <motion.div
                  key={`${card.id}-${i}`}
                  initial={{ opacity: 0, y: 20, rotate: -5 + Math.random() * 10 }}
                  animate={{ opacity: 1, y: 0, rotate: 0 }}
                  transition={{ delay: 1.5 + i * 0.15, type: 'spring', stiffness: 200 }}
                >
                  <Card
                    cardId={card.id}
                    stackCount={card.stackCount}
                    scalingState={card.scalingState}
                  />
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Analytics */}
        <motion.div
          className="max-w-lg mx-auto w-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
        >
          <RunStats
            history={game.runStats.sectorHistory}
            hand={game.hand}
            isEndOfRun={true}
            totalScore={game.runStats.totalScore}
            antesCleared={8}
            bestSpin={game.runStats.highestSpin}
            onClose={game.restart}
          />
        </motion.div>

        {/* Restart */}
        <motion.button
          onClick={onRestart}
          className="btn-gold text-sm tracking-wider px-10 py-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.3 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
        >
          NEW RUN
        </motion.button>
      </div>
    </div>
  )
}

// ═══════════════════════════
// RESULT OVERLAY (The Juice)
// ═══════════════════════════
function ResultOverlay({ game }) {
  const { lastResult, roundScore, blindTarget, spinsLeft, hand } = game
  const sector = lastResult.sector
  const sectorColor = SECTOR_COLORS[sector.color] || '#888'
  const activations = lastResult.activations || []

  // Stagger state: sector → cards one by one → score → actions
  const [activeCardIndex, setActiveCardIndex] = useState(-1)
  const [showScore, setShowScore] = useState(false)
  const [showActions, setShowActions] = useState(false)

  useEffect(() => {
    setActiveCardIndex(-1)
    setShowScore(false)
    setShowActions(false)

    const sectorDelay = 400
    const perCard = 250
    const totalCardTime = activations.length * perCard

    activations.forEach((act, i) => {
      setTimeout(() => {
        setActiveCardIndex(i)
        // Play appropriate sound for each card effect type
        if (act.type === 'xmult') sfx.xmult()
        else if (act.type === '+mult') sfx.mult()
        else sfx.chipsCard()
      }, sectorDelay + i * perCard)
    })
    setTimeout(() => { setShowScore(true); sfx.pop() }, sectorDelay + totalCardTime + 200)
    setTimeout(() => setShowActions(true), sectorDelay + totalCardTime + 700)
  }, [lastResult])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: '#0c1e2cdd' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="p-6 text-center space-y-4 max-w-md w-full mx-4"
        style={{
          background: '#183848',
          border: '3px solid #2e6078',
          borderRadius: '4px',
          boxShadow: '0 4px 30px rgba(0,0,0,0.5)',
        }}
        initial={{ scale: 0.85, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 250, damping: 20 }}
      >
        {/* ── Big Sector Result ── */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
          className="inline-block mx-auto"
        >
          <div
            className="w-20 h-20 mx-auto flex items-center justify-center border-2 relative"
            style={{
              borderColor: sectorColor,
              boxShadow: `0 0 20px ${sectorColor}44, 0 0 40px ${sectorColor}22`,
              backgroundColor: `${sectorColor}15`,
            }}
          >
            <span className="text-2xl" style={{ color: sectorColor }}>{sector.label}</span>
            <div className="absolute -bottom-[10px] left-1/2 -translate-x-1/2 bg-panel px-2">
              <span className="text-[7px]" style={{ color: sectorColor }}>{sector.color.toUpperCase()}</span>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4 text-[8px] text-text-dim"
          >
            Base: <span className="text-accent-blue">{sector.baseChips} chips</span>
          </motion.div>
        </motion.div>

        {/* ── Card Activations (staggered one-by-one) ── */}
        {activations.length > 0 && (
          <div className="space-y-1 py-1">
            <div className="text-[6px] text-text-muted uppercase tracking-widest mb-2">Card Effects</div>
            {activations.map((act, i) => {
              const cardDef = CARDS[act.cardId]
              const isActive = i <= activeCardIndex
              const isFiring = i === activeCardIndex
              const typeColor = act.type === 'xmult' ? 'text-accent-pink' : act.type === '+mult' ? 'text-accent-red' : 'text-accent-blue'
              const typeLabel = act.type === 'xmult'
                ? `x${typeof act.value === 'number' ? act.value.toFixed(1) : act.value}`
                : act.value > 0 ? `+${act.value}` : `${act.value}`

              return (
                <motion.div
                  key={`${act.cardId}-${i}`}
                  className={`flex items-center gap-2 px-2 py-1 text-[8px] transition-all ${
                    isActive ? 'opacity-100' : 'opacity-15'
                  } ${isFiring ? 'bg-gold/5 border border-gold/20' : ''}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={isActive ? { opacity: 1, x: 0 } : { opacity: 0.15, x: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  <span className="text-[10px] text-text/60 w-[24px] text-center">{cardDef?.ascii || '?'}</span>
                  <span className="text-text flex-1 text-left">{cardDef?.name || act.cardId}</span>
                  <motion.span
                    className={`${typeColor} tabular-nums`}
                    animate={isFiring ? { scale: [1, 1.3, 1] } : {}}
                    transition={{ duration: 0.2 }}
                  >
                    {typeLabel}
                  </motion.span>
                </motion.div>
              )
            })}
          </div>
        )}

        {/* ── Score Breakdown + Progress ── */}
        <AnimatePresence>
          {showScore && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
              <ScoreBreakdown chips={lastResult.chips} addMult={lastResult.mult - 1} xMult={lastResult.xMult} />

              {lastResult.ballCount > 1 && (
                <div className="text-[7px] text-accent-purple">Split Shot: {lastResult.ballCount} balls</div>
              )}

              <div className="py-1">
                <div className="text-[6px] text-text-muted uppercase tracking-widest mb-1">This Spin</div>
                <ScoreAnimator targetScore={lastResult.totalScore} previousScore={0} />
              </div>

              <div className="panel-inset p-2">
                <div className="flex justify-between text-[7px] mb-1">
                  <span className="text-text-dim">Round Total</span>
                  <span className="text-text tabular-nums">{roundScore.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-[7px]">
                  <span className="text-text-dim">Target</span>
                  <span className="text-gold tabular-nums">{blindTarget.toLocaleString()}</span>
                </div>
                <div className="mt-1.5 h-[4px] bg-black/40 border border-border/30 relative overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0"
                    style={{ background: roundScore >= blindTarget ? 'linear-gradient(90deg, #16a34a, #22c55e)' : 'linear-gradient(90deg, #fbbf24, #f59e0b)' }}
                    initial={{ width: `${Math.min(100, ((roundScore - lastResult.totalScore) / blindTarget) * 100)}%` }}
                    animate={{ width: `${Math.min(100, (roundScore / blindTarget) * 100)}%` }}
                    transition={{ delay: 0.3, duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
                {roundScore >= blindTarget && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[7px] text-accent-green text-center mt-1">
                    TARGET REACHED!
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Action Buttons ── */}
        <AnimatePresence>
          {showActions && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-2 justify-center pt-1">
              {/* Reroll is now automatic on green — no manual button */}
              <motion.button
                onClick={() => { sfx.button(); game.continueRound() }}
                className="btn-orange px-5 py-2 text-[9px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {spinsLeft > 0 ? `CONTINUE (${spinsLeft} spin${spinsLeft !== 1 ? 's' : ''})` : 'END ROUND'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

// ── Floating card decoration for menu ──
function FloatingCard({ card, delay, x, y, rotation }) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ left: x, top: y }}
      initial={{ opacity: 0, y: 30, rotate: rotation - 10 }}
      animate={{
        opacity: [0, 0.45, 0.45, 0],
        y: [30, -10, -10, 30],
        rotate: [rotation - 10, rotation, rotation + 2, rotation - 10],
      }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: 'easeInOut' }}
    >
      <div className={`w-[50px] h-[68px] bg-panel border-2 ${
        card.rarity === 'legendary' ? 'rarity-legendary' :
        card.rarity === 'rare' ? 'rarity-rare' :
        card.rarity === 'uncommon' ? 'rarity-uncommon' : 'rarity-common'
      } flex items-center justify-center`}>
        <span className="text-[10px] text-text/60">{card.ascii}</span>
      </div>
    </motion.div>
  )
}

// ── How to Play overlay ──
function HowToPlay({ onClose }) {
  const rules = [
    { title: 'SPIN THE WHEEL', body: 'A ball drops through pegs and lands on a colored sector. Each sector gives base chips.', icon: '(o)' },
    { title: 'CARDS MODIFY SCORE', body: 'Your hand of cards adds chips, multipliers, and special effects. Cards activate in order: +Chips, then +Mult, then xMult.', icon: '[+]' },
    { title: 'BEAT THE BLIND', body: 'Score enough points in 3 spins to clear each blind. Beat all 3 blinds per ante to reach the shop.', icon: '>>>' },
    { title: 'BUILD YOUR DECK', body: 'Buy cards from the shop. Stack duplicates for compounding power. Sell cards you don\'t need.', icon: '[$]' },
    { title: 'SCALE INFINITELY', body: 'Some cards grow stronger every round. By late game, your scores will be astronomical. That\'s the math.', icon: 'x^n' },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="panel p-6 max-w-md w-full mx-4 space-y-4 max-h-[80vh] overflow-y-auto"
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <div className="text-center">
          <span className="text-[8px] text-text-muted uppercase tracking-widest">How to Play</span>
          <h2 className="text-lg text-accent-blue mt-1">THE RULES</h2>
        </div>

        <div className="space-y-3">
          {rules.map((rule, i) => (
            <motion.div
              key={rule.title}
              className="panel-inset p-3 flex gap-3 items-start"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
            >
              <div className="w-[36px] h-[36px] border border-border flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] text-accent-blue">{rule.icon}</span>
              </div>
              <div>
                <div className="text-[8px] text-text mb-1">{rule.title}</div>
                <div className="text-[6px] text-text-dim leading-relaxed">{rule.body}</div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="panel-inset p-3 text-center">
          <div className="text-[6px] text-text-muted uppercase tracking-widest mb-1">Scoring Formula</div>
          <div className="flex items-center gap-1 justify-center text-[9px]">
            <span className="text-accent-blue">Chips</span>
            <span className="text-text-muted">x</span>
            <span className="text-accent-red">Mult</span>
            <span className="text-text-muted">x</span>
            <span className="text-accent-pink">xMult</span>
            <span className="text-text-muted">=</span>
            <span className="text-text">Score</span>
          </div>
        </div>

        <motion.button
          onClick={onClose}
          className="btn-play w-full text-[10px]"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
        >
          GOT IT
        </motion.button>
      </motion.div>
    </motion.div>
  )
}

// ── Main Menu ──
function MainMenu({ onStart }) {
  const [showRules, setShowRules] = useState(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const showcaseCards = [
    { card: CARDS.lucky_charm, delay: 0, x: '6%', y: '25%', rotation: -15 },
    { card: CARDS.golden_touch, delay: 1.2, x: '85%', y: '18%', rotation: 10 },
    { card: CARDS.compounding_interest, delay: 2.5, x: '4%', y: '65%', rotation: -8 },
    { card: CARDS.momentum, delay: 3.8, x: '88%', y: '60%', rotation: 12 },
  ]

  return (
    <motion.div
      className="min-h-screen relative overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="fixed inset-0 z-0"><BalatroBackground ante={0} /></div>
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      {/* Floating card decorations */}
      <div className="fixed inset-0 z-[5] pointer-events-none">
        {showcaseCards.map((sc, i) => <FloatingCard key={i} {...sc} />)}
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-2 px-4">
        {/* Title with PixelEye as the O */}
        <motion.div className="text-center" initial={{ opacity: 0 }} animate={mounted ? { opacity: 1 } : {}}>
          <div className="overflow-hidden">
            <motion.h1
              className="leading-tight flex items-center justify-center flex-wrap"
              style={{
                fontSize: 'clamp(48px, 6vw, 96px)',
                fontFamily: "'Silkscreen', var(--font-heading)",
                color: '#eaf0f4',
                textShadow: '0 0 30px rgba(42, 93, 170, 0.4), 0 0 60px rgba(199, 51, 45, 0.2)',
                letterSpacing: '0.05em',
              }}
              initial={{ y: 60, opacity: 0 }}
              animate={mounted ? { y: 0, opacity: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              SPIN
              <span className="inline-flex items-center justify-center relative" style={{
                width: '0.75em',
                height: '0.75em',
                marginRight: '0.15em',
              }}>
                <PixelEye className="absolute" style={{
                  width: '2em',
                  height: '2em',
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  filter: 'drop-shadow(0 0 12px rgba(42, 93, 170, 0.6))',
                  pointerEvents: 'none',
                }} />
              </span>
              MANCY
            </motion.h1>
          </div>

          <motion.p
            className="text-text-dim tracking-wide"
            style={{ fontSize: 'clamp(7px, 0.55vw, 12px)', marginTop: 'clamp(4px, 0.3vw, 8px)' }}
            initial={{ opacity: 0 }}
            animate={mounted ? { opacity: 1 } : {}}
            transition={{ delay: 0.7 }}
          >
            A roguelite where cards bend the wheel
          </motion.p>
        </motion.div>

        {/* Buttons — Balatro-style colored row */}
        <motion.div
          className="flex items-center justify-center"
          style={{ gap: 'clamp(8px, 0.7vw, 16px)', marginTop: 'clamp(12px, 1vw, 24px)' }}
          initial={{ opacity: 0, y: 20 }}
          animate={mounted ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.9 }}
        >
          <motion.button
            onClick={() => { sfx.button(); preloadAll(); onStart() }}
            className="btn-play"
            style={{ padding: 'clamp(8px, 0.7vw, 16px) clamp(24px, 2vw, 48px)', fontSize: 'clamp(10px, 0.8vw, 18px)' }}
            whileHover={{ scale: 1.06, filter: 'brightness(1.15)' }}
            whileTap={{ scale: 0.94 }}
          >
            PLAY
          </motion.button>

          <motion.button
            onClick={() => { sfx.button(); setShowRules(true) }}
            className="btn-orange"
            style={{ padding: 'clamp(8px, 0.7vw, 16px) clamp(16px, 1.3vw, 32px)', fontSize: 'clamp(9px, 0.7vw, 16px)' }}
            whileHover={{ scale: 1.06, filter: 'brightness(1.15)' }}
            whileTap={{ scale: 0.94 }}
          >
            RULES
          </motion.button>
        </motion.div>

        {/* Footer */}
        <motion.div
          className="text-center"
          style={{ marginTop: 'clamp(8px, 0.7vw, 16px)' }}
          initial={{ opacity: 0 }}
          animate={mounted ? { opacity: 1 } : {}}
          transition={{ delay: 1.1 }}
        >
          <div className="flex flex-wrap gap-2 justify-center" style={{ marginBottom: 'clamp(4px, 0.3vw, 8px)' }}>
            {['Probability', 'Expected Value', 'Data Analysis'].map(tag => (
              <span key={tag} className="text-text-muted uppercase border border-border/30" style={{ fontSize: 'clamp(4px, 0.35vw, 7px)', letterSpacing: '0.15em', padding: 'clamp(2px, 0.2vw, 4px) clamp(4px, 0.35vw, 8px)' }}>{tag}</span>
            ))}
          </div>
          <p className="text-text-muted uppercase" style={{ fontSize: 'clamp(4px, 0.35vw, 7px)', letterSpacing: '0.3em' }}>Math in the Modern World</p>
        </motion.div>
      </div>

      <AnimatePresence>{showRules && <HowToPlay onClose={() => setShowRules(false)} />}</AnimatePresence>
    </motion.div>
  )
}

// ═══════════════════════════════════════
// INLINE GAMEPLAY (no popups, all in-place)
// ═══════════════════════════════════════
function InlineGameplay({ game }) {
  const isSpinning = game.phase === PHASE.SPINNING
  const isResult = game.phase === PHASE.RESULT
  const isRoundEnd = game.phase === PHASE.ROUND_END
  const wheelRef = useRef(null)

  // Inline scoring animation state
  const [activeCardIndex, setActiveCardIndex] = useState(-1)
  const [scoringDone, setScoringDone] = useState(false)
  const [arenaMsg, setArenaMsg] = useState(null)
  const [sidebarCleared, setSidebarCleared] = useState(false)
  const [sidebarFailed, setSidebarFailed] = useState(false)
  const [displayChips, setDisplayChips] = useState(0)
  const [displayMult, setDisplayMult] = useState(1)
  const [liveHits, setLiveHits] = useState(0)
  const [liveBonusHits, setLiveBonusHits] = useState(0)
  const [liveMultHits, setLiveMultHits] = useState(0)
  const [runInfoOpen, setRunInfoOpen] = useState(false)
  const lastResultRef = useRef(null)

  // ── Live pin hit callback — updates chips/mult in real-time during spin ──
  const handlePinHit = useCallback((hitType, value) => {
    if (hitType === 'pin') {
      // Regular pin: +2 chips per hit (bumper bonus)
      setDisplayChips(prev => prev + 2)
      setLiveHits(prev => prev + 1)
    } else if (hitType === 'bonus') {
      // Bonus pin: extra chips
      setDisplayChips(prev => prev + (value || 5))
      setLiveBonusHits(prev => prev + 1)
    } else if (hitType === 'multiplier') {
      // Multiplier pin: x1.5 mult
      setDisplayMult(prev => prev * 1.5)
      setLiveMultHits(prev => prev + 1)
    }
  }, [])

  // Which cards are currently firing
  const firingCardIds = activeCardIndex >= 0 && game.lastResult?.activations
    ? game.lastResult.activations.slice(0, activeCardIndex + 1).map(a => a.cardId)
    : []

  // Can spin during PLAYING or SPINNING (multi-ball) as long as spins remain
  const canSpin = (game.phase === PHASE.PLAYING || game.phase === PHASE.SPINNING) && game.spinsLeft > 0

  // ── Reset live stats when spinning starts ──
  useEffect(() => {
    if (isSpinning) {
      setLiveHits(0)
      setLiveBonusHits(0)
      setLiveMultHits(0)
      // Start with base sector chips (10 for red/black, 25 for gold, 0 for green)
      setDisplayChips(10)
      setDisplayMult(1)
    }
  }, [isSpinning])

  // ── Spacebar to spin — infinite ball spam ──
  useEffect(() => {
    function handleKey(e) {
      if (e.code === 'Space' && canSpin) {
        e.preventDefault()
        sfx.button()
        game.spin()
        if (isSpinning && wheelRef.current?.launchBall) {
          wheelRef.current.launchBall()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [canSpin, game, isSpinning])

  // ── Run inline scoring sequence when RESULT phase starts ──
  useEffect(() => {
    if (!isResult || !game.lastResult) return
    if (game.lastResult === lastResultRef.current) return
    lastResultRef.current = game.lastResult

    const result = game.lastResult
    const activations = result.activations || []
    setScoringDone(false)
    setActiveCardIndex(-1)
    setSidebarCleared(false)
    setSidebarFailed(false)
    setDisplayChips(result.sector.baseChips)
    setDisplayMult(1)

    // Phase 1: Show sector result on arena (immediate)
    const sectorColor = SECTOR_COLORS[result.sector.color] || '#888'
    setArenaMsg(
      <div
        className="px-4 py-2 border-2 text-center"
        style={{
          borderColor: sectorColor,
          backgroundColor: `${sectorColor}30`,
          boxShadow: `0 0 15px ${sectorColor}44`,
        }}
      >
        <span className="text-lg" style={{ color: sectorColor }}>{result.sector.label}</span>
        <span className="text-[8px] text-text-dim ml-2">{result.sector.baseChips} chips</span>
      </div>
    )

    // Phase 2: Stagger card activations
    const cardDelay = 350
    const cardStart = 500
    activations.forEach((act, i) => {
      setTimeout(() => {
        setActiveCardIndex(i)
        // Play sound per type
        if (act.type === 'xmult') sfx.xmult()
        else if (act.type === '+mult') sfx.mult()
        else sfx.chipsCard()
        // Update displayed chips/mult
        if (act.type === '+chips' || act.type === 'chips') {
          setDisplayChips(prev => prev + (act.value || 0))
        } else if (act.type === '+mult') {
          setDisplayMult(prev => prev + (act.value || 0))
        } else if (act.type === 'xmult') {
          setDisplayMult(prev => prev * (act.value || 1))
        }
      }, cardStart + i * cardDelay)
    })

    // Phase 3: Score lands, clear arena, auto-continue
    const totalAnimTime = cardStart + activations.length * cardDelay + 400
    setTimeout(() => {
      sfx.pop()
      setArenaMsg(null)
      setActiveCardIndex(-1)
      setScoringDone(true)
    }, totalAnimTime)

    // Phase 4: Auto-continue after brief pause
    setTimeout(() => {
      game.continueRound()
    }, totalAnimTime + 600)

    return () => {
      // Cleanup not needed — timers complete naturally
    }
  }, [isResult, game.lastResult])

  // ── Handle ROUND_END (blind cleared) — inline flash then auto-advance ──
  useEffect(() => {
    if (!isRoundEnd) return
    setSidebarCleared(true)
    sfx.pop()
    const timer = setTimeout(() => {
      setSidebarCleared(false)
      game.advanceBlind()
    }, 1500)
    return () => clearTimeout(timer)
  }, [isRoundEnd])

  // ── Handle game over from continueRound (spins out, target not met) ──
  // This is handled by useGameEngine setting phase to GAME_OVER
  // But we show a brief FAILED flash via the sidebar
  useEffect(() => {
    if (game.phase === PHASE.GAME_OVER) {
      setSidebarFailed(true)
    }
  }, [game.phase])

  return (
    <GameLayout
      score={game.roundScore}
      money={game.money}
      ante={game.ante + 1}
      blind={game.blindType}
      target={game.blindTarget}
      spinsLeft={game.spinsLeft}
      totalSpins={5 + (game.hand?.filter(c => CARDS[c.id]?.effect.type === 'extra_spin').reduce((sum, c) => sum + (c.stackCount || 1), 0) || 0)}
      streak={game.streakLength}
      boss={game.bossBlind}
      chips={displayChips}
      mult={displayMult}
      cleared={sidebarCleared}
      failed={sidebarFailed}
      floatingHand={true}
      arenaMessage={arenaMsg}
      gameState={isSpinning ? 'spinning' : isResult ? 'scoring' : sidebarCleared ? 'cleared' : sidebarFailed ? 'failed' : 'idle'}
      totalRunScore={game.runStats?.totalScore || 0}
      history={game.runStats?.sectorHistory || []}
      arenaStats={{ hits: liveHits, bonus: liveBonusHits, multHits: liveMultHits, currentChips: displayChips, currentMult: displayMult, isLive: isSpinning }}
      specialBalls={game.specialBalls}
      hand={game.hand}
      runInfoOpen={runInfoOpen}
      onToggleRunInfo={() => setRunInfoOpen(o => !o)}
      wheelSlot={
        <RouletteWheel
          ref={wheelRef}
          onResult={game.handleSpinResult}
          spinning={isSpinning}
          sectors={game.activeSectors}
          ballCount={getSplitBallCount(game.hand)}
          blockerActive={game.blockerActive}
          blockerTimer={game.blockerTimer}
          hiddenSectors={game.bossEffect === 'hidden_sectors'}
          reverseLaunch={game.bossEffect === 'reverse_spin'}
          specialBalls={game.specialBalls}
          attractBonus={hasAttractBonus(game.hand)}
          splitThreshold={getSplitThreshold(game.hand)}
          splitCount={getSplitCount(game.hand)}
          recursiveSplitThreshold={getRecursiveSplitThreshold(game.hand)}
          onPinHit={handlePinHit}
        />
      }
      handCards={<CardHandFan cards={game.hand} firingCardIds={firingCardIds} />}
      actionButtons={
        <div className="flex flex-col gap-2 items-center">
          <div className="flex gap-3 items-center">
            <motion.button
              onClick={() => { sfx.button(); game.spin() }}
              className={`btn-play px-8 py-3 text-[11px] ${
                !canSpin ? 'opacity-40 cursor-not-allowed' : ''
              }`}
              disabled={!canSpin}
              whileHover={canSpin ? { scale: 1.05 } : {}}
              whileTap={canSpin ? { scale: 0.95 } : {}}
              animate={{ opacity: canSpin ? 1 : 0.4 }}
            >
              SPIN
            </motion.button>
            {/* BLOCK button */}
            {(game.phase === PHASE.PLAYING || game.phase === PHASE.SPINNING) && !game.blockerActive && (
              <motion.button
                onClick={() => { sfx.button(); game.useBlocker?.() }}
                className="btn-green px-4 py-3 text-[9px]"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Blocks bottom for 5s"
              >
                BLOCK
              </motion.button>
            )}
            {game.blockerActive && (
              <span className="text-[9px] text-accent-green animate-pulse">BARRIER ACTIVE</span>
            )}
          </div>
        </div>
      }
    />
  )
}

// ── Card Hand — stacked deck that fans out on hover ──
function CardHandFan({ cards, firingCardIds = [] }) {
  const count = cards.length
  const [fanned, setFanned] = useState(false)

  if (count === 0) return null

  // For large hands (8+), use scrollable layout when fanned
  const isLargeHand = count > 7
  const fanAngle = isLargeHand ? 0 : count <= 1 ? 0 : Math.min(count * 4, 20)
  const fanOverlap = isLargeHand ? -12 : count > 2 ? -18 : count > 1 ? -10 : 0
  const stackOverlap = -68

  const isOpen = fanned || firingCardIds.length > 0

  return (
    <div
      className="relative cursor-pointer select-none"
      onMouseEnter={() => setFanned(true)}
      onMouseLeave={() => setFanned(false)}
      onClick={() => setFanned(f => !f)}
      style={isOpen && isLargeHand ? { maxWidth: '90vw', overflowX: 'auto', overflowY: 'visible', paddingBottom: '4px' } : {}}
    >
      {/* Deck label when collapsed */}
      <AnimatePresence>
        {!isOpen && count > 0 && (
          <motion.div
            className="absolute -top-5 left-1/2 -translate-x-1/2 z-50 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <span className="text-[6px] text-text-muted uppercase tracking-wider">
              Hand ({count})
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <div
        className={`flex items-end relative ${isOpen && isLargeHand ? 'justify-start' : 'justify-center'}`}
        style={{
          marginLeft: isOpen && isLargeHand ? 0 : (isOpen ? fanOverlap : stackOverlap) * count / 2,
          perspective: '800px',
          minWidth: isOpen && isLargeHand ? 'max-content' : undefined,
        }}
      >
        {cards.map((card, i) => {
          const centerOffset = i - (count - 1) / 2
          const isFiring = firingCardIds.includes(card.id)

          // Fanned: arc layout with rotation
          const fanRotation = count <= 1 ? 0 : centerOffset * (fanAngle / (count - 1))
          const fanArcY = Math.pow(Math.abs(centerOffset), 1.6) * 4

          // Stacked: slight offset, slight random rotation
          const stackRotation = (i - count / 2) * 0.5
          const stackY = 0

          const rotation = isOpen ? fanRotation : stackRotation
          const yPos = isFiring ? -20 : isOpen ? fanArcY : stackY
          const overlap = isOpen ? fanOverlap : stackOverlap

          return (
            <motion.div
              key={`${card.id}-${i}`}
              className="cursor-pointer"
              style={{
                marginLeft: i > 0 ? overlap : 0,
                zIndex: isOpen ? i + 1 : count - i, // stack: last card on top
                transformOrigin: 'bottom center',
              }}
              animate={{
                rotate: rotation,
                y: yPos,
                scale: isFiring ? 1.08 : 1,
              }}
              transition={isFiring
                ? { type: 'spring', stiffness: 400, damping: 12 }
                : { type: 'spring', stiffness: 180, damping: 18 }
              }
              whileHover={isOpen ? { y: -22, zIndex: 50, scale: 1.12, rotate: 0 } : {}}
            >
              <Card
                cardId={card.id}
                stackCount={card.stackCount}
                scalingState={card.scalingState}
                disabled={card.disabled}
                highlighted={isFiring}
                size="small"
              />
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ── Screen wrapper for fade transitions ──
function ScreenWrapper({ children, screenKey }) {
  return (
    <motion.div
      key={screenKey}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  )
}

function App() {
  const game = useGameEngine()

  // Determine the current screen key for transitions
  const screenKey = game.phase === PHASE.PLAYING || game.phase === PHASE.SPINNING || game.phase === PHASE.RESULT || game.phase === PHASE.ROUND_END
    ? 'gameplay'
    : game.phase

  // Firing card IDs for hand highlighting
  const showResult = game.phase === PHASE.RESULT || game.phase === PHASE.ROUND_END
  const firingCardIds = showResult && game.lastResult?.activations
    ? game.lastResult.activations.map(a => a.cardId)
    : []

  function renderScreen() {
    // ── MENU ──
    if (game.phase === PHASE.MENU) {
      return <MainMenu key="menu" onStart={game.startGame} />
    }

    // ── DRAFT (starting card pick) ──
    if (game.phase === PHASE.DRAFT || game.phase === 'draft') {
      return (
        <ScreenWrapper screenKey="draft">
          <DraftScreen
            draftCards={game.draftCards || []}
            onPick={(index) => game.pickDraftCard ? game.pickDraftCard(index) : null}
          />
        </ScreenWrapper>
      )
    }

    // ── GAME OVER ──
    if (game.phase === PHASE.GAME_OVER) {
      return (
        <ScreenWrapper screenKey="gameover">
          <GameOverScreen game={game} onRestart={game.restart} />
        </ScreenWrapper>
      )
    }

    // ── VICTORY ──
    if (game.phase === PHASE.VICTORY) {
      return (
        <ScreenWrapper screenKey="victory">
          <VictoryScreen game={game} onRestart={game.restart} />
        </ScreenWrapper>
      )
    }

    // ── BLIND SELECT ──
    if (game.phase === PHASE.BLIND_SELECT) {
      return (
        <ScreenWrapper screenKey="blindselect">
          <GameLayout
            score={game.roundScore}
            money={game.money}
            ante={game.ante + 1}
            blind={game.blindType}
            target={game.blindTarget}
            spinsLeft={game.spinsLeft}
            streak={game.streakLength}
            overlay={
              <BlindSelect
                anteIndex={game.ante}
                currentBlind={game.blindIndex}
                onSelectBlind={game.startBlind}
              />
            }
          />
        </ScreenWrapper>
      )
    }

    // ── BOSS INTRO ──
    if (game.phase === PHASE.BOSS_INTRO) {
      return (
        <ScreenWrapper screenKey="bossintro">
          <GameLayout
            score={game.roundScore}
            money={game.money}
            ante={game.ante + 1}
            blind="boss"
            target={game.blindTarget}
            spinsLeft={game.spinsLeft}
            boss={game.bossBlind}
            overlay={
              <BossIntroScreen
                bossBlind={game.bossBlind}
                blindTarget={game.blindTarget}
                onStart={game.startBossRound}
              />
            }
          />
        </ScreenWrapper>
      )
    }

    // ── SHOP ──
    if (game.phase === PHASE.SHOP) {
      return (
        <ScreenWrapper screenKey="shop">
          <GameLayout
            score={game.roundScore}
            money={game.money}
            ante={game.ante + 1}
            blind={game.blindType}
            target={game.blindTarget}
            spinsLeft={game.spinsLeft}
            handCards={<CardHandFan cards={game.hand} />}
            overlay={
              <Shop
                hand={game.hand}
                money={game.money}
                unusedSpins={game.spinsLeft}
                engineShopCards={game.shopCards}
                onBuyCard={(shopIndex) => game.buyCard(shopIndex)}
                onBuySpecialBall={(ballType) => game.buySpecialBall(ballType)}
                onReroll={game.rerollShop}
                onSellCard={game.sellCard}
                onDone={game.leaveShop}
                isFirstVisit={game.ante === 0}
              />
            }
          />
        </ScreenWrapper>
      )
    }

    // ── PLAYING / SPINNING / RESULT / ROUND_END — all inline, no popups ──
    return (
      <ScreenWrapper screenKey="gameplay">
        <InlineGameplay game={game} />
      </ScreenWrapper>
    )
  }

  return (
    <AnimatePresence mode="wait">
      {renderScreen()}
    </AnimatePresence>
  )
}

export default App
