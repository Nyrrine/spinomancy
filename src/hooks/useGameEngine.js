// ═══════════════════════════════════════
// GAME ENGINE — Full State Hook
// ═══════════════════════════════════════

import { useState, useCallback, useRef } from 'react'
import {
  ANTES, BLIND_TYPES, BASE_SPINS_PER_ROUND, STARTING_MONEY,
  SHOP_CONFIG, CARDS, CARD_RARITY, RARITY_WEIGHTS,
  getBlindTarget, getBossBlind, getShopCards, getRandomCard,
  calculateInterest, SECTORS,
} from '../utils/gameConfig'
import {
  calculateSpinScore, getExtraSpins, hasRespinGreen,
  getSplitBallCount, hasReroll, getInsurance,
  getModifiedSectors, advanceScaling, resetRoundCardState,
} from '../utils/cardEngine'
import { SPECIAL_BALLS } from '../utils/specialBalls'

// ── Game phases ──
export const PHASE = {
  MENU: 'menu',
  DRAFT: 'draft',
  BLIND_SELECT: 'blind_select',
  PLAYING: 'playing',
  SPINNING: 'spinning',
  RESULT: 'result',
  ROUND_END: 'round_end',
  SHOP: 'shop',
  BOSS_INTRO: 'boss_intro',
  GAME_OVER: 'game_over',
  VICTORY: 'victory',
}

function initialState() {
  return {
    phase: PHASE.MENU,
    ante: 0,           // index into ANTES (0-7)
    blindIndex: 0,     // 0=small, 1=big, 2=boss
    roundScore: 0,
    money: STARTING_MONEY,
    hand: [{ id: 'lucky_charm', stackCount: 1, scalingState: { roundsSurvived: 0, blindsBeaten: 0 } }],
    spinsLeft: BASE_SPINS_PER_ROUND,
    totalSpins: 0,     // lifetime
    streakColor: null,
    streakLength: 0,
    lastResult: null,   // { sector, score breakdown }
    activeSectors: SECTORS,
    bossBlind: null,
    bossEffect: null,
    shopCards: [],
    rerollCost: SHOP_CONFIG.baseRerollCost,
    runStats: {
      totalScore: 0,
      spinsPlayed: 0,
      blindsBeaten: 0,
      highestSpin: 0,
      sectorHistory: [],
    },
    insuranceRetry: false,
    draftCards: [],
    blockerActive: false,
    blockerTimer: null,
    specialBalls: [],
    accumulatedChips: 0,  // chips accumulate across spins within a blind
    accumulatedMult: 1,   // mult accumulates across spins within a blind
  }
}

export default function useGameEngine() {
  const [state, setState] = useState(initialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // ── Helper: update state ──
  const patch = useCallback((updates) => {
    setState(prev => {
      const next = typeof updates === 'function' ? updates(prev) : { ...prev, ...updates }
      return next
    })
  }, [])

  // ══════════════════════════
  // GAME FLOW
  // ══════════════════════════

  // Generate 3 draft cards with bias toward uncommon+
  function generateDraftCards() {
    const cards = []
    const excludeIds = ['lucky_charm'] // already in starting hand
    for (let i = 0; i < 3; i++) {
      // Bias: double the weight of uncommon, rare, legendary
      const available = Object.values(CARDS).filter(c => !excludeIds.includes(c.id) && !cards.some(d => d.id === c.id))
      const biasedWeights = {
        [CARD_RARITY.COMMON]: RARITY_WEIGHTS[CARD_RARITY.COMMON] * 0.6,
        [CARD_RARITY.UNCOMMON]: RARITY_WEIGHTS[CARD_RARITY.UNCOMMON] * 1.8,
        [CARD_RARITY.RARE]: RARITY_WEIGHTS[CARD_RARITY.RARE] * 2.0,
        [CARD_RARITY.LEGENDARY]: RARITY_WEIGHTS[CARD_RARITY.LEGENDARY] * 2.5,
      }
      const totalWeight = available.reduce((sum, c) => sum + (biasedWeights[c.rarity] || 1), 0)
      let rand = Math.random() * totalWeight
      let picked = available[available.length - 1]
      for (const card of available) {
        rand -= biasedWeights[card.rarity] || 1
        if (rand < 0) { picked = card; break }
      }
      cards.push({ ...picked })
    }
    return cards
  }

  const startGame = useCallback(() => {
    const fresh = initialState()
    fresh.phase = PHASE.DRAFT
    fresh.draftCards = generateDraftCards()
    setState(fresh)
  }, [])

  const pickDraftCard = useCallback((draftIndex) => {
    patch(prev => {
      const card = prev.draftCards[draftIndex]
      if (!card) return prev
      const newHand = [...prev.hand, {
        id: card.id,
        stackCount: 1,
        scalingState: { roundsSurvived: 0, blindsBeaten: 0 },
      }]
      return {
        ...prev,
        phase: PHASE.BLIND_SELECT,
        hand: newHand,
        draftCards: [],
      }
    })
  }, [patch])

  const startBlind = useCallback(() => {
    patch(prev => {
      const isBoss = prev.blindIndex === 2
      let bossBlind = null
      let bossEffect = null

      if (isBoss) {
        bossBlind = getBossBlind(prev.ante)
        bossEffect = bossBlind.effect
      }

      // Always apply probability card effects + boss effects to sectors
      const activeSectors = getModifiedSectors(prev.hand, bossEffect)

      // Boss: The Tax Man
      let money = prev.money
      if (bossEffect === 'lose_money') {
        money = Math.max(0, money - 3)
      }

      // Cursed: Blood Tax — lose $2 per round
      for (const card of prev.hand) {
        if (card.disabled) continue
        const def = CARDS[card.id]
        if (def?.effect.type === 'cursed_tax') {
          money = Math.max(0, money - def.effect.taxAmount)
        }
      }

      const extraSpins = getExtraSpins(prev.hand)
      const hand = resetRoundCardState(prev.hand)

      // Boss: The Jinx — disable one random card
      if (bossEffect === 'disable_card' && hand.length > 0) {
        const enabled = hand.filter(c => !c.disabled)
        if (enabled.length > 0) {
          const victim = enabled[Math.floor(Math.random() * enabled.length)]
          const idx = hand.indexOf(victim)
          hand[idx] = { ...hand[idx], disabled: true }
        }
      }

      let target = getBlindTarget(prev.ante, BLIND_TYPES[prev.blindIndex])
      // Boss: The Final Bet
      if (bossEffect === 'triple_target') {
        target *= 3
      }

      return {
        ...prev,
        phase: isBoss ? PHASE.BOSS_INTRO : PHASE.PLAYING,
        money,
        bossBlind,
        bossEffect,
        activeSectors,
        spinsLeft: BASE_SPINS_PER_ROUND + extraSpins,
        roundScore: 0,
        accumulatedChips: 0,
        accumulatedMult: 1,
        hand,
        streakColor: null,
        streakLength: 0,
        lastResult: null,
        insuranceRetry: false,
      }
    })
  }, [patch])

  const startBossRound = useCallback(() => {
    patch({ phase: PHASE.PLAYING })
  }, [patch])

  // ── Spin the wheel (allows multi-ball spam during SPINNING) ──
  const spin = useCallback(() => {
    patch(prev => {
      if (prev.spinsLeft <= 0) return prev
      if (prev.phase !== PHASE.PLAYING && prev.phase !== PHASE.SPINNING) return prev
      return { ...prev, phase: PHASE.SPINNING, spinsLeft: prev.spinsLeft - 1 }
    })
  }, [patch])

  // ── Handle spin result (called by Arena onResult) ──
  // arenaData: { bumperHits, bonusHits, multiplierHits, pipeUses }
  const handleSpinResult = useCallback((sectorId, arenaData = {}) => {
    // Support legacy call: handleSpinResult(sectorId, number)
    const arena = typeof arenaData === 'number'
      ? { bumperHits: arenaData, bonusHits: 0, multiplierHits: 0, pipeUses: 0, wallBounces: 0 }
      : { bumperHits: 0, bonusHits: 0, multiplierHits: 0, pipeUses: 0, wallBounces: 0, ...arenaData }

    patch(prev => {
      const sector = prev.activeSectors.find(s => s.id === sectorId) || prev.activeSectors[0]

      // Check respin on green — Second Chance card OR Reroll Token (auto, no button)
      if (sector.color === 'green') {
        // Second Chance: unlimited green respins
        if (hasRespinGreen(prev.hand)) {
          return {
            ...prev,
            phase: PHASE.SPINNING,
            lastResult: { sector, respin: true },
          }
        }
        // Reroll Token: auto-respin on green, consumes 1 use per stack per round
        const rerollCard = prev.hand.find(c =>
          !c.disabled && CARDS[c.id]?.effect.type === 'reroll' && (c.rerollsLeft ?? (c.stackCount || 1)) > 0
        )
        if (rerollCard) {
          const newHand = prev.hand.map(c =>
            c.id === rerollCard.id ? { ...c, rerollsLeft: (c.rerollsLeft ?? (c.stackCount || 1)) - 1 } : c
          )
          return {
            ...prev,
            phase: PHASE.SPINNING,
            hand: newHand,
            lastResult: { sector, respin: true },
          }
        }
      }

      // Streak tracking
      let streakColor = prev.streakColor
      let streakLength = prev.streakLength
      if (sector.color === streakColor) {
        streakLength++
      } else {
        streakColor = sector.color
        streakLength = 1
      }

      const newTotalSpins = prev.totalSpins + 1
      const isLastSpin = prev.spinsLeft <= 1

      // Bumper bonus: +2 chips per total pin hit
      const bumperBonus = arena.bumperHits * 2
      const boostedSector = bumperBonus > 0
        ? { ...sector, baseChips: sector.baseChips + bumperBonus }
        : sector

      const scoreResult = calculateSpinScore({
        sector: boostedSector,
        hand: prev.hand,
        context: {
          isLastSpin,
          streakColor,
          streakLength: streakLength - 1,
          bossEffect: prev.bossEffect,
          lifetimeSpins: newTotalSpins,
          bumperHits: arena.bumperHits,
          bonusHits: arena.bonusHits,
          wallBounces: arena.wallBounces,
          specialBalls: arena.specialBalls || [],
        },
      })

      // Multiplier pins: each red pin hit applies x1.5 (compounds)
      let multiplierFromPins = 1
      for (let i = 0; i < arena.multiplierHits; i++) {
        multiplierFromPins *= 1.5
      }

      // Split shot: multiple balls
      const ballCount = getSplitBallCount(prev.hand)

      // ── Accumulating scoring: chips and mult ADD across spins ──
      const spinChips = scoreResult.chips * ballCount
      const spinMult = scoreResult.mult * scoreResult.xMult * multiplierFromPins
      const newAccChips = prev.accumulatedChips + spinChips
      const newAccMult = prev.accumulatedMult + (spinMult - 1) // add the bonus mult (subtract base 1)
      const newRoundScore = Math.floor(newAccChips * newAccMult)

      // Also track individual spin score for display
      // Color combo multiplier from arena (same-color multi-ball landing)
      const comboMult = arena.comboMult || 1
      const totalScore = Math.floor(scoreResult.finalScore * multiplierFromPins * comboMult) * ballCount

      const newSpinsLeft = prev.spinsLeft - 1

      // Run stats — track arena data
      const runStats = {
        ...prev.runStats,
        totalScore: prev.runStats.totalScore + totalScore,
        spinsPlayed: prev.runStats.spinsPlayed + 1,
        highestSpin: Math.max(prev.runStats.highestSpin, totalScore),
        sectorHistory: [...prev.runStats.sectorHistory, {
          sector, score: totalScore,
          sectorId,
          bumperHits: arena.bumperHits,
          bonusHits: arena.bonusHits,
          multiplierHits: arena.multiplierHits,
          pipeUses: arena.pipeUses,
        }],
        totalPinHits: (prev.runStats.totalPinHits || 0) + arena.bumperHits,
        totalPipeUses: (prev.runStats.totalPipeUses || 0) + arena.pipeUses,
        bestCombo: Math.max(prev.runStats.bestCombo || 0, arena.bumperHits),
      }

      // Gold sector bonus: +$3 base
      let goldBonus = 0
      if (sector.color === 'gold') {
        goldBonus = 3
        // Jackpot Slot card adds more (handled in card effects, but base $3 here)
        for (const card of prev.hand) {
          if (card.disabled) continue
          const def = CARDS[card.id]
          if (def?.effect.type === 'gold_money') {
            goldBonus += def.effect.value * (card.stackCount || 1)
          }
        }
      }

      return {
        ...prev,
        phase: PHASE.RESULT,
        money: prev.money + goldBonus,
        roundScore: newRoundScore,
        accumulatedChips: newAccChips,
        accumulatedMult: newAccMult,
        spinsLeft: newSpinsLeft,
        totalSpins: newTotalSpins,
        streakColor,
        streakLength,
        lastResult: {
          sector, ...scoreResult, totalScore, ballCount,
          spinChips, spinMult,
          accumulatedChips: newAccChips,
          accumulatedMult: newAccMult,
          bumperHits: arena.bumperHits,
          bonusHits: arena.bonusHits,
          multiplierHits: arena.multiplierHits,
          multiplierFromPins,
          pipeUses: arena.pipeUses,
          wallBounces: arena.wallBounces,
          bumperBonus,
        },
        runStats,
      }
    })
  }, [patch])

  // ── After result animation, continue or end round ──
  const continueRound = useCallback(() => {
    patch(prev => {
      const target = getBlindTarget(prev.ante, BLIND_TYPES[prev.blindIndex])
      const effectiveTarget = prev.bossEffect === 'triple_target' ? target * 3 : target

      // Beat the blind?
      if (prev.roundScore >= effectiveTarget) {
        return { ...prev, phase: PHASE.ROUND_END }
      }

      // Out of spins?
      if (prev.spinsLeft <= 0) {
        // Insurance check
        const insuranceValue = getInsurance(prev.hand)
        if (insuranceValue && !prev.insuranceRetry) {
          return {
            ...prev,
            phase: PHASE.PLAYING,
            roundScore: Math.floor(prev.roundScore * insuranceValue),
            spinsLeft: BASE_SPINS_PER_ROUND,
            insuranceRetry: true,
          }
        }
        return { ...prev, phase: PHASE.GAME_OVER }
      }

      return { ...prev, phase: PHASE.PLAYING }
    })
  }, [patch])

  // ── Round won — advance blind ──
  const advanceBlind = useCallback(() => {
    patch(prev => {
      const hand = advanceScaling(prev.hand, 'blind')
      const newBlindIndex = prev.blindIndex + 1
      const runStats = {
        ...prev.runStats,
        blindsBeaten: prev.runStats.blindsBeaten + 1,
      }

      // Re-enable all cards (unjinx)
      const cleansedHand = hand.map(c => ({ ...c, disabled: false }))

      // All 3 blinds beaten in this ante → shop time
      if (newBlindIndex >= 3) {
        // Advance scaling for round completion
        const scaledHand = advanceScaling(cleansedHand, 'round')

        // Check victory (beat ante 8)
        if (prev.ante >= ANTES.length - 1) {
          return {
            ...prev,
            phase: PHASE.VICTORY,
            hand: scaledHand,
            runStats,
          }
        }

        // Income
        const unusedSpins = prev.spinsLeft
        const income = SHOP_CONFIG.baseIncome
          + (unusedSpins * SHOP_CONFIG.unusedSpinBonus)
          + calculateInterest(prev.money)
        const newMoney = prev.money + income
        const shopCards = getShopCards(scaledHand)

        return {
          ...prev,
          phase: PHASE.SHOP,
          ante: prev.ante + 1,
          blindIndex: 0,
          hand: scaledHand,
          money: newMoney,
          shopCards,
          rerollCost: SHOP_CONFIG.baseRerollCost,
          bossBlind: null,
          bossEffect: null,
          activeSectors: SECTORS,
          runStats,
        }
      }

      // Next blind in same ante
      return {
        ...prev,
        phase: PHASE.BLIND_SELECT,
        blindIndex: newBlindIndex,
        hand: cleansedHand,
        bossBlind: null,
        bossEffect: null,
        activeSectors: SECTORS,
        runStats,
      }
    })
  }, [patch])

  // ══════════════════════════
  // SHOP ACTIONS
  // ══════════════════════════

  const buyCard = useCallback((shopIndex) => {
    patch(prev => {
      const card = prev.shopCards[shopIndex]
      if (!card || prev.money < card.cost) return prev

      let newHand = [...prev.hand]

      // Check if stackable and already in hand
      if (card.stackable) {
        const existing = newHand.find(c => c.id === card.id)
        if (existing) {
          newHand = newHand.map(c =>
            c.id === card.id ? { ...c, stackCount: (c.stackCount || 1) + 1 } : c
          )
        } else {
          newHand.push({ id: card.id, stackCount: 1, scalingState: { roundsSurvived: 0, blindsBeaten: 0 } })
        }
      } else {
        newHand.push({ id: card.id, stackCount: 1, scalingState: { roundsSurvived: 0, blindsBeaten: 0 } })
      }

      const newShop = prev.shopCards.map((c, i) => i === shopIndex ? null : c)

      return {
        ...prev,
        money: prev.money - card.cost,
        hand: newHand,
        shopCards: newShop,
      }
    })
  }, [patch])

  const sellCard = useCallback((handIndex) => {
    patch(prev => {
      const card = prev.hand[handIndex]
      if (!card) return prev
      const cardDef = CARDS[card.id]
      const sellPrice = Math.floor((cardDef?.cost || 4) * SHOP_CONFIG.sellMultiplier)

      const newHand = prev.hand.filter((_, i) => i !== handIndex)
      return {
        ...prev,
        money: prev.money + sellPrice,
        hand: newHand,
      }
    })
  }, [patch])

  const rerollShop = useCallback(() => {
    patch(prev => {
      if (prev.money < prev.rerollCost) return prev
      const newShop = getShopCards(prev.hand)
      return {
        ...prev,
        money: prev.money - prev.rerollCost,
        rerollCost: prev.rerollCost + SHOP_CONFIG.rerollIncrement,
        shopCards: newShop,
      }
    })
  }, [patch])

  const leaveShop = useCallback(() => {
    patch({ phase: PHASE.BLIND_SELECT })
  }, [patch])

  // ══════════════════════════
  // SPECIAL BALLS
  // ══════════════════════════

  const buySpecialBall = useCallback((ballType) => {
    patch(prev => {
      const def = SPECIAL_BALLS[ballType]
      if (!def || prev.money < def.cost) return prev

      let newSpecialBalls = [...prev.specialBalls]
      const existing = newSpecialBalls.find(b => b.id === ballType)

      if (existing) {
        if (!def.stackable) return prev // unique, already owned
        newSpecialBalls = newSpecialBalls.map(b =>
          b.id === ballType ? { ...b, stackCount: (b.stackCount || 1) + 1 } : b
        )
      } else {
        newSpecialBalls.push({ id: ballType, stackCount: 1 })
      }

      return {
        ...prev,
        money: prev.money - def.cost,
        specialBalls: newSpecialBalls,
      }
    })
  }, [patch])

  // ══════════════════════════
  // REROLL (in-round)
  // ══════════════════════════

  // useReroll removed — reroll is now automatic on green landing

  // ── Use Blocker (costs 1 spin, activates shield) ──
  const useBlocker = useCallback(() => {
    patch(prev => {
      if (prev.phase !== PHASE.PLAYING || prev.spinsLeft <= 0) return prev

      // Check if Barrier Master extends duration
      const barrierCard = prev.hand.find(c =>
        !c.disabled && CARDS[c.id]?.effect.type === 'barrier_extend'
      )
      const duration = barrierCard ? CARDS[barrierCard.id].effect.value * 1000 : 5000

      return {
        ...prev,
        spinsLeft: prev.spinsLeft - 1,
        blockerActive: true,
        blockerTimer: Date.now() + duration,
      }
    })
  }, [patch])

  // ── Restart ──
  const restart = useCallback(() => {
    setState(initialState())
  }, [])

  return {
    ...state,
    // Actions
    startGame,
    pickDraftCard,
    startBlind,
    startBossRound,
    spin,
    handleSpinResult,
    continueRound,
    advanceBlind,
    buyCard,
    sellCard,
    rerollShop,
    leaveShop,
    useBlocker,
    buySpecialBall,
    restart,
    // Computed
    blindTarget: getBlindTarget(
      state.ante,
      BLIND_TYPES[state.blindIndex]
    ) * (state.bossEffect === 'triple_target' ? 3 : 1),
    blindType: BLIND_TYPES[state.blindIndex],
    currentAnte: ANTES[state.ante],
  }
}
