// Standard response shape from the Prymr backend (ResponseService)
export interface ApiResponse<T = unknown> {
  status: boolean
  message: string
  data: T
}

// Paginated response wrapper
export interface PaginatedData<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
}

// Reaction pin as returned by GET /board/fetchBoardReactionPins
export interface ReactionPin {
  id: string
  top: string | null
  left: string | null
  normalizedX: number | null
  normalizedY: number | null
  emoji: string | null
  contentType: string | null
  user: {
    profileIcon: string | null
    initialProfileIcon: string | null
    userName: string
  } | null
}

// Full reaction detail from GET /board/fetchReactionInfo
export interface ReactionDetail {
  contentText: string | null
  contentType: string | null
  contentUrl: string | null
  emoji: string | null
  createdAt: string
  totalLikes: number
  backgroundCapture: string | null
  user: {
    userName: string
    profileIcon: string | null
    id: string
  } | null
  newTransaction: Array<{
    totalAmount: string
    price: string
    senderUser: {
      id: string
      profileIcon: string | null
      firstName: string
      lastName: string
    } | null
  }>
}

// Shape returned by GET /board/fetchPublicUserBoardDetails
export interface PublicBoardImage {
  id: string
  url: string
  status: string
  title?: string
  description?: string
  subTitle?: string
  jsonElement: string
  allowComments: boolean
  lastEditedAt: string
  tappables: Array<{ id: string; contentLinks: unknown }>
}

export interface PublicBoardResponse {
  boardId: string
  createdAt: string
  user: { name: string; icon: string | null }
  images: PublicBoardImage[]
}
