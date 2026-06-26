<script setup lang="ts">
import HeroParticleDome from './HeroParticleDome.vue'

defineProps<{
  owner: string
  subtitle: string
  description: string
}>()
</script>

<template>
  <section class="home-hero" aria-labelledby="home-title">
    <HeroParticleDome />

    <div class="hero-content">
      <p class="eyebrow">masenyu.top</p>
      <h1 id="home-title">你好，我是{{ owner }}</h1>
      <p class="subtitle">{{ subtitle }}</p>
      <p class="description">{{ description }}</p>

      <div class="actions" aria-label="首页快捷操作">
        <RouterLink class="primary-button" to="/posts">开始阅读</RouterLink>
        <RouterLink class="secondary-button" to="/projects">查看项目</RouterLink>
      </div>
    </div>
  </section>
</template>
