import apiClient from './apiClient'
import type { User } from '../types/user.types'
import type { ApiResponse } from '../types/api.types'

interface LoginResponse {
  token: string
  user: User
}

interface RegisterRequest {
  email: string
  userName: string
  firstName: string
  lastName: string
  password: string
}

// The backend returns user fields and token at the same level in data.
// e.g. { id, userName, email, firstName, lastName, role, token, ... }
type RawAuthPayload = User & {
  token: string
  profileImage?: string
}

function toLoginResponse(raw: RawAuthPayload): LoginResponse {
  const { token, ...rest } = raw
  // Backend uses profileImage; our User type uses profileIcon
  const user: User = {
    id: rest.id,
    email: rest.email ?? '',
    userName: rest.userName ?? '',
    firstName: rest.firstName ?? '',
    lastName: rest.lastName ?? '',
    role: rest.role ?? 'standardUser',
    profileIcon: (raw as unknown as Record<string, unknown>).profileImage as string | undefined,
    initialProfileIcon: rest.initialProfileIcon,
    isAdmin: rest.isAdmin ?? false,
    isCompletedPaymentProcess: !!rest.isCompletedPaymentProcess,
    createdAt: rest.createdAt ?? new Date().toISOString(),
  }
  return { token, user }
}

export const authService = {
  async login(identifier: string, password: string): Promise<LoginResponse> {
    const res = await apiClient.post<ApiResponse<RawAuthPayload>>('/auth/loginUser', {
      userName: identifier,
      password,
    })
    return toLoginResponse(res.data.data)
  },

  async register(data: RegisterRequest): Promise<LoginResponse> {
    const res = await apiClient.post<ApiResponse<RawAuthPayload>>('/auth/createUser', data)
    return toLoginResponse(res.data.data)
  },

  async getProfile(): Promise<User> {
    const res = await apiClient.get<ApiResponse<RawAuthPayload>>('/auth/getProfileDetails')
    return toLoginResponse(res.data.data).user
  },

  async updateProfile(updates: Partial<User>): Promise<User> {
    const res = await apiClient.put<ApiResponse<RawAuthPayload>>(
      '/auth/updateProfileDetails',
      updates,
    )
    return toLoginResponse(res.data.data).user
  },

  async forgotPassword(email: string): Promise<void> {
    await apiClient.post('/auth/forgotPassword', { email })
  },

  async resetPassword(token: string, password: string): Promise<void> {
    await apiClient.post('/auth/verifyForgotPassword', { token, password })
  },
}
