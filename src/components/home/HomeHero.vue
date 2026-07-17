<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref } from 'vue'

// Defer particle worker bundle until after home shell mounts.
const HeroParticleDome = defineAsyncComponent(() => import('./HeroParticleDome.vue'))

defineProps<{
  owner: string
  subtitle: string
  description: string
}>()

const typedIntro = '专注于AI 融入JAVA GO 业务，项目实践沉淀成技术作品'
const typedOutput = ref('')
const typedCharacters = Array.from(typedIntro)
const typedDisplay = computed(() => typedOutput.value || '\u00a0')

let animationFrameId: number | undefined
let lastFrameTime = 0
let currentIndex = 0
let currentDelay = 0

function clearTyping() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId)
    animationFrameId = undefined
  }
}

function typeNextCharacter(timestamp: number) {
  if (lastFrameTime === 0) {
    lastFrameTime = timestamp
  }

  const elapsed = timestamp - lastFrameTime

  if (elapsed >= currentDelay) {
    currentIndex++
    typedOutput.value = typedCharacters.slice(0, currentIndex).join('')
    lastFrameTime = timestamp

    if (currentIndex > typedCharacters.length) {
      return
    }

    const currentCharacter = typedCharacters[currentIndex - 1] ?? ''
    currentDelay = /[，。,.]/.test(currentCharacter) ? 180 : 46 + (currentIndex % 3) * 14
  }

  animationFrameId = requestAnimationFrame(typeNextCharacter)
}

onMounted(() => {
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  if (prefersReducedMotion) {
    typedOutput.value = typedIntro
    return
  }

  // Delay the start of typewriter effect slightly to allow First Contentful Paint (FCP) to complete smoothly
  setTimeout(() => {
    animationFrameId = requestAnimationFrame(typeNextCharacter)
  }, 400)
})

onBeforeUnmount(clearTyping)
</script>

<template>
  <section class="home-hero" aria-labelledby="home-title">
    <HeroParticleDome />

    <div class="hero-content">
      <p class="hero-brandline">
        <span class="hero-brand-mark" aria-hidden="true">M</span>
        <span>{{ owner }} Blog</span>
      </p>
      <h1 id="home-title">
        <span class="title-light">构建清爽可靠的</span>
        <span class="title-bold">技术作品</span>
      </h1>
      <p class="subtitle">{{ subtitle }}</p>
      <p class="typed-intro" :aria-label="typedIntro" data-test="typed-intro">
        <span aria-hidden="true" data-test="typed-intro-text" data-typing-stream="true">
          {{ typedDisplay }}
        </span>
        <i aria-hidden="true" />
      </p>
      <p class="description">{{ description }}</p>

      <div class="actions" aria-label="首页快捷操作">
        <RouterLink class="primary-button" to="/posts">开始阅读</RouterLink>
        <RouterLink class="secondary-button" to="/projects">查看项目</RouterLink>
      </div>
    </div>
  </section>
</template>
