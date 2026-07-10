<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getArchive, type ArchiveYear } from '../api/blog'

const years = ref<ArchiveYear[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    years.value = await getArchive()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '归档加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">归档</p>
      <h1>沿着时间线回看</h1>
      <p>按年份和月份收纳公开笔记，适合从一个阶段继续追踪思考脉络。</p>
    </div>

    <p v-if="loading" class="state-line">正在加载归档呀...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else class="archive-list">
      <section v-for="year in years" :key="year.year" class="archive-year">
        <h2>{{ year.year }}</h2>
        <div v-for="month in year.months" :key="month.month" class="archive-month">
          <h3>{{ month.month }} 月</h3>
          <RouterLink v-for="post in month.posts" :key="post.slug" :to="`/posts/${post.slug}`">
            <time>{{ post.publishedAt }}</time>
            <span>{{ post.title }}</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </section>
</template>
