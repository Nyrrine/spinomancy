// ═══════════════════════════════════════
// RUN STATS — Analytics dashboard
// ═══════════════════════════════════════

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from 'recharts'
import { SECTORS, SECTOR_COLORS, CARDS } from '../utils/gameConfig'

// ── Chart Theme (Balatro palette) ──
const AXIS_COLOR = '#3d6580'
const TOOLTIP_BG = '#0d2233'
const TOOLTIP_BORDER = '#2a5570'
const FONT = { fontSize: 8, fontFamily: "'Press Start 2P', monospace" }

const CHART_LINE_PRIMARY = '#c7332d'    // Balatro red
const CHART_LINE_SECONDARY = '#2a5daa'  // Balatro blue
const CHART_AREA_FILL = '#c7332d'       // Red for area charts

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: TOOLTIP_BG,
      border: `1px solid ${TOOLTIP_BORDER}`,
      padding: '6px 10px',
      fontFamily: FONT.fontFamily,
      fontSize: '7px',
    }}>
      <div style={{ color: '#888', marginBottom: 2 }}>{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color || '#e5e5e5' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}
        </div>
      ))}
    </div>
  )
}

// ── Stat Card ──
function StatCard({ label, value, color = 'text-text', sub }) {
  return (
    <div className="panel-inset flex flex-col items-center gap-1 p-3 min-w-[90px]">
      <div className="text-[6px] text-text-dim uppercase tracking-wider">{label}</div>
      <div className={`text-xs ${color} tabular-nums`}>{value}</div>
      {sub && <div className="text-[6px] text-text-muted">{sub}</div>}
    </div>
  )
}

// ── Sector Frequency Chart ──
function SectorFrequencyChart({ history }) {
  const data = useMemo(() => {
    const counts = { red: 0, black: 0, green: 0, gold: 0 }
    for (const entry of history) {
      const sector = SECTORS[entry.sectorId]
      if (sector) counts[sector.color] = (counts[sector.color] || 0) + 1
    }
    const total = history.length || 1

    // Expected frequencies based on base wheel
    const sectorCounts = { red: 5, black: 5, green: 1, gold: 1 }
    const totalSectors = 12

    return Object.entries(counts).map(([color, count]) => ({
      color: color.charAt(0).toUpperCase() + color.slice(1),
      actual: Math.round((count / total) * 100),
      expected: Math.round((sectorCounts[color] / totalSectors) * 100),
      fill: SECTOR_COLORS[color],
    }))
  }, [history])

  return (
    <div>
      <div className="text-[7px] text-text-dim mb-2 tracking-wider">
        PREDICTED vs ACTUAL DISTRIBUTION
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} barGap={2}>
          <XAxis dataKey="color" tick={FONT} stroke={AXIS_COLOR} />
          <YAxis tick={FONT} stroke={AXIS_COLOR} tickFormatter={v => `${v}%`} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="expected" fill="#555555" name="Expected %" radius={[2, 2, 0, 0]} />
          <Bar dataKey="actual" name="Actual %" radius={[2, 2, 0, 0]}>
            {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Score Over Time (exponential growth) ──
function ScoreGraph({ history }) {
  const data = useMemo(() => {
    let cumulative = 0
    return history.map((entry, i) => {
      cumulative += entry.score
      return { spin: i + 1, score: entry.score, total: cumulative }
    })
  }, [history])

  return (
    <div>
      <div className="text-[7px] text-text-dim mb-2 tracking-wider">
        SCORING POWER OVER TIME
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={data}>
          <defs>
            <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_AREA_FILL} stopOpacity={0.3} />
              <stop offset="100%" stopColor={CHART_AREA_FILL} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="spin" tick={FONT} stroke={AXIS_COLOR} label={{ value: 'Spin', style: { ...FONT, fill: AXIS_COLOR }, position: 'bottom' }} />
          <YAxis tick={FONT} stroke={AXIS_COLOR} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={35} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={CHART_LINE_PRIMARY}
            fill="url(#scoreGrad)"
            strokeWidth={2}
            name="Per Spin"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Cumulative Score Line ──
function CumulativeGraph({ history }) {
  const data = useMemo(() => {
    let total = 0
    return history.map((entry, i) => {
      total += entry.score
      return { spin: i + 1, total }
    })
  }, [history])

  return (
    <div>
      <div className="text-[7px] text-text-dim mb-2 tracking-wider">
        CUMULATIVE SCORE
      </div>
      <ResponsiveContainer width="100%" height={140}>
        <LineChart data={data}>
          <XAxis dataKey="spin" tick={FONT} stroke={AXIS_COLOR} />
          <YAxis tick={FONT} stroke={AXIS_COLOR} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v} width={40} />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="total"
            stroke={CHART_LINE_SECONDARY}
            strokeWidth={2}
            dot={false}
            name="Total Score"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// ── Sector Distribution Pie ──
function SectorPie({ history }) {
  const data = useMemo(() => {
    const counts = { red: 0, black: 0, green: 0, gold: 0 }
    for (const entry of history) {
      const sector = SECTORS[entry.sectorId]
      if (sector) counts[sector.color] = (counts[sector.color] || 0) + 1
    }
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([color, count]) => ({
        name: color.charAt(0).toUpperCase() + color.slice(1),
        value: count,
        fill: SECTOR_COLORS[color],
      }))
  }, [history])

  return (
    <div>
      <div className="text-[7px] text-text-dim mb-2 tracking-wider">
        DRAW DISTRIBUTION
      </div>
      <div className="flex items-center gap-4">
        <ResponsiveContainer width={120} height={120}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={25}
              outerRadius={45}
              dataKey="value"
              strokeWidth={0}
            >
              {data.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="flex flex-col gap-1.5">
          {data.map((d, i) => (
            <div key={i} className="flex items-center gap-2 text-[6px]">
              <div className="w-2 h-2" style={{ background: d.fill }} />
              <span className="text-text-dim">{d.name}:</span>
              <span className="text-text">{d.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Card Performance ──
function CardPerformance({ history, hand }) {
  const data = useMemo(() => {
    const cardScores = {}
    for (const entry of history) {
      if (!entry.activations) continue
      for (const act of entry.activations) {
        if (!cardScores[act.cardId]) {
          cardScores[act.cardId] = { fires: 0, totalValue: 0 }
        }
        cardScores[act.cardId].fires += 1
        cardScores[act.cardId].totalValue += act.value || 0
      }
    }
    return Object.entries(cardScores)
      .map(([id, stats]) => ({
        id,
        name: CARDS[id]?.name || id,
        ascii: CARDS[id]?.ascii || '???',
        fires: stats.fires,
        totalValue: Math.round(stats.totalValue),
        category: CARDS[id]?.category || 'unknown',
      }))
      .sort((a, b) => b.totalValue - a.totalValue)
  }, [history, hand])

  if (data.length === 0) {
    return (
      <div>
        <div className="text-[7px] text-text-dim mb-2 tracking-wider">CARD PERFORMANCE</div>
        <div className="panel-inset text-center py-4 text-[7px] text-text-muted">
          No card activations yet
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="text-[7px] text-text-dim mb-2 tracking-wider">CARD PERFORMANCE</div>
      <div className="flex flex-col gap-1">
        {data.slice(0, 6).map((card, i) => (
          <div key={card.id} className="panel-inset flex items-center gap-3 px-3 py-1.5">
            <span className="text-[8px] text-text-dim w-8">{card.ascii}</span>
            <span className="text-[6px] text-text flex-1">{card.name}</span>
            <span className="text-[5px] text-text-muted">{card.fires}x fired</span>
            <span className={`text-[7px] ${
              card.category === 'mult' || card.category === 'xmult'
                ? 'text-accent-red'
                : card.category === 'chips'
                  ? 'text-accent-blue'
                  : 'text-gold'
            }`}>
              {card.category === 'xmult' ? `x${card.totalValue.toFixed(1)}` : `+${card.totalValue}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main Component ──
export default function RunStats({ history = [], hand = [], isEndOfRun = false, totalScore = 0, antesCleared = 0, bestSpin = 0, onClose }) {
  const winRate = useMemo(() => {
    if (!history.length) return 0
    const nonGreen = history.filter(h => SECTORS[h.sectorId]?.color !== 'green')
    return nonGreen.length ? Math.round((nonGreen.length / history.length) * 100) : 0
  }, [history])

  const avgScore = useMemo(() => {
    if (!history.length) return 0
    return Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
  }, [history])

  const content = (
    <div className="flex flex-col gap-4">
      {/* ── Stats Cards ── */}
      <div className="flex gap-3 flex-wrap justify-center">
        <StatCard label="Total Score" value={totalScore.toLocaleString()} color="text-gold" />
        <StatCard label="Total Spins" value={history.length} />
        <StatCard label="Antes Cleared" value={`${antesCleared}/8`} color="text-accent-green" />
        <StatCard label="Best Spin" value={bestSpin.toLocaleString()} color="text-accent-red" />
        <StatCard label="Avg Score" value={avgScore.toLocaleString()} color="text-accent-blue" />
        <StatCard
          label="Non-Green Rate"
          value={`${winRate}%`}
          sub="% of spins that scored"
        />
      </div>

      {/* ── Charts Grid ── */}
      {history.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="panel p-3">
            <SectorFrequencyChart history={history} />
          </div>
          <div className="panel p-3">
            <SectorPie history={history} />
          </div>
          <div className="panel p-3">
            <ScoreGraph history={history} />
          </div>
          <div className="panel p-3">
            <CumulativeGraph history={history} />
          </div>
          <div className="panel p-3 md:col-span-2">
            <CardPerformance history={history} hand={hand} />
          </div>
        </div>
      ) : (
        <div className="panel text-center py-8 text-[8px] text-text-muted">
          No spin data yet — start playing!
        </div>
      )}

      {/* ── Math Insights (end of run) ── */}
      {isEndOfRun && history.length > 0 && (
        <div className="bg-panel border-2 border-border p-4">
          <div className="bg-balatro-red px-4 py-1.5 inline-block border-2 border-red-900 shadow-[0_3px_0_#7a1a16] mb-3">
            <span className="text-[8px] text-white tracking-wider">WHAT THE MATH SHOWS</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InsightCard
              title="Law of Large Numbers"
              text="As your spins increased, the sector distribution converged toward the expected probabilities. Red and Black each approach ~41.7% (5/12 and 5/12), Green ~8.3%, Gold ~8.3%."
            />
            <InsightCard
              title="Exponential Scaling"
              text="Stacking multiplier cards created exponential score growth. Each +Mult is additive, but xMult compounds multiplicatively — that's why late-game scores can be 100x or more."
            />
            <InsightCard
              title="Expected Value"
              text="Every spin's EV = (probability x base chips x multipliers). Cards that modify probability (Weighted Ball, Magnet) change which sectors are worth betting on."
            />
            <InsightCard
              title="Order of Operations"
              text="Scoring uses (Chips + Bonus) x (1 + AddMult) x xMult. Adding +Mult first then multiplying by xMult means the order matters — a core algebraic principle."
            />
          </div>
        </div>
      )}
    </div>
  )

  // End of run: full-screen overlay
  if (isEndOfRun) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 overflow-y-auto p-6 flex flex-col items-center"
        style={{ background: '#0a1a24f0' }}
      >
        <div className="max-w-3xl w-full mx-auto">
          <div className="text-center mb-6">
            <div className="text-lg text-gold tracking-wider">RUN COMPLETE</div>
            <div className="text-[6px] text-text-dim tracking-widest mt-1">
              ════════════════════
            </div>
          </div>
          {content}
          {onClose && (
            <div className="flex justify-center mt-6 mb-4">
              <button
                onClick={onClose}
                className="btn-play text-[10px] tracking-wider"
                style={{ padding: '10px 32px' }}
              >
                NEW RUN
              </button>
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  // In-game: side panel
  return (
    <div className="bg-panel border-2 border-border p-3 overflow-y-auto max-h-[80vh]">
      <div className="text-[7px] text-text-dim mb-3 tracking-wider text-center">
        RUN STATS
      </div>
      {content}
    </div>
  )
}

function InsightCard({ title, text }) {
  return (
    <div className="panel-inset p-3">
      <div className="text-[7px] text-accent-blue mb-1.5 tracking-wider">{title}</div>
      <div className="text-[6px] text-text-dim leading-relaxed">{text}</div>
    </div>
  )
}

// ── Collapsible In-Game Stats Panel ──
// A small toggle button that expands a sidebar with key stats during gameplay.
export function StatsToggle({ history = [], hand = [] }) {
  const [open, setOpen] = useState(false)

  const sectorCounts = useMemo(() => {
    const counts = { red: 0, black: 0, green: 0, gold: 0 }
    for (const entry of history) {
      const sector = SECTORS[entry.sectorId]
      if (sector) counts[sector.color] = (counts[sector.color] || 0) + 1
    }
    return counts
  }, [history])

  const total = history.length || 1
  const lastSpins = history.slice(-5).reverse()
  const avgScore = history.length
    ? Math.round(history.reduce((s, h) => s + h.score, 0) / history.length)
    : 0

  return (
    <div className="fixed top-20 right-0 z-30 flex items-start">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: 200, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 200, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-panel border-2 border-border p-3 w-56 mr-0 max-h-[70vh] overflow-y-auto"
          >
            <div className="text-[7px] text-text-dim mb-3 tracking-wider text-center">
              QUICK STATS
            </div>

            {/* Sector frequency bars */}
            <div className="flex flex-col gap-1.5 mb-3">
              {Object.entries(sectorCounts).map(([color, count]) => {
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={color} className="flex items-center gap-2">
                    <div className="w-2 h-2" style={{ background: SECTOR_COLORS[color] }} />
                    <div className="flex-1 h-2 bg-black/40 relative overflow-hidden">
                      <motion.div
                        className="h-full"
                        style={{ background: SECTOR_COLORS[color] }}
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className="text-[6px] text-text-dim w-8 text-right">
                      {Math.round(pct)}%
                    </span>
                  </div>
                )
              })}
            </div>

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-1.5 mb-3">
              <div className="panel-inset p-1.5 text-center">
                <div className="text-[5px] text-text-muted">SPINS</div>
                <div className="text-[8px] text-text">{history.length}</div>
              </div>
              <div className="panel-inset p-1.5 text-center">
                <div className="text-[5px] text-text-muted">AVG</div>
                <div className="text-[8px] text-gold">{avgScore.toLocaleString()}</div>
              </div>
            </div>

            {/* Last spins */}
            {lastSpins.length > 0 && (
              <div>
                <div className="text-[6px] text-text-muted mb-1 tracking-wider">RECENT</div>
                <div className="flex flex-col gap-0.5">
                  {lastSpins.map((entry, i) => {
                    const sector = SECTORS[entry.sectorId]
                    return (
                      <div key={i} className="flex items-center gap-2 text-[6px]">
                        <div className="w-1.5 h-1.5" style={{ background: sector ? SECTOR_COLORS[sector.color] : '#555' }} />
                        <span className="text-text-dim flex-1">{sector?.color || '?'}</span>
                        <span className="text-text">{entry.score.toLocaleString()}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className={`px-2 py-3 border-2 border-l-0 transition-colors ${
          open ? 'bg-panel border-gold text-gold' : 'bg-bg border-border text-text-muted hover:text-text hover:border-text-dim'
        }`}
      >
        <span className="text-[8px] tracking-widest">{open ? 'X' : '#'}</span>
      </button>
    </div>
  )
}
