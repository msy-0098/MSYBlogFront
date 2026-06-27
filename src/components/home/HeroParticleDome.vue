<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  DOME_BASE_Y,
  PARTICLE_JUMP_AMPLITUDE,
  PARTICLE_LENGTH,
  PARTICLE_THICKNESS,
  getMouseFollowTarget,
  getParticleCount
} from './particleDomeConfig'

const stageRef = ref<HTMLDivElement | null>(null)

let disposeScene = () => {}
let disposed = false

function canUseWebGL() {
  if (typeof WebGLRenderingContext === 'undefined') {
    return false
  }

  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
  } catch {
    return false
  }
}

onMounted(async () => {
  const host = stageRef.value
  if (!host || typeof window === 'undefined' || !canUseWebGL()) {
    return
  }

  const [
    { gsap },
    { Scene },
    { PerspectiveCamera },
    { WebGLRenderer },
    { Group },
    { InstancedMesh },
    { PlaneGeometry },
    { MeshBasicMaterial },
    { Object3D }
  ] = await Promise.all([
    import('gsap'),
    import('three/src/scenes/Scene.js'),
    import('three/src/cameras/PerspectiveCamera.js'),
    import('three/src/renderers/WebGLRenderer.js'),
    import('three/src/objects/Group.js'),
    import('three/src/objects/InstancedMesh.js'),
    import('three/src/geometries/PlaneGeometry.js'),
    import('three/src/materials/MeshBasicMaterial.js'),
    import('three/src/core/Object3D.js')
  ])
  if (disposed || stageRef.value !== host) {
    return
  }

  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
  const scene = new Scene()
  const camera = new PerspectiveCamera(42, 1, 0.1, 100)
  const renderer = new WebGLRenderer({
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance'
  })
  const dome = new Group()
  const palette = ['#2563EB', '#4F46E5', '#8B5CF6', '#D946EF', '#F43F5E', '#F97316', '#FACC15']
  const count = getParticleCount(host.clientWidth || window.innerWidth, prefersReducedMotion)
  const geometry = new PlaneGeometry(PARTICLE_LENGTH, PARTICLE_THICKNESS)
  const meshCounts = palette.map((_, index) => {
    return Math.floor(count / palette.length) + (index < count % palette.length ? 1 : 0)
  })
  const materials = palette.map((particleColor) => {
    return new MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 0.78,
      depthWrite: false
    })
  })
  const meshes = meshCounts.map((meshCount, index) => {
    return new InstancedMesh(geometry, materials[index], meshCount)
  })
  const meshOffsets = palette.map(() => 0)
  const dummy = new Object3D()
  const radius = 7.8
  const particles: Array<{
    meshIndex: number
    instanceIndex: number
    x: number
    y: number
    z: number
    scale: number
    rotationZ: number
    phase: number
    jump: number
  }> = []

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.domElement.className = 'particle-canvas'
  host.appendChild(renderer.domElement)

  camera.position.set(0, 0.85, 10)
  dome.position.set(0, DOME_BASE_Y, 0)

  let generated = 0
  let attempts = 0
  while (generated < count && attempts < count * 3) {
    attempts += 1
    const theta = Math.random() * Math.PI * 2
    const vertical = 0.08 + Math.random() * 0.82
    const ring = Math.sqrt(1 - vertical * vertical)
    const sideBoost = Math.abs(Math.cos(theta)) ** 0.34
    const spread = radius * (0.74 + sideBoost * 0.34 + Math.random() * 0.18)
    const x = spread * ring * Math.cos(theta) * 1.12
    const y = spread * vertical - 0.18 + (Math.random() - 0.5) * 0.46
    const z = spread * ring * Math.sin(theta) * 0.42 + (Math.random() - 0.5) * 0.3
    const inTitleClearZone = Math.abs(x) < 4.95 && y > 1.25 && y < 3.95
    const inButtonClearZone = Math.abs(x) < 2.2 && y > -0.2 && y < 1.05
    if (inTitleClearZone || inButtonClearZone) {
      continue
    }
    const scale = 0.72 + Math.random() * 0.72
    const rotationZ = theta + Math.PI / 2 + (Math.random() - 0.5) * 0.7

    dummy.position.set(x, y, z)
    dummy.rotation.set((Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.45, rotationZ)
    dummy.scale.set(scale, scale, scale)
    dummy.updateMatrix()
    const meshIndex = generated % meshes.length
    const mesh = meshes[meshIndex]
    const instanceIndex = meshOffsets[meshIndex]
    mesh.setMatrixAt(instanceIndex, dummy.matrix)
    meshOffsets[meshIndex] += 1
    particles.push({
      meshIndex,
      instanceIndex,
      x,
      y,
      z,
      scale,
      rotationZ,
      phase: Math.random() * Math.PI * 2,
      jump: PARTICLE_JUMP_AMPLITUDE * (0.45 + Math.random() * 0.9)
    })
    generated += 1
  }

  meshes.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true
    dome.add(mesh)
  })
  scene.add(dome)

  const rotateX = gsap.quickTo(dome.rotation, 'x', { duration: 1.4, ease: 'power3.out' })
  const rotateY = gsap.quickTo(dome.rotation, 'y', { duration: 1.4, ease: 'power3.out' })
  const moveX = gsap.quickTo(dome.position, 'x', { duration: 1.2, ease: 'power3.out' })
  const moveY = gsap.quickTo(dome.position, 'y', { duration: 1.2, ease: 'power3.out' })

  const resize = () => {
    const width = host.clientWidth || window.innerWidth
    const height = host.clientHeight || 520
    camera.aspect = width / height
    camera.updateProjectionMatrix()
    renderer.setSize(width, height, false)
  }

  const handleMouseMove = (event: MouseEvent) => {
    const mouseX = event.clientX / window.innerWidth - 0.5
    const mouseY = event.clientY / window.innerHeight - 0.5
    const target = getMouseFollowTarget(mouseX, mouseY)
    rotateX(target.rotationX)
    rotateY(target.rotationY)
    moveX(target.positionX)
    moveY(target.positionY)
  }

  const resetRotation = () => {
    rotateX(0)
    rotateY(0)
    moveX(0)
    moveY(DOME_BASE_Y)
  }

  let frameId = 0
  const clockStart = performance.now()
  const render = () => {
    frameId = window.requestAnimationFrame(render)
    if (!prefersReducedMotion) {
      const elapsed = (performance.now() - clockStart) / 1000
      particles.forEach((particle) => {
        const wave = Math.sin(elapsed * 2.7 + particle.phase)
        const pulse = 1 + Math.sin(elapsed * 3.2 + particle.phase) * 0.12
        dummy.position.set(particle.x, particle.y + Math.max(0, wave) * particle.jump, particle.z)
        dummy.rotation.set(
          Math.sin(elapsed * 0.72 + particle.phase) * 0.18,
          Math.cos(elapsed * 0.64 + particle.phase) * 0.2,
          particle.rotationZ + elapsed * 0.18 + wave * 0.08
        )
        dummy.scale.set(particle.scale * pulse, particle.scale, particle.scale)
        dummy.updateMatrix()
        const mesh = meshes[particle.meshIndex]
        mesh.setMatrixAt(particle.instanceIndex, dummy.matrix)
      })
      meshes.forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true
      })
      dome.rotation.z += 0.00045
      meshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.00018 + index * 0.00002
      })
    }
    renderer.render(scene, camera)
  }

  resize()
  render()
  window.addEventListener('resize', resize)
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseleave', resetRotation)

  disposeScene = () => {
    window.cancelAnimationFrame(frameId)
    window.removeEventListener('resize', resize)
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('mouseleave', resetRotation)
    gsap.killTweensOf(dome.rotation)
    gsap.killTweensOf(dome.position)
    geometry.dispose()
    materials.forEach((material) => {
      material.dispose()
    })
    renderer.dispose()
    renderer.domElement.remove()
  }
})

onBeforeUnmount(() => {
  disposed = true
  disposeScene()
  disposeScene = () => {}
})
</script>

<template>
  <div ref="stageRef" class="particle-dome" aria-hidden="true" data-test="particle-dome" />
</template>
