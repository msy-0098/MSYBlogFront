<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getSiteProfile, type SiteProfile } from '../api/site'

const fallbackProfile: SiteProfile = {
  siteTitle: '马森雨的技术博客',
  subtitle: '用 Go、Vue 和 AI 工具构建清爽可靠的技术作品',
  owner: '马森雨',
  domain: 'masenyu.top',
  description: '记录项目实践、技术复盘和持续成长。',
  navItems: ['首页', '文章', '分类', '项目', '关于']
}

const profile = ref<SiteProfile>(fallbackProfile)
const apiStatus = ref('正在连接 /api/site')

onMounted(async () => {
  try {
    profile.value = await getSiteProfile()
    apiStatus.value = '/api/site 已连接'
  } catch {
    apiStatus.value = '后端未启动，已显示本地默认信息'
  }
})
</script>

<template>
  <section class="home-shell">
    <p class="eyebrow">masenyu.top</p>
    <h1>{{ profile.siteTitle }}</h1>
    <p class="subtitle">{{ profile.subtitle }}</p>
    <p class="description">{{ profile.description }}</p>

    <div class="actions">
      <RouterLink class="primary-button" to="/posts">开始阅读</RouterLink>
      <RouterLink class="secondary-button" to="/projects">查看项目</RouterLink>
    </div>

    <div class="status-panel">
      <span>第一阶段骨架</span>
      <strong>{{ apiStatus }}</strong>
    </div>
  </section>
</template>

