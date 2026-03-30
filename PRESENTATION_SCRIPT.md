# Spinomancy — Presentation Script
### MATWRLD (Mathematics in the Modern World) Mini Game
### ~8 minutes | Live demo + math walkthrough

---

## SLIDE 1: INTRO (30 seconds)

> Hey everyone. So for our MATWRLD mini game, I built **Spinomancy** — it's a roguelike deckbuilder crossed with a pachinko roulette wheel. Think Balatro meets pinball.

> The idea is that you spin a roulette ball, it bounces through pins, and where it lands determines your score. But the math runs deeper than just "spin and hope." Every decision you make — which cards to buy, when to save money, how to build your hand — is a math problem.

> Let me show you.

**[DEMO: Click PLAY, pick a starting card, show the blind select screen]**

---

## SLIDE 2: PROBABILITY & STATISTICS (90 seconds)

> So here's our wheel. It has **12 sectors**: 5 red, 4 black, 1 green, and 1 gold. Right away we can calculate the probability space.

> Red has a **5 out of 12** chance — about 41.7%. Black is **4 out of 12** — 33.3%. Green and gold are each **1 out of 12** — 8.3% each.

> Green is your "miss" — zero chips. Gold is the jackpot — 25 base chips. Red and black give 10 each.

**[DEMO: Spin a few times, let the ball bounce through pins]**

> Now here's where it gets interesting. There's a card called **Weighted Ball** — it reduces the probability of landing on green by 50%. So with one copy, green drops from 8.3% to about 4.15%. Stack two copies and it's down to 2%. Three copies and green is effectively removed — replaced by an extra red sector.

> This is compound probability reduction — each Weighted Ball multiplies the remaining probability by 0.5. It's not subtracting, it's multiplying.

> And then there's **Magnet** — it boosts your chosen color by 20%. So if you magnetize red, it goes from 41.7% to around 50%. You're literally reshaping the probability distribution with your card choices.

> One thing the game subtly teaches is the **Gambler's Fallacy**. You might feel like "I haven't hit gold in 5 spins, it's due!" — but each spin is independent. The Run Stats dashboard actually tracks your sector frequency over time.

**[DEMO: Open Run Stats, show sector frequency chart]**

> See how the observed frequencies gradually converge toward the theoretical probabilities? That's the **Law of Large Numbers** playing out in real time.

---

## SLIDE 3: EXPECTED VALUE (90 seconds)

> Let's talk about **Expected Value** — probably the most important concept in the game.

> A basic spin gives you: 5/12 times 10 chips for red, plus 4/12 times 10 for black, plus 1/12 times 0 for green, plus 1/12 times 25 for gold. That's an EV of about **9.6 chips per spin** before any card effects.

> Now here's a fun example. There's a card called **Jackpot Hunter** — it gives you +50 chips when you land on gold, but -5 chips on everything else.

> If you do the math: 8.3% chance of +50 is about 4.15. 91.7% chance of -5 is about -4.59. The EV is **negative 0.44 chips**. On its own, Jackpot Hunter actually makes you worse off.

**[DEMO: Show Jackpot Hunter in shop or hand]**

> But — if you pair it with **Golden Touch**, which gives x4 multiplier on gold landings, now that +50 chips gets multiplied by 4. The gold hit becomes worth way more, and the EV flips positive. That's the power of synergies changing the math.

> Every shop decision is an EV calculation. Do I buy this card for $5, or save my money to earn interest? The game gives $1 interest per $5 saved, capped at $5 per round. So if you have $12 in the bank, you earn $2 interest. That's a guaranteed return versus a probabilistic return from a new card.

> This is literally the **time value of money** in game form.

---

## SLIDE 4: COMPOUND GROWTH (90 seconds)

> This is where the game really mirrors real math. The ante targets scale roughly 2-3x each ante:

> Ante 1 boss needs 400 points. Ante 8 boss needs **200,000**. That's a 500x increase. You can't get there with flat bonuses — you need exponential scaling.

**[DEMO: Show the blind select screen, point out the escalating targets]**

> The game has **scaling cards** that grow over time — just like compound interest.

> **Snowball** starts at +1 Mult and gains +1 every round. By round 24, that's +24 Mult from a single card. Linear growth — simple but steady.

> **Compounding Interest** starts at x1.5 and gains x0.1 per round. So it goes 1.5, 1.6, 1.7... By Ante 8, it's x2.2. Now, if you have TWO copies: 2.2 times 2.2 equals **4.84x**. That's exponential — each copy multiplies with the other.

> And **Momentum** grows by x0.2 per blind beaten. After all 24 blinds, that's **x5.8**. Momentum rewards you for surviving longer — the mathematical incentive aligns with the gameplay incentive.

> The scoring formula is: **(Base Chips + Bonus Chips) times (1 + Additive Mult) times (all xMult stacked)**. The order matters — additive multipliers add up, but xMult cards multiply each other. Two x2 cards don't give you x4 additively — they give you 2 times 2 equals x4 multiplicatively. Three x2 cards give x8. That's the power of compounding.

---

## SLIDE 5: COMBINATORICS & OPTIMIZATION (60 seconds)

> Building your hand is essentially a **budget-constrained optimization problem** — a knapsack problem.

> You start with $8 and cards cost $3 to $8. The shop shows 3 random cards per visit. Rerolls start at $2 and increase by $1 each time. So you're constantly deciding: do I buy now at a known value, or reroll hoping for something better — spending $2 on pure chance?

**[DEMO: Show the shop screen, point out card costs and the reroll button]**

> The game has **14 documented synergies** — card combinations that are stronger together than apart. For example, **Split Shot** launches 2 balls per spin, and **Loaded Die** adds +5 chips per spin. Separately they're okay. Together, you get 2 balls each getting +5 chips — the synergy doubles Loaded Die's value.

> So the optimization question becomes: do I buy the card that's individually strongest, or the one that completes a synergy? That's combinatorial thinking — evaluating combinations, not just individual pieces.

---

## SLIDE 6: DATA ANALYSIS (45 seconds)

> The game tracks everything and shows you real analytics.

**[DEMO: Play a few rounds, then open the Run Stats panel]**

> You can see your **sector frequency** — how often you actually hit each color versus the theoretical probability. After enough spins, these converge — that's statistical inference in action.

> There's a **score over time** chart showing your per-spin scoring power. Early game it's flat, but once scaling cards kick in, you see the exponential curve form.

> You can also see your **average score per spin**, **non-green landing rate**, **highest single spin**, and **best pin combo**. All of this is real data analysis — interpreting trends, identifying which cards contributed most, and understanding variance.

---

## SLIDE 7: GAME THEORY (60 seconds)

> Finally — **boss blinds** introduce adversarial game theory.

> Every third round is a boss fight with a special debuff. **The House** removes the gold sector entirely — your 8.3% jackpot chance drops to zero. If your whole strategy relied on gold, you're done. **The Void** expands green to 3 sectors — your miss chance triples from 8.3% to 25%. **The Gambler** halves all your additive multipliers.

**[DEMO: Show a boss blind intro screen if available]**

> This forces **minimax thinking** — you can't just build the highest-ceiling strategy. You need one that performs well in the average case AND survives the worst case. That's exactly what game theory teaches: optimizing under adversarial constraints.

> **The Fog** is my favorite — it hides all sector values until you land. You're betting purely on probability with zero information. That's decision-making under uncertainty — a core game theory concept.

---

## SLIDE 8: CLOSING (30 seconds)

> So to wrap up — Spinomancy isn't just a game. Every spin involves probability. Every purchase involves expected value. Every scaling card demonstrates compound growth. Every hand you build is an optimization problem. The stats dashboard teaches data analysis. And the boss fights teach game theory.

> The math isn't bolted on — it IS the game. You literally can't win without doing the math, even if you're doing it intuitively.

> Thanks! Happy to take questions or do a live run if you want to see it in action.

---

## TIMING GUIDE

| Section | Duration | Cumulative |
|---------|----------|------------|
| Intro | 0:30 | 0:30 |
| Probability & Statistics | 1:30 | 2:00 |
| Expected Value | 1:30 | 3:30 |
| Compound Growth | 1:30 | 5:00 |
| Combinatorics & Optimization | 1:00 | 6:00 |
| Data Analysis | 0:45 | 6:45 |
| Game Theory | 1:00 | 7:45 |
| Closing | 0:30 | 8:15 |

**Total: ~8 minutes** (leaves buffer for demo pauses and audience reactions)

## DEMO CUES SUMMARY

1. **[2:00]** Start a run — PLAY, pick card, show blind select
2. **[2:30]** Spin a few times, let audience see the ball physics
3. **[3:00]** Open Run Stats, show sector frequency convergence
4. **[4:00]** Show Jackpot Hunter card in hand/shop
5. **[5:30]** Show blind select escalating targets
6. **[6:30]** Show shop — card costs, reroll, synergy cards
7. **[7:00]** Open Run Stats charts — score over time, averages
8. **[7:30]** Show boss blind intro screen
