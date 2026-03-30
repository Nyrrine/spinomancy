// ═══════════════════════════════════════
// PROBABILITY ROULETTE v2 — GAME CONFIG
// ═══════════════════════════════════════

// ── Wheel Sectors ──
export const SECTORS = [
  { id: 0, color: 'red', label: 'R', baseChips: 10 },
  { id: 1, color: 'black', label: 'B', baseChips: 10 },
  { id: 2, color: 'red', label: 'R', baseChips: 10 },
  { id: 3, color: 'black', label: 'B', baseChips: 10 },
  { id: 4, color: 'red', label: 'R', baseChips: 10 },
  { id: 5, color: 'green', label: '0', baseChips: 0 },
  { id: 6, color: 'black', label: 'B', baseChips: 10 },
  { id: 7, color: 'red', label: 'R', baseChips: 10 },
  { id: 8, color: 'black', label: 'B', baseChips: 10 },
  { id: 9, color: 'gold', label: '$', baseChips: 25 },
  { id: 10, color: 'red', label: 'R', baseChips: 10 },
  { id: 11, color: 'black', label: 'B', baseChips: 10 },
]

export const SECTOR_COLORS = {
  red: '#dc2626',
  black: '#e5e5e5', // white-ish on dark bg
  green: '#16a34a',
  gold: '#fbbf24',
}

// ── Ante / Blind Targets ──
export const ANTES = [
  { ante: 1, small: 150, big: 250, boss: 400 },
  { ante: 2, small: 350, big: 500, boss: 700 },
  { ante: 3, small: 800, big: 1200, boss: 1800 },
  { ante: 4, small: 2000, big: 3500, boss: 5500 },
  { ante: 5, small: 5000, big: 8000, boss: 12000 },
  { ante: 6, small: 12000, big: 20000, boss: 30000 },
  { ante: 7, small: 30000, big: 50000, boss: 80000 },
  { ante: 8, small: 60000, big: 100000, boss: 200000 },
]

export const BLIND_TYPES = ['small', 'big', 'boss']

// ── Boss Blinds ──
export const BOSS_BLINDS = [
  { name: 'The House', effect: 'gold_removed', description: 'Gold sector is removed from the wheel' },
  { name: 'The Jinx', effect: 'disable_card', description: 'One random card is disabled' },
  { name: 'The Fog', effect: 'hidden_sectors', description: 'Sector values are hidden until the ball lands' },
  { name: 'The Tax Man', effect: 'lose_money', description: 'Lose $3 before the round starts' },
  { name: 'The Mirror', effect: 'reverse_spin', description: 'Wheel spins in reverse' },
  { name: 'The Void', effect: 'extra_green', description: 'Green expands to 3 sectors' },
  { name: 'The Gambler', effect: 'half_mult', description: 'All +Mult effects are halved' },
  { name: 'The Final Bet', effect: 'triple_target', description: 'Target score is tripled' },
]

// ── Card Definitions ──
export const CARD_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  LEGENDARY: 'legendary',
  CURSED: 'cursed',
}

export const CARD_CATEGORY = {
  CHIPS: 'chips',
  MULT: 'mult',
  XMULT: 'xmult',
  PROBABILITY: 'probability',
  UTILITY: 'utility',
  SCALING: 'scaling',
}

// stackable = can buy multiple copies
// unique = max 1 copy
export const CARDS = {
  // ── Stackable Cards ──
  loaded_die: {
    id: 'loaded_die',
    name: 'Loaded Die',
    description: '+10 chips per spin',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 3,
    effect: { type: 'add_chips', value: 10, trigger: 'per_spin' },
    ascii: '[/]',
  },
  lucky_charm: {
    id: 'lucky_charm',
    name: 'Lucky Charm',
    description: '+4 Mult',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.MULT,
    stackable: true,
    cost: 4,
    effect: { type: 'add_mult', value: 4, trigger: 'always' },
    ascii: '(^)',
  },
  hot_streak: {
    id: 'hot_streak',
    name: 'Hot Streak',
    description: '+2 Mult per consecutive same-color',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.MULT,
    stackable: true,
    cost: 5,
    effect: { type: 'streak_mult', value: 2, trigger: 'on_streak' },
    ascii: '~*~',
  },
  extra_ball: {
    id: 'extra_ball',
    name: 'Extra Ball',
    description: '+1 spin per round',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 5,
    effect: { type: 'extra_spin', value: 1, trigger: 'round_start' },
    ascii: '(o)',
  },
  weighted_ball: {
    id: 'weighted_ball',
    name: 'Weighted Ball',
    description: 'Green sector 50% less likely',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: true,
    cost: 6,
    effect: { type: 'reduce_green', value: 0.5, trigger: 'per_spin' },
    ascii: '{W}',
  },

  // ── Unique Cards ──
  double_down: {
    id: 'double_down',
    name: 'Double Down',
    description: 'x2 Mult on your final spin',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.XMULT,
    stackable: false,
    cost: 5,
    effect: { type: 'x_mult', value: 2, trigger: 'final_spin' },
    ascii: 'x2!',
  },
  golden_touch: {
    id: 'golden_touch',
    name: 'Golden Touch',
    description: 'x4 Mult when ball lands on Gold',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.XMULT,
    stackable: false,
    cost: 7,
    effect: { type: 'x_mult', value: 4, trigger: 'on_gold' },
    ascii: '$x4',
  },
  black_market: {
    id: 'black_market',
    name: 'Black Market',
    description: '+30 chips on Black',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: false,
    cost: 3,
    effect: { type: 'add_chips', value: 30, trigger: 'on_black' },
    ascii: '[B]',
  },
  red_carpet: {
    id: 'red_carpet',
    name: 'Red Carpet',
    description: '+30 chips on Red',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: false,
    cost: 3,
    effect: { type: 'add_chips', value: 30, trigger: 'on_red' },
    ascii: '[R]',
  },
  jackpot_hunter: {
    id: 'jackpot_hunter',
    name: 'Jackpot Hunter',
    description: '+75 chips on Gold, -3 on others',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: false,
    cost: 4,
    effect: { type: 'jackpot_chips', goldBonus: 75, penalty: -3, trigger: 'per_spin' },
    ascii: '[$]',
  },
  magnet: {
    id: 'magnet',
    name: 'Magnet',
    description: 'Choose a color, +20% chance to land there',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: false,
    cost: 6,
    effect: { type: 'magnet', value: 0.2, trigger: 'per_spin' },
    ascii: '<M>',
  },
  second_chance: {
    id: 'second_chance',
    name: 'Second Chance',
    description: 'Auto-respin if ball lands on Green',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 5,
    effect: { type: 'respin_green', trigger: 'on_green' },
    ascii: '<!>',
  },
  split_shot: {
    id: 'split_shot',
    name: 'Split Shot',
    description: 'Spawn 2 balls — both score',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 7,
    effect: { type: 'split_ball', value: 2, trigger: 'per_spin' },
    ascii: 'oo!',
  },
  reroll_token: {
    id: 'reroll_token',
    name: 'Reroll Token',
    description: 'Auto-respin on green (1 per stack per round)',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 3,
    effect: { type: 'reroll', uses: 1, trigger: 'on_green' },
    ascii: '[?]',
  },
  insurance: {
    id: 'insurance',
    name: 'Insurance',
    description: 'On blind fail, keep 50% score and retry',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 7,
    effect: { type: 'insurance', value: 0.5, trigger: 'on_fail' },
    ascii: '{!}',
  },

  // ── Infinite Scaling Cards ──
  snowball: {
    id: 'snowball',
    name: 'Snowball',
    description: '+1 Mult, grows +1 per round',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 5,
    effect: { type: 'scaling_mult', baseValue: 1, growth: 1, trigger: 'always' },
    ascii: '*.*',
  },
  compounding_interest: {
    id: 'compounding_interest',
    name: 'Compounding',
    description: 'x1.5 Mult, grows x0.1 per round',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 7,
    effect: { type: 'scaling_xmult', baseValue: 1.5, growth: 0.1, trigger: 'always' },
    ascii: 'x^n',
  },
  card_counter: {
    id: 'card_counter',
    name: 'Card Counter',
    description: '+2 chips per lifetime spin',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 4,
    effect: { type: 'lifetime_chips', value: 2, trigger: 'per_spin' },
    ascii: '#++',
  },
  momentum: {
    id: 'momentum',
    name: 'Momentum',
    description: 'x1.0 Mult, grows x0.2 per blind beaten',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 8,
    effect: { type: 'scaling_xmult_blind', baseValue: 1.0, growth: 0.2, trigger: 'always' },
    ascii: '>>>',
  },

  // ── Arena Feature Cards ──
  cannon_boost: {
    id: 'cannon_boost',
    name: 'Cannon Power',
    description: 'Ball exits cannons with double speed',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 3,
    effect: { type: 'cannon_boost', value: 1.0, trigger: 'per_spin' },
    ascii: '(o)',
  },
  barrier_master: {
    id: 'barrier_master',
    name: 'Barrier Master',
    description: 'BLOCK power-up lasts 8s instead of 5s',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 5,
    effect: { type: 'barrier_extend', value: 8, trigger: 'passive' },
    ascii: '[=]',
  },
  pin_magnet: {
    id: 'pin_magnet',
    name: 'Pin Magnet',
    description: 'Ball attracted toward nearest unhit bonus pin',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: false,
    cost: 6,
    effect: { type: 'attract_bonus', trigger: 'per_spin' },
    ascii: '<*>',
  },
  ricochet_king: {
    id: 'ricochet_king',
    name: 'Ricochet King',
    description: '+3 chips for every pin hit',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 4,
    effect: { type: 'per_hit_chips', value: 3, trigger: 'per_spin' },
    ascii: '*.*',
  },
  lucky_bounce: {
    id: 'lucky_bounce',
    name: 'Lucky Bounce',
    description: '15% chance each pin hit gives x1.2',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.MULT,
    stackable: true,
    cost: 5,
    effect: { type: 'lucky_hit_mult', chance: 0.15, value: 1.2, trigger: 'per_spin' },
    ascii: '~*~',
  },
  wall_walker: {
    id: 'wall_walker',
    name: 'Wall Walker',
    description: '+6 chips every time ball bounces off a wall',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 3,
    effect: { type: 'wall_bounce_chips', value: 6, trigger: 'per_spin' },
    ascii: '|.|',
  },
  gold_rush: {
    id: 'gold_rush',
    name: 'Gold Rush',
    description: 'Gold sector pays x2 base chips (50 instead of 25)',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: false,
    cost: 5,
    effect: { type: 'gold_double', trigger: 'on_gold' },
    ascii: '$$$',
  },
  slow_motion: {
    id: 'slow_motion',
    name: 'Slow Motion',
    description: 'Ball moves 30% slower — more pin hits',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 7,
    effect: { type: 'slow_ball', value: 0.7, trigger: 'passive' },
    ascii: '~.~',
  },
  pin_destroyer: {
    id: 'pin_destroyer',
    name: 'Pin Destroyer',
    description: 'Hit pins explode and damage adjacent pins',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 8,
    effect: { type: 'chain_hit', trigger: 'passive' },
    ascii: '*X*',
  },
  mega_cannon: {
    id: 'mega_cannon',
    name: 'Mega Cannon',
    description: 'Cannon exit speed x3',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 4,
    effect: { type: 'mega_cannon', value: 3, trigger: 'per_spin' },
    ascii: '(O)',
  },

  // ── Cursed Cards (modify the wheel) ──
  green_tide: {
    id: 'green_tide',
    name: 'Green Tide',
    description: 'Adds 2 green sectors per stack, BUT x3 Mult (cursed)',
    rarity: CARD_RARITY.CURSED,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: true,
    cost: 2,
    effect: { type: 'cursed_green', value: 2, multBonus: 3, trigger: 'always' },
    ascii: '[G]',
  },
  shrinking_wheel: {
    id: 'shrinking_wheel',
    name: 'Shrinking Wheel',
    description: 'Removes gold sector, +10 chips to all others (cursed)',
    rarity: CARD_RARITY.CURSED,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: false,
    cost: 3,
    effect: { type: 'cursed_remove_gold', bonusChips: 10, trigger: 'always' },
    ascii: '[-]',
  },
  chaos_wheel: {
    id: 'chaos_wheel',
    name: 'Chaos Wheel',
    description: 'Randomize all sector chip values 0-50 (cursed)',
    rarity: CARD_RARITY.CURSED,
    category: CARD_CATEGORY.PROBABILITY,
    stackable: false,
    cost: 3,
    effect: { type: 'cursed_randomize', maxChips: 50, trigger: 'always' },
    ascii: '{?}',
  },
  blood_tax: {
    id: 'blood_tax',
    name: 'Blood Tax',
    description: 'Lose $2 per round, BUT +8 Mult permanently (cursed)',
    rarity: CARD_RARITY.CURSED,
    category: CARD_CATEGORY.MULT,
    stackable: false,
    cost: 1,
    effect: { type: 'cursed_tax', multBonus: 8, taxAmount: 2, trigger: 'always' },
    ascii: '{$}',
  },
  ghost_zone: {
    id: 'ghost_zone',
    name: 'Ghost Zone',
    description: '25% of pins invisible, BUT +5 chips per invisible hit (cursed)',
    rarity: CARD_RARITY.CURSED,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 3,
    effect: { type: 'cursed_ghost', invisRate: 0.25, chipBonus: 5, trigger: 'per_spin' },
    ascii: '(~)',
  },

  // ── Gold Cards (earn money) ──
  gold_digger: {
    id: 'gold_digger',
    name: 'Gold Digger',
    description: '+$1 per bonus pin hit',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 3,
    effect: { type: 'gold_per_bonus', value: 1, trigger: 'per_spin' },
    ascii: '($)',
  },
  tax_collector: {
    id: 'tax_collector',
    name: 'Tax Collector',
    description: '+$1 per blind beaten this run',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 4,
    effect: { type: 'gold_per_blind', value: 1, trigger: 'round_end' },
    ascii: '[%]',
  },
  jackpot_slot: {
    id: 'jackpot_slot',
    name: 'Jackpot Slot',
    description: 'Land on gold = +$5',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 5,
    effect: { type: 'gold_on_gold', value: 5, trigger: 'on_gold' },
    ascii: '[J]',
  },
  penny_pincher: {
    id: 'penny_pincher',
    name: 'Penny Pincher',
    description: '+$1 interest cap',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 2,
    effect: { type: 'interest_cap', value: 1, trigger: 'passive' },
    ascii: '[c]',
  },
  bounty_hunter: {
    id: 'bounty_hunter',
    name: 'Bounty Hunter',
    description: '+$2 per boss beaten',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 4,
    effect: { type: 'gold_per_boss', value: 2, trigger: 'round_end' },
    ascii: '[!]',
  },

  // ── Split Cards ──
  chain_split: {
    id: 'chain_split',
    name: 'Chain Split',
    description: 'Ball splits after 10 pin hits (-3 per stack)',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 5,
    effect: { type: 'split_threshold', baseThreshold: 10, reduction: 3, trigger: 'per_spin' },
    ascii: '<Y>',
  },
  mega_split: {
    id: 'mega_split',
    name: 'Mega Split',
    description: 'Ball splits into 3 instead of 2',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: false,
    cost: 7,
    effect: { type: 'mega_split', value: 3, trigger: 'per_spin' },
    ascii: '<W>',
  },
  split_chain: {
    id: 'split_chain',
    name: 'Split Chain',
    description: 'Split balls can split again after 8 more hits',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 6,
    effect: { type: 'recursive_split', threshold: 8, trigger: 'per_spin' },
    ascii: 'YYY',
  },

  // ── More Mult/Chip/Utility ──
  chain_lightning: {
    id: 'chain_lightning',
    name: 'Chain Lightning',
    description: 'When mult > x5, +2 Mult per spin rest of round',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.MULT,
    stackable: true,
    cost: 6,
    effect: { type: 'chain_mult', threshold: 5, value: 2, trigger: 'conditional' },
    ascii: '~!~',
  },
  glass_cannon: {
    id: 'glass_cannon',
    name: 'Glass Cannon',
    description: 'x10 Mult — breaks after 3 uses',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.XMULT,
    stackable: false,
    cost: 6,
    effect: { type: 'glass_xmult', value: 10, uses: 3, trigger: 'per_spin' },
    ascii: '!X!',
  },
  echo_mult: {
    id: 'echo_mult',
    name: 'Echo Mult',
    description: 'Previous spin\'s mult as +Mult next spin',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.MULT,
    stackable: false,
    cost: 5,
    effect: { type: 'echo_mult', trigger: 'per_spin' },
    ascii: '(E)',
  },
  rainbow_pin: {
    id: 'rainbow_pin',
    name: 'Rainbow Pin',
    description: 'ALL pin types +6 chips',
    rarity: CARD_RARITY.COMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 3,
    effect: { type: 'all_pin_chips', value: 6, trigger: 'per_spin' },
    ascii: '[*]',
  },
  sector_master: {
    id: 'sector_master',
    name: 'Sector Master',
    description: '+15 chips on your most-landed sector',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.CHIPS,
    stackable: true,
    cost: 4,
    effect: { type: 'frequent_sector_chips', value: 15, trigger: 'conditional' },
    ascii: '[#]',
  },

  // ── LEGENDARY CARDS (game-breaking) ──
  midas_touch: {
    id: 'midas_touch',
    name: 'Midas Touch',
    description: 'ALL sectors pay gold base chips (25)',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.CHIPS,
    stackable: false,
    cost: 10,
    effect: { type: 'midas', value: 25, trigger: 'always' },
    ascii: '$!$',
  },
  infinity_engine: {
    id: 'infinity_engine',
    name: 'Infinity Engine',
    description: 'x2 to ALL xMult effects permanently',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.XMULT,
    stackable: false,
    cost: 12,
    effect: { type: 'double_xmult', value: 2, trigger: 'always' },
    ascii: '{8}',
  },
  pin_storm: {
    id: 'pin_storm',
    name: 'Pin Storm',
    description: 'Every pin hit: +1 chip AND +0.1 Mult',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 8,
    effect: { type: 'pin_storm', chipValue: 1, multValue: 0.1, trigger: 'per_spin' },
    ascii: '***',
  },
  gold_multiplier: {
    id: 'gold_multiplier',
    name: 'Gold Multiplier',
    description: 'Earn $1 per 100 score',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 6,
    effect: { type: 'gold_per_score', value: 100, trigger: 'per_spin' },
    ascii: '[$]',
  },
  time_lord: {
    id: 'time_lord',
    name: 'Time Lord',
    description: '+5 spins per blind permanently',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.UTILITY,
    stackable: true,
    cost: 8,
    effect: { type: 'extra_spin', value: 5, trigger: 'round_start' },
    ascii: '{T}',
  },
  chaos_master: {
    id: 'chaos_master',
    name: 'Chaos Master',
    description: 'x5 Mult but sectors randomize each spin',
    rarity: CARD_RARITY.LEGENDARY,
    category: CARD_CATEGORY.XMULT,
    stackable: false,
    cost: 7,
    effect: { type: 'chaos_xmult', value: 5, trigger: 'always' },
    ascii: '?X?',
  },

  // ── PERMANENT SCALING CARDS ──
  eternal_flame: {
    id: 'eternal_flame',
    name: 'Eternal Flame',
    description: '+0.5 chips per pin hit, grows +0.5 per blind',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 5,
    effect: { type: 'scaling_pin_chips', baseValue: 0.5, growth: 0.5, trigger: 'per_spin' },
    ascii: '{F}',
  },
  gravity_well: {
    id: 'gravity_well',
    name: 'Gravity Well',
    description: 'x1.1 Mult, grows x0.05 per blind',
    rarity: CARD_RARITY.RARE,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 6,
    effect: { type: 'scaling_xmult', baseValue: 1.1, growth: 0.05, trigger: 'always' },
    ascii: '{G}',
  },
  pin_counter: {
    id: 'pin_counter',
    name: 'Pin Counter',
    description: '+1 chip per 50 lifetime pin hits',
    rarity: CARD_RARITY.UNCOMMON,
    category: CARD_CATEGORY.SCALING,
    stackable: true,
    cost: 4,
    effect: { type: 'lifetime_pin_chips', value: 1, per: 50, trigger: 'per_spin' },
    ascii: '#p#',
  },
}

// ── Shop Configuration ──
export const SHOP_CONFIG = {
  cardsPerVisit: 3,
  baseRerollCost: 2,
  rerollIncrement: 1,
  sellMultiplier: 0.5,
  baseIncome: 3,
  unusedSpinBonus: 1,
  interestPer5: 1,
  maxInterest: 5,
}

// ── Rarity Weights for Shop ──
export const RARITY_WEIGHTS = {
  [CARD_RARITY.COMMON]: 60,
  [CARD_RARITY.UNCOMMON]: 25,
  [CARD_RARITY.RARE]: 12,
  [CARD_RARITY.LEGENDARY]: 3,
  [CARD_RARITY.CURSED]: 8,
}

// ── Game Constants ──
export const BASE_SPINS_PER_ROUND = 5
export const STARTING_MONEY = 8

// ── Utility Functions ──

export function getRandomCard(excludeIds = []) {
  const available = Object.values(CARDS).filter(c => !excludeIds.includes(c.id))
  // Weighted random by rarity
  const totalWeight = available.reduce((sum, c) => sum + RARITY_WEIGHTS[c.rarity], 0)
  let rand = Math.random() * totalWeight
  for (const card of available) {
    rand -= RARITY_WEIGHTS[card.rarity]
    if (rand < 0) return { ...card }
  }
  return { ...available[available.length - 1] }
}

export function getShopCards(hand, count = SHOP_CONFIG.cardsPerVisit) {
  const nonStackableInHand = hand
    .filter(c => !CARDS[c.id]?.stackable)
    .map(c => c.id)
  const cards = []
  for (let i = 0; i < count; i++) {
    cards.push(getRandomCard(nonStackableInHand))
  }
  return cards
}

export function calculateInterest(money) {
  return Math.min(SHOP_CONFIG.maxInterest, Math.floor(money / 5))
}

export function getBlindTarget(anteIndex, blindType) {
  const ante = ANTES[anteIndex]
  if (!ante) return 999999
  return ante[blindType]
}

export function getBossBlind(anteIndex) {
  return BOSS_BLINDS[anteIndex] || BOSS_BLINDS[BOSS_BLINDS.length - 1]
}
