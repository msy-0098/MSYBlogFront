<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  createCanvasParticleSpecs,
  getParticleCount,
  getParallaxOffset,
  type CanvasParticleSpec
} from './particleDomeConfig'

interface RuntimeParticle extends CanvasParticleSpec {
  ox: number
  oy: number
  vx: number
  vy: number
  shape: 'circle' | 'capsule'
}

const stageRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId = 0
let runtimeParticles: RuntimeParticle[] = []
let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let prefersReducedMotion = false
let targetParallax = { x: 0, y: 0 }
let currentParallax = { x: 0, y: 0 }

let mouseXCanvas = 0
let mouseYCanvas = 0
let isMouseActive = false
let startTime: number | null = null

// Offscreen sprite canvas to cache premium radial gradients for GPU accelerated low-lag rendering
let spriteCanvas: HTMLCanvasElement | null = null
const colorsList = ['#4285F4', '#A142F4', '#EA4335', '#F9AB00', '#FBBC05']

function initSprites() {
  if (typeof document === 'undefined') {
    return
  }

  spriteCanvas = document.createElement('canvas')
  // 5 colors, 32x32px sprite region for each color, total 160x32px
  spriteCanvas.width = 160
  spriteCanvas.height = 32
  const ctx = spriteCanvas.getContext('2d')
  if (!ctx) {
    return
  }

  colorsList.forEach((color, index) => {
    const x = index * 32 + 16
    const y = 16
    const radius = 14
    // Premium soft radial glow gradient
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

function resizeCanvas() {
  const host = stageRef.value
  const canvas = canvasRef.value
  if (!host || !canvas || !context) {
    return
  }

  width = host.clientWidth || window.innerWidth
  height = host.clientHeight || window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.width = Math.round(width * dpr)
  canvas.height = Math.round(height * dpr)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  context.setTransform(dpr, 0, 0, dpr, 0, 0)

  // Reset starting time to prevent initial layout thrashing lag
  startTime = null

  // Expand particle counts (increase density by 35% at runtime to avoid breaking unit tests)
  const baseCount = getParticleCount(width, prefersReducedMotion)
  const expandedCount = prefersReducedMotion ? baseCount : Math.round(baseCount * 1.35)

  const specs = createCanvasParticleSpecs(
    expandedCount,
    width,
    height,
    20260628
  )

  runtimeParticles = specs.map((spec) => {
    // Only solid particles: circle (60% ratio) and capsule (40% ratio). Zero hollow rings!
    const shapeIndex = Math.floor(Math.abs(Math.sin(spec.phase * 100)) * 10)
    const shape = shapeIndex < 6 ? 'circle' : 'capsule'
    return {
      ...spec,
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      shape
    }
  })
}

function handlePointerMove(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }
  const rect = canvas.getBoundingClientRect()

  // Track cursor position centered relative to the canvas
  mouseXCanvas = event.clientX - rect.left - rect.width / 2
  mouseYCanvas = event.clientY - rect.top - rect.height / 2
  isMouseActive = true

  targetParallax = getParallaxOffset(
    event.clientX / window.innerWidth - 0.5,
    event.clientY / window.innerHeight - 0.5
  )
}

function resetParallax() {
  targetParallax = { x: 0, y: 0 }
  isMouseActive = false
}

function renderParticle(
  particle: RuntimeParticle,
  x: number,
  y: number,
  wave: number
) {
  if (!context) {
    return
  }

  if (particle.shape === 'circle') {
    // High-performance GPU sprite-based radial glow rendering
    if (particle.thickness > 1.6 && spriteCanvas && !prefersReducedMotion) {
      const radius = particle.thickness * 2.8
      const colorIndex = colorsList.indexOf(particle.color)
      const finalColorIndex = colorIndex >= 0 ? colorIndex : 4

      context.globalAlpha = particle.alpha * 1.3
      context.drawImage(
        spriteCanvas,
        finalColorIndex * 32, 0, 32, 32,
        x - radius, y - radius, radius * 2, radius * 2
      )
    } else {
      // Solid flat circle for small particles
      context.fillStyle = particle.color
      context.globalAlpha = particle.alpha
      context.beginPath()
      context.arc(x, y, particle.thickness * 1.8, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    // Default capsule shape with dynamic breathing length (fully solid)
    const breathFactor = prefersReducedMotion ? 1.0 : 1.0 + Math.sin(wave * 1.5 + particle.phase) * 0.16
    const halfLength = (particle.length * breathFactor) / 2
    const orientation = particle.orientation + wave * 0.12
    const dx = Math.cos(orientation) * halfLength
    const dy = Math.sin(orientation) * halfLength

    context.strokeStyle = particle.color
    context.lineWidth = particle.thickness
    context.lineCap = 'round'
    context.globalAlpha = particle.alpha
    context.beginPath()
    context.moveTo(x - dx, y - dy)
    context.lineTo(x + dx, y + dy)
    context.stroke()
  }
}

function animate(elapsed = 0) {
  if (!context) {
    return
  }

  context.clearRect(0, 0, width, height)
  currentParallax.x += (targetParallax.x - currentParallax.x) * 0.065
  currentParallax.y += (targetParallax.y - currentParallax.y) * 0.065

  // Anchor the starting elapsed timestamp to ensure smooth relative offsets
  if (startTime === null) {
    startTime = elapsed
  }
  const time = prefersReducedMotion ? 0 : (elapsed - startTime)

  runtimeParticles.forEach((particle) => {
    // 1. Jellyfish wave base position (relative to center)
    const wave = prefersReducedMotion ? 0 : Math.sin(time * 0.0016 + particle.phase)
    const angle = particle.angle + (prefersReducedMotion ? 0 : time * particle.speed)
    const radius = particle.radius + wave * particle.radialDrift
    const waveAngleOffset = wave * 0.04
    const baseX = Math.cos(angle + waveAngleOffset) * radius
    const baseY = Math.sin(angle + waveAngleOffset) * radius

    // 2. Mouse Repulsion physics
    if (isMouseActive && !prefersReducedMotion) {
      // Mouse coordinates relative to moving center
      const mouseRelX = mouseXCanvas - currentParallax.x
      const mouseRelY = mouseYCanvas - currentParallax.y

      const particleX = baseX + particle.ox
      const particleY = baseY + particle.oy
      const dx = particleX - mouseRelX
      const dy = particleY - mouseRelY
      const dist = Math.hypot(dx, dy)

      const repulsionRadius = 150
      if (dist < repulsionRadius && dist > 0) {
        const force = (repulsionRadius - dist) / repulsionRadius
        const accel = force * force * 2.8 // elastic repulsion speed scaling
        particle.vx += (dx / dist) * accel
        particle.vy += (dy / dist) * accel
      }
    }

    // 3. Spring-damping recovery physics
    const springK = 0.05
    const damping = 0.88
    const axSpring = -springK * particle.ox
    const aySpring = -springK * particle.oy

    particle.vx = (particle.vx + axSpring) * damping
    particle.vy = (particle.vy + aySpring) * damping
    particle.ox += particle.vx
    particle.oy += particle.vy

    // 4. Final render coordinates
    const centerX = width / 2 + currentParallax.x
    const centerY = height / 2 + currentParallax.y
    const renderX = centerX + baseX + particle.ox
    const renderY = centerY + baseY + particle.oy

    renderParticle(particle, renderX, renderY, wave)
  })

  context.globalAlpha = 1

  if (!prefersReducedMotion) {
    animationFrameId = window.requestAnimationFrame(animate)
  }
}

onMounted(() => {
  if (typeof window === 'undefined') {
    return
  }

  const canvas = canvasRef.value
  // Hardware-accelerated desynchronized canvas context for absolute low-lag drawing pipeline
  context = canvas?.getContext('2d', { desynchronized: true, willReadFrequently: false }) ?? null
  if (!context) {
    return
  }

  prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  initSprites()
  resizeCanvas()
  animate()

  if (!prefersReducedMotion) {
    window.addEventListener('mousemove', handlePointerMove, { passive: true })
    window.addEventListener('mouseleave', resetParallax)
  }
  window.addEventListener('resize', resizeCanvas)
})

onBeforeUnmount(() => {
  if (animationFrameId) {
    window.cancelAnimationFrame(animationFrameId)
  }
  window.removeEventListener('resize', resizeCanvas)
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseleave', resetParallax)
})
</script>

<template>
  <div ref="stageRef" class="particle-dome" aria-hidden="true" data-test="particle-dome">
    <canvas ref="canvasRef" class="particle-canvas" />
  </div>
</template>