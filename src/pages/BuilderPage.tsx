import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import BoardPlayer from '../components/board/BoardPlayer'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import { boardsService } from '../services/boards.service'
import { uploadsService } from '../services/uploads.service'
import { authStore } from '../stores/authStore'
import type { BoardElement, BoardSchema, TappableAction, TappableZone } from '../types/board.types'
import { createEmptyBoard, deserializeBoard } from '../utils/boardSchema'

const DRAFT_KEY = 'prymr-builder-draft'

type Selection =
  | { type: 'element'; id: string }
  | { type: 'tappable'; id: string }
  | { type: 'board' }

const actionLabels: Record<TappableAction['type'], string> = {
  appreciation: 'Appreciation',
  link: 'Link',
  reveal: 'Reveal',
  vanish: 'Vanish',
  switch: 'Switch',
  infoOverlay: 'Info overlay',
  follow: 'Follow',
  purchase: 'Purchase',
}

function clamp01(value: number) {
  if (Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

function asPercent(value: number) {
  return Math.round(value * 100)
}

function emptyElement(type: BoardElement['type'], zIndex: number): BoardElement {
  const base = {
    id: uuidv4(),
    type,
    x: 0.18,
    y: 0.18,
    w: 0.64,
    h: type === 'text' ? 0.14 : 0.34,
    rotation: 0,
    zIndex,
  }

  if (type === 'text') {
    return {
      ...base,
      content: 'Tap into the moment',
      style: {
        fontSize: 0.035,
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.35)',
        borderRadius: 8,
      },
    }
  }

  if (type === 'shape') {
    return {
      ...base,
      style: {
        backgroundColor: 'rgba(255,255,255,0.14)',
        borderRadius: 12,
      },
    }
  }

  return {
    ...base,
    url: '',
    autoplay: true,
    loop: true,
    muted: true,
  }
}

function emptyTappable(): TappableZone {
  return {
    id: uuidv4(),
    x: 0.28,
    y: 0.34,
    w: 0.44,
    h: 0.16,
    visible: true,
    style: {
      borderRadius: 10,
      color: 'rgba(255,255,255,0.1)',
    },
    action: {
      type: 'infoOverlay',
      title: 'Why this matters',
      body: 'Add context, an item detail, or the little spark that makes the board worth exploring.',
    },
  }
}

function loadInitialBoard(creatorId: string): BoardSchema {
  const stored = window.localStorage.getItem(DRAFT_KEY)
  if (stored) {
    try {
      return JSON.parse(stored) as BoardSchema
    } catch {
      window.localStorage.removeItem(DRAFT_KEY)
    }
  }

  return {
    ...createEmptyBoard(creatorId, '9:16'),
    title: 'Untitled Prymr board',
    description: 'A first interactive post.',
    background: 'linear-gradient(160deg, #111827 0%, #111827 42%, #0f766e 100%)',
    elements: [
      {
        ...emptyElement('text', 1),
        x: 0.12,
        y: 0.1,
        w: 0.76,
        h: 0.18,
        content: 'Make the post worth touching',
        style: {
          fontSize: 0.04,
          color: '#ffffff',
          backgroundColor: 'rgba(0,0,0,0)',
        },
      },
      {
        ...emptyElement('shape', 2),
        x: 0.2,
        y: 0.42,
        w: 0.6,
        h: 0.18,
        style: {
          backgroundColor: 'rgba(255,255,255,0.16)',
          borderRadius: 18,
        },
      },
    ],
    tappables: [emptyTappable()],
  }
}

export default function BuilderPage() {
  const { boardId: routeBoardId } = useParams<{ boardId: string }>()
  const navigate = useNavigate()
  const user = authStore((state) => state.user)
  const creatorId = user?.id ?? 'local-creator'
  const [board, setBoard] = useState<BoardSchema>(() => loadInitialBoard(creatorId))
  const [selection, setSelection] = useState<Selection>({ type: 'board' })
  const [savedBoardId, setSavedBoardId] = useState<string | null>(routeBoardId ?? null)
  const [savedBoardImageId, setSavedBoardImageId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)
  const [shareUrl, setShareUrl] = useState<string | null>(null)
  const [saveError, setSaveError] = useState('')

  useEffect(() => {
    if (!routeBoardId) return
    boardsService
      .getBoardSummary(routeBoardId)
      .then((summary) => {
        const jsonElement = summary.BoardImages[0]?.jsonElement
        if (jsonElement) setBoard(deserializeBoard(jsonElement))
        setSavedBoardId(summary.id)
        const imageId = summary.BoardImages[0]?.id
        if (imageId) setSavedBoardImageId(imageId)
      })
      .catch(() => {})
  }, [routeBoardId])

  const selectedElement = useMemo(
    () =>
      selection.type === 'element'
        ? board.elements.find((element) => element.id === selection.id)
        : undefined,
    [board.elements, selection],
  )

  const selectedTappable = useMemo(
    () =>
      selection.type === 'tappable'
        ? board.tappables.find((tappable) => tappable.id === selection.id)
        : undefined,
    [board.tappables, selection],
  )

  function updateBoard(updates: Partial<BoardSchema>) {
    setBoard((current) => ({ ...current, ...updates }))
  }

  function updateSelectedElement(updates: Partial<BoardElement>) {
    if (!selectedElement) return
    setBoard((current) => ({
      ...current,
      elements: current.elements.map((element) =>
        element.id === selectedElement.id ? { ...element, ...updates } : element,
      ),
    }))
  }

  function updateSelectedElementStyle(style: NonNullable<BoardElement['style']>) {
    if (!selectedElement) return
    updateSelectedElement({ style: { ...selectedElement.style, ...style } })
  }

  function updateSelectedTappable(updates: Partial<TappableZone>) {
    if (!selectedTappable) return
    setBoard((current) => ({
      ...current,
      tappables: current.tappables.map((tappable) =>
        tappable.id === selectedTappable.id ? { ...tappable, ...updates } : tappable,
      ),
    }))
  }

  function updateSelectedAction(updates: Partial<TappableAction>) {
    if (!selectedTappable) return
    updateSelectedTappable({
      action: { ...selectedTappable.action, ...updates } as TappableAction,
    })
  }

  function addElement(type: BoardElement['type']) {
    const element = emptyElement(type, board.elements.length + 1)
    setBoard((current) => ({ ...current, elements: [...current.elements, element] }))
    setSelection({ type: 'element', id: element.id })
  }

  function addTappable() {
    const tappable = emptyTappable()
    setBoard((current) => ({ ...current, tappables: [...current.tappables, tappable] }))
    setSelection({ type: 'tappable', id: tappable.id })
  }

  function removeSelection() {
    if (selection.type === 'element') {
      setBoard((current) => ({
        ...current,
        elements: current.elements.filter((element) => element.id !== selection.id),
        tappables: current.tappables.filter((tappable) => {
          const action = tappable.action
          if (action.type === 'vanish' || action.type === 'reveal')
            return action.elementId !== selection.id
          if (action.type === 'switch')
            return action.fromElementId !== selection.id && action.toElementId !== selection.id
          return true
        }),
      }))
    }

    if (selection.type === 'tappable') {
      setBoard((current) => ({
        ...current,
        tappables: current.tappables.filter((tappable) => tappable.id !== selection.id),
      }))
    }

    setSelection({ type: 'board' })
  }

  async function handleSave() {
    setIsSaving(true)
    setSaveError('')
    try {
      let imageId = savedBoardImageId
      if (!savedBoardId || !imageId) {
        const created = await boardsService.createBoard(board)
        setSavedBoardId(created.boardId)
        setSavedBoardImageId(created.boardImageId)
        imageId = created.boardImageId
        window.localStorage.removeItem(DRAFT_KEY)
        navigate(`/builder/${created.boardId}`, { replace: true })
      }
      await boardsService.saveBoard(imageId, board)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSaving(false)
    }
  }

  async function handlePublish() {
    if (!savedBoardId || !savedBoardImageId) {
      setSaveError('Save your board before publishing.')
      return
    }
    setIsPublishing(true)
    setSaveError('')
    try {
      const url = await boardsService.publishBoard(savedBoardId, savedBoardImageId)
      setShareUrl(url)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsPublishing(false)
    }
  }

  function handlePreviewTap(x: number, y: number) {
    if (selectedElement) {
      updateSelectedElement({
        x: clamp01(x - selectedElement.w / 2),
        y: clamp01(y - selectedElement.h / 2),
      })
    }
    if (selectedTappable) {
      updateSelectedTappable({
        x: clamp01(x - selectedTappable.w / 2),
        y: clamp01(y - selectedTappable.h / 2),
      })
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <header className="border-b border-white/10 bg-zinc-950/95 px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300">
              Prymr Builder MVP
            </p>
            <h1 className="mt-1 text-xl font-semibold">Compose a board that invites interaction</h1>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleSave} loading={isSaving}>
                Save
              </Button>
              <Button onClick={handlePublish} loading={isPublishing} disabled={!savedBoardImageId}>
                Publish
              </Button>
            </div>
            {saveError && <p className="text-xs text-red-400">{saveError}</p>}
            {shareUrl && (
              <div className="flex items-center gap-2">
                <a
                  href={shareUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="max-w-[200px] truncate text-xs text-teal-300 underline"
                >
                  {shareUrl}
                </a>
                <button
                  type="button"
                  className="text-xs text-zinc-400 hover:text-white"
                  onClick={() => void navigator.clipboard.writeText(shareUrl)}
                >
                  Copy
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="grid min-h-[calc(100vh-81px)] grid-cols-1 lg:grid-cols-[300px_minmax(360px,1fr)_340px]">
        <aside className="border-b border-white/10 bg-zinc-900/60 p-4 lg:border-b-0 lg:border-r">
          <section>
            <h2 className="text-sm font-semibold text-zinc-200">Board</h2>
            <button
              type="button"
              className={[
                'mt-3 w-full rounded-lg border px-3 py-2 text-left text-sm',
                selection.type === 'board'
                  ? 'border-teal-300 bg-teal-300/10'
                  : 'border-white/10 bg-black/20',
              ].join(' ')}
              onClick={() => setSelection({ type: 'board' })}
            >
              {board.title || 'Untitled board'}
            </button>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-200">Layers</h2>
              <div className="flex gap-1">
                {(['image', 'video', 'text', 'shape'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
                    onClick={() => addElement(type)}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {[...board.elements]
                .sort((a, b) => b.zIndex - a.zIndex)
                .map((element) => (
                  <button
                    key={element.id}
                    type="button"
                    className={[
                      'w-full rounded-lg border px-3 py-2 text-left text-sm',
                      selection.type === 'element' && selection.id === element.id
                        ? 'border-teal-300 bg-teal-300/10'
                        : 'border-white/10 bg-black/20 hover:bg-white/5',
                    ].join(' ')}
                    onClick={() => setSelection({ type: 'element', id: element.id })}
                  >
                    <span className="block font-medium capitalize">{element.type}</span>
                    <span className="block truncate text-xs text-zinc-500">
                      {element.content || element.url || element.id}
                    </span>
                  </button>
                ))}
            </div>
          </section>

          <section className="mt-6">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-zinc-200">Tappables</h2>
              <button
                type="button"
                className="rounded-md border border-white/10 px-2 py-1 text-xs text-zinc-300 hover:bg-white/10"
                onClick={addTappable}
              >
                add
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {board.tappables.map((tappable) => (
                <button
                  key={tappable.id}
                  type="button"
                  className={[
                    'w-full rounded-lg border px-3 py-2 text-left text-sm',
                    selection.type === 'tappable' && selection.id === tappable.id
                      ? 'border-teal-300 bg-teal-300/10'
                      : 'border-white/10 bg-black/20 hover:bg-white/5',
                  ].join(' ')}
                  onClick={() => setSelection({ type: 'tappable', id: tappable.id })}
                >
                  <span className="block font-medium">{actionLabels[tappable.action.type]}</span>
                  <span className="block text-xs text-zinc-500">
                    {asPercent(tappable.x)}%, {asPercent(tappable.y)}%
                  </span>
                </button>
              ))}
            </div>
          </section>
        </aside>

        <section className="flex items-center justify-center bg-[radial-gradient(circle_at_top,#134e4a_0%,#09090b_42%)] p-5">
          <div className="w-full max-w-[430px]">
            <div className="mb-3 flex items-center justify-between text-xs text-zinc-400">
              <span>Live preview</span>
              <span>Tap preview to position selected item</span>
            </div>
            <div className="rounded-xl border border-white/10 bg-black p-3 shadow-2xl">
              <BoardPlayer schema={board} onBoardTap={handlePreviewTap} />
            </div>
          </div>
        </section>

        <aside className="border-t border-white/10 bg-zinc-900/60 p-4 lg:border-l lg:border-t-0">
          <Inspector
            board={board}
            selectedElement={selectedElement}
            selectedTappable={selectedTappable}
            selection={selection}
            updateBoard={updateBoard}
            updateSelectedElement={updateSelectedElement}
            updateSelectedElementStyle={updateSelectedElementStyle}
            updateSelectedTappable={updateSelectedTappable}
            updateSelectedAction={updateSelectedAction}
            removeSelection={removeSelection}
          />
        </aside>
      </main>
    </div>
  )
}

interface InspectorProps {
  board: BoardSchema
  selectedElement?: BoardElement
  selectedTappable?: TappableZone
  selection: Selection
  updateBoard: (updates: Partial<BoardSchema>) => void
  updateSelectedElement: (updates: Partial<BoardElement>) => void
  updateSelectedElementStyle: (style: NonNullable<BoardElement['style']>) => void
  updateSelectedTappable: (updates: Partial<TappableZone>) => void
  updateSelectedAction: (updates: Partial<TappableAction>) => void
  removeSelection: () => void
}

function Inspector({
  board,
  selectedElement,
  selectedTappable,
  selection,
  updateBoard,
  updateSelectedElement,
  updateSelectedElementStyle,
  updateSelectedTappable,
  updateSelectedAction,
  removeSelection,
}: InspectorProps) {
  if (selection.type === 'board') {
    return (
      <Panel title="Board settings">
        <Input
          label="Title"
          value={board.title ?? ''}
          onChange={(event) => updateBoard({ title: event.target.value })}
        />
        <Input
          label="Description"
          value={board.description ?? ''}
          onChange={(event) => updateBoard({ description: event.target.value })}
        />
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Aspect ratio
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={board.aspectRatio}
            onChange={(event) =>
              updateBoard({ aspectRatio: event.target.value as BoardSchema['aspectRatio'] })
            }
          >
            <option value="9:16">9:16 portrait</option>
            <option value="1:1">1:1 square</option>
            <option value="4:3">4:3 landscape</option>
            <option value="16:9">16:9 wide</option>
          </select>
        </label>
        <Input
          label="Background"
          value={board.background}
          onChange={(event) => updateBoard({ background: event.target.value })}
        />
      </Panel>
    )
  }

  if (selectedElement) {
    return (
      <Panel title={`${selectedElement.type} layer`}>
        {(selectedElement.type === 'image' ||
          selectedElement.type === 'video' ||
          selectedElement.type === 'gif') && (
          <>
            <MediaUpload onUrl={(url) => updateSelectedElement({ url })} />
            <Input
              label="Or paste URL"
              value={selectedElement.url ?? ''}
              onChange={(event) => updateSelectedElement({ url: event.target.value })}
              placeholder="https://..."
            />
          </>
        )}

        {selectedElement.type === 'text' && (
          <>
            <label className="flex flex-col gap-1 text-sm text-zinc-300">
              Text
              <textarea
                className="min-h-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
                value={selectedElement.content ?? ''}
                onChange={(event) => updateSelectedElement({ content: event.target.value })}
              />
            </label>
            <Input
              label="Text color"
              type="color"
              value={selectedElement.style?.color ?? '#ffffff'}
              onChange={(event) => updateSelectedElementStyle({ color: event.target.value })}
            />
          </>
        )}

        {(selectedElement.type === 'shape' || selectedElement.type === 'text') && (
          <Input
            label="Fill"
            value={selectedElement.style?.backgroundColor ?? ''}
            onChange={(event) =>
              updateSelectedElementStyle({ backgroundColor: event.target.value })
            }
            placeholder="rgba(255,255,255,0.16)"
          />
        )}

        <PositionControls
          x={selectedElement.x}
          y={selectedElement.y}
          w={selectedElement.w}
          h={selectedElement.h}
          onChange={(updates) => updateSelectedElement(updates)}
        />

        <Slider
          label="Layer order"
          value={selectedElement.zIndex}
          min={0}
          max={30}
          step={1}
          onChange={(value) => updateSelectedElement({ zIndex: value })}
        />
        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={!!selectedElement.initiallyHidden}
            onChange={(event) => updateSelectedElement({ initiallyHidden: event.target.checked })}
          />
          Hidden until revealed
        </label>
        <Button variant="ghost" fullWidth onClick={removeSelection}>
          Delete layer
        </Button>
      </Panel>
    )
  }

  if (selectedTappable) {
    return (
      <Panel title="Tappable">
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Action
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={selectedTappable.action.type}
            onChange={(event) =>
              updateSelectedTappable({
                action: defaultAction(event.target.value as TappableAction['type']),
              })
            }
          >
            {Object.entries(actionLabels).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>

        <PositionControls
          x={selectedTappable.x}
          y={selectedTappable.y}
          w={selectedTappable.w}
          h={selectedTappable.h}
          onChange={(updates) => updateSelectedTappable(updates)}
        />

        <label className="flex items-center gap-2 text-sm text-zinc-300">
          <input
            type="checkbox"
            checked={selectedTappable.visible}
            onChange={(event) => updateSelectedTappable({ visible: event.target.checked })}
          />
          Show tappable outline
        </label>

        <ActionFields
          board={board}
          tappable={selectedTappable}
          updateSelectedAction={updateSelectedAction}
        />

        <Button variant="ghost" fullWidth onClick={removeSelection}>
          Delete tappable
        </Button>
      </Panel>
    )
  }

  return null
}

function defaultAction(type: TappableAction['type']): TappableAction {
  if (type === 'appreciation') return { type, suggestedAmount: 5 }
  if (type === 'link') return { type, url: 'https://prymr.xyz', openIn: 'new' }
  if (type === 'reveal') return { type, elementId: '' }
  if (type === 'vanish') return { type, elementId: '' }
  if (type === 'switch') return { type, fromElementId: '', toElementId: '' }
  if (type === 'infoOverlay') return { type, title: 'About this moment', body: '' }
  return { type: 'follow' }
}

function ActionFields({
  board,
  tappable,
  updateSelectedAction,
}: {
  board: BoardSchema
  tappable: TappableZone
  updateSelectedAction: (updates: Partial<TappableAction>) => void
}) {
  const action = tappable.action
  const elementOptions = board.elements.map((element) => (
    <option key={element.id} value={element.id}>
      {element.type}: {element.content || element.url || element.id.slice(0, 8)}
    </option>
  ))

  if (action.type === 'appreciation') {
    return (
      <Input
        label="Suggested amount"
        type="number"
        min={1}
        value={action.suggestedAmount ?? 5}
        onChange={(event) => updateSelectedAction({ suggestedAmount: Number(event.target.value) })}
      />
    )
  }

  if (action.type === 'link') {
    return (
      <>
        <Input
          label="URL"
          value={action.url}
          onChange={(event) => updateSelectedAction({ url: event.target.value })}
        />
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Open in
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={action.openIn}
            onChange={(event) =>
              updateSelectedAction({ openIn: event.target.value as 'same' | 'new' })
            }
          >
            <option value="new">New tab</option>
            <option value="same">Same tab</option>
          </select>
        </label>
      </>
    )
  }

  if (action.type === 'reveal' || action.type === 'vanish') {
    return (
      <label className="flex flex-col gap-1 text-sm text-zinc-300">
        Target layer
        <select
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
          value={action.elementId}
          onChange={(event) => updateSelectedAction({ elementId: event.target.value })}
        >
          <option value="">Choose a layer</option>
          {elementOptions}
        </select>
      </label>
    )
  }

  if (action.type === 'switch') {
    return (
      <>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Hide layer
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={action.fromElementId ?? ''}
            onChange={(event) => updateSelectedAction({ fromElementId: event.target.value })}
          >
            <option value="">No layer</option>
            {elementOptions}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Show layer
          <select
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={action.toElementId}
            onChange={(event) => updateSelectedAction({ toElementId: event.target.value })}
          >
            <option value="">Choose a layer</option>
            {elementOptions}
          </select>
        </label>
      </>
    )
  }

  if (action.type === 'infoOverlay') {
    return (
      <>
        <Input
          label="Overlay title"
          value={action.title}
          onChange={(event) => updateSelectedAction({ title: event.target.value })}
        />
        <label className="flex flex-col gap-1 text-sm text-zinc-300">
          Body
          <textarea
            className="min-h-24 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-white/20"
            value={action.body ?? ''}
            onChange={(event) => updateSelectedAction({ body: event.target.value })}
          />
        </label>
        <Input
          label="Image URL"
          value={action.imageUrl ?? ''}
          onChange={(event) => updateSelectedAction({ imageUrl: event.target.value })}
        />
        <Input
          label="Price"
          type="number"
          value={action.price ?? ''}
          onChange={(event) =>
            updateSelectedAction({ price: Number(event.target.value) || undefined })
          }
        />
        <Input
          label="Purchase URL"
          value={action.purchaseUrl ?? ''}
          onChange={(event) => updateSelectedAction({ purchaseUrl: event.target.value })}
        />
      </>
    )
  }

  return (
    <p className="rounded-lg bg-black/30 p-3 text-sm text-zinc-400">
      Follow action placeholder for MVP validation.
    </p>
  )
}

function MediaUpload({ onUrl }: { onUrl: (url: string) => void }) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadError, setUploadError] = useState('')

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError('')
    try {
      const url = await uploadsService.upload(file, (p) => setProgress(p.percent))
      onUrl(url)
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }

  return (
    <label className="flex flex-col gap-1 text-sm text-zinc-300">
      Upload file
      <div className="relative rounded-lg border border-dashed border-zinc-700 bg-zinc-900 py-3 text-center text-xs text-zinc-500 hover:border-zinc-500">
        {uploading ? `Uploading ${Math.round(progress)}%…` : 'Click to upload image / video'}
        <input
          type="file"
          accept="image/*,video/*"
          className="absolute inset-0 cursor-pointer opacity-0"
          onChange={handleFile}
          disabled={uploading}
        />
      </div>
      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
    </label>
  )
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
      {children}
    </section>
  )
}

function PositionControls({
  x,
  y,
  w,
  h,
  onChange,
}: {
  x: number
  y: number
  w: number
  h: number
  onChange: (updates: { x?: number; y?: number; w?: number; h?: number }) => void
}) {
  return (
    <div className="space-y-3 rounded-lg border border-white/10 bg-black/20 p-3">
      <Slider label="X" value={asPercent(x)} onChange={(value) => onChange({ x: value / 100 })} />
      <Slider label="Y" value={asPercent(y)} onChange={(value) => onChange({ y: value / 100 })} />
      <Slider
        label="Width"
        value={asPercent(w)}
        min={4}
        onChange={(value) => onChange({ w: value / 100 })}
      />
      <Slider
        label="Height"
        value={asPercent(h)}
        min={4}
        onChange={(value) => onChange({ h: value / 100 })}
      />
    </div>
  )
}

function Slider({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onChange,
}: {
  label: string
  value: number
  min?: number
  max?: number
  step?: number
  onChange: (value: number) => void
}) {
  return (
    <label className="block text-sm text-zinc-300">
      <span className="mb-1 flex items-center justify-between">
        <span>{label}</span>
        <span className="text-xs text-zinc-500">{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        className="w-full accent-teal-300"
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}
