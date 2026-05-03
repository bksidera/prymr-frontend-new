import type { BoardElement as BoardElementType } from '../../types/board.types'
import { toCSSPercent } from '../../utils/coordinates'

interface Props {
  element: BoardElementType
  hidden?: boolean
}

export default function BoardElement({ element, hidden = false }: Props) {
  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: toCSSPercent(element.x),
    top: toCSSPercent(element.y),
    width: toCSSPercent(element.w),
    height: toCSSPercent(element.h),
    transform: `rotate(${element.rotation}deg)`,
    zIndex: element.zIndex,
    overflow: 'hidden',
    opacity: hidden ? 0 : (element.style?.opacity ?? 1),
    transition: hidden ? 'opacity 0.3s ease' : undefined,
    pointerEvents: hidden ? 'none' : undefined,
  }

  if (element.type === 'image' || element.type === 'gif') {
    return (
      <div style={posStyle}>
        <img
          src={element.url}
          alt=""
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
      </div>
    )
  }

  if (element.type === 'video') {
    return (
      <div style={posStyle}>
        <video
          src={element.url}
          autoPlay={element.autoplay ?? true}
          loop={element.loop ?? true}
          muted={element.muted ?? true}
          playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      </div>
    )
  }

  if (element.type === 'text') {
    const { fontFamily, fontSize, color, backgroundColor, borderRadius } = element.style ?? {}
    return (
      <div
        style={{
          ...posStyle,
          fontFamily,
          // fontSize is normalized 0–1 relative to board height; treat as a % of container
          fontSize: fontSize !== undefined ? `${fontSize * 100}cqh` : undefined,
          color: color ?? '#ffffff',
          backgroundColor,
          borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '0.25em',
          wordBreak: 'break-word',
          whiteSpace: 'pre-wrap',
          textAlign: 'center',
        }}
      >
        {element.content}
      </div>
    )
  }

  if (element.type === 'shape') {
    const { backgroundColor, borderRadius, opacity } = element.style ?? {}
    return (
      <div
        style={{
          ...posStyle,
          backgroundColor: backgroundColor ?? 'rgba(255,255,255,0.1)',
          borderRadius,
          opacity: hidden ? 0 : (opacity ?? 1),
        }}
      />
    )
  }

  return null
}
