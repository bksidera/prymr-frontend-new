import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { boardsService, type BoardSummary } from '../services/boards.service'
import { authStore } from '../stores/authStore'

export default function FeedPage() {
  const isAuthenticated = authStore((s) => s.isAuthenticated)

  const { data: feed, isLoading: feedLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: () => boardsService.getFeed(1, 24),
  })

  const { data: myBoards } = useQuery({
    queryKey: ['myBoards'],
    queryFn: () => boardsService.getMyBoards(1, 12),
    enabled: isAuthenticated,
  })

  return (
    <div className="min-h-screen bg-black text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <span className="text-base font-semibold tracking-tight">Prymr</span>
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <Link
              to="/builder"
              className="rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-black hover:bg-zinc-100"
            >
              New board
            </Link>
          ) : (
            <Link to="/login" className="text-sm text-zinc-400 hover:text-white">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6 space-y-8">
        {isAuthenticated && myBoards && myBoards.items.length > 0 && (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
              My boards
            </h2>
            <BoardGrid boards={myBoards.items} showEdit />
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-semibold text-zinc-400 uppercase tracking-wider">
            Explore
          </h2>
          {feedLoading ? (
            <div className="flex justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white border-t-transparent" />
            </div>
          ) : feed && feed.items.length > 0 ? (
            <BoardGrid boards={feed.items} />
          ) : (
            <p className="py-12 text-center text-zinc-500">No boards yet.</p>
          )}
        </section>
      </main>
    </div>
  )
}

function BoardGrid({ boards, showEdit = false }: { boards: BoardSummary[]; showEdit?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {boards.map((board) => (
        <BoardCard key={board.id} board={board} showEdit={showEdit} />
      ))}
    </div>
  )
}

function BoardCard({ board, showEdit }: { board: BoardSummary; showEdit: boolean }) {
  const thumb = board.BoardImages[0]?.imageUrl

  return (
    <div className="group relative">
      <Link
        to={`/b/${board.id}`}
        className="block aspect-[9/16] overflow-hidden rounded-xl border border-white/10 bg-zinc-900"
      >
        {thumb ? (
          <img src={thumb} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full bg-gradient-to-b from-zinc-800 to-zinc-900" />
        )}
      </Link>
      {showEdit && (
        <Link
          to={`/builder/${board.id}`}
          className="absolute right-2 top-2 rounded-md bg-black/70 px-2 py-1 text-xs text-zinc-300 opacity-0 transition-opacity group-hover:opacity-100 hover:text-white"
        >
          Edit
        </Link>
      )}
    </div>
  )
}
