# Spinomancy

**A Balatro-inspired roguelite pachinko game built for Math in the Modern World.**

Stack cards. Bend probability. Break the math.

## What is Spinomancy?

Spinomancy is a browser-based roguelite where players launch balls through a physics-based pinball arena, collect modifier cards that stack and compound, and battle through 8 escalating antes. Inspired by Balatro's card mechanics and Peggle's physics.

Every decision in the game is a math problem in disguise -- probability, expected value, compound growth, and combinatorial optimization drive every card purchase, every spin, and every strategy.

## Features

- **55+ modifier cards** across 6 rarities (Common, Uncommon, Rare, Legendary, Cursed)
- **12 special ball upgrades** with unique physics (ember trails, ghost phasing, magnetic pull)
- **Pinball arena** with spinning circles, cannons, moving platforms, and wall pins
- **Ball splitting chains** -- balls split mid-bounce and split again, cascading into chaos
- **Color combo system** -- multiple balls landing on the same color = bonus multiplier
- **8 boss blinds** with unique debuffs (The House, The Jinx, The Fog, The Void...)
- **Accumulating scoring** -- chips and mult build across spins within each blind
- **Live scoring** -- watch your chips x mult update in real-time as the ball bounces
- **Dynamic shop** with card synergies, special balls, and interest economy
- **Balatro-style WebGL background** shader that shifts colors per ante
- **Procedural Web Audio** -- all sounds synthesized in real-time, zero audio files
- **Fire effects, screen shake, streak text, milestone celebrations**

## Math Concepts (MATWRLD Course)

| Concept | How It Appears in Gameplay |
|---------|---------------------------|
| **Probability & Statistics** | Wheel sector odds, weighted draws, compound probability reduction |
| **Expected Value** | Card purchase decisions, risk-reward evaluation |
| **Compound Growth** | Scaling cards (Snowball, Compounding Interest, Momentum) |
| **Combinatorics** | Card synergy optimization with unlimited hand size |
| **Data Analysis** | Run stats dashboard, sector frequency tracking |
| **Game Theory** | Boss blind adaptation, minimax strategy building |

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 + Vite 8 | UI framework and build tool |
| Tailwind CSS 4 | Utility-first styling |
| Framer Motion 12 | Card animations, screen transitions |
| HTML5 Canvas 2D | Physics-based pinball arena |
| WebGL | Balatro background shader |
| Web Audio API | Procedural sound synthesis |
| Recharts 3 | Analytics dashboard |

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Build for Production

```bash
npm run build
```

The production build outputs to `dist/` and can be deployed to any static hosting (Vercel, Netlify, GitHub Pages).

## Controls

- **Space / Click SPIN** -- Launch a ball
- **Spam Space** -- Launch multiple balls simultaneously
- **Hover cards** -- See live contribution tooltips with accumulated values

## Live Demo

[Play on Vercel](https://spinomancy.vercel.app) *(deployment pending)*

---

**Math in the Modern World** -- MATWRLD Mini Game Project
