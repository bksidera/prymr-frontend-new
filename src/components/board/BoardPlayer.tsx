import { useState, useRef } from 'react'
import type { BoardSchema, TappableZone, TappableAction } from '../../types/board.types'
import BoardElement from './BoardElement'
import TappableZoneComponent from './TappableZone'

const ASPECT_RATIOS: Record<BoardSchema['aspectRatio'], string> = {
  '9:16': '9 / 16',
  '1:1': '1 / 1',
  '4:3': '4 / 3',
  '16:9': '16 / 9',
}

interface Props {
  schema: BoardSchema
  // Called when a tappable zone is tapped (appreciation, follow)
  onTappableTap?: (tappable: TappableZone) => void
  // Called when the board canvas itself is tapped (free-form reaction placement)
  // x and y are normalized 0–1 coordinates of the tap point
  onBoardTap?: (x: number, y: number) => void
  // Overlay content rendered inside the board container (reaction pins)
  children?: React.ReactNode
}

function initialHiddenElementIds(schema: BoardSchema) {
  return new Set(
    schema.elements.filter((element) => element.initiallyHidden).map((element) => element.id),
  )
}

export default function BoardPlayer({ schema, onTappableTap, onBoardTap, children }: Props) {
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(() => initialHiddenElementIds(schema))
  const [overlay, setOverlay] = useState<Extract<TappableAction, { type: 'infoOverlay' }> | null>(
    null,
  )
  const containerRef = useRef<HTMLDivElement>(null)

  const sortedElements = [...schema.elements].sort((a, b) => a.zIndex - b.zIndex)

  function handleTappableTap(tappable: TappableZone) {
    const { action } = tappable
    if (action.type === 'vanish') {
      setHiddenIds((prev) => new Set([...prev, action.elementId]))
      return
    }
    if (action.type === 'reveal') {
      setHiddenIds((prev) => {
        const next = new Set(prev)
        next.delete(action.elementId)
        return next
      })
      return
    }
    if (action.type === 'switch') {
      setHiddenIds((prev) => {
        const next = new Set(prev)
        if (action.fromElementId) next.add(action.fromElementId)
        next.delete(action.toElementId)
        return next
      })
      return
    }
    if (action.type === 'infoOverlay') {
      setOverlay(action)
      return
    }
    onTappableTap?.(tappable)
  }

  function handleBoardClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!onBoardTap || !containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    onBoardTap(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)))
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: ASPECT_RATIOS[schema.aspectRatio],
        background: schema.background,
        overflow: 'hidden',
        containerType: 'size',
        cursor: onBoardTap ? 'crosshair' : undefined,
      }}
      onClick={handleBoardClick}
    >
      {sortedElements.map((el) => (
        <BoardElement key={el.id} element={el} hidden={hiddenIds.has(el.id)} />
      ))}

      {schema.tappables.map((t) => (
        <TappableZoneComponent key={t.id} tappable={t} onTap={() => handleTappableTap(t)} />
      ))}

      {/* Reaction pins and other overlays */}
      {children}

      {overlay && (
        <div
          className="absolute inset-x-3 bottom-3 z-[2000] rounded-lg border border-white/15 bg-black/85 p-3 text-white shadow-2xl backdrop-blur"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            {overlay.imageUrl && (
              <img
                src={overlay.imageUrl}
                alt=""
                className="h-16 w-16 shrink-0 rounded-md object-cover"
                draggable={false}
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold leading-tight">{overlay.title}</h3>
                <button
                  type="button"
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                  onClick={() => setOverlay(null)}
                  aria-label="Close overlay"
                >
                  x
                </button>
              </div>
              {overlay.body && (
                <p className="mt-1 text-xs leading-relaxed text-zinc-300">{overlay.body}</p>
              )}
              <div className="mt-3 flex items-center gap-2">
                {overlay.price !== undefined && (
                  <span className="rounded-full bg-white/10 px-2 py-1 text-xs font-medium">
                    ${overlay.price.toFixed(2)}
                  </span>
                )}
                {overlay.purchaseUrl && (
                  <a
                    href={overlay.purchaseUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-md bg-white px-3 py-1.5 text-xs font-medium text-black hover:bg-zinc-100"
                  >
                    View item
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
