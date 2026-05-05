import { motion } from 'framer-motion'
import type { TappableAction, TappableZone as TappableZoneType } from '../../types/board.types'
import { toCSSPercent } from '../../utils/coordinates'

interface Props {
  tappable: TappableZoneType
  onTap: () => void
}

const ICON_TINT: Record<TappableAction['type'], string> = {
  appreciation: 'rgba(255, 200, 120, 0.95)',
  link: 'rgba(255, 255, 255, 0.85)',
  reveal: 'rgba(255, 255, 255, 0.85)',
  vanish: 'rgba(255, 255, 255, 0.85)',
  switch: 'rgba(255, 255, 255, 0.85)',
  follow: 'rgba(255, 255, 255, 0.85)',
  purchase: 'rgba(180, 230, 255, 0.95)',
  infoOverlay: 'rgba(255, 255, 255, 0.85)',
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
    backgroundColor: visible ? (style?.color ?? 'rgba(255,255,255,0.06)') : 'transparent',
    border: visible ? '1px solid rgba(255,255,255,0.12)' : 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }

  function handleClick(event: React.MouseEvent<HTMLDivElement>) {
    event.stopPropagation()
    if (action.type === 'link') {
      window.open(action.url, action.openIn === 'new' ? '_blank' : '_self', 'noopener,noreferrer')
      return
    }
    onTap()
  }

  return (
    <motion.div
      style={posStyle}
      onClick={handleClick}
      onPointerDown={(e) => e.stopPropagation()}
      animate={{ scale: [1, 1.04, 1] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      whileTap={{ scale: 0.97 }}
    >
      <ActionIcon type={action.type} />
    </motion.div>
  )
}

function ActionIcon({ type }: { type: TappableAction['type'] }) {
  const color = ICON_TINT[type]
  // Container query unit so the icon scales with the tappable zone height.
  const size = '40cqh'
  const iconStyle: React.CSSProperties = {
    width: size,
    height: size,
    maxWidth: 32,
    maxHeight: 32,
    minWidth: 14,
    minHeight: 14,
    color,
    filter: 'drop-shadow(0 0 4px rgba(0,0,0,0.5))',
  }
  switch (type) {
    case 'appreciation':
      return <Heart style={iconStyle} />
    case 'link':
      return <ArrowOut style={iconStyle} />
    case 'reveal':
      return <Eye style={iconStyle} />
    case 'vanish':
      return <EyeSlash style={iconStyle} />
    case 'switch':
      return <Swap style={iconStyle} />
    case 'follow':
      return <UserPlus style={iconStyle} />
    case 'purchase':
      return <Tag style={iconStyle} />
    case 'infoOverlay':
      return <InfoCircle style={iconStyle} />
  }
}

// Inline SVGs — minimal, currentColor-driven for tinting.

function Heart(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 21s-7-4.35-9.5-8.5C.5 8.5 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.5 4.5 4.5 8.5C19 16.65 12 21 12 21z" />
    </svg>
  )
}
function ArrowOut(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M20 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h5" />
    </svg>
  )
}
function Eye(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}
function EyeSlash(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a3 3 0 0 0 4.2 4.2" />
      <path d="M9.4 5.5C10.2 5.2 11.1 5 12 5c6 0 10 7 10 7a17.5 17.5 0 0 1-3.6 4.3" />
      <path d="M6.1 6.6A17.5 17.5 0 0 0 2 12s4 7 10 7c1.6 0 3-.5 4.3-1.2" />
    </svg>
  )
}
function Swap(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 7h13" />
      <path d="m17 4 3 3-3 3" />
      <path d="M17 17H4" />
      <path d="m7 14-3 3 3 3" />
    </svg>
  )
}
function UserPlus(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="9" cy="8" r="4" />
      <path d="M2 21a7 7 0 0 1 14 0" />
      <path d="M19 8v6" />
      <path d="M22 11h-6" />
    </svg>
  )
}
function Tag(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M20.6 13.4 12 22 2 12V2h10l8.6 8.6a2 2 0 0 1 0 2.8z" />
      <circle cx="7.5" cy="7.5" r="1.4" fill="currentColor" />
    </svg>
  )
}
function InfoCircle(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8h.01" />
      <path d="M11 12h1v5h1" />
    </svg>
  )
}
