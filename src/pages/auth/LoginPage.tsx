import LoginForm from '../../components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-white">Prymr</h1>
          <p className="mt-1 text-sm text-zinc-400">Sign in to your account</p>
        </div>
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
