export const PARTICLE_LENGTH = 0.11
export const PARTICLE_THICKNESS = 0.02
export const PARTICLE_JUMP_AMPLITUDE = 0.1
export const DOME_BASE_Y = -1.18

export interface MouseFollowTarget {
  rotationX: number
  rotationY: number
  positionX: number
  positionY: number
}

export function getParticleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return 520
  }
  if (width < 640) {
    return 1080
  }
  if (width < 1024) {
    return 2300
  }
  return 5000
}

export function getMouseFollowTarget(mouseX: number, mouseY: number): MouseFollowTarget {
  return {
    rotationX: mouseY * 0.5,
    rotationY: mouseX * 0.72,
    positionX: mouseX * 0.82,
    positionY: DOME_BASE_Y - mouseY * 0.42
  }
}
