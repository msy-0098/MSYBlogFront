<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getSiteProfile, type SiteProfile } from '../api/site'

const profile = ref<SiteProfile | null>(null)
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    profile.value = await getSiteProfile()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '个人资料加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">关于</p>
      <h1>{{ profile?.owner || '关于我' }}</h1>
      <p>{{ profile?.subtitle || '记录工程实践、项目复盘和 AI 协作里的长期成长。' }}</p>
    </div>

    <p v-if="loading" class="state-line">正在加载个人资料...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else class="about-strip">
      <div>
        <h2>{{ profile?.siteTitle }}</h2>
        <p>{{ profile?.description }}</p>
        <p v-if="profile?.domain">域名：{{ profile.domain }}</p>
      </div>
      <RouterLink class="secondary-button" to="/posts">继续阅读文章</RouterLink>
    </div>
  </section>
</template>
