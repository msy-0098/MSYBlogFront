import { effectScope, nextTick, type EffectScope } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVerificationCountdown } from './useVerificationCountdown'

describe('useVerificationCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it('normalizes the email and restores a persisted cooldown in a new instance', () => {
    const first = useVerificationCountdown()
    first.start(' Reader@Example.com ', 'register', 15)

    expect(first.remaining('reader@example.com', 'register').value).toBe(15)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader%40example.com')).toBeTypeOf('string')

    const restored = useVerificationCountdown()
    expect(restored.remaining('READER@example.com', 'register').value).toBe(15)

    first.dispose()
    restored.dispose()
  })

  it('keeps register and reset cooldowns isolated for the same email', () => {
    const countdown = useVerificationCountdown()
    countdown.start('reader@example.com', 'register', 30)
    countdown.start('reader@example.com', 'reset', 10)

    expect(countdown.remaining('reader@example.com', 'register').value).toBe(30)
    expect(countdown.remaining('reader@example.com', 'reset').value).toBe(10)

    countdown.dispose()
  })

  it('keeps different normalized email addresses isolated', () => {
    const countdown = useVerificationCountdown()
    countdown.start('first@example.com', 'register', 30)
    countdown.start('second@example.com', 'register', 10)

    expect(countdown.remaining(' FIRST@example.com ', 'register').value).toBe(30)
    expect(countdown.remaining('second@example.com', 'register').value).toBe(10)

    countdown.dispose()
  })

  it('rounds remaining time up and removes expired storage', async () => {
    const countdown = useVerificationCountdown()
    countdown.start('reader@example.com', 'register', 3)

    await vi.advanceTimersByTimeAsync(1100)
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(2)

    await vi.advanceTimersByTimeAsync(1900)
    await nextTick()
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader%40example.com')).toBeNull()

    countdown.dispose()
  })

  it('uses one interval per instance and stops it when disposed without clearing storage', () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const countdown = useVerificationCountdown()
    countdown.start('reader@example.com', 'register', 30)
    countdown.start('reader@example.com', 'reset', 30)

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    countdown.dispose()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader%40example.com')).toBeTypeOf('string')
  })

  it('stops its interval automatically when the owning effect scope is disposed', () => {
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    let countdown: ReturnType<typeof useVerificationCountdown> | undefined
    let scope: EffectScope | undefined

    scope = effectScope()
    scope.run(() => {
      countdown = useVerificationCountdown()
      countdown.start('reader@example.com', 'register', 30)
    })

    scope.stop()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader%40example.com')).toBeTypeOf('string')
    countdown?.dispose()
  })

  it('ignores invalid cooldown values and clears invalid persisted values', () => {
    sessionStorage.setItem('email-code-cooldown:register:reader%40example.com', 'not-a-timestamp')
    const countdown = useVerificationCountdown()

    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader@example.com')).toBeNull()

    countdown.start('reader@example.com', 'register', 0)
    countdown.start('reader@example.com', 'register', Number.POSITIVE_INFINITY)
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)

    countdown.dispose()
  })

  it('clears empty persisted cooldown values instead of treating them as absent', () => {
    const key = 'email-code-cooldown:register:reader%40example.com'
    sessionStorage.setItem(key, '')
    const countdown = useVerificationCountdown()

    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem(key)).toBeNull()

    countdown.dispose()
  })

  it('uses an in-memory fallback when sessionStorage is unavailable', () => {
    vi.stubGlobal('sessionStorage', undefined)
    const first = useVerificationCountdown()
    first.start('memory@example.com', 'register', 20)

    const restored = useVerificationCountdown()
    expect(restored.remaining('memory@example.com', 'register').value).toBe(20)

    first.dispose()
    restored.dispose()
  })

  it('keeps a write-failed cooldown in memory when storage reads remain available', () => {
    const storage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(() => {
        throw new Error('quota exceeded')
      }),
      removeItem: vi.fn()
    }
    vi.stubGlobal('sessionStorage', storage)
    const first = useVerificationCountdown()
    first.start('write-failure@example.com', 'register', 20)

    expect(first.remaining('write-failure@example.com', 'register').value).toBe(20)
    const restored = useVerificationCountdown()
    expect(restored.remaining('write-failure@example.com', 'register').value).toBe(20)
    expect(storage.setItem).toHaveBeenCalledTimes(1)

    first.dispose()
    restored.dispose()
  })

  it('shares a pre-subscribed cooldown ref across instances without leaking its interval', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const second = useVerificationCountdown()
    const secondRemaining = second.remaining('shared@example.com', 'register')
    const first = useVerificationCountdown()

    first.start('shared@example.com', 'register', 30)
    expect(secondRemaining.value).toBe(30)
    expect(setIntervalSpy).toHaveBeenCalledTimes(1)

    second.dispose()
    expect(clearIntervalSpy).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(1100)
    expect(secondRemaining.value).toBe(29)

    first.dispose()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
  })

  it('rejects unsafe cooldown calculations before writing storage', () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem')
    const countdown = useVerificationCountdown()
    countdown.start('overflow@example.com', 'register', Number.MAX_VALUE)

    expect(countdown.remaining('overflow@example.com', 'register').value).toBe(0)
    expect(setItemSpy).not.toHaveBeenCalled()

    countdown.dispose()
  })

  it('encodes email segments and ignores unsupported purposes at runtime', () => {
    const countdown = useVerificationCountdown()
    countdown.start('reader:one@example.com', 'register', 30)
    countdown.start('reader@example.com', 'register:reset' as never, 30)

    expect(sessionStorage.getItem('email-code-cooldown:register:reader%3Aone%40example.com')).toBeTypeOf('string')
    expect(sessionStorage.length).toBe(1)
    expect(countdown.remaining('reader@example.com', 'register:reset' as never).value).toBe(0)

    countdown.dispose()
  })

  it('accepts and restores cooldowns longer than one day', () => {
    const first = useVerificationCountdown()
    first.start('long@example.com', 'register', 86401)

    expect(first.remaining('long@example.com', 'register').value).toBe(86401)
    const restored = useVerificationCountdown()
    expect(restored.remaining('long@example.com', 'register').value).toBe(86401)

    first.dispose()
    restored.dispose()
  })

  it('only extends an existing cooldown when retryAfter is later', () => {
    const countdown = useVerificationCountdown()
    countdown.start('reader@example.com', 'register', 45)
    countdown.start('reader@example.com', 'register', 10)

    expect(countdown.remaining('reader@example.com', 'register').value).toBe(45)

    countdown.start('reader@example.com', 'register', 90)
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(90)

    countdown.dispose()
  })
})
