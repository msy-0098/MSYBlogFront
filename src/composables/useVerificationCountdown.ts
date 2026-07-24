import { getCurrentScope, onScopeDispose, ref, type Ref } from 'vue'

export type VerificationPurpose = 'register' | 'reset'

const storagePrefix = 'email-code-cooldown'
const memoryCooldowns = new Map<string, string>()
const sharedStates = new Map<string, SharedCountdownState>()
let interval: ReturnType<typeof setInterval> | undefined

interface SharedCountdownState {
  remaining: Ref<number>
  subscribers: Set<symbol>
}

export interface VerificationCountdown {
  remaining: (email: string, purpose: VerificationPurpose) => Ref<number>
  start: (email: string, purpose: VerificationPurpose, seconds: number) => void
  release: (email: string, purpose: VerificationPurpose) => void
  dispose: () => void
}

export function useVerificationCountdown(): VerificationCountdown {
  const subscriber = Symbol('verification-countdown')
  const keys = new Set<string>()
  let disposed = false

  const subscribe = (key: string) => {
    const state = getSharedState(key)
    state.subscribers.add(subscriber)
    keys.add(key)
    return state
  }

  const remaining = (email: string, purpose: VerificationPurpose) => {
    const key = getCooldownKey(email, purpose)
    if (!key || disposed) return ref(0)

    const state = subscribe(key)
    syncState(key)
    ensureInterval()
    return state.remaining
  }

  const start = (email: string, purpose: VerificationPurpose, seconds: number) => {
    const key = getCooldownKey(email, purpose)
    if (!key || disposed || !isValidCooldown(seconds)) return

    const now = Date.now()
    const requestedExpiresAt = now + Math.ceil(seconds) * 1000
    if (!Number.isFinite(requestedExpiresAt) || !Number.isSafeInteger(requestedExpiresAt)) return

    subscribe(key)
    const currentExpiresAt = readExpiresAt(key, now) ?? 0
    const expiresAt = Math.max(currentExpiresAt, requestedExpiresAt)
    if (!Number.isSafeInteger(expiresAt)) return

    writeExpiresAt(key, expiresAt)
    syncState(key, now)
    ensureInterval()
  }

  const release = (email: string, purpose: VerificationPurpose) => {
    const key = getCooldownKey(email, purpose)
    if (!key || disposed) return

    unsubscribe(key)
  }

  const dispose = () => {
    if (disposed) return
    disposed = true
    for (const key of [...keys]) unsubscribe(key)
  }

  if (getCurrentScope()) onScopeDispose(dispose)

  function unsubscribe(key: string) {
    keys.delete(key)
    const state = sharedStates.get(key)
    if (!state) return

    state.subscribers.delete(subscriber)
    if (state.subscribers.size === 0 && syncState(key) === 0) {
      sharedStates.delete(key)
    }
    stopIntervalIfIdle()
  }

  return { remaining, start, release, dispose }
}

function getSharedState(key: string): SharedCountdownState {
  const existing = sharedStates.get(key)
  if (existing) return existing

  const state = { remaining: ref(0), subscribers: new Set<symbol>() }
  sharedStates.set(key, state)
  return state
}

function syncState(key: string, now = Date.now()) {
  const state = getSharedState(key)
  const expiresAt = readExpiresAt(key, now)
  state.remaining.value = expiresAt === null ? 0 : Math.ceil((expiresAt - now) / 1000)
  return state.remaining.value
}

function ensureInterval() {
  if (!interval && hasActiveSubscriber()) interval = setInterval(tick, 1000)
}

function tick() {
  const now = Date.now()
  let active = false
  for (const [key, state] of sharedStates) {
    if (state.subscribers.size === 0) continue
    if (syncState(key, now) > 0) active = true
  }
  if (!active) stopInterval()
}

function hasActiveSubscriber() {
  return [...sharedStates.values()].some((state) => state.subscribers.size > 0 && state.remaining.value > 0)
}

function stopIntervalIfIdle() {
  if (!hasActiveSubscriber()) stopInterval()
}

function stopInterval() {
  if (interval) clearInterval(interval)
  interval = undefined
}

function getCooldownKey(email: string, purpose: unknown) {
  if (!isVerificationPurpose(purpose) || typeof email !== 'string') return ''
  const normalizedEmail = email.trim().toLowerCase()
  return normalizedEmail
    ? `${storagePrefix}:${encodeURIComponent(purpose)}:${encodeURIComponent(normalizedEmail)}`
    : ''
}

function isVerificationPurpose(purpose: unknown): purpose is VerificationPurpose {
  return purpose === 'register' || purpose === 'reset'
}

function isValidCooldown(seconds: number) {
  return Number.isFinite(seconds) && seconds > 0
}

function readExpiresAt(key: string, now = Date.now()) {
  const value = readStoredValue(key)
  if (value === null) return null

  const expiresAt = Number(value)
  if (!Number.isFinite(expiresAt) || !Number.isSafeInteger(expiresAt) || expiresAt <= now) {
    removeStoredValue(key)
    return null
  }

  return expiresAt
}

function writeExpiresAt(key: string, expiresAt: number) {
  writeStoredValue(key, String(expiresAt))
}

function readStoredValue(key: string) {
  const memoryValue = memoryCooldowns.get(key)
  if (memoryValue !== undefined) return memoryValue

  const storage = getSessionStorage()
  if (!storage) return null
  try {
    return storage.getItem(key)
  } catch {
    return null
  }
}

function writeStoredValue(key: string, value: string) {
  const storage = getSessionStorage()
  if (storage) {
    try {
      storage.setItem(key, value)
      memoryCooldowns.delete(key)
      return
    } catch {
      // A blocked browser storage falls back to in-memory state.
    }
  }
  memoryCooldowns.set(key, value)
}

function removeStoredValue(key: string) {
  memoryCooldowns.delete(key)
  const storage = getSessionStorage()
  if (!storage) return
  try {
    storage.removeItem(key)
  } catch {
    // Storage cleanup is best-effort when browser storage is blocked.
  }
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === 'undefined') return null
  try {
    return sessionStorage
  } catch {
    return null
  }
}
