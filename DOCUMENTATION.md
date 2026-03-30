# Spinomancy — MATWRLD Mini Game Documentation

## Title
**Spinomancy** — A Roguelite Roulette Where Cards Bend the Wheel

## Game Concept and Objective

Spinomancy is a web-based roguelite game inspired by Balatro's card-driven strategy and pachinko physics. Players launch a ball through a pinball-style arena, where it bounces off pins, rides through cannons, and lands on colored wheel sectors to score points. Between rounds, players visit a shop to buy modifier cards that stack, compound, and fundamentally alter the math of every spin.

The objective is to survive 8 escalating antes — each with three blinds (Small, Big, and Boss) — by building a synergistic hand of cards that amplify scoring through chips, multipliers, and probability manipulation. Boss blinds introduce unique debuffs that force players to adapt their strategy on the fly.

The game is designed for a **Math in the Modern World (MATWRLD)** course. Every meaningful decision the player makes — which card to buy, when to sell, how to evaluate risk, which sector to bet on — is a direct application of probability, expected value, or data-driven reasoning. The math isn't layered on top of the game; it *is* the game.

---

## Mechanics and Rules

### Core Game Loop

1. **Select a blind** — Choose to face the Small, Big, or Boss blind. Each has a target score that must be met.
2. **Spin the wheel** — A ball launches from a moving top launcher into a physics-based arena filled with pins, cannons, spinning circles, and rails. The ball bounces through obstacles and lands on a colored sector. Players can **spam the SPIN button or spacebar** to launch additional balls mid-spin — all active balls score independently, creating chaotic multi-ball mayhem.
3. **Score the spin** — The sector's base chip value is modified by the player's hand of cards. Chips are added, multipliers stack, and exponential multipliers compound — producing a final score for that spin.
4. **Repeat or stop** — Players get 5 base spins per round (modifiable by cards). Meet the target score to beat the blind.
5. **Visit the shop** — Between blinds, buy new cards, sell unwanted ones, reroll offerings, or purchase special ball upgrades. Earn income, interest, and spin bonuses.
6. **Advance** — Beat all three blinds in an ante to progress. Survive all 8 antes to win.

### Wheel Sectors

The roulette wheel has 16 sectors:

| Sector | Count | Base Chips | Color |
|--------|-------|------------|-------|
| Red (R) | 6 | 10 | Red |
| Black (B) | 5 | 10 | Black |
| Green (0) | 3 | 0 | Green |
| Gold ($) | 2 | 25 | Gold |

Green is the "miss" sector — it awards nothing by default (unless modified by Void Ball). Gold is the jackpot sector with 2.5x the standard chip value. The expanded 16-sector wheel creates richer probability distributions — with 3 green sectors (18.75%), risk management becomes more critical, while 2 gold sectors (12.5%) make gold-targeting strategies more viable. Sector Manipulation cards can further reshape the wheel's composition mid-run.

### Arena Physics

The ball doesn't just fall — it navigates a rich physical environment:

- **Pin Grid** — Hundreds of pins arranged in offset rows. Normal pins (white) bounce the ball; **bonus pins** (gold) award extra chips; **multiplier pins** (red) apply a x1.5 scoring multiplier per hit.
- **Spinning Circles** — Three rotating pin clusters (left, right, center) that deflect the ball unpredictably, adding chaos to trajectory planning.
- **4 Cannons** — Four color-coded pipe systems (blue, purple, red, green) positioned at different heights across the arena. Each captures the ball at an entry point and launches it to a distant exit with high velocity, creating dramatic cross-arena trajectory changes and strategic path diversity.
- **Moving Launcher** — The ball spawns from a horizontally sweeping launcher at the top, adding variability to each drop.

The arena canvas stands 1200px tall — a deep, vertical play field that gives the ball more time to interact with pins, spinners, and cannons before reaching the sectors at the bottom. All HUD elements (score, spins, ante info) live in a Balatro-style bordered sidebar to the left, keeping the arena uncluttered. Rails were removed to prevent corner-trapping. Physics constants (gravity: 0.17, friction: 0.994, bounce damping: 0.6) create a satisfying, slightly floaty feel that gives players time to watch their ball navigate the arena.

### Card System

Cards are the heart of Spinomancy's strategy. Each card modifies the scoring formula in a specific way, and effects are resolved in a strict order:

**Scoring Formula:** `Final Score = (Base Chips + Bonus Chips) x (1 + Additive Mult) x (xMult1 x xMult2 x ...)`

Cards are categorized by effect type:

**Chip Cards (+Chips)**
| Card | Effect | Rarity |
|------|--------|--------|
| Loaded Die | +5 chips per spin | Common |
| Black Market | +20 chips when landing on Black | Common |
| Red Carpet | +20 chips when landing on Red | Common |
| Jackpot Hunter | +50 chips on Gold, -5 on others | Uncommon |
| Ricochet King | +1 chip per pin hit during the spin | Common |
| Wall Walker | +3 chips every time ball bounces off a wall | Common |
| Gold Rush | Gold sector pays x2 base chips (50 instead of 25) | Uncommon |
| Card Counter | +2 chips per lifetime spin (scales permanently) | Uncommon |

**Multiplier Cards (+Mult)**
| Card | Effect | Rarity |
|------|--------|--------|
| Lucky Charm | +4 mult | Common |
| Hot Streak | +2 mult per consecutive non-Green landing | Uncommon |
| Snowball | +1 mult, grows +1 per round (scaling) | Uncommon |

**Exponential Multiplier Cards (xMult)**
| Card | Effect | Rarity |
|------|--------|--------|
| Double Down | x2 on final spin of the round | Uncommon |
| Golden Touch | x4 when landing on Gold | Rare |
| Compounding Interest | x1.5 base, grows x0.1 per round | Rare |
| Lucky Bounce | 15% chance of x1.2 per pin hit (compounds) | Uncommon |
| Momentum | x1.0 base, grows x0.2 per blind beaten | Legendary |

**Probability Manipulation Cards**
| Card | Effect | Rarity |
|------|--------|--------|
| Weighted Ball | Reduces Green sector probability by 50% per copy (compounds) | Rare |
| Magnet | +20% probability to a chosen color | Rare |

**Utility Cards**
| Card | Effect | Rarity |
|------|--------|--------|
| Extra Ball | +1 spin per round | Uncommon |
| Second Chance | Automatic respin when landing on Green | Uncommon |
| Split Shot | Launch 2 balls, both score | Rare |
| Reroll Token | 1 free shop reroll per round | Common |
| Insurance | Keep 50% score on fail, get a retry | Rare |

**Arena Feature Cards**
| Card | Effect | Rarity |
|------|--------|--------|
| Cannon Power | Ball exits cannons with double speed | Common |
| Mega Cannon | Cannon exit speed x3 | Uncommon |
| Barrier Master | BLOCK power-up lasts 8s instead of 5s | Uncommon |
| Pin Magnet | Ball nudged toward nearest unhit bonus pin (120px attraction radius, force scales with proximity) | Rare |
| Slow Motion | Ball moves 30% slower — more pin hits | Rare |
| Pin Destroyer | Hit pins explode and damage adjacent pins (chain reaction) | Legendary |

**Stacking:** Stackable cards multiply their effects with each additional copy. Two Loaded Dice = +10 chips. Two Weighted Balls compound: each applies 0.5x to Green probability (0.5 x 0.5 = 0.25, a 75% reduction). Three or more copies of Weighted Ball remove Green entirely and add an extra Red sector.

**Cursed Cards** — High-risk, high-reward cards that fundamentally alter the wheel:
| Card | Effect | Rarity |
|------|--------|--------|
| Green Tide | Adds 2 green sectors per stack, BUT +3 Mult | Cursed |
| Shrinking Wheel | Removes gold sector, +10 chips to all others | Cursed |
| Chaos Wheel | Randomizes all sector chip values (0–50) each spin | Cursed |
| Blood Tax | Lose $2 per round, BUT +8 Mult permanently | Cursed |
| Ghost Zone | 25% of pins invisible, BUT +5 chips per invisible hit | Cursed |

**Sector Manipulation Cards** — Reshape the wheel's composition mid-run:
| Card | Effect | Rarity |
|------|--------|--------|
| Gold Fever | Add 2 extra gold sectors (stacks) | Rare |
| Green Garden | Add 3 extra green sectors (pairs with Void Ball) | Uncommon |
| Sector Doubler | Double ALL sectors (32 instead of 16) | Legendary |

**No Hand Limit:** Players can hold unlimited cards — the more you buy, the more powerful your scoring engine becomes. This turns the game into a pure economic optimization problem: every dollar spent on a card is a dollar not earning interest, so players must balance accumulation speed against compounding savings.

### Shop Economy

Between blinds, players enter the shop:

- **3 cards** offered per visit (weighted by rarity: 60% Common, 25% Uncommon, 12% Rare, 3% Legendary)
- **Buy cost:** $3–8 depending on rarity
- **Sell price:** 50% of buy cost
- **Reroll:** $2 base cost, increases by $1 per reroll within a round
- **Income:** $3 base + $1 per unused spin + interest ($1 per $5 saved, max $5)

**Pity System:** The shop tracks how many visits have passed without offering rare or legendary cards. After 3 consecutive dry visits, a rare card is guaranteed in the next shop. After 5 dry visits, a legendary card is guaranteed. This prevents frustrating runs where RNG denies access to key build pieces — a deliberate design choice that mirrors gacha game mechanics while teaching students about expected wait times and geometric distributions.

**Synergies:** The game recognizes 14 card combinations that produce powerful interactions:

| Synergy | Cards | Effect |
|---------|-------|--------|
| Gold Rush | Golden Touch + Jackpot Hunter | +50 chips then x4 on Gold |
| Red Hot | Red Carpet + Hot Streak | +20 chips fueling streak mult |
| Infinite Engine | Snowball + Compounding Interest | Double scaling mult + xMult |
| Green Shield | Weighted Ball + Second Chance | Reduce Green and respin it |
| Scatter Shot | Split Shot + Loaded Die | 2 balls with bonus chips each |
| Snowball Effect | Momentum + Compounding Interest | Double scaling xMult |
| Pin Combo | Ricochet King + Lucky Bounce | +chips and xMult from every hit |
| Double Cannon | Cannon Boost + Split Shot | 2 fast balls through cannons |

When a synergy is completed, the game displays a toast notification.

### Antes and Blinds

The game has 8 antes, each with 3 blinds (Small, Big, Boss):

| Ante | Small | Big | Boss |
|------|-------|-----|------|
| 1 | 150 | 250 | 400 |
| 2 | 350 | 500 | 700 |
| 3 | 800 | 1,200 | 1,800 |
| 4 | 2,000 | 3,500 | 5,500 |
| 5 | 5,000 | 8,000 | 12,000 |
| 6 | 12,000 | 20,000 | 30,000 |
| 7 | 30,000 | 50,000 | 80,000 |
| 8 | 60,000 | 100,000 | 200,000 |

Target scores increase by roughly 2–3x per ante, demanding exponential growth in the player's scoring engine. This makes compound scaling cards (Compounding Interest, Momentum, Snowball) increasingly valuable at higher antes.

**Infinite Game Loop:** After clearing Ante 8, there is no victory screen — the game loops back to Ante 1 with all score requirements doubled. Each subsequent loop doubles again (4x on loop 3, 8x on loop 4, etc.). The player's card collection and scaling state carry over, creating an endless endgame that tests how far a build can scale. This transforms the game from "can you survive 8 antes?" to "how far can your math engine go?" — a natural exploration of exponential growth limits.

### Boss Blinds

Each ante's third blind is a Boss with a unique debuff:

| Boss | Debuff |
|------|--------|
| The House | Gold sector removed from the wheel |
| The Jinx | One random card disabled each blind |
| The Fog | Sector values hidden until the ball lands |
| The Tax Man | Lose $3 before the round starts |
| The Mirror | Wheel spins in reverse |
| The Void | Green expands to 3 sectors |
| The Gambler | All +Mult effects halved |
| The Final Bet | Target score is tripled |

Boss debuffs force players to evaluate whether their current hand can handle the constraint. A player relying on Golden Touch is devastated by The House (no Gold sector). A player with heavy +Mult cards is crippled by The Gambler. This is applied game theory — building a resilient strategy that survives adversarial conditions.

### Special Balls

In addition to cards, players can purchase **special ball upgrades** from the shop — permanent physics modifiers that change how the ball behaves in the arena. Special balls appear with a 60% chance per shop visit and are stackable for compounding effects.

| Ball | Effect | Rarity |
|------|--------|--------|
| Ember Ball | +3 chips per pin hit (stacks) | Common |
| Heavy Ball | Ball 20% heavier — more momentum per copy (compounds) | Common |
| Ghost Ball | Phase through first 3 pins without bouncing (+2 per stack) | Uncommon |
| Magnet Ball | Ball attracted toward gold sector positions near the bottom | Uncommon |
| Split Ball | Permanently +1 ball per spin (stacks) | Rare |
| Crystal Ball | Bonus pin rewards doubled (stacks multiplicatively) | Rare |
| Void Ball | Green sector becomes x2 mult instead of 0 chips | Legendary |

Each ball type has a unique visual trail (ember glow, translucent ghost effect, crystal sparkles, void darkness) that makes the arena visually dynamic as the player accumulates upgrades.

### Visual Juice System

Spinomancy uses layered visual effects that intensify with gameplay progression, creating visceral feedback for high-scoring plays:

- **Fire Border** — screen edges glow orange at 500+ score, animate as flames at 2,000+, and become a flickering inferno at 10,000+. Intensity scales with the current round score.
- **Background Tint** — the Balatro-style WebGL swirl background shifts color based on game state: calm blue during idle, red pulse during spins, gold on cleared blinds, deep red on failures.
- **Score Explosions** — score numbers physically grow larger based on digit count (Balatro-style). 5-digit scores are 25% larger with a gold glow; 6+ digits are 40% larger with intense radiance.
- **Gold Burst** — a brief radial gold flash fills the screen when a blind is cleared.
- **Screen Shake** — the arena canvas shakes on pin-hit combos (5+ hits triggers shake, intensity scales with combo count up to 20+ hits).
- **Pin Hit Particles** — gold sparkle bursts on bonus pin hits, white bursts on normal pins, with a central flash that fades over 300ms.
- **Fire Particles** — on scores above 10,000, fire particles float upward from the score display during the counting animation.
- **Confetti** — 80-particle gold confetti burst on victory screen.

These effects serve a design purpose: they make the mathematical consequences of card synergies *visible*. When a player stacks three Compounding Interest cards and watches the screen shake, the border ignite, and the score explosion grow with each spin — they're seeing exponential growth manifest as spectacle.

---

## Mathematics in Gameplay

Spinomancy is built so that **every strategic decision is a math problem in disguise.** The following concepts from Math in the Modern World are embedded directly into core gameplay:

### 1. Probability and Statistics

The wheel's sector distribution creates a probability space that players must constantly evaluate:

- **P(Red) = 6/16 = 37.5%** — most likely outcome
- **P(Black) = 5/16 = 31.25%** — second most likely
- **P(Green) = 3/16 = 18.75%** — the "miss" sectors, a significant threat
- **P(Gold) = 2/16 = 12.5%** — high reward, low-but-viable probability

With 3 green sectors on the base wheel, the miss rate is nearly 1-in-5 — making probability manipulation cards far more critical than on a 12-sector wheel. Cards like **Weighted Ball** and **Magnet** directly modify these probabilities. A player with two Weighted Balls reduces P(Green) from 18.75% to ~4.7% (0.5 x 0.5 compound reduction). **Sector Manipulation cards** go further: Gold Fever adds 2 gold sectors (shifting P(Gold) from 12.5% to 22.2% on an 18-sector wheel), while Sector Doubler doubles the entire wheel to 32 sectors, preserving ratios but creating more granular probability distributions. Understanding how these modifications interact is essential to optimizing expected value.

**Independent Events:** Each spin is independent — the ball doesn't "remember" previous outcomes. The arena's chaotic physics (spinning circles, cannon launches, pin deflections) reinforce this viscerally. Players who think a Gold landing is "due" after several misses are experiencing the **Gambler's Fallacy**, which the game's analytics dashboard explicitly counters with real-time convergence data.

### 2. Expected Value (EV)

Every card purchase is an expected value calculation:

- **Jackpot Hunter:** +50 chips on Gold (P ≈ 8.3%), -5 chips otherwise (P ≈ 91.7%)
  - EV per spin = (0.083 x 50) + (0.917 x -5) = 4.15 - 4.585 = **-0.435 chips**
  - *Negative EV as a standalone card!* But paired with Magnet (+20% to Gold) or Golden Touch (x4 on Gold), the EV flips dramatically positive.

- **Loaded Die:** +5 chips every spin, no conditions
  - EV per spin = **+5 chips** (guaranteed)
  - Lower ceiling but zero variance — the mathematically "safe" choice.

Players must compare guaranteed value against conditional value, weighing variance tolerance against potential upside. This is directly analogous to portfolio theory in finance and risk assessment in statistics.

### 3. Compound Growth and Exponential Functions

The ante progression demands exponential scoring growth (150 → 200,000 across 8 antes). Linear cards (+5 chips per spin) become insufficient — players must invest in **scaling cards** that grow over time:

- **Compounding Interest:** x1.5 at Ante 1, x1.6 at Ante 2, ..., x2.2 by Ante 8
- **Momentum:** x1.0 at start, x0.2 per blind beaten → x5.8 after all 24 blinds
- **Snowball:** +1 mult at start, +1 per round → +24 mult by endgame

Two Compounding Interest cards multiply: 1.5 x 1.5 = 2.25 at start, growing to 2.2 x 2.2 = 4.84 by Ante 8. This is **compound interest in action** — the same mathematical principle behind savings accounts, population growth, and Moore's Law.

### 4. Combinatorics and Optimization

With 40+ unique cards (including Cursed and Sector Manipulation), 7 special ball types, and unlimited hand size, players face a rich optimization problem:

- Which cards maximize expected score given remaining antes and likely boss debuffs?
- Is it better to buy a new card now or save money for interest ($1 per $5)?
- When should you sell a card that's underperforming to fund a synergy piece?
- How many balls should you invest in (Split Ball stacks) vs. per-ball power?

The **knapsack problem** appears naturally: each card has a cost and a value, and money is finite. With no hand limit, the constraint shifts from slots to economy — a more realistic optimization scenario where budget allocation, opportunity cost, and diminishing returns drive every decision.

### 5. Data Analysis and Statistical Inference

The in-game **Run Stats** dashboard provides real-time analytics:

- **Sector History Chart** — tracks which sectors the ball has landed on across all spins, revealing whether observed frequencies match theoretical probability
- **Spin Score Distribution** — visualizes scoring variance, helping players identify whether their hand produces consistent or volatile results
- **Balance Trajectory** — an area chart showing economic health over time

Players who use this data to inform card purchases (e.g., noticing high Gold frequency → investing in Golden Touch) are performing **statistical inference** — drawing conclusions from observed data to predict future outcomes.

### 6. Game Theory and Risk Management

Boss blinds introduce **adversarial constraints** that test strategic resilience:

- Building a hand that depends entirely on Gold sectors is destroyed by The House
- Over-investing in +Mult cards is halved by The Gambler
- The Void (3 Green sectors) punishes players without Green mitigation

Optimal play requires **minimax thinking** — building a hand that performs well in the average case while remaining viable against worst-case scenarios. This is game theory applied to deck-building, teaching the same principles used in decision-making under uncertainty.

---

## Tools and Technologies

| Technology | Purpose |
|------------|---------|
| **React 19** | Component-based UI framework for game state and rendering |
| **Vite 8** | Fast build tool with hot module replacement for development |
| **Tailwind CSS 4** | Utility-first CSS framework for consistent, responsive styling |
| **Framer Motion 12** | Animation library for card flips, screen transitions, UI effects |
| **Canvas 2D API** | Renders the physics-based roulette arena (ball, pins, cannons, spinners) |
| **WebGL** | GPU-accelerated Balatro-style swirling background shader |
| **Web Audio API** | All sounds procedurally synthesized (no WAV files) — oscillators, filters, and envelopes generate pin hits, score ticks, and UI feedback in real time |
| **Recharts 3** | Data visualization library for the analytics dashboard |
| **Silkscreen** | Primary heading font for clean pixel-art aesthetic |
| **Press Start 2P** | Secondary pixel font for body text and UI elements |

The game runs entirely client-side — no backend, no database, no server. All game state is managed in React hooks, and physics simulation runs at 60fps on the HTML5 Canvas.

---

## How to Run

**Prerequisites:** Node.js 18+ installed.

```bash
# Install dependencies
npm install

# Start development server (http://localhost:5173)
npm run dev

# Build for production
npm run build
```

The production build outputs to `dist/` and can be served with any static file server or opened directly in a browser.

---

## Reflection

Spinomancy demonstrates that mathematics is not an abstract academic exercise — it is the engine behind every strategic decision in a game that *feels* like pure intuition. When a player instinctively saves money for interest, sells a card to optimize their hand, or chooses Weighted Ball over Golden Touch because the expected value is higher given their current build — they are doing math. They just don't realize it.

The most powerful teaching moment is the transition from Ante 4 to Ante 5, where target scores jump from 5,500 to 12,000. Players who relied on linear chip-adding cards hit a wall. The ones who invested in scaling cards — Compounding Interest, Momentum, Snowball — watch their scores grow exponentially. This is the moment where compound growth stops being a formula on a whiteboard and becomes something you *feel* in the gameplay.

Boss blinds serve as the game's lesson in robust decision-making. Students learn that the mathematically optimal strategy isn't the one that maximizes average performance — it's the one that performs well across all scenarios, including adversarial ones. This mirrors real-world applications of game theory in economics, cybersecurity, and public policy.

The infinite game loop after Ante 8 is the ultimate math playground — with scores doubling each cycle, players discover firsthand that exponential growth has no ceiling, but also that compound strategies eventually hit diminishing returns. The question shifts from "can I win?" to "how far can my math engine scale?" — and that's the most powerful lesson of all.

By embedding probability, expected value, combinatorics, compound growth, data analysis, and game theory into a roguelite card game, Spinomancy makes Math in the Modern World something students want to engage with — not because it's required, but because it helps them win.
