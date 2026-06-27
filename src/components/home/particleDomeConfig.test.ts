import { describe, expect, it } from 'vitest'

import {
  COOL_PARTICLE_PALETTE_INDICES,
  DOME_CENTER_CLEAR_WIDTH,
  DOME_RING_COUNT,
  PARTICLE_JUMP_AMPLITUDE,
  PARTICLE_LENGTH,
  PARTICLE_OPACITY,
  PARTICLE_THICKNESS,
  WARM_PARTICLE_PALETTE_INDICES,
  createDomeParticleSpecs,
  getBoundaryImpact,
  getContainedDomeFlowPoint,
  getParticleCount,
  getFluidDomeFollowTarget,
  getMouseFollowTarget,
  isWithinDomeClearZone
} from './particleDomeConfig'

describe('particleDomeConfig', () => {
  it('keeps the Antigravity-inspired particles slim and gently jumping', () => {
    expect(getParticleCount(1440, false)).toBeGreaterThanOrEqual(1300)
    expect(getParticleCount(1440, false)).toBeLessThanOrEqual(1900)
    expect(getParticleCount(820, false)).toBeGreaterThanOrEqual(720)
    expect(getParticleCount(390, false)).toBeGreaterThanOrEqual(320)
    expect(PARTICLE_OPACITY).toBeLessThanOrEqual(0.56)
    expect(PARTICLE_LENGTH).toBeLessThanOrEqual(0.085)
    expect(PARTICLE_THICKNESS).toBeLessThanOrEqual(0.014)
    expect(PARTICLE_LENGTH).toBeGreaterThan(PARTICLE_THICKNESS * 5)
    expect(PARTICLE_JUMP_AMPLITUDE).toBeLessThanOrEqual(0.06)
    expect(PARTICLE_JUMP_AMPLITUDE).toBeGreaterThan(0.025)
  })

  it('generates an ordered hollow dome with cool-left and warm-right color regions', () => {
    const specs = createDomeParticleSpecs(900, 20260627)
    const usedRings = new Set(specs.map((spec) => spec.ringIndex))
    const centerLeaks = specs.filter((spec) => isWithinDomeClearZone(spec.x, spec.y))
    const leftParticles = specs.filter((spec) => spec.x < -DOME_CENTER_CLEAR_WIDTH)
    const rightParticles = specs.filter((spec) => spec.x > DOME_CENTER_CLEAR_WIDTH)
    const coolLeft = leftParticles.filter((spec) =>
      COOL_PARTICLE_PALETTE_INDICES.includes(spec.paletteIndex)
    )
    const warmRight = rightParticles.filter((spec) =>
      WARM_PARTICLE_PALETTE_INDICES.includes(spec.paletteIndex)
    )

    expect(specs).toHaveLength(900)
    expect(usedRings.size).toBeGreaterThanOrEqual(DOME_RING_COUNT - 4)
    expect(centerLeaks).toHaveLength(0)
    expect(coolLeft.length / leftParticles.length).toBeGreaterThan(0.62)
    expect(warmRight.length / rightParticles.length).toBeGreaterThan(0.58)
  })

  it('keeps the visible dome as a sparse halo instead of filling the whole viewport', () => {
    const specs = createDomeParticleSpecs(1200, 20260627)
    const farTopOrBottom = specs.filter((spec) => spec.y > 5.25 || spec.y < -2.25)
    const nearSideHalo = specs.filter(
      (spec) => Math.abs(spec.x) > DOME_CENTER_CLEAR_WIDTH && spec.y > -1.8 && spec.y < 4.95
    )
    const sideWalls = specs.filter((spec) => Math.abs(spec.x) > 5.4)
    const topOrBottomArc = specs.filter(
      (spec) => Math.abs(spec.x) < 5.2 && (spec.y > 3.6 || spec.y < -1.15)
    )
    const leftParticles = specs.filter((spec) => spec.x < -DOME_CENTER_CLEAR_WIDTH)
    const rightParticles = specs.filter((spec) => spec.x > DOME_CENTER_CLEAR_WIDTH)
    const coolLeft = leftParticles.filter((spec) =>
      COOL_PARTICLE_PALETTE_INDICES.includes(spec.paletteIndex)
    )
    const warmRight = rightParticles.filter((spec) =>
      WARM_PARTICLE_PALETTE_INDICES.includes(spec.paletteIndex)
    )

    expect(farTopOrBottom.length / specs.length).toBeLessThan(0.16)
    expect(nearSideHalo.length / specs.length).toBeGreaterThan(0.62)
    expect(sideWalls.length / specs.length).toBeLessThan(0.38)
    expect(topOrBottomArc.length / specs.length).toBeGreaterThan(0.16)
    expect(coolLeft.length / leftParticles.length).toBeGreaterThan(0.78)
    expect(warmRight.length / rightParticles.length).toBeGreaterThan(0.72)
  })

  it('maps mouse movement to a visible eased follow target', () => {
    const target = getMouseFollowTarget(0.5, -0.5)

    expect(target.rotationY).toBeGreaterThanOrEqual(0.32)
    expect(target.rotationX).toBeLessThanOrEqual(-0.22)
    expect(target.positionX).toBeGreaterThan(0.24)
    expect(target.positionX).toBeLessThan(0.34)
    expect(target.positionY).toBeGreaterThan(-1.4)
  })

  it('keeps center-out flow particles bounded inside the dome surface', () => {
    const specs = createDomeParticleSpecs(900, 20260627)
    const radialSpecs = specs.filter((spec) => spec.flowRadius > 0.14)
    const escapedSpecs = specs.filter((spec) => spec.flowRadius > spec.boundaryRadius)

    expect(radialSpecs.length / specs.length).toBeGreaterThan(0.9)
    expect(escapedSpecs).toHaveLength(0)
    expect(Math.min(...specs.map((spec) => spec.boundaryStrength))).toBeGreaterThan(0.2)
    expect(Math.max(...specs.map((spec) => spec.flowSpeed))).toBeGreaterThan(0.35)
  })

  it('moves the fluid dome center with the pointer and increases impact near screen edges', () => {
    const centerTarget = getFluidDomeFollowTarget(0, 0)
    const edgeTarget = getFluidDomeFollowTarget(0.49, -0.47)
    const centerImpact = getBoundaryImpact(0, 0)
    const edgeImpact = getBoundaryImpact(0.49, -0.47)

    expect(Math.abs(centerTarget.centerX)).toBeLessThan(0.02)
    expect(Math.abs(centerTarget.centerY)).toBeLessThan(0.02)
    expect(edgeTarget.centerX).toBeGreaterThan(0.55)
    expect(edgeTarget.centerY).toBeGreaterThan(0.35)
    expect(edgeTarget.centerX).toBeLessThan(0.98)
    expect(edgeImpact).toBeGreaterThan(centerImpact * 2.5)
  })

  it('slides edge-impact flow along the dome boundary without escaping it', () => {
    const calm = getContainedDomeFlowPoint({
      angle: 0,
      boundaryRadius: 1,
      centerX: 0.72,
      centerY: 0,
      impact: 0.08,
      radius: 0.48,
      verticalScale: 0.62
    })
    const impacted = getContainedDomeFlowPoint({
      angle: 0,
      boundaryRadius: 1,
      centerX: 0.72,
      centerY: 0,
      impact: 1,
      radius: 0.48,
      verticalScale: 0.62
    })

    const calmDistance = Math.hypot(calm.x, calm.y / 0.62)
    const impactedDistance = Math.hypot(impacted.x, impacted.y / 0.62)

    expect(calmDistance).toBeLessThanOrEqual(0.99)
    expect(impactedDistance).toBeLessThanOrEqual(0.99)
    expect(impacted.boundaryHit).toBeGreaterThan(0.8)
    expect(Math.abs(impacted.y)).toBeGreaterThan(Math.abs(calm.y) + 0.04)
  })
})
