import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  loading?: boolean
  variant?: 'primary' | 'ghost'
  fullWidth?: boolean
}

export default function Button({
  children,
  loading = false,
  variant = 'primary',
  fullWidth = false,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/20'

  const variants = {
    primary: 'bg-white text-black hover:bg-zinc-100 active:bg-zinc-200',
    ghost:
      'bg-transparent text-zinc-300 border border-zinc-700 hover:bg-zinc-800 active:bg-zinc-700',
  }

  return (
    <button
      disabled={loading || disabled}
      className={[base, variants[variant], fullWidth ? 'w-full' : '', className].join(' ')}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {children}
    </button>
  )
}
