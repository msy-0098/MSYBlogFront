<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  createCanvasParticleSpecs,
  getParticleCount,
  getParallaxOffset,
  type CanvasParticleSpec
} from './particleDomeConfig'

const stageRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let animationFrameId = 0
let particles: CanvasParticleSpec[] = []
let context: CanvasRenderingContext2D | null = null
let width = 0
let height = 0
let prefersReducedMotion = false
let targetParallax = { x: 0, y: 0 }
let currentParallax = { x: 0, y: 0 }

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

  particles = createCanvasParticleSpecs(
    getParticleCount(width, prefersReducedMotion),
    width,
    height,
    20260628
  )
}

function handlePointerMove(event: MouseEvent) {
  targetParallax = getParallaxOffset(
    event.clientX / window.innerWidth - 0.5,
    event.clientY / window.innerHeight - 0.5
  )
}

function resetParallax() {
  targetParallax = { x: 0, y: 0 }
}

function renderParticle(particle: CanvasParticleSpec, elapsed: number) {
  if (!context) {
    return
  }

  const wave = prefersReducedMotion ? 0 : Math.sin(elapsed * 0.0016 + particle.phase)
  const angle = particle.angle + (prefersReducedMotion ? 0 : elapsed * particle.speed)
  const radius = particle.radius + wave * particle.radialDrift
  const centerX = width / 2 + currentParallax.x
  const centerY = height / 2 + currentParallax.y
  const x = centerX + Math.cos(angle) * radius
  const y = centerY + Math.sin(angle) * radius
  const halfLength = particle.length / 2
  const orientation = particle.orientation + wave * 0.12
  const dx = Math.cos(orientation) * halfLength
  const dy = Math.sin(orientation) * halfLength

  context.globalAlpha = particle.alpha
  context.strokeStyle = particle.color
  context.lineWidth = particle.thickness
  context.lineCap = 'round'
  context.beginPath()
  context.moveTo(x - dx, y - dy)
  context.lineTo(x + dx, y + dy)
  context.stroke()
}

function animate(elapsed = 0) {
  if (!context) {
    return
  }

  context.clearRect(0, 0, width, height)
  currentParallax.x += (targetParallax.x - currentParallax.x) * 0.065
  currentParallax.y += (targetParallax.y - currentParallax.y) * 0.065
  particles.forEach((particle) => renderParticle(particle, elapsed))
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
  context = canvas?.getContext('2d') ?? null
  if (!context) {
    return
  }

  prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
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
