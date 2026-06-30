<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { getParallaxOffset } from './particleDomeConfig'
import ParticleWorker from './particleWorker?worker'

const stageRef = ref<HTMLDivElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)

let worker: Worker | null = null

function handlePointerMove(event: MouseEvent) {
  const canvas = canvasRef.value
  if (!canvas || !worker) return
  const rect = canvas.getBoundingClientRect()

  const mouseX = event.clientX - rect.left - rect.width / 2
  const mouseY = event.clientY - rect.top - rect.height / 2
  const targetParallax = getParallaxOffset(
    event.clientX / window.innerWidth - 0.5,
    event.clientY / window.innerHeight - 0.5
  )

  worker.postMessage({
    type: 'MOUSE_MOVE',
    payload: { mouseX, mouseY, targetParallax }
  })
}

function resetParallax() {
  if (worker) {
    worker.postMessage({ type: 'MOUSE_LEAVE' })
  }
}

function resizeCanvas() {
  const host = stageRef.value
  const canvas = canvasRef.value
  if (!host || !canvas || !worker) return

  const width = host.clientWidth || window.innerWidth
  const height = host.clientHeight || window.innerHeight
  const dpr = Math.min(window.devicePixelRatio || 1, 2)

  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`

  worker.postMessage({
    type: 'RESIZE',
    payload: { width, height, dpr }
  })
}

onMounted(() => {
  if (typeof window === 'undefined' || !canvasRef.value || !stageRef.value) return
  if (typeof Worker === 'undefined' || typeof canvasRef.value.transferControlToOffscreen !== 'function') return

  const canvas = canvasRef.value
  const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  // Initialize worker
  worker = new ParticleWorker()

  // Transfer canvas control to worker
  try {
    const offscreen = canvas.transferControlToOffscreen()
    const host = stageRef.value
    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`

    worker.postMessage({
      type: 'INIT',
      payload: {
        canvas: offscreen,
        width,
        height,
        dpr,
        prefersReducedMotion
      }
    }, [offscreen])

    if (!prefersReducedMotion) {
      window.addEventListener('mousemove', handlePointerMove, { passive: true })
      window.addEventListener('mouseleave', resetParallax)
    }
    window.addEventListener('resize', resizeCanvas)
  } catch (e) {
    console.error('OffscreenCanvas not supported or transfer failed:', e)
    worker.terminate()
    worker = null
  }
})

onBeforeUnmount(() => {
  if (worker) {
    worker.postMessage({ type: 'DESTROY' })
    worker.terminate()
    worker = null
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
