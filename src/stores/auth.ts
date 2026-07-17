import { defineStore } from 'pinia'

import { getAdminProfile, loginAdmin, logoutAdmin, type AdminUser } from '../api/admin'

const SESSION_KEY = 'admin_session'
const USER_KEY = 'admin_user'

interface AuthState {
  /** Session marker only — JWT lives in httpOnly cookie. */
  sessionActive: boolean
  user: AdminUser | null
  loading: boolean
}

export const useAuthStore = defineStore('admin-auth', {
  state: (): AuthState => ({
    sessionActive: readSessionActive(),
    user: readUser(),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => state.sessionActive,
    /** Kept for compatibility with older call sites that still check token. */
    token: (state) => (state.sessionActive ? 'cookie' : '')
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true

      try {
        const result = await loginAdmin({ username, password })
        this.setSession(result.user)
        return result.user
      } finally {
        this.loading = false
      }
    },
    async loadProfile() {
      if (!this.sessionActive) {
        return null
      }

      this.loading = true

      try {
        const user = await getAdminProfile()
        this.user = user
        this.sessionActive = true
        sessionStorage.setItem(SESSION_KEY, '1')
        sessionStorage.setItem(USER_KEY, JSON.stringify(user))
        return user
      } catch (error) {
        this.logout(false)
        throw error
      } finally {
        this.loading = false
      }
    },
    setSession(user: AdminUser) {
      this.sessionActive = true
      this.user = user
      sessionStorage.setItem(SESSION_KEY, '1')
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      // Migrate away from legacy JWT localStorage storage.
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    },
    async logout(callApi = true) {
      if (callApi) {
        try {
          await logoutAdmin()
        } catch {
          // Still clear local session markers.
        }
      }
      this.sessionActive = false
      this.user = null
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(USER_KEY)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_user')
    }
  }
})

function readSessionActive(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(SESSION_KEY) === '1'
}

function readUser(): AdminUser | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    sessionStorage.removeItem(USER_KEY)
    return null
  }
}