import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!email.trim()) return

    setError('')
    setLoading(true)
    try {
      await authService.forgotPassword(email.trim().toLowerCase())
      setSent(true)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-2xl">
          ✉️
        </div>
        <p className="text-sm text-zinc-300">
          Check your inbox — we sent a reset link to{' '}
          <span className="font-medium text-white">{email}</span>.
        </p>
        <Link to="/login" className="text-sm text-zinc-400 hover:text-white transition-colors">
          Back to sign in
        </Link>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-zinc-400">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="email"
        required
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Send reset link
      </Button>

      <Link
        to="/login"
        className="text-center text-sm text-zinc-500 hover:text-white transition-colors"
      >
        Back to sign in
      </Link>
    </form>
  )
}
