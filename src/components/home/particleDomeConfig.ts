export const PARTICLE_RADIUS = 0.016
export const DOME_BASE_Y = -1.4

export interface MouseFollowTarget {
  rotationX: number
  rotationY: number
  positionX: number
  positionY: number
}

export function getParticleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return 260
  }
  if (width < 640) {
    return 840
  }
  if (width < 1024) {
    return 1500
  }
  return 2600
}

export function getMouseFollowTarget(mouseX: number, mouseY: number): MouseFollowTarget {
  return {
    rotationX: mouseY * 0.5,
    rotationY: mouseX * 0.72,
    positionX: mouseX * 0.72,
    positionY: DOME_BASE_Y - mouseY * 0.38
  }
}
