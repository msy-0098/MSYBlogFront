import { nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useVerificationCountdown } from './useVerificationCountdown'

describe('useVerificationCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    sessionStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
    sessionStorage.clear()
  })

  it('normalizes the email and restores a persisted cooldown in a new instance', () => {
    const first = useVerificationCountdown()
    first.start(' Reader@Example.com ', 'register', 15)

    expect(first.remaining('reader@example.com', 'register').value).toBe(15)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader@example.com')).toBeTypeOf('string')

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

  it('rounds remaining time up and removes expired storage', async () => {
    const countdown = useVerificationCountdown()
    countdown.start('reader@example.com', 'register', 3)

    await vi.advanceTimersByTimeAsync(1100)
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(2)

    await vi.advanceTimersByTimeAsync(1900)
    await nextTick()
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader@example.com')).toBeNull()

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
    expect(sessionStorage.getItem('email-code-cooldown:register:reader@example.com')).toBeTypeOf('string')
  })

  it('ignores invalid cooldown values and clears invalid persisted values', () => {
    sessionStorage.setItem('email-code-cooldown:register:reader@example.com', 'not-a-timestamp')
    const countdown = useVerificationCountdown()

    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem('email-code-cooldown:register:reader@example.com')).toBeNull()

    countdown.start('reader@example.com', 'register', 0)
    countdown.start('reader@example.com', 'register', Number.POSITIVE_INFINITY)
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)

    countdown.dispose()
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
