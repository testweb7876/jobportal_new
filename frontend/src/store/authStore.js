import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/services/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, accessToken, refreshToken) => {
        set({ user, accessToken, refreshToken, isAuthenticated: true })
        api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`
      },

      updateUser: (updates) => set((state) => ({
        user: { ...state.user, ...updates }
      })),
      clearAuth: () => {
        delete api.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
      },

      logout: async () => {
        try {
          await api.post('/auth/logout', { refreshToken: get().refreshToken })
        } catch { /* silent */ }
        get().clearAuth()
      },

      logoutAll: async () => {
        try {
          await api.post('/auth/logout-all')
        } finally {
          get().clearAuth()
        }
      },
      setAccessToken: (token) => {
        set({ accessToken: token })
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      },
    }),
    {
      name: 'jp-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken, isAuthenticated: s.isAuthenticated }),
    }
  )
)
export default useAuthStore