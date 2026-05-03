import apiClient from './apiClient'
import type { ApiResponse } from '../types/api.types'
import type { User } from '../types/user.types'

export const socialService = {
  async followUser(userId: string): Promise<void> {
    await apiClient.post('/social/followUser', { userId })
  },

  async unfollowUser(userId: string): Promise<void> {
    await apiClient.delete('/social/unfollowUser', { data: { userId } })
  },

  async getFollowers(userId: string): Promise<User[]> {
    const res = await apiClient.get<ApiResponse<User[]>>(`/social/fetchFollowers?userId=${userId}`)
    return res.data.data
  },

  async getFollowing(userId: string): Promise<User[]> {
    const res = await apiClient.get<ApiResponse<User[]>>(`/social/fetchFollowing?userId=${userId}`)
    return res.data.data
  },
}
