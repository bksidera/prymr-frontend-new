import { useEffect, useState } from 'react'

interface Props {
  boardId: string
  onChange: (visible: boolean) => void
}

const STORAGE_PREFIX = 'prymr-pins-visible:'

export default function ReactionsToggle({ boardId, onChange }: Props) {
  const [visible, setVisible] = useState(() => {
    if (typeof window === 'undefined') return true
    const stored = localStorage.getItem(STORAGE_PREFIX + boardId)
    return stored === null ? true : stored === '1'
  })

  useEffect(() => {
    onChange(visible)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_PREFIX + boardId, visible ? '1' : '0')
    }
  }, [visible, boardId, onChange])

  return (
    <button
      type="button"
      onClick={() => setVisible((v) => !v)}
      className="absolute right-3 top-3 z-30 rounded-full bg-black/40 p-2 text-white opacity-70 ring-1 ring-white/10 backdrop-blur transition-opacity hover:opacity-100"
      aria-label={visible ? 'Hide reactions' : 'Show reactions'}
      title={visible ? 'Hide reactions' : 'Show reactions'}
    >
      {visible ? <PinsIcon /> : <PinsSlashIcon />}
    </button>
  )
}

function PinsIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="8" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="14" cy="16" r="2.4" />
    </svg>
  )
}

function PinsSlashIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width={18}
      height={18}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="6" cy="8" r="2.4" />
      <circle cx="18" cy="6" r="2.4" />
      <circle cx="14" cy="16" r="2.4" />
      <line x1="3" y1="3" x2="21" y2="21" />
    </svg>
  )
}
