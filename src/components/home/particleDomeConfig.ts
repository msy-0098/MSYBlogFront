export const PARTICLE_RENDERER_KIND = 'canvas-2d'

export const ANTIGRAVITY_COLORS = {
  blue: '#4285F4',
  purple: '#A142F4',
  red: '#EA4335',
  orange: '#F9AB00',
  yellow: '#FBBC05'
} as const

export interface CanvasParticleRadii {
  centerEmptyRadius: number
  maxRadius: number
  bandWidth: number
}

export interface CanvasParticleSpec {
  angle: number
  radius: number
  length: number
  thickness: number
  orientation: number
  color: string
  alpha: number
  speed: number
  radialDrift: number
  phase: number
}

const TWO_PI = Math.PI * 2
const PARALLAX_LIMIT = 18

export function getParticleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return 140
  }
  if (width < 640) {
    return 260
  }
  if (width < 1024) {
    return 360
  }
  return 480
}

export function getCanvasParticleRadii(width: number, height: number): CanvasParticleRadii {
  const shortestSide = Math.min(width, height)
  const centerEmptyRadius = clamp(shortestSide * 0.28, 250, 250)
  const maxRadius = clamp(shortestSide * 0.89, 520, 800)

  return {
    centerEmptyRadius,
    maxRadius,
    bandWidth: maxRadius - centerEmptyRadius
  }
}

export function getParticleColorByAngle(angle: number) {
  const normalizedAngle = normalizeAngle(angle)

  if (normalizedAngle === 0 || normalizedAngle >= TWO_PI - 0.18 || normalizedAngle <= 0.34) {
    return ANTIGRAVITY_COLORS.yellow
  }
  if (normalizedAngle >= Math.PI * 1.48 && normalizedAngle <= Math.PI * 1.64) {
    return ANTIGRAVITY_COLORS.purple
  }
  if (normalizedAngle >= Math.PI && normalizedAngle < Math.PI * 1.02) {
    return ANTIGRAVITY_COLORS.blue
  }
  if (normalizedAngle >= Math.PI * 1.02 && normalizedAngle < Math.PI * 1.48) {
    return blendHex(
      ANTIGRAVITY_COLORS.blue,
      ANTIGRAVITY_COLORS.purple,
      (normalizedAngle - Math.PI * 1.02) / (Math.PI * 0.46)
    )
  }
  if (normalizedAngle >= Math.PI * 0.46 && normalizedAngle <= Math.PI * 0.62) {
    return ANTIGRAVITY_COLORS.red
  }
  if (normalizedAngle >= Math.PI * 0.62 && normalizedAngle < Math.PI) {
    return blendHex(
      ANTIGRAVITY_COLORS.red,
      ANTIGRAVITY_COLORS.orange,
      (normalizedAngle - Math.PI * 0.62) / (Math.PI * 0.38)
    )
  }
  if (normalizedAngle > Math.PI * 0.34 && normalizedAngle < Math.PI * 0.46) {
    return blendHex(
      ANTIGRAVITY_COLORS.yellow,
      ANTIGRAVITY_COLORS.red,
      (normalizedAngle - Math.PI * 0.34) / (Math.PI * 0.12)
    )
  }

  return ANTIGRAVITY_COLORS.yellow
}

export function createCanvasParticleSpecs(
  count: number,
  width: number,
  height: number,
  seed = 13579
): CanvasParticleSpec[] {
  const random = createSeededRandom(seed)
  const radii = getCanvasParticleRadii(width, height)
  const specs: CanvasParticleSpec[] = []

  while (specs.length < count) {
    const angle = pickComposedAngle(random)
    const radialProgress = random() ** 1.82
    const radius = radii.centerEmptyRadius + radialProgress * radii.bandWidth
    const orientation =
      angle + Math.PI / 2 + (random() - 0.5) * 0.34 + (random() < 0.16 ? Math.PI / 2 : 0)

    specs.push({
      angle,
      radius,
      length: 3 + random() * 5,
      thickness: 1.05 + random() * 0.95,
      orientation,
      color: getParticleColorByAngle(angle),
      alpha: 0.46 + random() * 0.34,
      speed: (random() - 0.5) * 0.0018,
      radialDrift: 2.6 + random() * 5.8,
      phase: random() * TWO_PI
    })
  }

  return specs
}

export function getParallaxOffset(mouseX: number, mouseY: number) {
  return {
    x: clamp(mouseX * 36, -PARALLAX_LIMIT, PARALLAX_LIMIT),
    y: clamp(mouseY * 36, -PARALLAX_LIMIT, PARALLAX_LIMIT)
  }
}

function pickComposedAngle(random: () => number) {
  const roll = random()
  if (roll < 0.5) {
    return Math.PI * (0.9 + random() * 0.72)
  }
  if (roll < 0.82) {
    return Math.PI * (0.34 + random() * 0.66)
  }
  if (roll < 0.92) {
    return Math.PI * (1.62 + random() * 0.38)
  }

  return (random() - 0.5) * Math.PI * 0.72
}

function normalizeAngle(angle: number) {
  const normalizedAngle = angle % TWO_PI
  return normalizedAngle < 0 ? normalizedAngle + TWO_PI : normalizedAngle
}

function blendHex(from: string, to: string, amount: number) {
  const ratio = clamp(amount, 0, 1)
  const fromRgb = hexToRgb(from)
  const toRgb = hexToRgb(to)
  const blended = fromRgb.map((channel, index) => {
    return Math.round(channel + (toRgb[index] - channel) * ratio)
  })

  return `#${blended.map((channel) => channel.toString(16).padStart(2, '0')).join('').toUpperCase()}`
}

function hexToRgb(hex: string) {
  const normalizedHex = hex.replace('#', '')
  return [0, 2, 4].map((start) => parseInt(normalizedHex.slice(start, start + 2), 16))
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
