<script setup lang="ts">
import HeroParticleDome from './HeroParticleDome.vue'

defineProps<{
  owner: string
  subtitle: string
  description: string
}>()

const typedIntro = '专注于AI 融入JAVA GO 业务，项目实践沉淀成技术作品'
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
      <p class="typed-intro" :aria-label="typedIntro">
        <span>{{ typedIntro }}</span>
      </p>
      <p class="description">{{ description }}</p>

      <div class="actions" aria-label="首页快捷操作">
        <RouterLink class="primary-button" to="/posts">开始阅读</RouterLink>
        <RouterLink class="secondary-button" to="/projects">查看项目</RouterLink>
      </div>
    </div>
  </section>
</template>
