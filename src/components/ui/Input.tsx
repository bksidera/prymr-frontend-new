import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-sm font-medium text-zinc-300">{label}</label>}
        <input
          ref={ref}
          className={[
            'w-full rounded-lg border bg-zinc-900 px-3 py-2.5 text-sm text-white',
            'placeholder:text-zinc-500 outline-none',
            'focus:ring-2 focus:ring-white/20',
            error ? 'border-red-500' : 'border-zinc-700',
            className,
          ].join(' ')}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'

export default Input
