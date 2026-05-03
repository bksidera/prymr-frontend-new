import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User } from '../types/user.types'

interface AuthState {
  token: string | null
  user: User | null
  isAuthenticated: boolean
  login: (token: string, user: User) => void
  logout: () => void
  updateUser: (updates: Partial<User>) => void
}

// Single source of truth for auth state.
// This is the ONLY place in the codebase that reads/writes auth data.
// The API client reads token via authStore.getState().token.
// Components read via useAuth() hook.
export const authStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isAuthenticated: false,

      login: (token, user) => set({ token, user, isAuthenticated: true }),

      logout: () => set({ token: null, user: null, isAuthenticated: false }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),
    }),
    {
      name: 'prymr-auth',
      // Only persist token and user — isAuthenticated is derived
      partialize: (state) => ({ token: state.token, user: state.user }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.isAuthenticated = !!state.token
        }
      },
    },
  ),
)
