<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import HeroParticleDome from './HeroParticleDome.vue'

defineProps<{
  owner: string
  subtitle: string
  description: string
}>()

const typedIntro = '专注于AI 融入JAVA GO 业务，项目实践沉淀成技术作品'
const typedOutput = ref('')
const typedCharacters = Array.from(typedIntro)
const typedDisplay = computed(() => typedOutput.value || '\u00a0')

let typingTimer: ReturnType<typeof setTimeout> | undefined

function clearTypingTimer() {
  if (typingTimer) {
    clearTimeout(typingTimer)
    typingTimer = undefined
  }
}

function typeNextCharacter(index = 0) {
  typedOutput.value = typedCharacters.slice(0, index).join('')

  if (index > typedCharacters.length) {
    return
  }

  const currentCharacter = typedCharacters[index - 1] ?? ''
  const delay = /[，。,.]/.test(currentCharacter) ? 180 : 46 + (index % 3) * 14
  typingTimer = setTimeout(() => typeNextCharacter(index + 1), delay)
}

onMounted(() => {
  const prefersReducedMotion =
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false

  if (prefersReducedMotion) {
    typedOutput.value = typedIntro
    return
  }

  typeNextCharacter()
})

onBeforeUnmount(clearTypingTimer)
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
        <span>构建清爽可靠的</span>
        <span>技术作品</span>
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
