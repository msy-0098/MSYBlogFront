<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getSiteProfile, type SiteProfile } from '../api/site'
import CategoryCloud from '../components/home/CategoryCloud.vue'
import FeaturedProjects from '../components/home/FeaturedProjects.vue'
import HomeHero from '../components/home/HomeHero.vue'
import LatestPosts from '../components/home/LatestPosts.vue'

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
  <div class="home-page">
    <HomeHero
      :owner="profile.owner"
      :subtitle="profile.subtitle"
      :description="profile.description"
    />
    <LatestPosts />
    <CategoryCloud />
    <FeaturedProjects />

    <section class="about-strip" aria-labelledby="about-strip-title">
      <div>
        <p class="section-kicker">About</p>
        <h2 id="about-strip-title">关于我</h2>
        <p>{{ profile.description }}</p>
      </div>
      <RouterLink class="secondary-button" to="/about">了解更多</RouterLink>
    </section>

    <p class="api-status" aria-live="polite">{{ apiStatus }}</p>
  </div>
</template>
