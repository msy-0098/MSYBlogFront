import { defineStore } from 'pinia'

import { getAdminProfile, loginAdmin, logoutAdmin, type AdminUser } from '../api/admin'

const SESSION_KEY = 'admin_session'
const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

interface AuthState {
  /** JWT also mirrored in sessionStorage for Bearer fallback when cookies fail. */
  token: string
  sessionActive: boolean
  user: AdminUser | null
  loading: boolean
}

export const useAuthStore = defineStore('admin-auth', {
  state: (): AuthState => ({
    token: readToken(),
    sessionActive: readSessionActive() || Boolean(readToken()),
    user: readUser(),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => state.sessionActive || Boolean(state.token)
  },
  actions: {
    async login(username: string, password: string) {
      this.loading = true

      try {
        const result = await loginAdmin({ username, password })
        this.setSession(result.token, result.user)
        return result.user
      } finally {
        this.loading = false
      }
    },
    async loadProfile() {
      if (!this.isAuthenticated) {
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
    setSession(token: string, user: AdminUser) {
      this.token = token
      this.sessionActive = true
      this.user = user
      sessionStorage.setItem(SESSION_KEY, '1')
      sessionStorage.setItem(TOKEN_KEY, token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(user))
      // Prefer sessionStorage over long-lived localStorage for tokens.
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
      this.token = ''
      this.sessionActive = false
      this.user = null
      sessionStorage.removeItem(SESSION_KEY)
      sessionStorage.removeItem(TOKEN_KEY)
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

function readToken(): string {
  if (typeof sessionStorage === 'undefined') return ''
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || ''
}

function readUser(): AdminUser | null {
  if (typeof sessionStorage === 'undefined') return null
  const raw = sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    sessionStorage.removeItem(USER_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
}