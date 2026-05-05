import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Link } from 'react-router-dom'

interface Props {
  name: string
  icon?: string | null
  username?: string | null
}

export default function CreatorOverlay({ name, icon, username }: Props) {
  const [introVisible, setIntroVisible] = useState(true)
  const [popoverOpen, setPopoverOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setIntroVisible(false), 3000)
    return () => clearTimeout(t)
  }, [])

  const profileHref = username ? `/u/${username}` : '#'

  return (
    <>
      {/* Intro overlay — large name + avatar, fades after 3s */}
      <AnimatePresence>
        {introVisible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            transition={{ duration: 0.4 }}
            className="pointer-events-none absolute inset-x-0 bottom-6 z-30 flex justify-center"
          >
            <div className="flex items-center gap-3 rounded-full bg-black/60 px-4 py-2 backdrop-blur-sm">
              <Avatar size={36} name={name} icon={icon} />
              <span className="text-sm font-medium text-white">{name}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent corner avatar — opens popover on tap */}
      <button
        type="button"
        onClick={() => setPopoverOpen((s) => !s)}
        className="absolute left-3 top-3 z-30 rounded-full opacity-70 transition-opacity hover:opacity-100"
        aria-label={`Creator: ${name}`}
      >
        <Avatar size={32} name={name} icon={icon} />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {popoverOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            className="absolute left-3 top-12 z-40 w-56 rounded-xl bg-zinc-900/95 p-3 shadow-lg ring-1 ring-white/10 backdrop-blur"
          >
            <div className="flex items-center gap-2">
              <Avatar size={32} name={name} icon={icon} />
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-white">{name}</div>
                {username && <div className="truncate text-xs text-zinc-400">@{username}</div>}
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                disabled
                className="flex-1 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium text-white/70"
                title="Follow coming soon"
              >
                Follow
              </button>
              {username && (
                <Link
                  to={profileHref}
                  className="flex-1 rounded-md bg-white px-3 py-1.5 text-center text-xs font-medium text-black hover:bg-zinc-200"
                >
                  Profile
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function Avatar({ size, name, icon }: { size: number; name: string; icon?: string | null }) {
  if (icon) {
    return (
      <img
        src={icon}
        alt={name}
        style={{ width: size, height: size }}
        className="rounded-full object-cover"
      />
    )
  }
  return (
    <div
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded-full bg-zinc-700 text-xs font-medium text-white"
    >
      {name.charAt(0).toUpperCase()}
    </div>
  )
}
