import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authService } from '../../services/auth.service'
import { authStore } from '../../stores/authStore'
import Input from '../ui/Input'
import Button from '../ui/Button'

export default function RegisterForm() {
  const navigate = useNavigate()
  const { login } = authStore()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function set(field: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    setError('')
    setLoading(true)
    try {
      const { token, user } = await authService.register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        userName: form.userName.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
      })
      login(token, user)
      navigate('/feed')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          placeholder="Alex"
          value={form.firstName}
          onChange={(e) => set('firstName', e.target.value)}
          required
        />
        <Input
          label="Last name"
          placeholder="Lee"
          value={form.lastName}
          onChange={(e) => set('lastName', e.target.value)}
          required
        />
      </div>
      <Input
        label="Username"
        placeholder="alexlee"
        value={form.userName}
        onChange={(e) => set('userName', e.target.value)}
        autoComplete="username"
        required
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => set('email', e.target.value)}
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        type="password"
        placeholder="8+ characters"
        value={form.password}
        onChange={(e) => set('password', e.target.value)}
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Input
        label="Confirm password"
        type="password"
        placeholder="••••••••"
        value={form.confirmPassword}
        onChange={(e) => set('confirmPassword', e.target.value)}
        autoComplete="new-password"
        required
      />

      {error && (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      <Button type="submit" loading={loading} fullWidth>
        Create account
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Already have an account?{' '}
        <Link to="/login" className="text-white hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  )
}
