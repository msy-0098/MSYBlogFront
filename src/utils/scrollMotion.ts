export interface ScrollMotionState {
  blurPx: number
  shiftPx: number
}

export interface ScrollMotionOptions {
  disableBlur?: boolean
}

export function getScrollMotionState(
  deltaY: number,
  deltaMs: number,
  options: ScrollMotionOptions = {}
): ScrollMotionState {
  const safeDeltaMs = Math.max(16, deltaMs)
  const velocity = deltaY / safeDeltaMs
  const direction = Math.sign(velocity)
  const strength = Math.min(1, Math.abs(velocity) / 7.5)

  return {
    blurPx: options.disableBlur ? 0 : round(strength * 12),
    shiftPx: round(direction * strength * 16)
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}
