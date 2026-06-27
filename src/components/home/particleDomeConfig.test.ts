import { describe, expect, it } from 'vitest'

import {
  ANTIGRAVITY_COLORS,
  PARTICLE_RENDERER_KIND,
  createCanvasParticleSpecs,
  getCanvasParticleRadii,
  getParticleColorByAngle,
  getParticleCount,
  getParallaxOffset
} from './particleDomeConfig'

describe('particleDomeConfig', () => {
  it('uses the lightweight Canvas 2D renderer requested by the homepage color spec', () => {
    expect(PARTICLE_RENDERER_KIND).toBe('canvas-2d')
    expect(getParticleCount(1440, false)).toBeGreaterThanOrEqual(420)
    expect(getParticleCount(1440, false)).toBeLessThanOrEqual(560)
    expect(getParticleCount(820, false)).toBeGreaterThanOrEqual(320)
    expect(getParticleCount(390, false)).toBeLessThanOrEqual(300)
    expect(getParticleCount(1440, true)).toBeLessThan(getParticleCount(390, false))
  })

  it('keeps a clear center and places particles in the requested radial halo', () => {
    const radii = getCanvasParticleRadii(1440, 900)
    const specs = createCanvasParticleSpecs(480, 1440, 900, 20260628)
    const centerLeaks = specs.filter((spec) => spec.radius < radii.centerEmptyRadius)
    const outerBand = specs.filter((spec) => spec.radius > radii.centerEmptyRadius + radii.bandWidth * 0.72)
    const innerBand = specs.filter((spec) => spec.radius < radii.centerEmptyRadius + radii.bandWidth * 0.38)

    expect(radii.centerEmptyRadius).toBeGreaterThanOrEqual(238)
    expect(radii.centerEmptyRadius).toBeLessThanOrEqual(262)
    expect(radii.maxRadius).toBeGreaterThanOrEqual(760)
    expect(radii.maxRadius).toBeLessThanOrEqual(820)
    expect(centerLeaks).toHaveLength(0)
    expect(innerBand.length).toBeGreaterThan(outerBand.length)
  })

  it('maps particle colors from angle into Antigravity-style regions', () => {
    expect(ANTIGRAVITY_COLORS.blue).toBe('#4285F4')
    expect(ANTIGRAVITY_COLORS.purple).toBe('#A142F4')
    expect(ANTIGRAVITY_COLORS.red).toBe('#EA4335')
    expect(ANTIGRAVITY_COLORS.orange).toBe('#F9AB00')
    expect(ANTIGRAVITY_COLORS.yellow).toBe('#FBBC05')
    expect(getParticleColorByAngle(Math.PI)).toBe(ANTIGRAVITY_COLORS.blue)
    expect(getParticleColorByAngle(Math.PI * 1.5)).toBe(ANTIGRAVITY_COLORS.purple)
    expect(getParticleColorByAngle(Math.PI * 0.5)).toBe(ANTIGRAVITY_COLORS.red)
    expect(getParticleColorByAngle(0)).toBe(ANTIGRAVITY_COLORS.yellow)
    expect(getParticleColorByAngle(Math.PI * 1.25)).not.toBe(ANTIGRAVITY_COLORS.blue)
    expect(getParticleColorByAngle(Math.PI * 1.25)).not.toBe(ANTIGRAVITY_COLORS.purple)
  })

  it('biases the composition away from a full-screen random fill', () => {
    const specs = createCanvasParticleSpecs(520, 1440, 900, 20260628)
    const rightSide = specs.filter((spec) => Math.cos(spec.angle) > 0.32)
    const leftSide = specs.filter((spec) => Math.cos(spec.angle) < -0.32)
    const shortDashes = specs.filter((spec) => spec.length >= 3 && spec.length <= 8)
    const tangentDashes = specs.filter(
      (spec) => Math.abs(Math.abs(spec.orientation - spec.angle) - Math.PI / 2) < 0.46
    )

    expect(rightSide.length).toBeLessThan(leftSide.length * 0.78)
    expect(shortDashes.length).toBe(specs.length)
    expect(tangentDashes.length / specs.length).toBeGreaterThan(0.7)
  })

  it('keeps mouse parallax subtle and bounded', () => {
    expect(getParallaxOffset(0, 0)).toEqual({ x: 0, y: 0 })
    expect(getParallaxOffset(0.5, -0.5).x).toBeGreaterThan(9)
    expect(getParallaxOffset(0.5, -0.5).x).toBeLessThanOrEqual(20)
    expect(getParallaxOffset(0.5, -0.5).y).toBeLessThan(0)
    expect(getParallaxOffset(4, 4)).toEqual({ x: 18, y: 18 })
  })
})
