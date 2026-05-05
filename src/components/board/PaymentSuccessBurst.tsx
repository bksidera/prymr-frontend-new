import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

const PARTICLE_COUNT = 12

interface Props {
  /** Screen-space pixels for the burst origin */
  screenX: number
  screenY: number
  /** Triggers a new burst whenever this number changes */
  trigger: number
  onDone?: () => void
}

/**
 * One-shot particle burst at a screen-space point + a top-of-viewport toast,
 * fired when a paid reaction lands. Free reactions don't show a toast — the
 * pin appearing is the confirmation.
 */
export default function PaymentSuccessBurst({ screenX, screenY, trigger, onDone }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (trigger === 0) return
    setVisible(true)
    const t = setTimeout(() => {
      setVisible(false)
      onDone?.()
    }, 2200)
    return () => clearTimeout(t)
  }, [trigger, onDone])

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Particle burst at the tap point */}
          <div className="pointer-events-none fixed z-[60]" style={{ left: screenX, top: screenY }}>
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
              const angle = (i / PARTICLE_COUNT) * Math.PI * 2
              const dist = 50 + Math.random() * 30
              const dx = Math.cos(angle) * dist
              const dy = Math.sin(angle) * dist
              return (
                <motion.span
                  key={i}
                  className="absolute -translate-x-1/2 -translate-y-1/2 text-base"
                  initial={{ opacity: 1, x: 0, y: 0, scale: 0.6 }}
                  animate={{ opacity: 0, x: dx, y: dy, scale: 1 }}
                  transition={{ duration: 0.9, ease: 'easeOut' }}
                >
                  {i % 2 === 0 ? '✨' : '💛'}
                </motion.span>
              )
            })}
          </div>

          {/* Top toast */}
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-6 z-[60] flex justify-center"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.25 }}
          >
            <div className="rounded-full bg-zinc-900/95 px-4 py-2 text-sm font-medium text-white ring-1 ring-amber-300/40 backdrop-blur">
              Your appreciation was sent <span className="ml-1">💛</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
