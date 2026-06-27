export const PARTICLE_LENGTH = 0.072
export const PARTICLE_THICKNESS = 0.0095
export const PARTICLE_JUMP_AMPLITUDE = 0.046
export const PARTICLE_OPACITY = 0.52
export const DOME_BASE_Y = -1.16
export const DOME_RING_COUNT = 34
export const DOME_CENTER_CLEAR_WIDTH = 2.75

export const PARTICLE_PALETTE = [
  '#2563EB',
  '#3B82F6',
  '#6366F1',
  '#8B5CF6',
  '#E11D48',
  '#F97316',
  '#FBBF24'
] as const

export const COOL_PARTICLE_PALETTE_INDICES = [0, 1, 2, 3]
export const WARM_PARTICLE_PALETTE_INDICES = [4, 5, 6]

export interface MouseFollowTarget {
  rotationX: number
  rotationY: number
  positionX: number
  positionY: number
}

export interface FluidDomeFollowTarget extends MouseFollowTarget {
  centerX: number
  centerY: number
  impact: number
}

export interface ContainedDomeFlowPointInput {
  angle: number
  boundaryRadius: number
  centerX: number
  centerY: number
  impact: number
  radius: number
  verticalScale: number
}

export interface ContainedDomeFlowPoint {
  x: number
  y: number
  boundaryHit: number
}

export interface DomeParticleSpec {
  x: number
  y: number
  z: number
  scale: number
  rotationX: number
  rotationY: number
  rotationZ: number
  phase: number
  jump: number
  paletteIndex: number
  ringIndex: number
  flowAngle: number
  flowRadius: number
  boundaryRadius: number
  boundaryStrength: number
  flowSpeed: number
}

const TWO_PI = Math.PI * 2
const DOME_RADIUS_X = 6.2
const DOME_RADIUS_Y = 3.72
const DOME_RADIUS_Z = 1.85
const DOME_CENTER_Y = 1.34

export function getParticleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return 260
  }
  if (width < 640) {
    return 360
  }
  if (width < 1024) {
    return 780
  }
  return 1600
}

export function getMouseFollowTarget(mouseX: number, mouseY: number): MouseFollowTarget {
  return {
    rotationX: mouseY * 0.46,
    rotationY: mouseX * 0.66,
    positionX: mouseX * 0.54,
    positionY: DOME_BASE_Y - mouseY * 0.32
  }
}

export function getBoundaryImpact(mouseX: number, mouseY: number) {
  const edgePressure = Math.max(Math.abs(mouseX), Math.abs(mouseY)) * 2
  return Math.max(0.08, edgePressure ** 2.25)
}

export function getFluidDomeFollowTarget(mouseX: number, mouseY: number): FluidDomeFollowTarget {
  const target = getMouseFollowTarget(mouseX, mouseY)
  const centerX = clamp(mouseX * 1.52, -0.95, 0.95)
  const centerY = clamp(-mouseY * 1.05, -0.72, 0.72)

  return {
    ...target,
    centerX,
    centerY,
    impact: getBoundaryImpact(mouseX, mouseY)
  }
}

export function getContainedDomeFlowPoint(
  input: ContainedDomeFlowPointInput
): ContainedDomeFlowPoint {
  const boundaryRadius = Math.max(0.16, input.boundaryRadius)
  const verticalScale = Math.max(0.24, input.verticalScale)
  const impact = clamp(input.impact, 0, 1)
  const rawX = input.centerX + Math.cos(input.angle) * input.radius
  const rawY = input.centerY + Math.sin(input.angle) * input.radius * verticalScale
  const normalizedX = rawX / boundaryRadius
  const normalizedY = rawY / (boundaryRadius * verticalScale)
  const normalizedDistance = Math.max(0.001, Math.hypot(normalizedX, normalizedY))
  const boundaryHit = clamp((normalizedDistance - 0.7) / 0.3, 0, 1)
  const boundaryLimit = 0.985 - boundaryHit * impact * 0.04
  const compression = normalizedDistance > boundaryLimit ? boundaryLimit / normalizedDistance : 1
  const compressedX = normalizedX * compression
  const compressedY = normalizedY * compression
  const tangentX = -compressedY / Math.max(0.001, Math.hypot(compressedX, compressedY))
  const tangentY = compressedX / Math.max(0.001, Math.hypot(compressedX, compressedY))
  const slide = boundaryHit * (0.03 + impact * 0.16)
  let flowedX = compressedX + tangentX * slide
  let flowedY = compressedY + tangentY * slide
  const flowedDistance = Math.hypot(flowedX, flowedY)

  if (flowedDistance > 0.99) {
    const clampRatio = 0.99 / flowedDistance
    flowedX *= clampRatio
    flowedY *= clampRatio
  }

  return {
    x: flowedX * boundaryRadius,
    y: flowedY * boundaryRadius * verticalScale,
    boundaryHit
  }
}

export function isWithinDomeClearZone(x: number, y: number) {
  const titleClear =
    Math.abs(x) < 4.95 &&
    y > 0.24 &&
    y < 4.08 &&
    Math.abs((y - 2.12) / 1.82) + Math.abs(x / 4.95) < 1.5
  const actionClear = Math.abs(x) < 2.95 && y > -0.74 && y < 0.96

  return titleClear || actionClear
}

export function createDomeParticleSpecs(count: number, seed = 13579): DomeParticleSpec[] {
  const random = createSeededRandom(seed)
  const ringWeights = Array.from({ length: DOME_RING_COUNT }, (_, ringIndex) => {
    const latitude = getRingLatitude(ringIndex)
    const radius = Math.sqrt(Math.max(0, 1 - latitude * latitude))
    const verticalBias = 0.82 + Math.abs(latitude) * 0.24
    return (0.055 + radius ** 2.1) * verticalBias
  })
  const totalWeight = ringWeights.reduce((sum, weight) => sum + weight, 0)
  const ringTargets = ringWeights.map((weight) => {
    return Math.floor((count * weight) / totalWeight)
  })

  let allocated = ringTargets.reduce((sum, value) => sum + value, 0)
  let ringCursor = Math.floor(DOME_RING_COUNT * 0.5)
  while (allocated < count) {
    ringTargets[ringCursor % DOME_RING_COUNT] += 1
    ringCursor += 5
    allocated += 1
  }

  const specs: DomeParticleSpec[] = []
  ringTargets.forEach((target, ringIndex) => {
    specs.push(...createRingParticleSpecs(ringIndex, target, random))
  })

  return specs.slice(0, count)
}

function createRingParticleSpecs(
  ringIndex: number,
  target: number,
  random: () => number
): DomeParticleSpec[] {
  const latitude = getRingLatitude(ringIndex)
  const ringRadius = Math.sqrt(Math.max(0, 1 - latitude * latitude))
  const y = DOME_CENTER_Y + latitude * DOME_RADIUS_Y
  const specs: DomeParticleSpec[] = []
  const angleSlots = Math.max(18, Math.ceil(target * 1.58))
  const ringOffset = random() * TWO_PI
  let slot = 0

  while (specs.length < target && slot < angleSlots * 8) {
    const slotRatio = (slot % angleSlots) / angleSlots
    const orbit = Math.floor(slot / angleSlots)
    const jitter = (random() - 0.5) * (TWO_PI / angleSlots) * 0.42
    const theta = slotRatio * TWO_PI + ringOffset + orbit * 0.071 + jitter
    const candidate = createParticleSpec(theta, y, ringRadius, ringIndex, random)
    const sideDensity = Math.abs(Math.cos(theta))
    const shouldThinSideWall = sideDensity > 0.84 && random() < 0.56

    if (!shouldThinSideWall && !isWithinDomeClearZone(candidate.x, candidate.y)) {
      specs.push(candidate)
    }

    slot += 1
  }

  while (specs.length < target) {
    const side = specs.length % 2 === 0 ? 1 : -1
    const theta = (side > 0 ? 0 : Math.PI) + (random() - 0.5) * 0.82
    specs.push(createParticleSpec(theta, y, ringRadius, ringIndex, random))
  }

  return specs
}

function createParticleSpec(
  theta: number,
  y: number,
  ringRadius: number,
  ringIndex: number,
  random: () => number
): DomeParticleSpec {
  const depth = Math.sin(theta)
  const side = Math.cos(theta)
  const sideCurve = Math.sign(side) * Math.abs(side) ** 1.08
  const normalizedY = (y - DOME_CENTER_Y) / DOME_RADIUS_Y
  const boundaryRadius = Math.max(0.28, Math.sqrt(Math.max(0, 1 - normalizedY * normalizedY)))
  const flowRadius = Math.min(boundaryRadius * (0.18 + ringRadius * (0.76 + random() * 0.18)), boundaryRadius)
  const x = DOME_RADIUS_X * ringRadius * sideCurve + (random() - 0.5) * 0.06
  const z = DOME_RADIUS_Z * ringRadius * depth
  const perspectiveLift = z * 0.1
  const paletteIndex = pickPaletteIndex(side, random)
  const scale = 0.52 + random() * 0.43 + Math.abs(depth) * 0.08

  return {
    x,
    y: y + perspectiveLift + (random() - 0.5) * 0.08,
    z,
    scale,
    rotationX: depth * 0.1 + (random() - 0.5) * 0.07,
    rotationY: -side * 0.08 + (random() - 0.5) * 0.08,
    rotationZ: theta + Math.PI / 2 + (random() - 0.5) * 0.16,
    phase: random() * TWO_PI,
    jump: PARTICLE_JUMP_AMPLITUDE * (0.38 + random() * 0.72),
    paletteIndex,
    ringIndex,
    flowAngle: theta + (random() - 0.5) * 0.16,
    flowRadius,
    boundaryRadius,
    boundaryStrength: 0.28 + (flowRadius / boundaryRadius) * 0.72,
    flowSpeed: 0.28 + random() * 0.42 + flowRadius * 0.16
  }
}

function pickPaletteIndex(side: number, random: () => number) {
  if (side < -0.18) {
    const pool = random() < 0.9 ? COOL_PARTICLE_PALETTE_INDICES : [4]
    return pool[Math.floor(random() * pool.length)]
  }

  if (side > 0.18) {
    const pool = random() < 0.86 ? WARM_PARTICLE_PALETTE_INDICES : [1, 2, 3]
    return pool[Math.floor(random() * pool.length)]
  }

  const pool = [1, 2, 3, 4]
  return pool[Math.floor(random() * pool.length)]
}

function getRingLatitude(ringIndex: number) {
  return -0.96 + (ringIndex / (DOME_RING_COUNT - 1)) * 1.92
}

function createSeededRandom(seed: number) {
  let value = seed >>> 0
  return () => {
    value += 0x6d2b79f5
    let mixed = value
    mixed = Math.imul(mixed ^ (mixed >>> 15), mixed | 1)
    mixed ^= mixed + Math.imul(mixed ^ (mixed >>> 7), mixed | 61)
    return ((mixed ^ (mixed >>> 14)) >>> 0) / 4294967296
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
