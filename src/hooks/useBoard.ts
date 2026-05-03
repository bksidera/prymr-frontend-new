import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { boardsService } from '../services/boards.service'

export function usePublicBoard(boardId: string | undefined) {
  return useQuery({
    queryKey: ['board', 'public', boardId],
    queryFn: () => boardsService.getPublicBoard(boardId!),
    enabled: !!boardId,
    staleTime: 5 * 60 * 1000,
  })
}

export function useReactionPins(boardImageId: string | undefined) {
  return useQuery({
    queryKey: ['reactions', 'pins', boardImageId],
    queryFn: () => boardsService.getReactionPins(boardImageId!),
    enabled: !!boardImageId,
    staleTime: 30 * 1000, // refresh pins every 30s
  })
}

export function useReactionDetail(reactionId: string | undefined) {
  return useQuery({
    queryKey: ['reaction', 'detail', reactionId],
    queryFn: () => boardsService.getReactionDetail(reactionId!),
    enabled: !!reactionId,
  })
}

export function useAddReaction(boardImageId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: boardsService.addReaction,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['reactions', 'pins', boardImageId] })
    },
  })
}
