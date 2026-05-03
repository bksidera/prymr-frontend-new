import { motion } from 'framer-motion'
import type { TappableZone as TappableZoneType } from '../../types/board.types'
import { toCSSPercent } from '../../utils/coordinates'

interface Props {
  tappable: TappableZoneType
  onTap: () => void
}

export default function TappableZone({ tappable, onTap }: Props) {
  const { x, y, w, h, action, visible, style } = tappable

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: toCSSPercent(x),
    top: toCSSPercent(y),
    width: toCSSPercent(w),
    height: toCSSPercent(h),
    zIndex: 1000,
    cursor: 'pointer',
    borderRadius: style?.borderRadius,
    // Only show a visual indicator when the zone is marked visible
    backgroundColor: visible ? (style?.color ?? 'rgba(255,255,255,0.08)') : 'transparent',
    border: visible ? '1px solid rgba(255,255,255,0.15)' : 'none',
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (action.type === 'link') {
      window.open(action.url, action.openIn === 'new' ? '_blank' : '_self', 'noopener,noreferrer')
      return
    }
    onTap()
  }

  if (action.type === 'appreciation') {
    return (
      <motion.div
        style={posStyle}
        onClick={handleClick}
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        whileTap={{ scale: 0.97 }}
      />
    )
  }

  return <motion.div style={posStyle} onClick={handleClick} whileTap={{ scale: 0.97 }} />
}
