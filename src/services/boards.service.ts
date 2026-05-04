import apiClient from './apiClient'
import type {
  ApiResponse,
  PaginatedData,
  PublicBoardResponse,
  ReactionPin,
  ReactionDetail,
} from '../types/api.types'
import type { BoardSchema } from '../types/board.types'
import { serializeBoard, deserializeBoard } from '../utils/boardSchema'

export interface BoardSummary {
  id: string
  userId: string
  createdAt: string
  BoardImages: Array<{
    id: string
    imageUrl: string
    boardStatus: string
    jsonElement: string
  }>
}

export interface CreateBoardResult {
  boardId: string
  boardImageId: string
}

export const boardsService = {
  async createBoard(board: BoardSchema): Promise<CreateBoardResult> {
    // imageUrl is a query param; backend requires a valid URL so use a placeholder
    // when the board has no media elements yet.
    const imageUrl =
      board.elements.find((el) => el.url)?.url ??
      'https://prymr-media.s3.amazonaws.com/defaults/board-placeholder.png'
    const res = await apiClient.post<ApiResponse<CreateBoardResult>>(
      `/board/createBoard?imageUrl=${encodeURIComponent(imageUrl)}`,
      {},
    )
    return res.data.data
  },

  async saveBoard(boardId: string, board: BoardSchema): Promise<void> {
    await apiClient.put(`/board/updateBoardImage`, {
      boardId,
      jsonElement: serializeBoard(board),
    })
  },

  async publishBoard(boardId: string): Promise<string> {
    const res = await apiClient.post<ApiResponse<{ shareUrl: string }>>('/board/publishBoard', {
      boardId,
    })
    return res.data.data.shareUrl
  },

  async getBoard(boardId: string): Promise<BoardSchema> {
    const res = await apiClient.get<ApiResponse<BoardSummary>>(
      `/board/fetchPrivateUserBoardDetails?boardId=${boardId}`,
    )
    const jsonElement = res.data.data.BoardImages[0]?.jsonElement
    if (!jsonElement) throw new Error('Board has no content')
    return deserializeBoard(jsonElement)
  },

  async getBoardSummary(boardId: string): Promise<BoardSummary> {
    const res = await apiClient.get<ApiResponse<BoardSummary>>(
      `/board/fetchPrivateUserBoardDetails?boardId=${boardId}`,
    )
    return res.data.data
  },

  async getPublicBoard(
    boardId: string,
  ): Promise<{ schema: BoardSchema; meta: PublicBoardResponse }> {
    const res = await apiClient.get<ApiResponse<PublicBoardResponse>>(
      `/board/fetchPublicUserBoardDetails?boardId=${boardId}`,
    )
    const meta = res.data.data
    const jsonElement = meta.images[0]?.jsonElement
    if (!jsonElement) throw new Error('Board has no content')
    return { schema: deserializeBoard(jsonElement), meta }
  },

  async addReaction(data: {
    boardImageId: string
    reactionType: 'emoji' | 'photo' | 'video' | 'text'
    emoji?: string
    contentText?: string
    contentUrl?: string
    backgroundCapture: string
    top: string
    left: string
    paymentIntentId?: string
  }): Promise<{ id: string }> {
    const res = await apiClient.post<ApiResponse<{ id: string }>>('/board/addReaction', data)
    return res.data.data
  },

  async getReactionPins(boardImageId: string): Promise<ReactionPin[]> {
    const res = await apiClient.get<ApiResponse<{ data: ReactionPin[] }>>(
      `/board/fetchBoardReactionPins?boardImageId=${boardImageId}`,
    )
    return res.data.data.data
  },

  async getReactionDetail(reactionId: string): Promise<ReactionDetail> {
    const res = await apiClient.get<ApiResponse<{ data: ReactionDetail }>>(
      `/board/fetchReactionInfo?reactionId=${reactionId}`,
    )
    return res.data.data.data
  },

  async saveBoardSchema(boardImageId: string, schema: BoardSchema): Promise<void> {
    await apiClient.put('/board/saveBoardSchema', {
      boardImageId,
      jsonElement: serializeBoard(schema),
    })
  },

  async fetchMyCollections(): Promise<Array<{ id: string; collectionName: string }>> {
    const res = await apiClient.get<
      ApiResponse<{ data: Array<{ id: string; collectionName: string }> }>
    >('/board/fetchMyCollections')
    return res.data.data.data
  },

  async publishBoardFull(boardImageId: string, collectionId: string): Promise<void> {
    await apiClient.post('/board/publishBoard', {
      boardImageId,
      collectionId,
      isPrivateBoard: false,
      boardStatus: 'published',
    })
  },

  async getMyBoards(page = 1, pageSize = 10): Promise<PaginatedData<BoardSummary>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<BoardSummary>>>(
      `/board/fetchSavedBoard?page=${page}&pageSize=${pageSize}`,
    )
    return res.data.data
  },

  async getFeed(page = 1, pageSize = 10): Promise<PaginatedData<BoardSummary>> {
    const res = await apiClient.get<ApiResponse<PaginatedData<BoardSummary>>>(
      `/board/fetchPublicBoards?page=${page}&pageSize=${pageSize}`,
    )
    return res.data.data
  },

  async deleteBoard(boardId: string): Promise<void> {
    await apiClient.delete(`/board/deleteBoard?boardId=${boardId}`)
  },
}
