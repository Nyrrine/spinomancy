// ═══════════════════════════════════════
// SPECIAL BALLS — Permanent upgrades
// ═══════════════════════════════════════
// Consumable ball modifiers purchased in the shop.
// Stack for compounding effects (like Balatro Planet cards).

export const BALL_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  LEGENDARY: 'legendary',
}

export const SPECIAL_BALLS = {
  ember_ball: {
    id: 'ember_ball',
    name: 'Ember Ball',
    description: '+3 chips per pin hit',
    rarity: BALL_RARITY.COMMON,
    stackable: true,
    cost: 4,
    effect: { type: 'bonus_chips_per_hit', value: 3 },
    visual: 'ember', // orange trail
    ascii: '(~)',
  },
  heavy_ball: {
    id: 'heavy_ball',
    name: 'Heavy Ball',
    description: 'Ball 20% heavier (more momentum)',
    rarity: BALL_RARITY.COMMON,
    stackable: true,
    cost: 3,
    effect: { type: 'heavy', value: 0.2 },
    visual: 'heavy', // larger ball
    ascii: '(O)',
  },
  ghost_ball: {
    id: 'ghost_ball',
    name: 'Ghost Ball',
    description: 'Phase through first 3 pins (still hits)',
    rarity: BALL_RARITY.UNCOMMON,
    stackable: true,
    cost: 5,
    effect: { type: 'ghost', basePins: 3, extraPerStack: 2 },
    visual: 'ghost', // translucent ball
    ascii: '(?)',
  },
  magnet_ball: {
    id: 'magnet_ball',
    name: 'Magnet Ball',
    description: 'Ball attracted toward gold sectors',
    rarity: BALL_RARITY.UNCOMMON,
    stackable: false,
    cost: 5,
    effect: { type: 'magnet_gold', strength: 0.03 },
    visual: 'magnet',
    ascii: '<U>',
  },
  split_ball_perm: {
    id: 'split_ball_perm',
    name: 'Split Ball',
    description: 'Permanently +1 ball per spin',
    rarity: BALL_RARITY.RARE,
    stackable: true,
    cost: 7,
    effect: { type: 'extra_balls', value: 1 },
    visual: 'split',
    ascii: 'oo!',
  },
  crystal_ball: {
    id: 'crystal_ball',
    name: 'Crystal Ball',
    description: 'Bonus pin rewards doubled',
    rarity: BALL_RARITY.RARE,
    stackable: true,
    cost: 6,
    effect: { type: 'bonus_multiplier', value: 2 },
    visual: 'crystal', // sparkle
    ascii: '<*>',
  },
  void_ball: {
    id: 'void_ball',
    name: 'Void Ball',
    description: 'Green sector becomes x2 mult (not 0 chips)',
    rarity: BALL_RARITY.LEGENDARY,
    stackable: false,
    cost: 8,
    effect: { type: 'void_green' },
    visual: 'void',
    ascii: '{0}',
  },
  thunder_ball: {
    id: 'thunder_ball',
    name: 'Thunder Ball',
    description: 'Hits 3 random pins on landing (bonus hits)',
    rarity: BALL_RARITY.COMMON,
    stackable: true,
    cost: 3,
    effect: { type: 'bonus_landing_hits', value: 3 },
    visual: 'thunder',
    ascii: '{Z}',
  },
  diamond_ball: {
    id: 'diamond_ball',
    name: 'Diamond Ball',
    description: 'All bonus pins pay x3 instead of x2',
    rarity: BALL_RARITY.RARE,
    stackable: true,
    cost: 6,
    effect: { type: 'diamond_bonus', value: 3 },
    visual: 'diamond',
    ascii: '<>',
  },
  chaos_ball: {
    id: 'chaos_ball',
    name: 'Chaos Ball',
    description: 'Random speed changes mid-bounce',
    rarity: BALL_RARITY.UNCOMMON,
    stackable: true,
    cost: 4,
    effect: { type: 'chaos_speed', value: 0.3 },
    visual: 'chaos',
    ascii: '{C}',
  },
  king_ball: {
    id: 'king_ball',
    name: 'King Ball',
    description: 'x2 to ALL scoring for this spin',
    rarity: BALL_RARITY.LEGENDARY,
    stackable: false,
    cost: 9,
    effect: { type: 'king_multiplier', value: 2 },
    visual: 'king',
    ascii: '{K}',
  },
}

// Rarity weights for special ball shop generation
const BALL_RARITY_WEIGHTS = {
  [BALL_RARITY.COMMON]: 50,
  [BALL_RARITY.UNCOMMON]: 30,
  [BALL_RARITY.RARE]: 15,
  [BALL_RARITY.LEGENDARY]: 5,
}

/**
 * Get a random special ball for the shop.
 * ~60% chance to appear. Returns null if no ball this visit.
 */
export function getRandomSpecialBall(excludeIds = []) {
  // Always show 1 ball per shop visit
  const available = Object.values(SPECIAL_BALLS).filter(b => !excludeIds.includes(b.id))
  if (available.length === 0) return null

  const totalWeight = available.reduce((sum, b) => sum + (BALL_RARITY_WEIGHTS[b.rarity] || 10), 0)
  let rand = Math.random() * totalWeight
  for (const ball of available) {
    rand -= BALL_RARITY_WEIGHTS[ball.rarity] || 10
    if (rand < 0) return { ...ball }
  }
  return { ...available[available.length - 1] }
}

/**
 * Get the total effect values from a specialBalls array.
 * @param {Array<{id, stackCount}>} specialBalls
 * @returns computed effects
 */
export function getSpecialBallEffects(specialBalls) {
  const effects = {
    extraChipsPerHit: 0,
    heavyMult: 1,
    ghostPins: 0,
    hasMagnet: false,
    magnetStrength: 0,
    extraBalls: 0,
    bonusMultiplier: 1,
    hasVoidGreen: false,
    bonusLandingHits: 0,
    diamondBonusMult: 1,
    chaosSpeed: 0,
    kingMultiplier: 1,
  }

  for (const sb of specialBalls) {
    const def = SPECIAL_BALLS[sb.id]
    if (!def) continue
    const stacks = sb.stackCount || 1

    switch (def.effect.type) {
      case 'bonus_chips_per_hit':
        effects.extraChipsPerHit += def.effect.value * stacks
        break
      case 'heavy':
        effects.heavyMult *= Math.pow(1 + def.effect.value, stacks)
        break
      case 'ghost':
        effects.ghostPins += def.effect.basePins + def.effect.extraPerStack * (stacks - 1)
        break
      case 'magnet_gold':
        effects.hasMagnet = true
        effects.magnetStrength = def.effect.strength
        break
      case 'extra_balls':
        effects.extraBalls += def.effect.value * stacks
        break
      case 'bonus_multiplier':
        effects.bonusMultiplier *= Math.pow(def.effect.value, stacks)
        break
      case 'void_green':
        effects.hasVoidGreen = true
        break
      case 'bonus_landing_hits':
        effects.bonusLandingHits += def.effect.value * stacks
        break
      case 'diamond_bonus':
        effects.diamondBonusMult = Math.max(effects.diamondBonusMult, def.effect.value)
        break
      case 'chaos_speed':
        effects.chaosSpeed += def.effect.value * stacks
        break
      case 'king_multiplier':
        effects.kingMultiplier *= def.effect.value
        break
    }
  }

  return effects
}

/**
 * Get active visual effects for rendering.
 */
export function getActiveVisuals(specialBalls) {
  const visuals = new Set()
  for (const sb of specialBalls) {
    const def = SPECIAL_BALLS[sb.id]
    if (def) visuals.add(def.visual)
  }
  return visuals
}
