import { useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import type { Stripe, StripeCardElement } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js'
import type { TappableZone } from '../../types/board.types'
import { boardsService } from '../../services/boards.service'
import { paymentsService } from '../../services/payments.service'

export type ComposerMode = 'appreciation' | 'freeform'

const QUICK_AMOUNTS = [1, 3, 5, 10] as const
const BUBBLE_W = 320
const BUBBLE_H_COMPOSE = 220
const BUBBLE_H_PAY = 280
const VIEWPORT_PAD = 8

interface Props {
  mode: ComposerMode
  tappable?: TappableZone
  /** Normalized 0-1 board-space coords for storing the reaction pin */
  tapX: number
  tapY: number
  /** Screen-space pixels for anchoring the floating bubble */
  screenX: number
  screenY: number
  boardImageId: string
  boardId: string
  creatorName: string
  onClose: () => void
  onSuccess: (didPay: boolean) => void
}

let stripePromise: Promise<Stripe | null> | null = null
function getStripe() {
  if (!stripePromise) {
    const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined
    if (!key) return null
    stripePromise = loadStripe(key)
  }
  return stripePromise
}

export default function ReactionComposer(props: Props) {
  const stripe = getStripe()
  if (!stripe) {
    return <ComposerInner {...props} />
  }
  return (
    <Elements stripe={stripe}>
      <ComposerInner {...props} />
    </Elements>
  )
}

function ComposerInner({
  mode,
  tappable,
  tapX,
  tapY,
  screenX,
  screenY,
  boardImageId,
  boardId,
  creatorName,
  onClose,
  onSuccess,
}: Props) {
  const stripe = useStripe()
  const elements = useElements()

  const suggested =
    tappable?.action.type === 'appreciation' ? (tappable.action.suggestedAmount ?? 5) : 5

  const [text, setText] = useState('')
  const [amount, setAmount] = useState<number | null>(mode === 'appreciation' ? suggested : null)
  const [step, setStep] = useState<'compose' | 'pay'>('compose')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const cardElementRef = useRef<StripeCardElement | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const bubbleHeight = step === 'pay' ? BUBBLE_H_PAY : BUBBLE_H_COMPOSE
  const position = useMemo(
    () => clampToViewport(screenX, screenY, BUBBLE_W, bubbleHeight),
    [screenX, screenY, bubbleHeight],
  )

  async function handleSend() {
    setError('')
    if (!text.trim() && amount === null) {
      setError('Add a message or pick an amount.')
      return
    }
    if (amount !== null) {
      setStep('pay')
      return
    }
    // Free path
    setSubmitting(true)
    try {
      await boardsService.addReaction({
        boardImageId,
        reactionType: 'text',
        contentText: text.trim() || undefined,
        backgroundCapture: '',
        top: String(tapY),
        left: String(tapX),
      })
      onSuccess(false)
    } catch {
      setError('Failed to post reaction. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleConfirmPay() {
    if (!stripe || !elements || amount === null) return
    setError('')
    setSubmitting(true)
    try {
      const card = cardElementRef.current ?? elements.getElement(CardElement)
      if (!card) throw new Error('Card element not mounted')

      const pmRes = await stripe.createPaymentMethod({ type: 'card', card })
      if (pmRes.error) throw new Error(pmRes.error.message ?? 'Card error')

      const intent = await paymentsService.createTipIntent({
        featureName: 'ReactionTipPayment',
        boardId,
        amount,
        paymentMethodId: pmRes.paymentMethod.id,
      })

      const confirmRes = await stripe.confirmCardPayment(intent.clientSecret, {
        payment_method: pmRes.paymentMethod.id,
      })
      if (confirmRes.error)
        throw new Error(confirmRes.error.message ?? 'Payment confirmation failed')

      await boardsService.addReaction({
        boardImageId,
        reactionType: 'text',
        contentText: text.trim() || undefined,
        backgroundCapture: '',
        top: String(tapY),
        left: String(tapX),
        paymentIntentId: intent.paymentIntentId,
      })

      onSuccess(true)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      {/* Backdrop — tap-outside dismisses */}
      <div
        className="fixed inset-0 z-40 bg-black/30"
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
      />

      <AnimatePresence>
        <motion.div
          key={step}
          role="dialog"
          aria-modal="true"
          className="fixed z-50 select-none rounded-2xl bg-zinc-900/95 p-3 ring-1 ring-white/10 backdrop-blur"
          style={{
            left: position.left,
            top: position.top,
            width: BUBBLE_W,
          }}
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.85 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {step === 'compose' && (
            <ComposeStep
              text={text}
              setText={setText}
              amount={amount}
              setAmount={setAmount}
              suggested={suggested}
              creatorName={creatorName}
              mode={mode}
              error={error}
              submitting={submitting}
              onSend={handleSend}
              inputRef={inputRef}
            />
          )}

          {step === 'pay' && (
            <PayStep
              amount={amount ?? suggested}
              text={text}
              creatorName={creatorName}
              error={error}
              submitting={submitting}
              onBack={() => setStep('compose')}
              onConfirm={handleConfirmPay}
              onCardReady={(el) => {
                cardElementRef.current = el
              }}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </>
  )
}

function ComposeStep({
  text,
  setText,
  amount,
  setAmount,
  suggested,
  creatorName,
  mode,
  error,
  submitting,
  onSend,
  inputRef,
}: {
  text: string
  setText: (s: string) => void
  amount: number | null
  setAmount: (n: number | null) => void
  suggested: number
  creatorName: string
  mode: ComposerMode
  error: string
  submitting: boolean
  onSend: () => void
  inputRef: React.RefObject<HTMLInputElement>
}) {
  return (
    <div className="flex flex-col gap-3">
      <input
        ref={inputRef}
        type="text"
        placeholder="Say something..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSend()
        }}
        className="w-full rounded-lg bg-zinc-800/80 px-3 py-2 text-sm text-white placeholder:text-zinc-500 outline-none ring-1 ring-white/5 focus:ring-white/20"
      />

      <div className="flex items-center gap-1.5">
        <span className="text-zinc-400" aria-hidden>
          $
        </span>
        {QUICK_AMOUNTS.map((a) => {
          const active = amount === a
          return (
            <button
              key={a}
              type="button"
              onClick={() => setAmount(active ? null : a)}
              className={[
                'flex-1 rounded-full px-2 py-1 text-xs font-medium transition-colors',
                active
                  ? 'bg-amber-300 text-black'
                  : 'bg-zinc-800/70 text-zinc-300 hover:bg-zinc-700',
              ].join(' ')}
            >
              ${a}
            </button>
          )
        })}
      </div>

      {mode === 'appreciation' && amount === null && (
        <button
          type="button"
          onClick={() => setAmount(suggested)}
          className="self-start text-xs text-zinc-500 hover:text-zinc-300"
        >
          Suggested ${suggested}
        </button>
      )}

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MediaButton label="Photo" disabled />
          <MediaButton label="Video" disabled />
          <MediaButton label="GIF" disabled />
        </div>
        <button
          type="button"
          onClick={onSend}
          disabled={submitting}
          className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black hover:bg-zinc-100 disabled:opacity-60"
          title={amount !== null ? `Appreciate ${creatorName} with $${amount}` : 'Post reaction'}
        >
          {amount !== null ? `Send $${amount}` : 'Send'}
        </button>
      </div>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

function PayStep({
  amount,
  text,
  creatorName,
  error,
  submitting,
  onBack,
  onConfirm,
  onCardReady,
}: {
  amount: number
  text: string
  creatorName: string
  error: string
  submitting: boolean
  onBack: () => void
  onConfirm: () => void
  onCardReady: (el: StripeCardElement) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-zinc-400 hover:text-zinc-200"
        >
          ← back
        </button>
        <span className="text-xs text-zinc-400">
          ${amount} to {creatorName}
        </span>
      </div>

      {text && (
        <p className="rounded-md bg-zinc-800/60 px-3 py-1.5 text-xs text-zinc-300">{text}</p>
      )}

      <div className="rounded-lg border border-white/10 bg-zinc-950/60 px-3 py-2.5">
        <CardElement
          options={{
            style: {
              base: {
                color: '#ffffff',
                fontSize: '14px',
                '::placeholder': { color: '#71717a' },
              },
              invalid: { color: '#fb7185' },
            },
          }}
          onReady={(el) => onCardReady(el as StripeCardElement)}
        />
      </div>

      <button
        type="button"
        onClick={onConfirm}
        disabled={submitting}
        className="rounded-full bg-amber-300 px-3 py-2 text-sm font-semibold text-black hover:bg-amber-200 disabled:opacity-60"
      >
        {submitting ? 'Processing…' : `Appreciate $${amount}`}
      </button>

      {error && <p className="text-xs text-rose-400">{error}</p>}
    </div>
  )
}

function MediaButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      title={disabled ? `${label} attach — coming soon` : label}
      className="rounded-full bg-zinc-800/70 px-2 py-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400 hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {label}
    </button>
  )
}

function clampToViewport(
  cx: number,
  cy: number,
  w: number,
  h: number,
): { left: number; top: number } {
  const vw = typeof window !== 'undefined' ? window.innerWidth : 360
  const vh = typeof window !== 'undefined' ? window.innerHeight : 640
  // Anchor bubble's center near the tap, then shift up so it's "above" the tap point
  const idealLeft = cx - w / 2
  const idealTop = cy - h - 16 // sit above the tap by 16px
  // If above doesn't fit, place below the tap
  const fitsAbove = idealTop >= VIEWPORT_PAD
  const top = fitsAbove ? idealTop : Math.min(cy + 16, vh - h - VIEWPORT_PAD)
  const left = Math.max(VIEWPORT_PAD, Math.min(idealLeft, vw - w - VIEWPORT_PAD))
  return { left, top: Math.max(VIEWPORT_PAD, top) }
}
