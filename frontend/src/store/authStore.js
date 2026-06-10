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

      logout: async () => {
        try {
          await api.post('/auth/logout', { refreshToken: get().refreshToken })
        } catch { /* silent */ }
        delete api.defaults.headers.common['Authorization']
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false })
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
