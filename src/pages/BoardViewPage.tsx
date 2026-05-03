import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePublicBoard, useReactionPins } from '../hooks/useBoard'
import BoardPlayer from '../components/board/BoardPlayer'
import ReactionPin from '../components/board/ReactionPin'
import ReactionComposer, { type ComposerMode } from '../components/board/ReactionComposer'
import ReactionDetail from '../components/board/ReactionDetail'
import type { TappableZone } from '../types/board.types'

interface ComposerState {
  mode: ComposerMode
  tappable?: TappableZone
  tapX: number
  tapY: number
}

export default function BoardViewPage() {
  const { boardId } = useParams<{ boardId: string }>()
  const { data, isLoading, error } = usePublicBoard(boardId)
  const boardImageId = data?.meta.images[0]?.id ?? ''
  const { data: pins } = useReactionPins(boardImageId || undefined)

  const [composer, setComposer] = useState<ComposerState | null>(null)
  const [selectedPinId, setSelectedPinId] = useState<string | null>(null)

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
      setComposer({
        mode: 'appreciation',
        tappable,
        tapX: tappable.x + tappable.w / 2,
        tapY: tappable.y + tappable.h / 2,
      })
    }
    // follow action: no-op until Phase 4
  }

  function handleBoardTap(x: number, y: number) {
    setComposer({ mode: 'freeform', tapX: x, tapY: y })
  }

  return (
    <div className="flex min-h-screen flex-col bg-black">
      {/* Creator header */}
      <header className="flex items-center gap-3 px-4 py-3">
        {meta.user.icon ? (
          <img
            src={meta.user.icon}
            alt={meta.user.name}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-white">
            {meta.user.name.charAt(0).toUpperCase()}
          </div>
        )}
        <span className="text-sm font-medium text-white">{meta.user.name}</span>
      </header>

      {/* Board */}
      <main className="flex flex-1 items-center justify-center px-4 pb-4">
        <div className="w-full max-w-sm">
          <BoardPlayer
            schema={schema}
            onTappableTap={handleTappableTap}
            onBoardTap={handleBoardTap}
          >
            {/* Reaction pins rendered inside the board container */}
            {pins?.map((pin) => (
              <ReactionPin key={pin.id} pin={pin} onClick={(id) => setSelectedPinId(id)} />
            ))}
          </BoardPlayer>
        </div>
      </main>

      {/* Reaction composer overlay */}
      {composer && (
        <ReactionComposer
          mode={composer.mode}
          tappable={composer.tappable}
          tapX={composer.tapX}
          tapY={composer.tapY}
          boardImageId={boardImageId}
          boardId={boardId!}
          creatorName={meta.user.name}
          onClose={() => setComposer(null)}
          onSuccess={() => setComposer(null)}
        />
      )}

      {/* Reaction detail overlay */}
      {selectedPinId && (
        <ReactionDetail reactionId={selectedPinId} onClose={() => setSelectedPinId(null)} />
      )}
    </div>
  )
}
