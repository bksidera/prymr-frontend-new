import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { TappableZone } from '../../types/board.types'
import { boardsService } from '../../services/boards.service'
import Button from '../ui/Button'

const QUICK_AMOUNTS = [1, 3, 5, 10]

// Whether the tap was on an appreciation tappable or anywhere else on the board
export type ComposerMode = 'appreciation' | 'freeform'

interface Props {
  mode: ComposerMode
  tappable?: TappableZone
  tapX: number
  tapY: number
  boardImageId: string
  boardId: string
  creatorName: string
  onClose: () => void
  onSuccess: () => void
}

type Step = 'compose' | 'success'

const EMOJI_QUICK = ['❤️', '🔥', '✨', '👏', '😍', '💯']

export default function ReactionComposer({
  mode,
  tappable,
  tapX,
  tapY,
  boardImageId,
  creatorName,
  onClose,
  onSuccess,
}: Props) {
  const suggestedAmount =
    tappable?.action.type === 'appreciation' ? (tappable.action.suggestedAmount ?? 5) : 5

  const [step, setStep] = useState<Step>('compose')
  const [contentType, setContentType] = useState<'emoji' | 'text'>('emoji')
  const [selectedEmoji, setSelectedEmoji] = useState('❤️')
  const [textContent, setTextContent] = useState('')
  const [wantsPayment, setWantsPayment] = useState(mode === 'appreciation')
  const [amount, setAmount] = useState(suggestedAmount)
  const [showCustom, setShowCustom] = useState(false)
  const [customInput, setCustomInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const finalAmount = showCustom ? parseFloat(customInput) || suggestedAmount : amount
  const content = contentType === 'emoji' ? selectedEmoji : textContent

  async function handleContinue() {
    setSubmitting(true)
    setError('')
    try {
      await boardsService.addReaction({
        boardImageId,
        reactionType: contentType,
        emoji: contentType === 'emoji' ? content : undefined,
        contentText: contentType === 'text' ? content : undefined,
        backgroundCapture: '',
        top: String(tapY),
        left: String(tapX),
      })
      setStep('success')
      setTimeout(onSuccess, 1800)
    } catch {
      setError('Failed to post reaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <AnimatePresence>
        <motion.div
          key="sheet"
          className="relative z-10 w-full max-w-sm rounded-t-2xl bg-zinc-900 px-5 pb-8 pt-4"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        >
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

          {step === 'compose' && (
            <div className="flex flex-col gap-5">
              <div>
                {mode === 'appreciation' ? (
                  <>
                    <h2 className="text-base font-semibold text-white">Appreciate this</h2>
                    <p className="mt-0.5 text-sm text-zinc-400">
                      Support {creatorName}&apos;s work
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="text-base font-semibold text-white">Leave a reaction</h2>
                    <p className="mt-0.5 text-sm text-zinc-400">Mark this moment on the board</p>
                  </>
                )}
              </div>

              {mode === 'freeform' && (
                <div className="flex flex-col gap-3">
                  <div className="flex gap-2">
                    {(['emoji', 'text'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setContentType(t)}
                        className={[
                          'rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors',
                          contentType === t
                            ? 'bg-white text-black'
                            : 'border border-zinc-700 text-zinc-400 hover:bg-zinc-800',
                        ].join(' ')}
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  {contentType === 'emoji' && (
                    <div className="flex flex-wrap gap-2">
                      {EMOJI_QUICK.map((e) => (
                        <button
                          key={e}
                          type="button"
                          onClick={() => setSelectedEmoji(e)}
                          className={[
                            'rounded-lg p-2 text-xl transition-colors',
                            selectedEmoji === e ? 'bg-zinc-700' : 'hover:bg-zinc-800',
                          ].join(' ')}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}

                  {contentType === 'text' && (
                    <textarea
                      placeholder="What moved you about this?"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      rows={2}
                      className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-white/20"
                    />
                  )}
                </div>
              )}

              {mode === 'appreciation' && (
                <>
                  <div className="grid grid-cols-4 gap-2">
                    {QUICK_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => {
                          setAmount(a)
                          setShowCustom(false)
                        }}
                        className={[
                          'rounded-lg py-2.5 text-sm font-medium transition-colors',
                          !showCustom && amount === a
                            ? 'bg-white text-black'
                            : 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800',
                        ].join(' ')}
                      >
                        ${a}
                      </button>
                    ))}
                  </div>
                  {!showCustom ? (
                    <button
                      type="button"
                      onClick={() => setShowCustom(true)}
                      className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
                    >
                      Enter a different amount
                    </button>
                  ) : (
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-zinc-400">
                        $
                      </span>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        placeholder="Amount"
                        value={customInput}
                        onChange={(e) => setCustomInput(e.target.value)}
                        className="w-full rounded-lg border border-zinc-700 bg-zinc-800 py-2.5 pl-7 pr-3 text-sm text-white placeholder:text-zinc-600 outline-none focus:ring-2 focus:ring-white/20"
                        autoFocus
                      />
                    </div>
                  )}
                  <p className="text-xs text-zinc-600">Payments coming soon</p>
                </>
              )}

              {mode === 'freeform' && (
                <div className="flex flex-col gap-3 rounded-lg border border-zinc-700 p-3">
                  <button
                    type="button"
                    onClick={() => setWantsPayment((p) => !p)}
                    className="flex w-full items-center justify-between"
                  >
                    <div className="text-left">
                      <p className="text-sm font-medium text-white">Add appreciation</p>
                      <p className="text-xs text-zinc-500">
                        Send {creatorName} something for this moment
                      </p>
                    </div>
                    <div
                      className={[
                        'h-5 w-9 rounded-full transition-colors',
                        wantsPayment ? 'bg-white' : 'bg-zinc-700',
                      ].join(' ')}
                    >
                      <div
                        className={[
                          'h-5 w-5 rounded-full border-2 border-zinc-700 bg-zinc-900 transition-transform',
                          wantsPayment ? 'translate-x-4 border-white' : 'translate-x-0',
                        ].join(' ')}
                      />
                    </div>
                  </button>

                  {wantsPayment && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-2 overflow-hidden"
                    >
                      <div className="grid grid-cols-4 gap-2">
                        {QUICK_AMOUNTS.map((a) => (
                          <button
                            key={a}
                            type="button"
                            onClick={() => {
                              setAmount(a)
                              setShowCustom(false)
                            }}
                            className={[
                              'rounded-lg py-2 text-sm font-medium transition-colors',
                              !showCustom && amount === a
                                ? 'bg-white text-black'
                                : 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800',
                            ].join(' ')}
                          >
                            ${a}
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-zinc-600">Payments coming soon</p>
                    </motion.div>
                  )}
                </div>
              )}

              {error && <p className="text-xs text-red-400">{error}</p>}

              <Button onClick={handleContinue} loading={submitting} fullWidth>
                {wantsPayment ? `Appreciate with $${finalAmount}` : 'Post reaction'}
              </Button>
            </div>
          )}

          {step === 'success' && (
            <motion.div
              className="flex flex-col items-center gap-3 py-4"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <motion.span
                className="text-4xl"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 0.5 }}
              >
                {mode === 'appreciation' || wantsPayment ? '❤️' : '📍'}
              </motion.span>
              <p className="text-base font-semibold text-white">
                {wantsPayment ? 'Appreciation noted' : 'Reaction posted'}
              </p>
              {wantsPayment && (
                <p className="text-sm text-zinc-500">
                  Your reaction is live — payments coming soon
                </p>
              )}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
