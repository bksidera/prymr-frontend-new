import { authStore } from '../stores/authStore'
import { authService } from '../services/auth.service'
import type { User } from '../types/user.types'

export function useAuth() {
  const { token, user, isAuthenticated, login, logout } = authStore()

  async function signIn(identifier: string, password: string): Promise<void> {
    const { token: newToken, user: newUser } = await authService.login(identifier, password)
    login(newToken, newUser)
  }

  async function signOut(): Promise<void> {
    logout()
    window.location.href = '/login'
  }

  async function refreshProfile(): Promise<void> {
    if (!isAuthenticated) return
    const updatedUser = await authService.getProfile()
    authStore.getState().updateUser(updatedUser)
  }

  return {
    token,
    user,
    isAuthenticated,
    signIn,
    signOut,
    refreshProfile,
  }
}

export type AuthUser = User
