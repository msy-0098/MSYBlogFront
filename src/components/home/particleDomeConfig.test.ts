import { describe, expect, it } from 'vitest'

import {
  getParticleCount,
  getMouseFollowTarget,
  PARTICLE_JUMP_AMPLITUDE,
  PARTICLE_LENGTH,
  PARTICLE_THICKNESS
} from './particleDomeConfig'

describe('particleDomeConfig', () => {
  it('keeps the hero dome dense with jumping line particles', () => {
    expect(getParticleCount(1440, false)).toBeGreaterThanOrEqual(3600)
    expect(getParticleCount(820, false)).toBeGreaterThanOrEqual(2200)
    expect(getParticleCount(390, false)).toBeGreaterThanOrEqual(980)
    expect(PARTICLE_LENGTH).toBeGreaterThan(PARTICLE_THICKNESS * 3)
    expect(PARTICLE_JUMP_AMPLITUDE).toBeGreaterThanOrEqual(0.08)
  })

  it('maps mouse movement to a visible eased follow target', () => {
    const target = getMouseFollowTarget(0.5, -0.5)

    expect(target.rotationY).toBeGreaterThanOrEqual(0.32)
    expect(target.rotationX).toBeLessThanOrEqual(-0.22)
    expect(target.positionX).toBeGreaterThan(0.3)
    expect(target.positionY).toBeGreaterThan(-1.4)
  })
})
