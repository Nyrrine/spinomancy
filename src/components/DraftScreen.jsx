import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Card from './Card'
import BalatroBackground from './BalatroBackground'
import { sfx } from '../utils/sounds'

export default function DraftScreen({ draftCards = [], onPick }) {
  const [picked, setPicked] = useState(null) // index of picked card
  const [hoveredIndex, setHoveredIndex] = useState(-1)

  function handlePick(index) {
    if (picked !== null) return
    sfx.cardSelect()
    setPicked(index)
    // Brief delay for animation before advancing
    setTimeout(() => {
      sfx.pop()
      if (onPick) onPick(index)
    }, 800)
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      <div className="fixed inset-0 z-0"><BalatroBackground ante={0} /></div>
      <div className="crt-overlay" />
      <div className="crt-vignette" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen gap-8 px-4">
        {/* Header */}
        <motion.div
          className="text-center space-y-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <div className="text-[7px] text-text-muted uppercase tracking-[0.3em]">New Run</div>
          <h2 className="text-lg text-text">Choose your starting card</h2>
          <p className="text-[7px] text-text-dim">This card will define your opening strategy</p>
        </motion.div>

        {/* Draft cards — 3 side by side, scaled up */}
        <div className="flex gap-8 md:gap-12 items-center justify-center" style={{ transform: 'scale(1.4)', transformOrigin: 'center' }}>
          {draftCards.map((card, i) => {
            const isPicked = picked === i
            const isRejected = picked !== null && picked !== i

            return (
              <motion.div
                key={card.id + '-' + i}
                className="relative cursor-pointer"
                initial={{ opacity: 0, y: 40, rotate: (i - 1) * -5 }}
                animate={{
                  opacity: isRejected ? 0 : 1,
                  y: isPicked ? -20 : 0,
                  rotate: 0,
                  scale: isPicked ? 1.15 : isRejected ? 0.8 : 1,
                }}
                transition={{
                  delay: isRejected ? 0.1 : isPicked ? 0.05 : 0.3 + i * 0.15,
                  duration: isRejected ? 0.4 : 0.5,
                  type: isPicked ? 'spring' : 'tween',
                  stiffness: 200,
                  damping: 15,
                }}
                onClick={() => handlePick(i)}
                onMouseEnter={() => { setHoveredIndex(i); sfx.cardFocus() }}
                onMouseLeave={() => setHoveredIndex(-1)}
              >
                {/* Glow behind hovered card */}
                {hoveredIndex === i && picked === null && (
                  <motion.div
                    className="absolute -inset-3 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(42, 93, 170, 0.2) 0%, transparent 70%)',
                    }}
                  />
                )}

                {/* Picked glow */}
                {isPicked && (
                  <motion.div
                    className="absolute -inset-4 z-0 pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 0.6, 0.3] }}
                    transition={{ duration: 0.6 }}
                    style={{
                      background: 'radial-gradient(ellipse at center, rgba(232, 196, 74, 0.3) 0%, transparent 70%)',
                    }}
                  />
                )}

                <div className="relative z-10">
                  <Card
                    card={card}
                    selected={isPicked}
                  />
                </div>

                {/* "Pick" label on hover */}
                <AnimatePresence>
                  {hoveredIndex === i && picked === null && (
                    <motion.div
                      className="absolute -bottom-6 left-1/2 -translate-x-1/2 z-20"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="text-[7px] text-gold uppercase tracking-wider">Pick</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>

        {/* Picked confirmation */}
        <AnimatePresence>
          {picked !== null && (
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <span className="text-[9px] text-gold">
                {draftCards[picked]?.name} chosen!
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom hint */}
        {picked === null && (
          <motion.p
            className="text-[6px] text-text-muted"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
          >
            Click a card to begin your run
          </motion.p>
        )}
      </div>
    </div>
  )
}
