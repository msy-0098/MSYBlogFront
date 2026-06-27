import { describe, expect, it } from 'vitest'

import { getScrollMotionState } from './scrollMotion'

describe('scrollMotion', () => {
  it('turns scroll velocity into bounded blur and directional shift', () => {
    const slow = getScrollMotionState(12, 80)
    const fastDown = getScrollMotionState(420, 32)
    const fastUp = getScrollMotionState(-420, 32)

    expect(slow.blurPx).toBeLessThan(2)
    expect(fastDown.blurPx).toBeGreaterThan(slow.blurPx * 3)
    expect(fastDown.blurPx).toBeLessThanOrEqual(12)
    expect(fastDown.shiftPx).toBeGreaterThan(0)
    expect(fastUp.shiftPx).toBeLessThan(0)
    expect(Math.abs(fastDown.shiftPx)).toBeLessThanOrEqual(16)
  })
})
