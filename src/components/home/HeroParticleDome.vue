<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  DOME_BASE_Y,
  PARTICLE_OPACITY,
  PARTICLE_PALETTE,
  PARTICLE_LENGTH,
  PARTICLE_THICKNESS,
  createDomeParticleSpecs,
  getBoundaryImpact,
  getContainedDomeFlowPoint,
  getFluidDomeFollowTarget,
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
  const palette = PARTICLE_PALETTE
  const count = getParticleCount(host.clientWidth || window.innerWidth, prefersReducedMotion)
  const particleSpecs = createDomeParticleSpecs(count)
  const geometry = new PlaneGeometry(PARTICLE_LENGTH, PARTICLE_THICKNESS)
  const meshCounts = palette.map((_, index) => {
    return particleSpecs.filter((spec) => spec.paletteIndex === index).length
  })
  const materials = palette.map((particleColor) => {
    return new MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: PARTICLE_OPACITY,
      depthWrite: false
    })
  })
  const meshes = meshCounts.map((meshCount, index) => {
    return new InstancedMesh(geometry, materials[index], meshCount)
  })
  const meshOffsets = palette.map(() => 0)
  const dummy = new Object3D()
  const particles: Array<{
    meshIndex: number
    instanceIndex: number
    x: number
    y: number
    z: number
    scale: number
    rotationX: number
    rotationY: number
    rotationZ: number
    phase: number
    jump: number
    flowAngle: number
    flowRadius: number
    boundaryRadius: number
    boundaryStrength: number
    flowSpeed: number
  }> = []
  const flowCenter = {
    x: 0,
    y: 0,
    targetX: 0,
    targetY: 0,
    impact: 0.08,
    targetImpact: 0.08
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.domElement.className = 'particle-canvas'
  host.appendChild(renderer.domElement)

  camera.position.set(0, 0.85, 10)
  dome.position.set(0, DOME_BASE_Y, 0)

  particleSpecs.forEach((spec) => {
    dummy.position.set(spec.x, spec.y, spec.z)
    dummy.rotation.set(spec.rotationX, spec.rotationY, spec.rotationZ)
    dummy.scale.set(spec.scale, spec.scale, spec.scale)
    dummy.updateMatrix()
    const meshIndex = spec.paletteIndex
    const mesh = meshes[meshIndex]
    const instanceIndex = meshOffsets[meshIndex]
    mesh.setMatrixAt(instanceIndex, dummy.matrix)
    meshOffsets[meshIndex] += 1
    particles.push({
      meshIndex,
      instanceIndex,
      x: spec.x,
      y: spec.y,
      z: spec.z,
      scale: spec.scale,
      rotationX: spec.rotationX,
      rotationY: spec.rotationY,
      rotationZ: spec.rotationZ,
      phase: spec.phase,
      jump: spec.jump,
      flowAngle: spec.flowAngle,
      flowRadius: spec.flowRadius,
      boundaryRadius: spec.boundaryRadius,
      boundaryStrength: spec.boundaryStrength,
      flowSpeed: spec.flowSpeed
    })
  })

  meshes.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true
    dome.add(mesh)
  })
  scene.add(dome)

  const rotateX = gsap.quickTo(dome.rotation, 'x', { duration: 1.4, ease: 'power3.out' })
  const rotateY = gsap.quickTo(dome.rotation, 'y', { duration: 1.4, ease: 'power3.out' })
  const moveX = gsap.quickTo(dome.position, 'x', { duration: 1.2, ease: 'power3.out' })
  const moveY = gsap.quickTo(dome.position, 'y', { duration: 1.2, ease: 'power3.out' })
  const moveCenterX = gsap.quickTo(flowCenter, 'targetX', { duration: 0.68, ease: 'power3.out' })
  const moveCenterY = gsap.quickTo(flowCenter, 'targetY', { duration: 0.68, ease: 'power3.out' })
  const pushImpact = gsap.quickTo(flowCenter, 'targetImpact', { duration: 0.42, ease: 'power3.out' })

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
    const target = getFluidDomeFollowTarget(mouseX, mouseY)
    rotateX(target.rotationX)
    rotateY(target.rotationY)
    moveX(target.positionX)
    moveY(target.positionY)
    moveCenterX(target.centerX)
    moveCenterY(target.centerY)
    pushImpact(target.impact)
  }

  const resetRotation = () => {
    rotateX(0)
    rotateY(0)
    moveX(0)
    moveY(DOME_BASE_Y)
    moveCenterX(0)
    moveCenterY(0)
    pushImpact(getBoundaryImpact(0, 0))
  }

  let frameId = 0
  const clockStart = performance.now()
  const render = () => {
    frameId = window.requestAnimationFrame(render)
    if (!prefersReducedMotion) {
      const elapsed = (performance.now() - clockStart) / 1000
      flowCenter.x += (flowCenter.targetX - flowCenter.x) * 0.075
      flowCenter.y += (flowCenter.targetY - flowCenter.y) * 0.075
      flowCenter.impact += (flowCenter.targetImpact - flowCenter.impact) * 0.09
      particles.forEach((particle) => {
        const wave = Math.sin(elapsed * 2.25 + particle.phase)
        const lift = Math.max(0, wave) * particle.jump
        const pulse = 1 + Math.sin(elapsed * 2.45 + particle.phase) * 0.055
        const flowProgress =
          (elapsed * particle.flowSpeed + particle.flowRadius / particle.boundaryRadius) % 1
        const easedFlow = 1 - (1 - flowProgress) * (1 - flowProgress)
        const boundaryHit = Math.max(0, (flowProgress - 0.78) / 0.22)
        const impactWave =
          Math.sin(elapsed * 5.2 - particle.flowAngle * 2.4 + particle.phase) *
          boundaryHit *
          flowCenter.impact *
          particle.boundaryStrength
        const rebound = Math.cos(boundaryHit * Math.PI) * boundaryHit * 0.16
        const flowRadius = Math.min(
          particle.boundaryRadius,
          particle.boundaryRadius * (0.12 + easedFlow * 0.92 + impactWave * 0.08 - rebound)
        )
        const verticalScale = 0.56 + particle.boundaryStrength * 0.14
        const containedFlow = getContainedDomeFlowPoint({
          angle: particle.flowAngle + impactWave * 0.1,
          boundaryRadius: particle.boundaryRadius,
          centerX: flowCenter.x,
          centerY: flowCenter.y,
          impact: flowCenter.impact,
          radius: flowRadius,
          verticalScale
        })
        const boundarySlide = containedFlow.boundaryHit * flowCenter.impact
        const flowX = containedFlow.x
        const flowY = containedFlow.y
        const x = particle.x * 0.28 + flowX * 2.28
        const y = particle.y * 0.46 + flowY * 2.58
        const z = particle.z + impactWave * 0.16
        dummy.position.set(x, y + lift, z)
        dummy.rotation.set(
          particle.rotationX +
            Math.sin(elapsed * 0.52 + particle.phase) * 0.045 +
            impactWave * 0.06,
          particle.rotationY + Math.cos(elapsed * 0.46 + particle.phase) * 0.055,
          particle.rotationZ + elapsed * 0.065 + wave * 0.035 + boundaryHit * 0.18 + boundarySlide * 0.16
        )
        dummy.scale.set(particle.scale * pulse, particle.scale, particle.scale)
        dummy.updateMatrix()
        const mesh = meshes[particle.meshIndex]
        mesh.setMatrixAt(particle.instanceIndex, dummy.matrix)
      })
      meshes.forEach((mesh) => {
        mesh.instanceMatrix.needsUpdate = true
      })
      dome.rotation.z += 0.00018
      meshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.00006 + index * 0.000008
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
