import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'

export type VerificationPurpose = 'register' | 'reset'

const storagePrefix = 'email-code-cooldown'
const memoryCooldowns = new Map<string, string>()

export interface VerificationCountdown {
  remaining: (email: string, purpose: VerificationPurpose) => Ref<number>
  start: (email: string, purpose: VerificationPurpose, seconds: number) => void
  dispose: () => void
}

export function useVerificationCountdown(): VerificationCountdown {
  const refs = new Map<string, Ref<number>>()
  let interval: ReturnType<typeof setInterval> | undefined
  let disposed = false

  const readRemaining = (key: string, now = Date.now()) => {
    const expiresAt = readExpiresAt(key, now)
    return expiresAt === null ? 0 : Math.ceil((expiresAt - now) / 1000)
  }

  const updateRef = (key: string, now = Date.now()) => {
    const value = refs.get(key) ?? ref(0)
    refs.set(key, value)
    value.value = readRemaining(key, now)
    return value
  }

  const stopIfIdle = () => {
    if (interval && ![...refs.keys()].some((key) => readRemaining(key) > 0)) {
      clearInterval(interval)
      interval = undefined
    }
  }

  const tick = () => {
    const now = Date.now()
    for (const key of refs.keys()) updateRef(key, now)
    stopIfIdle()
  }

  const ensureInterval = () => {
    if (!disposed && !interval) interval = setInterval(tick, 1000)
  }

  const remaining = (email: string, purpose: VerificationPurpose) => {
    const key = getCooldownKey(email, purpose)
    if (!key) return ref(0)

    const value = updateRef(key)
    if (value.value > 0) ensureInterval()
    return value
  }

  const start = (email: string, purpose: VerificationPurpose, seconds: number) => {
    const key = getCooldownKey(email, purpose)
    if (!key || !isValidCooldown(seconds) || disposed) return

    const now = Date.now()
    const currentExpiresAt = readExpiresAt(key, now) ?? 0
    const expiresAt = Math.max(currentExpiresAt, now + Math.ceil(seconds) * 1000)
    writeExpiresAt(key, expiresAt)
    updateRef(key, now)
    ensureInterval()
  }

  const dispose = () => {
    disposed = true
    if (interval) clearInterval(interval)
    interval = undefined
    refs.clear()
  }

  if (getCurrentScope()) onScopeDispose(dispose)

  return { remaining, start, dispose }
}

function getCooldownKey(email: string, purpose: VerificationPurpose) {
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail ? `${storagePrefix}:${purpose}:${normalizedEmail}` : ''
}

function isValidCooldown(seconds: number) {
  return Number.isFinite(seconds) && seconds > 0
}

function readExpiresAt(key: string, now = Date.now()) {
  const value = readStoredValue(key)
  if (value === null) return null

  const expiresAt = Number(value)
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    removeStoredValue(key)
    return null
  }

  return expiresAt
}

function writeExpiresAt(key: string, expiresAt: number) {
  writeStoredValue(key, String(expiresAt))
}

function readStoredValue(key: string) {
  const storage = getSessionStorage()
  if (storage) {
    try {
      return storage.getItem(key)
    } catch {
      // A blocked browser storage falls back to in-memory state.
    }
  }
  return memoryCooldowns.get(key) ?? null
}

function writeStoredValue(key: string, value: string) {
  const storage = getSessionStorage()
  if (storage) {
    try {
      storage.setItem(key, value)
      return
    } catch {
      // A blocked browser storage falls back to in-memory state.
    }
  }
  memoryCooldowns.set(key, value)
}

function removeStoredValue(key: string) {
  const storage = getSessionStorage()
  if (storage) {
    try {
      storage.removeItem(key)
    } catch {
      // The fallback map is still cleared below.
    }
  }
  memoryCooldowns.delete(key)
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return sessionStorage
  } catch {
    return null
  }
}
