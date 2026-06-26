<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

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

function particleCount(width: number, reducedMotion: boolean) {
  if (reducedMotion) {
    return 160
  }
  if (width < 640) {
    return 420
  }
  if (width < 1024) {
    return 720
  }
  return 1120
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
    { SphereGeometry },
    { MeshBasicMaterial },
    { Object3D }
  ] = await Promise.all([
    import('gsap'),
    import('three/src/scenes/Scene.js'),
    import('three/src/cameras/PerspectiveCamera.js'),
    import('three/src/renderers/WebGLRenderer.js'),
    import('three/src/objects/Group.js'),
    import('three/src/objects/InstancedMesh.js'),
    import('three/src/geometries/SphereGeometry.js'),
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
  const palette = ['#3B82F6', '#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4']
  const count = particleCount(host.clientWidth || window.innerWidth, prefersReducedMotion)
  const geometry = new SphereGeometry(0.021, 8, 6)
  const meshCounts = palette.map((_, index) => {
    return Math.floor(count / palette.length) + (index < count % palette.length ? 1 : 0)
  })
  const materials = palette.map((particleColor) => {
    return new MeshBasicMaterial({
      color: particleColor,
      transparent: true,
      opacity: 0.56,
      depthWrite: false
    })
  })
  const meshes = meshCounts.map((meshCount, index) => {
    return new InstancedMesh(geometry, materials[index], meshCount)
  })
  const meshOffsets = palette.map(() => 0)
  const dummy = new Object3D()
  const radius = 7.05

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5))
  renderer.domElement.className = 'particle-canvas'
  host.appendChild(renderer.domElement)

  camera.position.set(0, 1.1, 10)
  dome.position.set(0, -1.4, 0)

  for (let i = 0; i < count; i += 1) {
    const theta = Math.random() * Math.PI * 2
    const vertical = 0.05 + Math.random() * 0.9
    const ring = Math.sqrt(1 - vertical * vertical)
    const spread = radius * (0.82 + Math.random() * 0.34)
    const x = spread * ring * Math.cos(theta)
    const y = spread * vertical + (Math.random() - 0.5) * 0.38
    const z = spread * ring * Math.sin(theta) * 0.52 + (Math.random() - 0.5) * 0.24
    const scale = 0.72 + Math.random() * 0.44

    dummy.position.set(x, y, z)
    dummy.scale.setScalar(scale)
    dummy.updateMatrix()
    const meshIndex = i % meshes.length
    const mesh = meshes[meshIndex]
    const instanceIndex = meshOffsets[meshIndex]
    mesh.setMatrixAt(instanceIndex, dummy.matrix)
    meshOffsets[meshIndex] += 1
  }

  meshes.forEach((mesh) => {
    mesh.instanceMatrix.needsUpdate = true
    dome.add(mesh)
  })
  scene.add(dome)

  const rotateX = gsap.quickTo(dome.rotation, 'x', { duration: 1.4, ease: 'power3.out' })
  const rotateY = gsap.quickTo(dome.rotation, 'y', { duration: 1.4, ease: 'power3.out' })

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
    rotateX(mouseY * 0.12)
    rotateY(mouseX * 0.18)
  }

  const resetRotation = () => {
    rotateX(0)
    rotateY(0)
  }

  let frameId = 0
  const render = () => {
    frameId = window.requestAnimationFrame(render)
    if (!prefersReducedMotion) {
      dome.rotation.z += 0.0007
      meshes.forEach((mesh, index) => {
        mesh.rotation.y += 0.00025 + index * 0.00003
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
