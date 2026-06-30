<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

type Particle = {
  x: number
  y: number
  baseX: number
  baseY: number
  density: number
  size: number
}

const canvasRef = ref<HTMLCanvasElement | null>(null)

let canvasContext: CanvasRenderingContext2D | null = null
let particles: Particle[] = []
let animationFrame = 0
let resizeTimer = 0
let shouldReduceMotion = false

const pointer = {
  x: null as number | null,
  y: null as number | null,
  radius: 120
}

function getParticleStep(width: number) {
  if (width < 520) {
    return 10
  }

  if (width < 900) {
    return 8
  }

  return 6
}

function getCanvasSize(canvas: HTMLCanvasElement) {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const width = window.innerWidth
  const height = window.innerHeight

  canvas.width = Math.floor(width * pixelRatio)
  canvas.height = Math.floor(height * pixelRatio)
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  canvasContext?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)

  return {
    width,
    height
  }
}

function createParticle(x: number, y: number): Particle {
  return {
    x: x + (Math.random() - 0.5) * 100,
    y: y + (Math.random() - 0.5) * 100,
    baseX: x,
    baseY: y,
    density: Math.random() * 40 + 5,
    size: Math.random() * 1.5 + 1
  }
}

function initParticles() {
  const canvas = canvasRef.value
  if (!canvas || !canvasContext) {
    return
  }

  particles = []
  const { width, height } = getCanvasSize(canvas)
  const fontSize = Math.min(width / 3, 300)
  const verticalOffset = height < 560 ? 16 : 40

  canvasContext.clearRect(0, 0, width, height)
  canvasContext.fillStyle = '#ffffff'
  canvasContext.font = `900 ${fontSize}px "Helvetica Neue", Arial, sans-serif`
  canvasContext.textAlign = 'center'
  canvasContext.textBaseline = 'middle'
  canvasContext.fillText('404', width / 2, height / 2 - verticalOffset)

  const textCoordinates = canvasContext.getImageData(0, 0, canvas.width, canvas.height)
  const step = getParticleStep(width)
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const sampleStep = Math.max(1, Math.round(step * pixelRatio))

  for (let y = 0; y < textCoordinates.height; y += sampleStep) {
    for (let x = 0; x < textCoordinates.width; x += sampleStep) {
      const alphaIndex = (y * 4 * textCoordinates.width) + (x * 4) + 3
      if (textCoordinates.data[alphaIndex] > 128) {
        const particle = createParticle(x / pixelRatio, y / pixelRatio)
        if (shouldReduceMotion) {
          particle.x = particle.baseX
          particle.y = particle.baseY
        }
        particles.push(particle)
      }
    }
  }

  canvasContext.clearRect(0, 0, width, height)
}

function drawParticle(particle: Particle) {
  if (!canvasContext) {
    return
  }

  canvasContext.fillStyle = 'rgba(255, 255, 255, 0.82)'
  canvasContext.beginPath()
  canvasContext.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
  canvasContext.closePath()
  canvasContext.fill()
}

function updateParticle(particle: Particle) {
  if (pointer.x !== null && pointer.y !== null) {
    const dx = pointer.x - particle.x
    const dy = pointer.y - particle.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance > 0 && distance < pointer.radius) {
      const force = (pointer.radius - distance) / pointer.radius
      const directionX = (dx / distance) * force * particle.density
      const directionY = (dy / distance) * force * particle.density
      particle.x -= directionX
      particle.y -= directionY
      return
    }
  }

  particle.x -= (particle.x - particle.baseX) / 15
  particle.y -= (particle.y - particle.baseY) / 15
}

function renderFrame() {
  const canvas = canvasRef.value
  if (!canvas || !canvasContext) {
    return
  }

  const width = window.innerWidth
  const height = window.innerHeight
  canvasContext.fillStyle = shouldReduceMotion ? '#050505' : 'rgba(5, 5, 5, 0.15)'
  canvasContext.fillRect(0, 0, width, height)

  particles.forEach((particle) => {
    if (!shouldReduceMotion) {
      updateParticle(particle)
    }
    drawParticle(particle)
  })

  if (!shouldReduceMotion) {
    animationFrame = window.requestAnimationFrame(renderFrame)
  }
}

function handlePointerMove(event: MouseEvent) {
  pointer.x = event.clientX
  pointer.y = event.clientY
}

function handlePointerLeave() {
  pointer.x = null
  pointer.y = null
}

function handleResize() {
  window.clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => {
    initParticles()
    if (shouldReduceMotion) {
      renderFrame()
    }
  }, 120)
}

onMounted(() => {
  const canvas = canvasRef.value
  if (!canvas) {
    return
  }

  canvasContext = canvas.getContext('2d')
  if (!canvasContext) {
    return
  }

  shouldReduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  initParticles()
  renderFrame()

  window.addEventListener('mousemove', handlePointerMove, { passive: true })
  window.addEventListener('mouseout', handlePointerLeave)
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handlePointerMove)
  window.removeEventListener('mouseout', handlePointerLeave)
  window.removeEventListener('resize', handleResize)
  window.clearTimeout(resizeTimer)

  if (animationFrame) {
    window.cancelAnimationFrame(animationFrame)
  }

  particles = []
  canvasContext = null
})
</script>

<template>
  <section class="not-found-scene" aria-labelledby="not-found-title">
    <canvas
      ref="canvasRef"
      class="not-found-canvas"
      data-test="not-found-canvas"
      aria-hidden="true"
    />

    <h1 id="not-found-title" class="sr-only">404 - Not Found</h1>

    <div class="not-found-interface">
      <p class="not-found-message">Signal Lost · Target Not Found</p>
      <RouterLink class="not-found-return" to="/">
        INITIATE RECALL (返回 masenyu.top)
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.not-found-scene {
  position: fixed;
  inset: 0;
  z-index: 1000;
  min-height: 100svh;
  overflow: hidden;
  background: #050505;
  color: #ffffff;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

.not-found-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.not-found-interface {
  position: absolute;
  left: 0;
  right: 0;
  bottom: clamp(28px, 7vh, 56px);
  z-index: 2;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0 24px;
  pointer-events: none;
}

.not-found-message {
  margin: 0 0 20px;
  color: rgba(255, 255, 255, 0.44);
  font-size: 0.75rem;
  font-weight: 300;
  letter-spacing: 4px;
  line-height: 1.6;
  text-align: center;
  text-transform: uppercase;
}

.not-found-return {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  padding: 12px 30px;
  overflow: hidden;
  color: #ffffff;
  font-size: 0.85rem;
  letter-spacing: 2px;
  line-height: 1.35;
  text-align: center;
  text-decoration: none;
  transition: color 0.4s ease;
  pointer-events: auto;
}

.not-found-return::before,
.not-found-return::after {
  position: absolute;
  content: '';
}

.not-found-return::before {
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.22);
  transition:
    border-color 0.4s ease,
    transform 0.4s ease;
}

.not-found-return::after {
  inset: 0;
  z-index: -1;
  background: #ffffff;
  transform: translateX(-105%);
  transition: transform 0.4s cubic-bezier(0.19, 1, 0.22, 1);
}

.not-found-return:hover,
.not-found-return:focus-visible {
  color: #050505;
}

.not-found-return:hover::before,
.not-found-return:focus-visible::before {
  border-color: #ffffff;
  transform: scale(1.05);
}

.not-found-return:hover::after,
.not-found-return:focus-visible::after {
  transform: translateX(0);
}

.not-found-return:focus-visible {
  outline: 2px solid rgba(255, 255, 255, 0.76);
  outline-offset: 6px;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

@media (max-width: 640px) {
  .not-found-message {
    letter-spacing: 2px;
  }

  .not-found-return {
    width: min(100%, 320px);
    padding: 12px 18px;
    font-size: 0.72rem;
    letter-spacing: 1.4px;
  }
}
</style>
