import { describe, expect, it } from 'vitest'

import {
  getParticleCount,
  getMouseFollowTarget,
  PARTICLE_RADIUS
} from './particleDomeConfig'

describe('particleDomeConfig', () => {
  it('keeps the hero dome dense while preserving smaller round particles', () => {
    expect(getParticleCount(1440, false)).toBeGreaterThanOrEqual(2200)
    expect(getParticleCount(820, false)).toBeGreaterThanOrEqual(1400)
    expect(getParticleCount(390, false)).toBeGreaterThanOrEqual(760)
    expect(PARTICLE_RADIUS).toBeLessThanOrEqual(0.018)
  })

  it('maps mouse movement to a visible eased follow target', () => {
    const target = getMouseFollowTarget(0.5, -0.5)

    expect(target.rotationY).toBeGreaterThanOrEqual(0.32)
    expect(target.rotationX).toBeLessThanOrEqual(-0.22)
    expect(target.positionX).toBeGreaterThan(0.3)
    expect(target.positionY).toBeGreaterThan(-1.4)
  })
})
