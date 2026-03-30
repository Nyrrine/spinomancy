// ═══════════════════════════════════════
// CARD ENGINE — Effect Processing
// ═══════════════════════════════════════
// Activation order: +Chips → +Mult → xMult
// Stacking: multiple copies of stackable cards compound their effects

import { SECTORS, CARDS } from './gameConfig'

/**
 * Calculate the score for a single spin.
 *
 * @param {object} params
 * @param {object} params.sector       — the SECTORS entry the ball landed on
 * @param {object[]} params.hand       — array of card instances in the player's hand
 *   Each card instance: { id, stackCount?, scalingState? }
 *   stackCount defaults to 1 for unique cards
 *   scalingState: { roundsSurvived, blindsBeaten, lifetimeSpins }
 * @param {object} params.context      — round context
 *   { isLastSpin, streakColor, streakLength, bossEffect, bumperHits, specialBalls }
 *   specialBalls: [{ type: 'ember'|'crystal'|'void', stacks: number }]
 * @returns {{ chips, mult, xMult, finalScore, activations }}
 */
export function calculateSpinScore({ sector, hand, context }) {
  const activations = [] // log of which cards fired, for UI animation
  let chips = sector.baseChips
  let mult = 1
  let xMult = 1

  const color = sector.color
  const {
    isLastSpin = false,
    streakColor = null,
    streakLength = 0,
    bossEffect = null,
    lifetimeSpins = 0,
    bumperHits = 0,
    wallBounces = 0,
    bonusHits = 0,
    specialBalls = [],
    mostLandedColor = null,
    chainLightningActive = false,
    previousMult = 1,
  } = context

  // ── Phase 1: +Chips ──
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'add_chips' && eff.trigger === 'per_spin') {
      const bonus = eff.value * stacks
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    if (eff.type === 'add_chips' && eff.trigger === 'on_black' && color === 'black') {
      chips += eff.value
      activations.push({ cardId: card.id, type: '+chips', value: eff.value })
    }

    if (eff.type === 'add_chips' && eff.trigger === 'on_red' && color === 'red') {
      chips += eff.value
      activations.push({ cardId: card.id, type: '+chips', value: eff.value })
    }

    if (eff.type === 'jackpot_chips') {
      const bonus = color === 'gold' ? eff.goldBonus : eff.penalty
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    if (eff.type === 'lifetime_chips') {
      const bonus = eff.value * stacks * lifetimeSpins
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Ricochet King: +N chips per pin hit
    if (eff.type === 'per_hit_chips' && bumperHits > 0) {
      const bonus = eff.value * stacks * bumperHits
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Wall Walker: +N chips per wall bounce
    if (eff.type === 'wall_bounce_chips' && context.wallBounces > 0) {
      const bonus = eff.value * stacks * context.wallBounces
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Gold Rush: double base chips on gold sector
    if (eff.type === 'gold_double' && color === 'gold') {
      const bonus = sector.baseChips // add another copy of base chips
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }
  }

  // ── New Card: +Chips effects ──
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    // Rainbow Pin: +N chips per ALL pin hits (not just bonus)
    if (eff.type === 'all_pin_chips' && bumperHits > 0) {
      const bonus = eff.value * stacks * bumperHits
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Sector Master: +15 chips if this is the most-landed sector
    if (eff.type === 'frequent_sector_chips' && context.mostLandedColor === color) {
      const bonus = eff.value * stacks
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Pin Storm: +N chips per pin hit (legendary)
    if (eff.type === 'pin_storm' && bumperHits > 0) {
      const bonus = eff.chipValue * stacks * bumperHits
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Midas Touch: override base chips to gold value (25) for all sectors
    if (eff.type === 'midas' && sector.baseChips < eff.value) {
      const bonus = eff.value - sector.baseChips
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Eternal Flame: scaling chips per pin hit (grows per blind)
    if (eff.type === 'scaling_pin_chips' && bumperHits > 0) {
      const state = card.scalingState || { blindsBeaten: 0 }
      const scaledValue = (eff.baseValue + eff.growth * state.blindsBeaten) * stacks
      const bonus = Math.floor(scaledValue * bumperHits)
      if (bonus > 0) {
        chips += bonus
        activations.push({ cardId: card.id, type: '+chips', value: bonus })
      }
    }

    // Pin Counter: +1 chip per 50 lifetime pin hits
    if (eff.type === 'lifetime_pin_chips' && context.lifetimePinHits > 0) {
      const bonus = eff.value * stacks * Math.floor(context.lifetimePinHits / eff.per)
      if (bonus > 0) {
        chips += bonus
        activations.push({ cardId: card.id, type: '+chips', value: bonus })
      }
    }
  }

  // ── Cursed Card: +Chips effects ──
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    // Shrinking Wheel: +10 chips to all non-gold sectors (gold is removed by getModifiedSectors)
    if (eff.type === 'cursed_remove_gold' && color !== 'gold') {
      chips += eff.bonusChips
      activations.push({ cardId: card.id, type: '+chips', value: eff.bonusChips })
    }

    // Ghost Zone: +5 chips per invisible pin hit
    if (eff.type === 'cursed_ghost' && context.ghostHits > 0) {
      const bonus = eff.chipBonus * stacks * context.ghostHits
      chips += bonus
      activations.push({ cardId: card.id, type: '+chips', value: bonus })
    }

    // Chaos Engine: randomize already applied to sector by getModifiedSectors, no scoring handler needed
  }

  // ── Special Ball: +Chips effects ──
  for (const sb of specialBalls) {
    // Ember Ball: +3 chips per pin hit per stack
    if (sb.type === 'ember' && bumperHits > 0) {
      const bonus = 3 * (sb.stacks || 1) * bumperHits
      chips += bonus
      activations.push({ cardId: '__ember_ball', type: '+chips', value: bonus })
    }
    // Crystal Ball: bonus pins pay double chips per stack
    if (sb.type === 'crystal' && bonusHits > 0) {
      const bonus = 2 * (sb.stacks || 1) * bonusHits
      chips += bonus
      activations.push({ cardId: '__crystal_ball', type: '+chips', value: bonus })
    }
    // Void Ball: green sector = 0 base chips (already 0), handled in xMult phase
  }

  // Floor chips at 0 — negative chips from Jackpot Hunter shouldn't go below 0
  chips = Math.max(0, chips)

  // ── Phase 2: +Mult ──
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'add_mult' && (eff.trigger === 'always')) {
      const bonus = eff.value * stacks
      mult += bonus
      activations.push({ cardId: card.id, type: '+mult', value: bonus })
    }

    if (eff.type === 'streak_mult' && eff.trigger === 'on_streak') {
      if (streakColor === color && streakLength > 0) {
        const bonus = eff.value * stacks * streakLength
        mult += bonus
        activations.push({ cardId: card.id, type: '+mult', value: bonus })
      }
    }

    // Pin Storm: +0.1 Mult per pin hit (legendary)
    if (eff.type === 'pin_storm' && bumperHits > 0) {
      const bonus = eff.multValue * stacks * bumperHits
      mult += bonus
      activations.push({ cardId: card.id, type: '+mult', value: +bonus.toFixed(1) })
    }

    // Chain Lightning: +2 Mult when accumulated mult > x5
    if (eff.type === 'chain_mult' && context.chainLightningActive) {
      const bonus = eff.value * stacks
      mult += bonus
      activations.push({ cardId: card.id, type: '+mult', value: bonus })
    }

    // Echo Mult: previous spin's mult as +Mult
    if (eff.type === 'echo_mult' && context.previousMult > 1) {
      const bonus = context.previousMult - 1 // subtract base 1
      mult += bonus
      activations.push({ cardId: card.id, type: '+mult', value: +bonus.toFixed(1) })
    }

    // Green Tide: x3 Mult per stack (cursed bonus for adding green sectors)
    if (eff.type === 'cursed_green') {
      const bonus = eff.multBonus * stacks
      mult += bonus
      activations.push({ cardId: card.id, type: '+mult', value: bonus })
    }

    // Blood Tax: +8 Mult permanently (cursed, tax applied in game engine)
    if (eff.type === 'cursed_tax') {
      mult += eff.multBonus
      activations.push({ cardId: card.id, type: '+mult', value: eff.multBonus })
    }

    // Scaling +Mult (Snowball)
    if (eff.type === 'scaling_mult') {
      const state = card.scalingState || { roundsSurvived: 0 }
      const scaledValue = (eff.baseValue + eff.growth * state.roundsSurvived) * stacks
      mult += scaledValue
      activations.push({ cardId: card.id, type: '+mult', value: scaledValue })
    }
  }

  // Boss: The Gambler halves all +Mult
  if (bossEffect === 'half_mult') {
    const addedMult = mult - 1 // base mult is 1
    mult = 1 + Math.floor(addedMult / 2)
  }

  // ── Phase 3: xMult ──
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'x_mult' && eff.trigger === 'final_spin' && isLastSpin) {
      xMult *= eff.value
      activations.push({ cardId: card.id, type: 'xmult', value: eff.value })
    }

    if (eff.type === 'x_mult' && eff.trigger === 'on_gold' && color === 'gold') {
      xMult *= eff.value
      activations.push({ cardId: card.id, type: 'xmult', value: eff.value })
    }

    // Scaling xMult (Compounding Interest)
    if (eff.type === 'scaling_xmult') {
      const state = card.scalingState || { roundsSurvived: 0 }
      const scaledValue = eff.baseValue + eff.growth * state.roundsSurvived
      // Multiple copies multiply independently
      for (let i = 0; i < stacks; i++) {
        xMult *= scaledValue
        activations.push({ cardId: card.id, type: 'xmult', value: scaledValue })
      }
    }

    // Chaos Master: x5 Mult (sectors randomize via getModifiedSectors)
    if (eff.type === 'chaos_xmult') {
      xMult *= eff.value
      activations.push({ cardId: card.id, type: 'xmult', value: eff.value })
    }

    // Glass Cannon: x10 Mult (breaks after N uses, tracked by card state)
    if (eff.type === 'glass_xmult' && (card.usesLeft ?? eff.uses) > 0) {
      xMult *= eff.value
      activations.push({ cardId: card.id, type: 'xmult', value: eff.value })
    }

    // Lucky Bounce: each pin hit has a chance to apply x1.2 micro-multiplier
    if (eff.type === 'lucky_hit_mult' && bumperHits > 0) {
      const chance = eff.chance + (stacks - 1) * 0.10 // +10% per extra copy
      let luckyHits = 0
      // Deterministic based on hit count: expected lucky hits = bumperHits * chance
      // Use floor + probabilistic remainder for consistency
      luckyHits = Math.floor(bumperHits * chance)
      if (luckyHits > 0) {
        const luckyMult = Math.pow(eff.value, luckyHits)
        xMult *= luckyMult
        activations.push({ cardId: card.id, type: 'xmult', value: +luckyMult.toFixed(2) })
      }
    }

    // Scaling xMult per blind beaten (Momentum)
    if (eff.type === 'scaling_xmult_blind') {
      const state = card.scalingState || { blindsBeaten: 0 }
      const scaledValue = eff.baseValue + eff.growth * state.blindsBeaten
      for (let i = 0; i < stacks; i++) {
        xMult *= scaledValue
        activations.push({ cardId: card.id, type: 'xmult', value: scaledValue })
      }
    }
  }

  // ── Special Ball: xMult effects ──
  for (const sb of specialBalls) {
    // Void Ball: x2 multiplier when sector is green
    if (sb.type === 'void' && color === 'green') {
      xMult *= 2
      activations.push({ cardId: '__void_ball', type: 'xmult', value: 2 })
    }
  }

  // Infinity Engine: x2 to ALL xMult (applied last, after all other xMult)
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'double_xmult') continue
    xMult *= def.effect.value
    activations.push({ cardId: card.id, type: 'xmult', value: def.effect.value })
  }

  // King Ball: x2 to ALL scoring
  for (const sb of specialBalls) {
    if (sb.type === 'king') {
      xMult *= 2
      activations.push({ cardId: '__king_ball', type: 'xmult', value: 2 })
    }
  }

  const finalScore = Math.floor(chips * mult * xMult)

  return { chips, mult, xMult, finalScore, activations }
}

/**
 * Calculate extra spins granted by cards at round start.
 */
export function getExtraSpins(hand) {
  let extra = 0
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    if (def.effect.type === 'extra_spin') {
      extra += def.effect.value * (card.stackCount || 1)
    }
  }
  return extra
}

/**
 * Get ball speed multiplier from cards (Slow Motion).
 */
export function getBallSpeedMult(hand) {
  const card = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'slow_ball')
  return card ? CARDS[card.id].effect.value : 1
}

/**
 * Get cannon exit speed multiplier from cards.
 */
export function getCannonSpeedMult(hand) {
  let mult = 1
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    if (def.effect.type === 'cannon_boost') mult += def.effect.value * (card.stackCount || 1)
    if (def.effect.type === 'mega_cannon') mult *= def.effect.value * (card.stackCount || 1)
  }
  return mult
}

/**
 * Check if chain_hit (Pin Destroyer) is active.
 */
export function hasChainHit(hand) {
  return hand.some(c => !c.disabled && CARDS[c.id]?.effect.type === 'chain_hit')
}

/**
 * Get split threshold from cards (how many pin hits before ball splits).
 * Returns null if no split card, or the threshold number.
 */
export function getSplitThreshold(hand) {
  let threshold = null
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    if (def.effect.type === 'split_threshold') {
      const stacks = card.stackCount || 1
      threshold = def.effect.baseThreshold - def.effect.reduction * (stacks - 1)
    }
  }
  return threshold ? Math.max(3, threshold) : null // minimum 3 hits
}

/**
 * Get split count (2 default, 3 with Mega Split).
 */
export function getSplitCount(hand) {
  const mega = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'mega_split')
  return mega ? CARDS[mega.id].effect.value : 2
}

/**
 * Get recursive split threshold (Split Chain).
 */
export function getRecursiveSplitThreshold(hand) {
  const card = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'recursive_split')
  if (!card) return null
  return CARDS[card.id].effect.threshold
}

/**
 * Calculate gold earned from cards after a spin.
 */
export function getSpinGoldBonus(hand, context) {
  let gold = 0
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'gold_per_bonus' && context.bonusHits > 0) {
      gold += eff.value * stacks * context.bonusHits
    }
    if (eff.type === 'gold_on_gold' && context.sectorColor === 'gold') {
      gold += eff.value * stacks
    }
  }
  return gold
}

/**
 * Calculate gold earned from cards at round end.
 */
export function getRoundEndGold(hand, blindsBeaten, bossesBeaten) {
  let gold = 0
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'gold_per_blind') gold += eff.value * stacks * blindsBeaten
    if (eff.type === 'gold_per_boss') gold += eff.value * stacks * bossesBeaten
  }
  return gold
}

/**
 * Get extra interest cap from Penny Pincher cards.
 */
export function getExtraInterestCap(hand) {
  let extra = 0
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'interest_cap') continue
    extra += def.effect.value * (card.stackCount || 1)
  }
  return extra
}

/**
 * Process glass cannon uses — decrement after scoring.
 */
export function decrementGlassCannon(hand) {
  return hand.map(card => {
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'glass_xmult') return card
    const usesLeft = (card.usesLeft ?? def.effect.uses) - 1
    if (usesLeft <= 0) return { ...card, disabled: true, usesLeft: 0 }
    return { ...card, usesLeft }
  })
}

/**
 * Compute live card chip breakdown for sidebar display.
 * Returns array of { label, chips } for each contributing card.
 */
export function getLiveChipBreakdown(hand, stats) {
  const breakdown = []
  const { bumperHits = 0, bonusHits = 0, wallBounces = 0, ghostHits = 0, baseChips = 0 } = stats

  if (baseChips > 0) {
    breakdown.push({ label: 'Base', chips: baseChips })
  }
  if (bumperHits > 0) {
    breakdown.push({ label: 'Pin Bonus', chips: bumperHits * 2 })
  }

  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def) continue
    const eff = def.effect
    const stacks = card.stackCount || 1

    if (eff.type === 'add_chips' && eff.trigger === 'per_spin') {
      breakdown.push({ label: def.name, chips: eff.value * stacks })
    }
    if (eff.type === 'per_hit_chips' && bumperHits > 0) {
      breakdown.push({ label: def.name, chips: eff.value * stacks * bumperHits })
    }
    if (eff.type === 'wall_bounce_chips' && wallBounces > 0) {
      breakdown.push({ label: def.name, chips: eff.value * stacks * wallBounces })
    }
    if (eff.type === 'all_pin_chips' && bumperHits > 0) {
      breakdown.push({ label: def.name, chips: eff.value * stacks * bumperHits })
    }
    if (eff.type === 'cursed_ghost' && ghostHits > 0) {
      breakdown.push({ label: def.name, chips: eff.chipBonus * stacks * ghostHits })
    }
  }

  return breakdown.filter(b => b.chips > 0)
}

/**
 * Get ghost pin invisibility rate from Ghost Zone cards.
 * Returns 0 if no ghost zone card, or the compound rate.
 */
export function getGhostPinRate(hand) {
  let rate = 0
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'cursed_ghost') continue
    const stacks = card.stackCount || 1
    // Each stack adds 25% invisible pins (caps at 75%)
    rate = Math.min(0.75, rate + def.effect.invisRate * stacks)
  }
  return rate
}

/**
 * Check if attract_bonus (Pin Magnet) is active.
 * Returns true if the ball should be nudged toward the nearest unhit bonus pin.
 */
export function hasAttractBonus(hand) {
  return hand.some(c => !c.disabled && CARDS[c.id]?.effect.type === 'attract_bonus')
}

/**
 * Check if any card has the respin-on-green effect.
 */
export function hasRespinGreen(hand) {
  return hand.some(c => !c.disabled && CARDS[c.id]?.effect.type === 'respin_green')
}

/**
 * Check if any card has the split ball effect, return ball count.
 */
export function getSplitBallCount(hand) {
  const card = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'split_ball')
  if (!card) return 1
  return CARDS[card.id].effect.value
}

/**
 * Check if any card has reroll available.
 */
export function hasReroll(hand) {
  return hand.some(c => !c.disabled && CARDS[c.id]?.effect.type === 'reroll' && (c.rerollsLeft ?? 1) > 0)
}

/**
 * Check if any card has insurance.
 */
export function getInsurance(hand) {
  const card = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'insurance')
  if (!card) return null
  return CARDS[card.id].effect.value
}

/**
 * Get modified sector list based on probability cards and boss effects.
 */
export function getModifiedSectors(hand, bossEffect) {
  let sectors = [...SECTORS]

  // ── Boss effects ──
  if (bossEffect === 'gold_removed') {
    sectors = sectors.filter(s => s.color !== 'gold')
  }
  if (bossEffect === 'extra_green') {
    const greenSector = sectors.find(s => s.color === 'green')
    if (greenSector) {
      sectors.push({ ...greenSector, id: 100 })
      sectors.push({ ...greenSector, id: 101 })
    }
  }

  // ── Probability card effects ──

  // Weighted Ball: reduce green probability
  const greenFactor = getGreenReduction(hand)
  if (greenFactor < 1) {
    if (greenFactor <= 0.25) {
      // 3+ copies: remove green entirely
      sectors = sectors.filter(s => s.color !== 'green')
    } else {
      // 1-2 copies: remove green, add a replacement red to compensate
      const hasGreen = sectors.some(s => s.color === 'green')
      if (hasGreen) {
        sectors = sectors.filter(s => s.color !== 'green')
        const redTemplate = sectors.find(s => s.color === 'red')
        if (redTemplate) {
          sectors.push({ ...redTemplate, id: 102 })
        }
      }
    }
  }

  // ── Cursed card effects ──

  // Green Tide: add N extra green sectors (N = 2 per stack)
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'cursed_green') continue
    const stacks = card.stackCount || 1
    const greenSector = sectors.find(s => s.color === 'green')
    if (greenSector) {
      const count = def.effect.value * stacks
      for (let i = 0; i < count; i++) {
        sectors.push({ ...greenSector, id: 200 + i })
      }
    }
  }

  // Shrinking Wheel: remove gold, +bonusChips to all remaining
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'cursed_remove_gold') continue
    sectors = sectors.filter(s => s.color !== 'gold')
    sectors = sectors.map(s => ({ ...s, baseChips: s.baseChips + def.effect.bonusChips }))
  }

  // Chaos Wheel: randomize all sector baseChips (0 to maxChips)
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'cursed_randomize') continue
    sectors = sectors.map(s => ({
      ...s,
      baseChips: Math.floor(Math.random() * (def.effect.maxChips + 1)),
    }))
  }

  // Biased Wheel: add 2 extra sectors of a random color
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'biased_wheel') continue
    const colors = [...new Set(sectors.map(s => s.color))]
    const biasColor = colors[Math.floor(Math.random() * colors.length)]
    const template = sectors.find(s => s.color === biasColor)
    if (template) {
      sectors.push({ ...template, id: 103 })
      sectors.push({ ...template, id: 104 })
    }
  }

  return sectors
}

/**
 * Apply magnet effect — bias probability toward a chosen color.
 * Returns a weighted sector index for the physics simulation hint.
 * (The actual physics determines the result, but magnet can nudge.)
 */
export function getMagnetColor(hand) {
  const card = hand.find(c => !c.disabled && CARDS[c.id]?.effect.type === 'magnet')
  if (!card) return null
  return card.magnetColor || null // set by UI when player picks a color
}

/**
 * Calculate green probability reduction from Weighted Ball cards.
 * Each copy multiplies by 0.5 (compound).
 */
export function getGreenReduction(hand) {
  let factor = 1
  for (const card of hand) {
    if (card.disabled) continue
    const def = CARDS[card.id]
    if (!def || def.effect.type !== 'reduce_green') continue
    const stacks = card.stackCount || 1
    for (let i = 0; i < stacks; i++) {
      factor *= def.effect.value
    }
  }
  return factor // 1.0 = no reduction, 0.5 = one copy, 0.25 = two copies, etc.
}

/**
 * Advance scaling state for all cards after a round.
 */
export function advanceScaling(hand, event) {
  return hand.map(card => {
    const def = CARDS[card.id]
    if (!def) return card
    const eff = def.effect

    if (eff.type === 'scaling_mult' || eff.type === 'scaling_xmult') {
      const state = card.scalingState || { roundsSurvived: 0, blindsBeaten: 0, lifetimeSpins: 0 }
      if (event === 'round') {
        return { ...card, scalingState: { ...state, roundsSurvived: state.roundsSurvived + 1 } }
      }
      if (event === 'blind') {
        return { ...card, scalingState: { ...state, blindsBeaten: (state.blindsBeaten || 0) + 1 } }
      }
    }

    if (eff.type === 'scaling_xmult_blind') {
      const state = card.scalingState || { roundsSurvived: 0, blindsBeaten: 0 }
      if (event === 'blind') {
        return { ...card, scalingState: { ...state, blindsBeaten: state.blindsBeaten + 1 } }
      }
    }

    return card
  })
}

/**
 * Reset per-round card state (reroll tokens, etc.).
 */
export function resetRoundCardState(hand) {
  return hand.map(card => {
    const def = CARDS[card.id]
    if (!def) return card
    if (def.effect.type === 'reroll') {
      // Each stack gives 1 use per round
      return { ...card, rerollsLeft: def.effect.uses * (card.stackCount || 1) }
    }
    return card
  })
}
