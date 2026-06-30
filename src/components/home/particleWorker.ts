import {
  createCanvasParticleSpecs,
  getParticleCount,
  type CanvasParticleSpec
} from './particleDomeConfig'

interface RuntimeParticle extends CanvasParticleSpec {
  ox: number
  oy: number
  vx: number
  vy: number
  shape: 'circle' | 'capsule'
}

let canvas: OffscreenCanvas | null = null
let context: OffscreenCanvasRenderingContext2D | null = null
let animationFrameId = 0
let runtimeParticles: RuntimeParticle[] = []
let width = 0
let height = 0
let prefersReducedMotion = false
let targetParallax = { x: 0, y: 0 }
let currentParallax = { x: 0, y: 0 }

let mouseXCanvas = 0
let mouseYCanvas = 0
let isMouseActive = false
let startTime: number | null = null

let spriteCanvas: OffscreenCanvas | null = null
const colorsList = ['#4285F4', '#34A853', '#EA4335', '#F9AB00', '#FBBC05']

function initSprites() {
  spriteCanvas = new OffscreenCanvas(160, 32)
  const ctx = spriteCanvas.getContext('2d')
  if (!ctx) return

  colorsList.forEach((color, index) => {
    const x = index * 32 + 16
    const y = 16
    const radius = 14
    const grad = ctx.createRadialGradient(x, y, radius * 0.15, x, y, radius)
    grad.addColorStop(0, color)
    grad.addColorStop(0.22, color)
    grad.addColorStop(1, 'transparent')

    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  })
}

function handleResize(newWidth: number, newHeight: number, dpr: number) {
  if (!canvas || !context) return

  width = newWidth
  height = newHeight

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  startTime = null

  const baseCount = getParticleCount(width, prefersReducedMotion)
  const expandedCount = prefersReducedMotion ? baseCount : Math.round(baseCount * 1.1)

  const specs = createCanvasParticleSpecs(expandedCount, width, height, 20260628)

  runtimeParticles = specs.map((spec) => {
    const shapeIndex = Math.floor(Math.abs(Math.sin(spec.phase * 100)) * 10)
    return {
      ...spec,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      shape: shapeIndex < 6 ? 'circle' : 'capsule'
    }
  })
}

let lastGlobalAlpha = 1
let lastFillStyle = ''
let lastStrokeStyle = ''
let lastLineWidth = 0

function renderParticle(particle: RuntimeParticle, x: number, y: number, wave: number) {
  if (!context) return

  if (lastGlobalAlpha !== particle.alpha) {
    context.globalAlpha = particle.alpha
    lastGlobalAlpha = particle.alpha
  }

  if (particle.shape === 'circle') {
    if (particle.thickness > 1.6 && spriteCanvas && !prefersReducedMotion) {
      const radius = particle.thickness * 2.8
      const colorIndex = colorsList.indexOf(particle.color)
      const finalColorIndex = colorIndex >= 0 ? colorIndex : 4

      context.globalAlpha = particle.alpha * 1.3
      lastGlobalAlpha = context.globalAlpha
      context.drawImage(
        spriteCanvas,
        finalColorIndex * 32, 0, 32, 32,
        x - radius, y - radius, radius * 2, radius * 2
      )
    } else {
      if (lastFillStyle !== particle.color) {
        context.fillStyle = particle.color
        lastFillStyle = particle.color
      }
      context.beginPath()
      context.arc(x, y, particle.thickness * 1.8, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    const breathFactor = prefersReducedMotion ? 1.0 : 1.0 + Math.sin(wave * 1.5 + particle.phase) * 0.16
    const halfLength = (particle.length * breathFactor) / 2
    const orientation = particle.orientation + wave * 0.12
    const dx = Math.cos(orientation) * halfLength
    const dy = Math.sin(orientation) * halfLength

    if (lastStrokeStyle !== particle.color) {
      context.strokeStyle = particle.color
      lastStrokeStyle = particle.color
    }
    if (lastLineWidth !== particle.thickness) {
      context.lineWidth = particle.thickness
      lastLineWidth = particle.thickness
    }
    context.lineCap = 'round'
    
    context.beginPath()
    context.moveTo(x - dx, y - dy)
    context.lineTo(x + dx, y + dy)
    context.stroke()
  }
}

function animate(elapsed = 0) {
  if (!context) return

  context.clearRect(0, 0, width, height)
  currentParallax.x += (targetParallax.x - currentParallax.x) * 0.065
  currentParallax.y += (targetParallax.y - currentParallax.y) * 0.065

  if (startTime === null) startTime = elapsed
  const time = prefersReducedMotion ? 0 : (elapsed - startTime)

  const timeFactor = time * 0.0016
  const centerX = width / 2 + currentParallax.x
  const centerY = height / 2 + currentParallax.y
  
  lastGlobalAlpha = -1
  lastFillStyle = ''
  lastStrokeStyle = ''
  lastLineWidth = -1

  runtimeParticles.forEach((particle) => {
    const wave = prefersReducedMotion ? 0 : Math.sin(timeFactor + particle.phase)
    const angle = particle.angle + (prefersReducedMotion ? 0 : time * particle.speed)
    const radius = particle.radius + wave * particle.radialDrift
    const waveAngleOffset = wave * 0.04
    
    const finalAngle = angle + waveAngleOffset
    const baseX = Math.cos(finalAngle) * radius
    const baseY = Math.sin(finalAngle) * radius

    if (isMouseActive && !prefersReducedMotion) {
      const mouseRelX = mouseXCanvas - currentParallax.x
      const mouseRelY = mouseYCanvas - currentParallax.y

      const particleX = baseX + particle.ox
      const particleY = baseY + particle.oy
      const dx = particleX - mouseRelX
      const dy = particleY - mouseRelY
      
      const distSq = dx * dx + dy * dy
      const repulsionRadiusSq = 22500
      
      if (distSq < repulsionRadiusSq && distSq > 0) {
        const dist = Math.sqrt(distSq)
        const force = (150 - dist) / 150
        const accel = force * force * 2.8
        particle.vx += (dx / dist) * accel
        particle.vy += (dy / dist) * accel
      }
    }

    const springK = 0.05
    const damping = 0.88
    
    particle.vx = (particle.vx - springK * particle.ox) * damping
    particle.vy = (particle.vy - springK * particle.oy) * damping
    particle.ox += particle.vx
    particle.oy += particle.vy

    const renderX = centerX + baseX + particle.ox
    const renderY = centerY + baseY + particle.oy

    renderParticle(particle, renderX, renderY, wave)
  })

  context.globalAlpha = 1

  if (!prefersReducedMotion) {
    animationFrameId = self.requestAnimationFrame(animate)
  }
}

self.onmessage = (e: MessageEvent) => {
  const { type, payload } = e.data

  if (type === 'INIT') {
    canvas = payload.canvas
    context = canvas?.getContext('2d', { desynchronized: true, willReadFrequently: false }) ?? null
    prefersReducedMotion = payload.prefersReducedMotion
    
    if (context) {
      initSprites()
      handleResize(payload.width, payload.height, payload.dpr)
      animate()
    }
  } else if (type === 'RESIZE') {
    handleResize(payload.width, payload.height, payload.dpr)
  } else if (type === 'MOUSE_MOVE') {
    mouseXCanvas = payload.mouseX
    mouseYCanvas = payload.mouseY
    targetParallax = payload.targetParallax
    isMouseActive = true
  } else if (type === 'MOUSE_LEAVE') {
    isMouseActive = false
    targetParallax = { x: 0, y: 0 }
  } else if (type === 'DESTROY') {
    if (animationFrameId) {
      self.cancelAnimationFrame(animationFrameId)
    }
    context = null
    canvas = null
    spriteCanvas = null
  }
}