// ═══════════════════════════════════════
// SHOP — Balatro-style card shop
// ═══════════════════════════════════════

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CARDS,
  SHOP_CONFIG,
  CARD_RARITY,
  getShopCards,
  calculateInterest,
} from '../utils/gameConfig'
import { SPECIAL_BALLS, BALL_RARITY, getRandomSpecialBall } from '../utils/specialBalls'

// ── Synergy Definitions ──
const SYNERGIES = [
  { cards: ['golden_touch', 'jackpot_hunter'], name: 'Gold Rush', desc: 'x4 Mult + 50 chips on Gold' },
  { cards: ['red_carpet', 'hot_streak'], name: 'Red Hot', desc: 'Red chips + streak bonus' },
  { cards: ['black_market', 'hot_streak'], name: 'Dark Streak', desc: 'Black chips + streak bonus' },
  { cards: ['loaded_die', 'card_counter'], name: 'Chip Stack', desc: 'Double chip sources' },
  { cards: ['lucky_charm', 'double_down'], name: 'Mult Surge', desc: '+Mult into x2 final spin' },
  { cards: ['snowball', 'compounding_interest'], name: 'Infinite Engine', desc: 'Scaling +Mult and xMult' },
  { cards: ['extra_ball', 'double_down'], name: 'Last Stand', desc: 'More spins, x2 on the final one' },
  { cards: ['weighted_ball', 'second_chance'], name: 'Green Shield', desc: 'Reduce and respin Green' },
  { cards: ['split_shot', 'loaded_die'], name: 'Scatter Shot', desc: '2 balls x bonus chips each' },
  { cards: ['momentum', 'compounding_interest'], name: 'Snowball Effect', desc: 'Double scaling xMult' },
  { cards: ['magnet', 'golden_touch'], name: 'Gold Magnet', desc: 'Pull toward Gold, then x4' },
  { cards: ['insurance', 'jackpot_hunter'], name: 'High Risk Fund', desc: 'Risky play with a safety net' },
  { cards: ['ricochet_king', 'lucky_bounce'], name: 'Pin Combo', desc: '+chips and xMult from every hit' },
  { cards: ['pin_magnet', 'ricochet_king'], name: 'Bonus Hunter', desc: 'Attract bonus pins + chips per hit' },
  { cards: ['cannon_boost', 'split_shot'], name: 'Double Cannon', desc: '2 fast balls through cannons' },
  { cards: ['slow_motion', 'ricochet_king'], name: 'Pinball Wizard', desc: 'Slower ball + chips per hit' },
  { cards: ['gold_rush', 'golden_touch'], name: 'Midas Touch', desc: 'Gold pays x2 chips AND x4 mult' },
  { cards: ['mega_cannon', 'cannon_boost'], name: 'Turbo Launcher', desc: 'Maximum cannon speed' },
  { cards: ['pin_destroyer', 'lucky_bounce'], name: 'Chain Reaction', desc: 'Exploding pins trigger lucky mult' },
]

function findSynergy(cardId, hand) {
  const handIds = hand.map(c => c.id)
  for (const syn of SYNERGIES) {
    if (syn.cards.includes(cardId)) {
      const other = syn.cards.find(id => id !== cardId)
      if (handIds.includes(other)) return syn
    }
  }
  return null
}

// ── Rarity Label Colors ──
const RARITY_COLORS = {
  [CARD_RARITY.COMMON]: 'text-text-dim',
  [CARD_RARITY.UNCOMMON]: 'text-accent-blue',
  [CARD_RARITY.RARE]: 'text-accent-purple',
  [CARD_RARITY.LEGENDARY]: 'text-gold',
  [CARD_RARITY.CURSED]: 'text-accent-red',
}

const RARITY_BORDER = {
  [CARD_RARITY.COMMON]: 'rarity-common',
  [CARD_RARITY.UNCOMMON]: 'rarity-uncommon',
  [CARD_RARITY.RARE]: 'rarity-rare',
  [CARD_RARITY.LEGENDARY]: 'rarity-legendary',
  [CARD_RARITY.CURSED]: 'rarity-cursed',
}

// ── Shop Card Component ──
function ShopCard({ card, canAfford, onBuy, alreadyOwned, dealDelay = 0 }) {
  const [flipped, setFlipped] = useState(false)
  const [buying, setBuying] = useState(false)
  const def = CARDS[card.id]
  if (!def) return null

  // Deal-in: start face-down, flip after stagger delay
  useEffect(() => {
    const t = setTimeout(() => setFlipped(true), dealDelay)
    return () => clearTimeout(t)
  }, [dealDelay])

  const disabled = !canAfford
  const label = alreadyOwned ? `+1 STACK  $${def.cost}` : `BUY  $${def.cost}`

  function handleBuy() {
    setBuying(true)
    setTimeout(onBuy, 300)
  }

  // Face-down state
  if (!flipped) {
    return (
      <motion.div
        initial={{ rotateY: 180, opacity: 0, scale: 0.8 }}
        animate={{ rotateY: 180, opacity: 1, scale: 1 }}
        className="panel flex items-center justify-center"
        style={{ perspective: '600px', width: 'clamp(120px, 9.5vw, 190px)', height: 'clamp(170px, 13.5vw, 270px)' }}
      >
        <div className="text-[clamp(14px,1.1vw,24px)] text-text-muted/30">[?]</div>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ rotateY: 90, scale: 0.8 }}
      animate={buying
        ? { scale: 1.15, y: -30, opacity: 0 }
        : { rotateY: 0, scale: 1 }
      }
      exit={{ scale: 0.8, opacity: 0, y: -20 }}
      transition={buying
        ? { duration: 0.3, ease: 'easeIn' }
        : { type: 'spring', stiffness: 200, damping: 20 }
      }
      className={`panel card-shine ${RARITY_BORDER[def.rarity]} flex flex-col items-center`}
      style={{ width: 'clamp(120px, 9.5vw, 190px)', padding: 'clamp(8px, 0.7vw, 16px)', gap: 'clamp(6px, 0.5vw, 12px)' }}
    >
      {/* ASCII art icon */}
      <div className="text-[clamp(14px,1.1vw,24px)] tracking-widest text-text-dim">{def.ascii}</div>

      {/* Name */}
      <div className="text-[clamp(6px,0.5vw,10px)] text-center leading-relaxed">{def.name}</div>

      {/* Rarity */}
      <div className={`text-[clamp(5px,0.38vw,8px)] uppercase ${RARITY_COLORS[def.rarity]}`}>
        {def.rarity}
      </div>

      {/* Description */}
      <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim text-center leading-relaxed" style={{ minHeight: 'clamp(20px, 1.6vw, 32px)' }}>
        {def.description}
      </div>

      {/* Category badge */}
      <div className="text-[clamp(4px,0.32vw,7px)] text-text-muted uppercase tracking-wider border border-border px-[clamp(5px,0.4vw,10px)] py-[clamp(1px,0.1vw,3px)]">
        {def.category}
      </div>

      {/* Buy button */}
      <button
        onClick={handleBuy}
        disabled={disabled || buying}
        className={`w-full text-[clamp(5px,0.42vw,9px)] transition-colors ${
          disabled
            ? 'border-border text-text-muted cursor-not-allowed'
            : 'border-gold text-gold hover:bg-gold/10 active:bg-gold/20'
        }`}
        style={{ padding: 'clamp(4px, 0.35vw, 8px)', borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid' }}
      >
        {label}
      </button>
    </motion.div>
  )
}

// ── Hand Card (for selling) ──
function HandCard({ card, onSell }) {
  const def = CARDS[card.id]
  if (!def) return null

  const sellPrice = Math.floor(def.cost * SHOP_CONFIG.sellMultiplier)

  return (
    <motion.div
      layout
      className={`panel ${RARITY_BORDER[def.rarity]} flex flex-col items-center`}
      style={{ width: 'clamp(80px, 6.5vw, 130px)', padding: 'clamp(6px, 0.5vw, 12px)', gap: 'clamp(3px, 0.25vw, 6px)' }}
    >
      <div className="text-[clamp(10px,0.8vw,16px)] tracking-widest text-text-dim">{def.ascii}</div>
      <div className="text-[clamp(5px,0.38vw,8px)] text-center leading-relaxed">{def.name}</div>
      {card.stackCount > 1 && (
        <div className="text-[clamp(5px,0.38vw,8px)] text-gold">x{card.stackCount}</div>
      )}
      <button
        onClick={onSell}
        className="w-full text-[clamp(5px,0.38vw,8px)] border border-accent-red/50 text-accent-red hover:bg-accent-red/10 transition-colors"
        style={{ padding: 'clamp(3px, 0.25vw, 6px)' }}
      >
        SELL ${sellPrice}
      </button>
    </motion.div>
  )
}

// ── Synergy Toast ──
function SynergyToast({ synergy, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000)
    return () => clearTimeout(t)
  }, [onDone])

  return (
    <motion.div
      initial={{ y: 40, opacity: 0, scale: 0.9 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      exit={{ y: -20, opacity: 0, scale: 0.9 }}
      className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 panel border-gold"
    >
      <div className="flex flex-col items-center" style={{ gap: 'clamp(3px, 0.25vw, 6px)', padding: 'clamp(8px, 0.7vw, 16px) clamp(16px, 1.3vw, 30px)' }}>
        <div className="text-[clamp(5px,0.42vw,9px)] text-gold uppercase tracking-wider">
          Synergy Discovered!
        </div>
        <div className="text-[clamp(7px,0.55vw,12px)] text-text">{synergy.name}</div>
        <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim">{synergy.desc}</div>
      </div>
    </motion.div>
  )
}

// ── First Visit Tooltip ──
// ── Special Ball visual colors ──
const BALL_VISUAL_COLORS = {
  ember: { bg: '#e07030', glow: 'rgba(224, 112, 48, 0.4)', border: '#c05820' },
  heavy: { bg: '#8888aa', glow: 'rgba(136, 136, 170, 0.3)', border: '#6666888' },
  ghost: { bg: '#90c0e0', glow: 'rgba(144, 192, 224, 0.4)', border: '#70a0c0' },
  magnet: { bg: '#4080cc', glow: 'rgba(64, 128, 204, 0.4)', border: '#3060aa' },
  split: { bg: '#cc6644', glow: 'rgba(204, 102, 68, 0.3)', border: '#aa5533' },
  crystal: { bg: '#e0e0ff', glow: 'rgba(224, 224, 255, 0.5)', border: '#c0c0ee' },
  void: { bg: '#8040c0', glow: 'rgba(128, 64, 192, 0.5)', border: '#6030a0' },
}

const BALL_RARITY_BORDER = {
  [BALL_RARITY.COMMON]: 'rarity-common',
  [BALL_RARITY.UNCOMMON]: 'rarity-uncommon',
  [BALL_RARITY.RARE]: 'rarity-rare',
  [BALL_RARITY.LEGENDARY]: 'rarity-legendary',
}

// ── Special Ball Shop Slot ──
function SpecialBallSlot({ ball, canAfford, onBuy, dealDelay = 0 }) {
  if (!ball) return null

  const colors = BALL_VISUAL_COLORS[ball.visual] || BALL_VISUAL_COLORS.ember
  const rarityBorder = BALL_RARITY_BORDER[ball.rarity] || ''

  return (
    <motion.div
      className="flex flex-col items-center bg-panel border-2 border-border"
      style={{
        width: 'clamp(120px, 9.5vw, 190px)',
        padding: 'clamp(10px, 0.8vw, 18px)',
        gap: 'clamp(6px, 0.5vw, 12px)',
      }}
      initial={{ opacity: 0, y: -30, rotateY: -90 }}
      animate={{ opacity: 1, y: 0, rotateY: 0 }}
      transition={{ delay: dealDelay / 1000, type: 'spring', stiffness: 200, damping: 15 }}
    >
      {/* Ball orb — round, glowing */}
      <motion.div
        className={`rounded-full flex items-center justify-center border-2 ${rarityBorder}`}
        style={{
          width: 'clamp(50px, 4vw, 80px)',
          height: 'clamp(50px, 4vw, 80px)',
          background: `radial-gradient(circle at 35% 35%, ${colors.bg}dd, ${colors.bg}88, ${colors.bg}44)`,
          boxShadow: `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}, inset 0 0 10px rgba(255,255,255,0.15)`,
        }}
        whileHover={{ scale: 1.1 }}
        animate={{
          boxShadow: [
            `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
            `0 0 20px ${colors.glow}, 0 0 40px ${colors.glow}`,
            `0 0 15px ${colors.glow}, 0 0 30px ${colors.glow}`,
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[clamp(12px,1vw,20px)] text-white/90">{ball.ascii}</span>
      </motion.div>

      {/* Ball name + description */}
      <div className="text-center">
        <div className="text-[clamp(6px,0.48vw,10px)] text-text leading-tight">{ball.name}</div>
        <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim leading-tight mt-1">{ball.description}</div>
      </div>

      {/* Rarity label */}
      <div className="text-[clamp(4px,0.32vw,6px)] text-text-muted uppercase tracking-widest">
        {ball.rarity}
      </div>

      {/* USE button */}
      <button
        onClick={onBuy}
        disabled={!canAfford}
        className={`w-full transition-colors text-center ${
          canAfford
            ? 'btn-orange'
            : 'bg-panel-light text-text-muted border-2 border-border cursor-not-allowed'
        }`}
        style={{ padding: 'clamp(4px,0.35vw,8px)', fontSize: 'clamp(6px,0.48vw,10px)' }}
      >
        USE ${ball.cost}
      </button>
    </motion.div>
  )
}

function ShopTutorial({ onDismiss }) {
  return (
    <motion.div
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -10, opacity: 0 }}
      className="panel border-gold/40 text-center px-5 py-3 mb-3"
    >
      <div className="text-[clamp(5px,0.42vw,9px)] text-gold mb-1 tracking-wider">WELCOME TO THE SHOP</div>
      <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim leading-relaxed">
        Buy cards to boost your spins. Sell what you don't need.
      </div>
      <button
        onClick={onDismiss}
        className="mt-2 text-[clamp(5px,0.38vw,8px)] text-text-muted hover:text-text transition-colors"
      >
        Got it
      </button>
    </motion.div>
  )
}

// ── Main Shop Component ──
export default function Shop({
  hand,
  money,
  unusedSpins = 0,
  isFirstVisit = false,
  engineShopCards,
  onBuyCard,
  onBuySpecialBall,
  onReroll,
  onSellCard,
  onDone,
}) {
  // Use the engine's shop cards as the source of truth so what you see = what you buy
  const [shopCards, setShopCards] = useState(() => engineShopCards || getShopCards(hand))
  const [rerollCost, setRerollCost] = useState(SHOP_CONFIG.baseRerollCost)
  const [synergy, setSynergy] = useState(null)
  const [soldIndices, setSoldIndices] = useState([])
  const [showTutorial, setShowTutorial] = useState(isFirstVisit)
  const [dealKey, setDealKey] = useState(0)
  // Special ball — 60% chance to appear
  const [shopBall, setShopBall] = useState(() => getRandomSpecialBall())

  const interest = calculateInterest(money)
  const income = SHOP_CONFIG.baseIncome
  const spinBonus = unusedSpins * SHOP_CONFIG.unusedSpinBonus
  const totalIncome = income + spinBonus + interest

  function handleBuy(index) {
    const card = shopCards[index]
    if (!card || money < CARDS[card.id].cost) return

    // Check for synergy before buying
    const syn = findSynergy(card.id, hand)

    onBuyCard(index)

    // Remove from shop display
    setShopCards(prev => prev.map((c, i) => i === index ? null : c))

    if (syn) {
      setSynergy(syn)
    }
  }

  function handleReroll() {
    if (money < rerollCost) return
    if (onReroll) onReroll()
    // Clear cards briefly for shuffle-out effect, then deal new ones
    setShopCards([null, null, null])
    setDealKey(k => k + 1)
    setTimeout(() => {
      setShopCards(getShopCards(hand))
    }, 200)
    setRerollCost(prev => prev + SHOP_CONFIG.rerollIncrement)
  }

  function handleBuyBall() {
    if (!shopBall || money < shopBall.cost) return
    if (onBuySpecialBall) onBuySpecialBall(shopBall.id)
    setShopBall(null)
  }

  function handleSell(handIndex) {
    onSellCard(handIndex)
    setSoldIndices(prev => [...prev, handIndex])
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 p-4"
    >
      <div className="bg-panel border-border flex flex-col" style={{ borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid', padding: 'clamp(12px, 1.2vw, 28px)', maxWidth: 'clamp(500px, 42vw, 780px)', width: '100%', gap: 'clamp(10px, 0.9vw, 22px)' }}>
        {/* Tutorial */}
        <AnimatePresence>
          {showTutorial && <ShopTutorial onDismiss={() => setShowTutorial(false)} />}
        </AnimatePresence>

        {/* Red Marquee Header */}
        <div className="flex items-center justify-between">
          <div className="bg-balatro-red border-red-900" style={{ padding: 'clamp(6px, 0.5vw, 12px) clamp(14px, 1.2vw, 28px)', borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid', boxShadow: '0 calc(4px * var(--game-scale)) 0 #7a1a16' }}>
            <div className="text-[clamp(11px,0.85vw,18px)] text-white tracking-wider">SHOP</div>
          </div>
          <div className="panel-inset text-center" style={{ padding: 'clamp(6px, 0.5vw, 12px) clamp(10px, 0.8vw, 20px)' }}>
            <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim tracking-wider">WALLET</div>
            <div className="text-[clamp(11px,0.85vw,18px)] text-gold">${money}</div>
          </div>
        </div>

        {/* Income Summary */}
        <div className="panel-inset" style={{ padding: 'clamp(8px, 0.7vw, 16px) clamp(10px, 0.8vw, 20px)' }}>
          <div className="text-[clamp(5px,0.38vw,8px)] text-text-dim tracking-wider mb-[clamp(4px,0.35vw,8px)]">ROUND EARNINGS</div>
          <div className="flex items-center gap-0 flex-wrap">
            <div className="flex flex-col items-center bg-panel border border-border" style={{ gap: 'clamp(1px,0.1vw,3px)', padding: 'clamp(4px,0.35vw,8px) clamp(8px,0.6vw,14px)' }}>
              <span className="text-[clamp(5px,0.38vw,8px)] text-text-dim">Base</span>
              <span className="text-[clamp(7px,0.55vw,12px)] text-text">${income}</span>
            </div>
            {spinBonus > 0 && (
              <div className="flex flex-col items-center bg-panel border border-border" style={{ gap: 'clamp(1px,0.1vw,3px)', padding: 'clamp(4px,0.35vw,8px) clamp(8px,0.6vw,14px)' }}>
                <span className="text-[clamp(5px,0.38vw,8px)] text-text-dim">Spins</span>
                <span className="text-[clamp(7px,0.55vw,12px)] text-accent-green">+${spinBonus}</span>
              </div>
            )}
            <div className="flex flex-col items-center bg-panel border border-border" style={{ gap: 'clamp(1px,0.1vw,3px)', padding: 'clamp(4px,0.35vw,8px) clamp(8px,0.6vw,14px)' }}>
              <span className="text-[clamp(5px,0.38vw,8px)] text-text-dim">Interest</span>
              <span className={`text-[clamp(7px,0.55vw,12px)] ${interest > 0 ? 'text-gold' : 'text-text-muted'}`}>+${interest}</span>
              <span className="text-[clamp(4px,0.3vw,6px)] text-text-muted">$1/$5</span>
            </div>
            <div className="flex flex-col items-center bg-panel-light border-gold/30" style={{ gap: 'clamp(1px,0.1vw,3px)', padding: 'clamp(4px,0.35vw,8px) clamp(10px,0.8vw,18px)', borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid' }}>
              <span className="text-[clamp(5px,0.38vw,8px)] text-gold">Total</span>
              <span className="text-[clamp(8px,0.6vw,13px)] text-gold">= ${totalIncome}</span>
            </div>
          </div>
        </div>

        {/* Cards for Sale */}
        <div>
          <div className="text-[clamp(5px,0.42vw,9px)] text-text-dim mb-[clamp(4px,0.35vw,8px)] tracking-wider">CARDS FOR SALE</div>
          <div className="flex justify-center" style={{ gap: 'clamp(8px, 0.7vw, 16px)' }}>
            <AnimatePresence mode="popLayout">
              {shopCards.map((card, i) =>
                card ? (
                  <ShopCard
                    key={`${card.id}-${i}-${dealKey}`}
                    card={card}
                    dealDelay={200 + i * 200}
                    canAfford={money >= CARDS[card.id].cost}
                    alreadyOwned={hand.some(c => c.id === card.id && CARDS[card.id]?.stackable)}
                    onBuy={() => handleBuy(i)}
                  />
                ) : (
                  <div key={`empty-${i}`} className="border-border flex flex-col items-center justify-center bg-panel-light" style={{ width: 'clamp(120px, 9.5vw, 190px)', height: 'clamp(145px, 11.5vw, 230px)', borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid', gap: 'clamp(6px, 0.5vw, 12px)' }}>
                    <span className="text-[clamp(14px,1.1vw,24px)] text-text-muted/40">---</span>
                    <span className="text-[clamp(5px,0.38vw,8px)] text-text-muted tracking-wider">SOLD OUT</span>
                  </div>
                )
              )}
            </AnimatePresence>

            {/* Special Ball slot (4th slot) */}
            {shopBall && (
              <SpecialBallSlot
                ball={shopBall}
                canAfford={money >= shopBall.cost}
                onBuy={handleBuyBall}
                dealDelay={200 + shopCards.length * 200}
              />
            )}
          </div>
        </div>

        {/* Reroll Button */}
        <div className="flex justify-center">
          <button
            onClick={handleReroll}
            disabled={money < rerollCost}
            className={`transition-colors flex items-center ${
              money >= rerollCost
                ? 'border-accent-blue text-accent-blue hover:bg-accent-blue/10'
                : 'border-border text-text-muted cursor-not-allowed'
            }`}
            style={{ padding: 'clamp(6px, 0.5vw, 12px) clamp(16px, 1.3vw, 30px)', borderWidth: 'calc(2px * var(--game-scale))', borderStyle: 'solid', gap: 'clamp(8px, 0.6vw, 14px)' }}
          >
            <span className="text-[clamp(5px,0.42vw,9px)] tracking-wider">REROLL</span>
            <span className={`text-[clamp(7px,0.55vw,12px)] ${money >= rerollCost ? 'text-accent-blue' : 'text-text-muted'}`}>
              ${rerollCost}
            </span>
          </button>
        </div>

        {/* Your Hand */}
        <div>
          <div className="text-[clamp(5px,0.42vw,9px)] text-text-dim mb-[clamp(4px,0.35vw,8px)] tracking-wider">
            YOUR HAND ({hand.length})
          </div>
          {hand.length === 0 ? (
            <div className="panel-inset text-center text-[clamp(5px,0.42vw,9px)] text-text-muted" style={{ padding: 'clamp(10px, 0.8vw, 20px)' }}>
              No cards yet — buy some above!
            </div>
          ) : (
            <div className="flex flex-wrap justify-center" style={{ gap: 'clamp(6px, 0.5vw, 12px)' }}>
              {hand.map((card, i) =>
                !soldIndices.includes(i) && (
                  <HandCard
                    key={`hand-${card.id}-${i}`}
                    card={card}
                    onSell={() => handleSell(i)}
                  />
                )
              )}
            </div>
          )}
        </div>

        {/* Next Round Button */}
        <div className="flex justify-center pt-[clamp(4px,0.35vw,8px)]">
          <button
            onClick={onDone}
            className="btn-green text-[clamp(7px,0.55vw,12px)] tracking-wider"
            style={{ padding: 'clamp(8px, 0.7vw, 16px) clamp(24px, 2vw, 48px)', boxShadow: '0 calc(4px * var(--game-scale)) 0 #1a5c16' }}
          >
            NEXT ROUND
          </button>
        </div>
      </div>

      {/* Synergy Toast */}
      <AnimatePresence>
        {synergy && (
          <SynergyToast synergy={synergy} onDone={() => setSynergy(null)} />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
