import { useParams } from 'react-router-dom'

export default function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  return (
    <div className="min-h-screen bg-black text-white">
      <p className="p-8 text-center text-zinc-400">@{username} — Phase 4</p>
    </div>
  )
}
