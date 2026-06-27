export interface ScrollMotionState {
  blurPx: number
  shiftPx: number
}

export function getScrollMotionState(deltaY: number, deltaMs: number): ScrollMotionState {
  const safeDeltaMs = Math.max(16, deltaMs)
  const velocity = deltaY / safeDeltaMs
  const direction = Math.sign(velocity)
  const strength = Math.min(1, Math.abs(velocity) / 7.5)

  return {
    blurPx: round(strength * 12),
    shiftPx: round(direction * strength * 16)
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
