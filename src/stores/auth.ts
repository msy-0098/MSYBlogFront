import { defineStore } from 'pinia'

import { getAdminProfile, loginAdmin, type AdminUser } from '../api/admin'

const TOKEN_KEY = 'admin_token'
const USER_KEY = 'admin_user'

interface AuthState {
  token: string
  user: AdminUser | null
  loading: boolean
}

export const useAuthStore = defineStore('admin-auth', {
  state: (): AuthState => ({
    token: readToken(),
    user: readUser(),
    loading: false
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.token)
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
      if (!this.token) {
        return null
      }

      this.loading = true

      try {
        const user = await getAdminProfile()
        this.user = user
        localStorage.setItem(USER_KEY, JSON.stringify(user))
        return user
      } catch (error) {
        this.logout()
        throw error
      } finally {
        this.loading = false
      }
    },
    setSession(token: string, user: AdminUser) {
      this.token = token
      this.user = user
      localStorage.setItem(TOKEN_KEY, token)
      localStorage.setItem(USER_KEY, JSON.stringify(user))
    },
    logout() {
      this.token = ''
      this.user = null
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
  }
})

function readToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

function readUser(): AdminUser | null {
  const raw = localStorage.getItem(USER_KEY)

  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw) as AdminUser
  } catch {
    localStorage.removeItem(USER_KEY)
    return null
  }
}
