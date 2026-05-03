import { motion } from 'framer-motion'
import type { ReactionPin as ReactionPinType } from '../../types/api.types'
import { toCSSPercent } from '../../utils/coordinates'

interface Props {
  pin: ReactionPinType
  onClick: (id: string) => void
}

// Parse a stored position string to a 0–1 normalized float.
// New reactions store values like "0.45". Legacy Konva reactions stored pixel
// values like "234.5". We only render pins we can normalize.
function parsePosition(val: string | null): number | null {
  if (val === null) return null
  const n = parseFloat(val)
  if (isNaN(n)) return null
  // Values > 1 are legacy pixel values — skip rendering them
  if (n > 1) return null
  return Math.max(0, Math.min(1, n))
}

export default function ReactionPin({ pin, onClick }: Props) {
  // Prefer explicit normalizedX/Y, fall back to parsing top/left strings
  const x = pin.normalizedX ?? parsePosition(pin.left)
  const y = pin.normalizedY ?? parsePosition(pin.top)

  if (x === null || y === null) return null

  const avatarUrl = pin.user?.profileIcon ?? pin.user?.initialProfileIcon ?? null
  const initials = pin.user?.userName?.charAt(0).toUpperCase() ?? '?'

  return (
    <motion.button
      type="button"
      style={{
        position: 'absolute',
        left: toCSSPercent(x),
        top: toCSSPercent(y),
        transform: 'translate(-50%, -50%)',
        zIndex: 900,
      }}
      className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-lg overflow-hidden"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileTap={{ scale: 0.9 }}
      onClick={(e) => {
        e.stopPropagation()
        onClick(pin.id)
      }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={pin.user?.userName ?? ''}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="bg-zinc-700 text-white text-xs font-medium w-full h-full flex items-center justify-center">
          {pin.emoji ?? initials}
        </span>
      )}
    </motion.button>
  )
}
