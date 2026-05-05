import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePublicBoard, useReactionPins } from '../hooks/useBoard'
import { useQueryClient } from '@tanstack/react-query'
import BoardPlayer from '../components/board/BoardPlayer'
import ReactionPin from '../components/board/ReactionPin'
import ReactionComposer, { type ComposerMode } from '../components/board/ReactionComposer'
import ReactionDetail from '../components/board/ReactionDetail'
import CreatorOverlay from '../components/board/CreatorOverlay'
import ReactionsToggle from '../components/board/ReactionsToggle'
import PaymentSuccessBurst from '../components/board/PaymentSuccessBurst'
import type { TappableZone } from '../types/board.types'

interface ComposerState {
  mode: ComposerMode
  tappable?: TappableZone
  tapX: number
  tapY: number
  screenX: number
  screenY: number
}

interface BurstState {
  trigger: number
  screenX: number
  screenY: number
}

export default function BoardViewPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = usePublicBoard(boardId)
  const boardImageId = data?.meta.images[0]?.id ?? ''
  const { data: pins } = useReactionPins(boardImageId || undefined)

  const [composer, setComposer] = useState<ComposerState | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)
  const [burst, setBurst] = useState<BurstState>({ trigger: 0, screenX: 0, screenY: 0 })
  const [pinsVisible, setPinsVisible] = useState(true)

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white border-t-transparent" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p className="text-zinc-400">This board doesn&apos;t exist or isn&apos;t published yet.</p>
        <Link to="/feed" className="text-sm text-white underline hover:no-underline">
          Back to feed
        </Link>
      </div>
    )
  }

  const { schema, meta } = data

  function handleTappableTap(tappable: TappableZone) {
    if (tappable.action.type === 'appreciation') {
      const screenX = window.innerWidth / 2
      const screenY = window.innerHeight / 2
      setComposer({
        mode: 'appreciation',
        tappable,
        tapX: tappable.x + tappable.w / 2,
        tapY: tappable.y + tappable.h / 2,
        screenX,
        screenY,
      })
    }
    if (tappable.action.type === 'purchase') {
      alert('Coming soon — for-sale items launch in v2')
    }
  }

  function handleBoardTap(x: number, y: number, screenX: number, screenY: number) {
    setComposer({ mode: 'freeform', tapX: x, tapY: y, screenX, screenY })
  }

  function handleComposerSuccess(didPay: boolean) {
    const c = composer
    setComposer(null)
    if (c && didPay) {
      setBurst({ trigger: Date.now(), screenX: c.screenX, screenY: c.screenY })
    }
    // Refresh pin list so the new pin appears
    if (boardImageId) {
      queryClient.invalidateQueries({ queryKey: ['reactionPins', boardImageId] })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-black p-4">
      <div className="relative w-full max-w-sm">
        <div className="relative overflow-hidden rounded-xl shadow-[0_25px_60px_-12px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
          <BoardPlayer
            schema={schema}
            onTappableTap={handleTappableTap}
            onBoardTap={handleBoardTap}
          >
            {pinsVisible &&
              pins?.map((pin) => (
                <ReactionPin key={pin.id} pin={pin} onClick={(id) => setSelectedPinId(id)} />
              ))}
          </BoardPlayer>

          <CreatorOverlay
            name={meta.user.name}
            icon={meta.user.icon}
            username={meta.user.username}
          />

          {boardId && <ReactionsToggle boardId={boardId} onChange={setPinsVisible} />}
        </div>
      </div>

      {composer && (
        <ReactionComposer
          mode={composer.mode}
          tappable={composer.tappable}
          tapX={composer.tapX}
          tapY={composer.tapY}
          screenX={composer.screenX}
          screenY={composer.screenY}
          boardImageId={boardImageId}
          boardId={boardId!}
          creatorName={meta.user.name}
          onClose={() => setComposer(null)}
          onSuccess={handleComposerSuccess}
        />
      )}

      <PaymentSuccessBurst
        trigger={burst.trigger}
        screenX={burst.screenX}
        screenY={burst.screenY}
      />

      {selectedPinId && (
        <ReactionDetail reactionId={selectedPinId} onClose={() => setSelectedPinId(null)} />
      )}
    </div>
  )
}
