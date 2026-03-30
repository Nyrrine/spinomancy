import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import BalatroBackground from './BalatroBackground'
import { preloadAll } from '../utils/sounds'
import { CARDS } from '../utils/gameConfig'
import { SPECIAL_BALLS } from '../utils/specialBalls'
import { AnimatedScore, SpinsIndicator, PulsingTarget, HotStreakCounter, MilestoneCelebration } from './GameHud'
import { FireBorder, BackgroundTint, GoldBurst } from './JuiceEffects'

// Helper: generates CSS clamp() value from min(px), preferred(vw), max(px)
function sz(min, vw, max) {
  return `clamp(${min}px, ${vw}vw, ${max}px)`
}

// ── Unified Left Sidebar — Balatro visual language ──
function Sidebar({ chips = 0, mult = 1, score = 0, target = 300, cleared = false, failed = false,
  ante = 1, blind = 'small', spinsLeft = 3, totalSpins = 3, streak = 0, money = 0, actionButtons = null, history = [], totalRunScore = 0, arenaStats = null,
  specialBalls = [], hand = [], runInfoOpen = false, onToggleRunInfo }) {
  const progress = Math.min(100, (score / target) * 100)

  // Live stats from arena
  const isLive = arenaStats && arenaStats.bumperHits > 0 && arenaStats.isLive
  const liveChips = isLive ? (arenaStats.currentChips || 0) : chips
  const liveMult = isLive ? (arenaStats.currentMult || 1) : mult
  const liveScore = isLive ? Math.floor(liveChips * liveMult) : score

  // Blind banner colors
  const blindBanner = {
    small: { bg: '#e07828', border: '#c06018', label: 'SMALL BLIND' },
    big: { bg: '#2a5daa', border: '#1a4888', label: 'BIG BLIND' },
    boss: { bg: '#c7332d', border: '#a01a18', label: 'BOSS BLIND' },
  }[blind] || { bg: '#e07828', border: '#c06018', label: 'SMALL BLIND' }

  return (
    <div className="flex flex-col relative" style={{ gap: sz(4, 0.35, 8) }}>

      {/* ═══ BLIND BANNER — colored header like Balatro ═══ */}
      <div
        className="text-center text-white uppercase tracking-wider"
        style={{
          background: blindBanner.bg,
          border: `2px solid ${blindBanner.border}`,
          padding: `${sz(5, 0.4, 10)} ${sz(8, 0.6, 16)}`,
          fontSize: sz(8, 0.65, 14),
          boxShadow: `0 3px 0 ${blindBanner.border}`,
        }}
      >
        {blindBanner.label}
      </div>

      {/* ═══ SCORE — the HUGE center number ═══ */}
      <div
        className="text-center relative"
        style={{
          background: '#0a1820',
          border: '2px solid var(--color-border)',
          padding: `${sz(8, 0.7, 18)} ${sz(6, 0.5, 14)}`,
        }}
      >
        <div className="text-text-muted uppercase tracking-wider" style={{ fontSize: sz(6, 0.48, 10), marginBottom: sz(2, 0.15, 4) }}>
          Round Score
        </div>
        <motion.div
          style={{ fontSize: sz(28, 2.2, 48) }}
          className="tabular-nums leading-none"
          animate={{ color: cleared ? '#50c050' : failed ? '#d04040' : isLive ? '#e8c44a' : '#eaf0f4' }}
        >
          <AnimatedScore value={isLive ? liveScore : score} />
        </motion.div>

        {/* Progress bar */}
        <div className="relative overflow-hidden" style={{ height: sz(5, 0.4, 9), marginTop: sz(6, 0.5, 12), background: '#060e18', border: '1px solid #1a3040' }}>
          <motion.div
            className="absolute inset-y-0 left-0"
            style={{ background: cleared ? '#3d9b3d' : score >= target * 0.8 ? '#e8c44a' : '#2a5daa' }}
            animate={{ width: `${progress}%` }}
            transition={{ type: 'spring', stiffness: 80, damping: 15 }}
          />
        </div>
        <div className="text-text-muted tabular-nums" style={{ fontSize: sz(5, 0.42, 9), marginTop: sz(2, 0.15, 4) }}>
          / <PulsingTarget score={score} target={target} />
        </div>

        <MilestoneCelebration totalScore={totalRunScore} />
      </div>

      {/* ═══ CHIPS x MULT — THE CENTERPIECE BADGES ═══ */}
      <div className="flex items-center justify-center" style={{ gap: sz(3, 0.25, 6) }}>
        <motion.div
          className="badge-chips tabular-nums text-center"
          style={{ fontSize: sz(16, 1.3, 28), minWidth: sz(75, 6, 130), padding: `${sz(6, 0.5, 12)} ${sz(8, 0.65, 16)}` }}
          key={`c-${liveChips}`}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ type: 'spring', stiffness: 400, damping: 15, duration: 0.15 }}
        >
          {liveChips}
        </motion.div>
        <span className="text-text-muted" style={{ fontSize: sz(12, 1, 22) }}>X</span>
        <motion.div
          className="badge-mult tabular-nums text-center"
          style={{ fontSize: sz(16, 1.3, 28), minWidth: sz(75, 6, 130), padding: `${sz(6, 0.5, 12)} ${sz(8, 0.65, 16)}` }}
          key={`m-${liveMult.toFixed(1)}`}
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ type: 'spring', stiffness: 500, damping: 12, duration: 0.15 }}
        >
          {liveMult.toFixed(1)}
        </motion.div>
      </div>

      {/* ═══ CONTROLS ═══ */}
      {actionButtons && <div style={{ padding: `${sz(2, 0.15, 4)} 0` }}>{actionButtons}</div>}

      {/* ═══ SPINS + ANTE ═══ */}
      <div className="flex" style={{ gap: sz(3, 0.25, 6) }}>
        <div className="flex-1" style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(6, 0.5, 12) }}>
          <div className="text-text-muted uppercase tracking-wider text-center" style={{ fontSize: sz(5, 0.4, 9), marginBottom: sz(3, 0.25, 6) }}>Spins</div>
          <div className="flex justify-center">
            <SpinsIndicator total={totalSpins} remaining={spinsLeft} />
          </div>
        </div>
        <div className="flex-1" style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(6, 0.5, 12) }}>
          <div className="text-text-muted uppercase tracking-wider text-center" style={{ fontSize: sz(5, 0.4, 9), marginBottom: sz(3, 0.25, 6) }}>Ante</div>
          <div className="text-text text-center tabular-nums" style={{ fontSize: sz(12, 0.9, 20) }}>{ante}/8</div>
        </div>
      </div>

      {/* ═══ ARENA STATS (live hits) ═══ */}
      {arenaStats && arenaStats.bumperHits > 0 && (
        <motion.div
          style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(5, 0.4, 10) }}
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between" style={{ fontSize: sz(6, 0.48, 10) }}>
            <span className="text-text-muted">HITS</span>
            <span className="text-text tabular-nums">{arenaStats.bumperHits}</span>
          </div>
          {arenaStats.multiplierHits > 0 && (
            <div className="flex items-center justify-between" style={{ fontSize: sz(6, 0.48, 10), marginTop: sz(2, 0.15, 4) }}>
              <span className="text-text-muted">MULT PINS</span>
              <span className="text-accent-red tabular-nums">x{(1.5 ** arenaStats.multiplierHits).toFixed(1)}</span>
            </div>
          )}
        </motion.div>
      )}

      {/* ═══ LIVE CARD CHIP BREAKDOWN ═══ */}
      {isLive && arenaStats.cardBreakdown && arenaStats.cardBreakdown.length > 0 && (
        <motion.div
          style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(5, 0.4, 10) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="text-text-muted uppercase tracking-wider text-center" style={{ fontSize: sz(5, 0.38, 8), marginBottom: sz(3, 0.2, 5) }}>
            CHIP SOURCES
          </div>
          {arenaStats.cardBreakdown.map((item, i) => (
            <motion.div
              key={`${item.label}-${item.chips}`}
              className="flex items-center justify-between"
              style={{ fontSize: sz(5, 0.42, 9), marginTop: i > 0 ? sz(1, 0.08, 2) : 0 }}
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 0.15 }}
            >
              <span className="text-text-dim" style={{ maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.label}
              </span>
              <span className="text-accent-blue tabular-nums">+{item.chips}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* ═══ WALLET ═══ */}
      <div
        className="flex items-center justify-between"
        style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: `${sz(5, 0.4, 10)} ${sz(8, 0.65, 16)}` }}
      >
        <span className="text-text-muted uppercase" style={{ fontSize: sz(6, 0.48, 10) }}>$</span>
        <span className="text-gold tabular-nums" style={{ fontSize: sz(14, 1.1, 24) }}>{money}</span>
      </div>

      {/* ═══ STREAK ═══ */}
      {streak > 0 && (
        <div className="text-accent-green text-center" style={{ fontSize: sz(7, 0.55, 12) }}>Streak x{streak}</div>
      )}
      <HotStreakCounter history={history || []} />

      {/* ═══ BALL INFO ═══ */}
      {specialBalls.length > 0 && (
        <div style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(5, 0.4, 10) }}>
          <div className="text-text-muted uppercase" style={{ fontSize: sz(5, 0.4, 9), marginBottom: sz(3, 0.2, 5) }}>Ball</div>
          {specialBalls.map((sb, i) => {
            const def = SPECIAL_BALLS[sb.id]
            if (!def) return null
            const clr = def.visual === 'ember' ? '#e07030' : def.visual === 'crystal' ? '#e0e0ff' : def.visual === 'ghost' ? '#90c0e0' : def.visual === 'magnet' ? '#4080cc' : def.visual === 'void' ? '#8040c0' : '#8888aa'
            return (
              <div key={sb.id} className="flex items-center" style={{ gap: sz(4, 0.3, 8), marginBottom: i < specialBalls.length - 1 ? sz(2, 0.15, 4) : 0 }}>
                <span style={{ fontSize: sz(9, 0.7, 14), color: clr }}>{def.ascii}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-text truncate" style={{ fontSize: sz(6, 0.45, 10) }}>{def.name}{sb.stackCount > 1 ? ` x${sb.stackCount}` : ''}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ═══ RUN INFO — colored button like Balatro ═══ */}
      {onToggleRunInfo && (
        <>
          <button
            onClick={onToggleRunInfo}
            className="w-full text-center uppercase tracking-wider"
            style={{
              background: '#3d8b37',
              border: '2px solid #2a6a28',
              color: '#fff',
              padding: `${sz(5, 0.4, 10)} ${sz(8, 0.6, 14)}`,
              fontSize: sz(6, 0.48, 10),
              boxShadow: '0 2px 0 #1a4a16',
            }}
          >
            Run Info {runInfoOpen ? '▾' : '▸'}
          </button>
          <AnimatePresence>
            {runInfoOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div style={{ background: '#0a1820', border: '2px solid var(--color-border)', padding: sz(5, 0.4, 10) }}>
                  {hand.length > 0 && (
                    <div style={{ marginBottom: sz(4, 0.3, 8) }}>
                      <div className="text-text-muted uppercase" style={{ fontSize: sz(4, 0.32, 7), marginBottom: sz(2, 0.15, 4) }}>Cards ({hand.length})</div>
                      {hand.map((c, i) => { const def = CARDS[c.id]; if (!def) return null; return (
                        <div key={`${c.id}-${i}`} className="flex items-center justify-between" style={{ marginBottom: sz(1, 0.1, 2) }}>
                          <span className="text-text truncate" style={{ fontSize: sz(5, 0.4, 8) }}>{def.ascii} {def.name}</span>
                          {c.stackCount > 1 && <span className="text-accent-red" style={{ fontSize: sz(5, 0.4, 8) }}>x{c.stackCount}</span>}
                        </div>
                      )})}
                    </div>
                  )}
                  {specialBalls.length > 0 && (
                    <div>
                      <div className="text-text-muted uppercase" style={{ fontSize: sz(4, 0.32, 7), marginBottom: sz(2, 0.15, 4) }}>Balls ({specialBalls.length})</div>
                      {specialBalls.map((sb, i) => { const def = SPECIAL_BALLS[sb.id]; if (!def) return null; return (
                        <div key={`${sb.id}-${i}`} className="flex items-center justify-between" style={{ marginBottom: sz(1, 0.1, 2) }}>
                          <span className="text-text truncate" style={{ fontSize: sz(5, 0.4, 8) }}>{def.ascii} {def.name}</span>
                          {sb.stackCount > 1 && <span className="text-gold" style={{ fontSize: sz(5, 0.4, 8) }}>x{sb.stackCount}</span>}
                        </div>
                      )})}
                    </div>
                  )}
                  {hand.length === 0 && specialBalls.length === 0 && (
                    <div className="text-text-muted text-center" style={{ fontSize: sz(5, 0.4, 8) }}>No items yet</div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Status flash */}
      <AnimatePresence>
        {cleared && (
          <motion.div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.2 }}
            transition={{ type: 'spring', stiffness: 300, damping: 15 }}>
            <div style={{ background: '#3d9b3d', border: '2px solid #50c050', padding: `${sz(6, 0.5, 12)} ${sz(12, 1, 24)}` }}>
              <span className="text-white" style={{ fontSize: sz(14, 1.1, 24) }}>CLEARED!</span>
            </div>
          </motion.div>
        )}
        {failed && (
          <motion.div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <div style={{ background: '#c7332d', border: '2px solid #e04040', padding: `${sz(6, 0.5, 12)} ${sz(12, 1, 24)}` }}>
              <span className="text-white" style={{ fontSize: sz(14, 1.1, 24) }}>FAILED</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Boss Blind Banner ──
function BossBanner({ boss }) {
  if (!boss) return null
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel border-accent-red bg-accent-red/10 text-center py-[clamp(6px,0.5vw,12px)] mb-2 mx-auto"
      style={{ maxWidth: 'clamp(320px, 25vw, 520px)' }}
    >
      <div className="text-[clamp(7px,0.55vw,12px)] text-accent-red uppercase tracking-wider">{boss.name}</div>
      <div className="text-[clamp(5px,0.4vw,9px)] text-text-dim mt-1">{boss.description}</div>
    </motion.div>
  )
}

// ── Main Game Layout ──
// Layout: [SIDEBAR] [======= ARENA =======]
export default function GameLayout({
  score = 0,
  money = 0,
  ante = 1,
  blind = 'small',
  target = 300,
  spinsLeft = 3,
  totalSpins = 3,
  streak = 0,
  chips = 0,
  mult = 1,
  boss = null,
  cleared = false,
  failed = false,
  wheelSlot = null,
  handCards = null,
  arenaMessage = null,
  actionButtons = null,
  overlay = null,
  floatingHand = false,
  history = [],
  totalRunScore = 0,
  gameState = 'idle',
  arenaStats = null,
  specialBalls = [],
  hand = [],
  runInfoOpen = false,
  onToggleRunInfo,
}) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
    preloadAll()
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Balatro Background */}
      <div className="fixed inset-0 z-0">
        <BalatroBackground ante={ante - 1} />
      </div>
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      {/* Juice effects */}
      <BackgroundTint gameState={gameState} />
      <FireBorder score={score} />
      <GoldBurst active={cleared} />

      {/* Game Chrome */}
      <div className="relative z-10 min-h-screen flex flex-col" style={{ paddingBottom: floatingHand ? 'clamp(140px, 11vw, 220px)' : 0 }}>
        {/* ── Two-column layout: Sidebar | Arena ── */}
        <div className="flex-1 flex items-stretch">
          {/* LEFT: Unified Sidebar */}
          <motion.aside
            initial={{ opacity: 0, x: -30 }}
            animate={mounted ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="p-[clamp(8px,0.6vw,16px)] flex-shrink-0 hidden md:flex flex-col gap-[clamp(8px,0.6vw,14px)] justify-center items-center"
            style={{ width: 'clamp(240px, 18vw, 340px)' }}
          >
            <div className="panel p-[clamp(8px,0.6vw,14px)] w-full">
              <Sidebar
                chips={chips}
                mult={mult}
                score={score}
                target={target}
                cleared={cleared}
                failed={failed}
                ante={ante}
                blind={blind}
                spinsLeft={spinsLeft}
                totalSpins={totalSpins}
                streak={streak}
                money={money}
                actionButtons={actionButtons}
                history={history}
                totalRunScore={totalRunScore}
                arenaStats={arenaStats}
                specialBalls={specialBalls}
                hand={hand}
                runInfoOpen={runInfoOpen}
                onToggleRunInfo={onToggleRunInfo}
              />
            </div>
          </motion.aside>

          {/* CENTER+RIGHT: Arena (fills all remaining space) */}
          <main className="flex-1 flex flex-col items-center justify-center p-[clamp(6px,0.4vw,12px)] relative">
            <BossBanner boss={boss} />

            {/* Mobile scoreboard */}
            <div className="md:hidden w-full max-w-[420px] mb-2">
              <div className="panel p-2 flex items-center justify-between text-[8px]">
                <div className="flex gap-1 items-center">
                  <span className="badge-chips text-[8px] px-2 py-0.5">{score.toLocaleString()}</span>
                  <span className="text-text-muted">/ {target.toLocaleString()}</span>
                </div>
                <span className="text-text-muted">A{ante}</span>
                <span className="text-gold">${money}</span>
                <div className="flex gap-[2px]">
                  {Array.from({ length: Math.min(spinsLeft, 8) }).map((_, i) => (
                    <div key={i} className="w-[7px] h-[7px] bg-gold" />
                  ))}
                </div>
              </div>
              {/* Mobile action buttons */}
              {actionButtons && <div className="mt-2">{actionButtons}</div>}
              <AnimatePresence>
                {cleared && (
                  <motion.div className="mt-1 bg-accent-green/90 text-center py-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className="text-[9px] text-white">CLEARED!</span>
                  </motion.div>
                )}
                {failed && (
                  <motion.div className="mt-1 bg-accent-red/90 text-center py-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <span className="text-[9px] text-white">FAILED</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wheel + arena message */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={mounted ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.3, duration: 0.5, type: 'spring' }}
              className="relative"
            >
              {wheelSlot || (
                <div className="w-[320px] h-[420px] panel flex items-center justify-center">
                  <span className="text-[8px] text-text-muted/40">[ ARENA ]</span>
                </div>
              )}
              <AnimatePresence>
                {arenaMessage && (
                  <motion.div
                    className="absolute inset-x-0 top-2 flex justify-center pointer-events-none z-20"
                    initial={{ opacity: 0, y: -20, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.9 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {arenaMessage}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </main>
        </div>

        {/* Bottom Card Hand (in-flow, for non-gameplay) */}
        {!floatingHand && handCards && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={mounted ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="panel mx-2 mb-2 p-2"
          >
            <div className="flex items-end justify-center min-h-[120px]">
              {handCards}
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating Card Hand (fixed bottom) */}
      {floatingHand && handCards && (
        <motion.div
          className="fixed bottom-0 left-0 right-0 z-30 flex justify-center items-end pb-2 pt-6 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(8, 20, 32, 0.97) 40%, rgba(8, 20, 32, 0.6) 70%, transparent)',
          }}
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6, type: 'spring', stiffness: 80, damping: 15 }}
        >
          <div className="pointer-events-auto" style={{ maxWidth: '92vw', overflowX: 'auto', overflowY: 'visible' }}>
            {handCards}
          </div>
        </motion.div>
      )}

      {/* Overlay */}
      <AnimatePresence>
        {overlay && <>{overlay}</>}
      </AnimatePresence>
    </div>
  )
}

export { Sidebar, BossBanner }
