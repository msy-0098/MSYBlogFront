<script setup lang="ts">
import { ref } from 'vue'

import { searchPosts, type PageResult, type PostSummary } from '../api/blog'
import PostCard from '../components/blog/PostCard.vue'

const keyword = ref('')
const result = ref<PageResult<PostSummary> | null>(null)
const loading = ref(false)
const message = ref('输入关键词后开始搜索哦。')

async function submitSearch() {
  const q = keyword.value.trim()
  if (!q) {
    result.value = null
    message.value = '请输入关键词呀。'
    return
  }

  loading.value = true
  message.value = ''

  try {
    result.value = await searchPosts(q)
    if (result.value.list.length === 0) {
      message.value = '没有找到相关文章哦。'
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : '搜索失败'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">Search</p>
      <h1>搜索</h1>
      <p>按标题、摘要和正文检索文章内容。</p>
    </div>

    <form class="search-box" @submit.prevent="submitSearch">
      <input v-model="keyword" type="search" placeholder="输入 Go、SQLite、部署..." aria-label="搜索关键词" />
      <button class="primary-button" type="submit">搜索</button>
    </form>

    <p v-if="loading" class="state-line">正在搜索呀...</p>
    <p v-else-if="message" class="state-line">{{ message }}</p>

    <div v-if="result?.list.length" class="post-grid reading-grid">
      <PostCard v-for="post in result.list" :key="post.slug" :post="post" />
    </div>
  </section>
</template>
