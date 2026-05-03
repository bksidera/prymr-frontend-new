import { motion } from 'framer-motion'
import { useReactionDetail } from '../../hooks/useBoard'

interface Props {
  reactionId: string
  onClose: () => void
}

export default function ReactionDetail({ reactionId, onClose }: Props) {
  const { data, isLoading } = useReactionDetail(reactionId)

  const payment = data?.newTransaction?.[0]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="absolute inset-0 bg-black/60" />

      <motion.div
        className="relative z-10 w-full max-w-sm rounded-t-2xl bg-zinc-900 px-5 pb-8 pt-4"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

        {isLoading ? (
          <div className="flex justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
          </div>
        ) : data ? (
          <div className="flex flex-col gap-4">
            {/* Creator info */}
            <div className="flex items-center gap-3">
              {data.user?.profileIcon ? (
                <img
                  src={data.user.profileIcon}
                  alt=""
                  className="h-9 w-9 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-zinc-700 text-sm font-medium text-white">
                  {data.user?.userName?.charAt(0).toUpperCase() ?? '?'}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-white">{data.user?.userName}</p>
                <p className="text-xs text-zinc-500">
                  {new Date(data.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content */}
            {data.emoji && <p className="text-3xl">{data.emoji}</p>}
            {data.contentText && <p className="text-sm text-zinc-200">{data.contentText}</p>}
            {data.contentUrl && data.contentType === 'photo' && (
              <img
                src={data.contentUrl}
                alt=""
                className="rounded-lg w-full object-cover max-h-48"
              />
            )}
            {data.contentUrl && data.contentType === 'video' && (
              <video src={data.contentUrl} controls className="rounded-lg w-full max-h-48" />
            )}

            {/* Payment */}
            {payment && (
              <div className="rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2.5 flex items-center justify-between">
                <span className="text-xs text-zinc-400">Appreciation sent</span>
                <span className="text-sm font-semibold text-white">${payment.totalAmount}</span>
              </div>
            )}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-zinc-500">
            Couldn&apos;t load this reaction.
          </p>
        )}
      </motion.div>
    </div>
  )
}
