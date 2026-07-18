<script setup lang="ts">
import { computed, ref } from 'vue'

import { searchPosts, type PageResult, type PostSummary } from '../api/blog'
import PostCard from '../components/blog/PostCard.vue'
import OrbitPagination from '../components/common/OrbitPagination.vue'

const keyword = ref('')
const lastQuery = ref('')
const result = ref<PageResult<PostSummary> | null>(null)
const currentPage = ref(1)
const pageSize = 9
const loading = ref(false)
const message = ref('输入关键词搜索文章，沿着一个问题继续往下读。')

const totalPages = computed(() => Math.max(1, Math.ceil((result.value?.total ?? 0) / pageSize)))

async function submitSearch() {
  currentPage.value = 1
  await loadSearch()
}

async function loadSearch() {
  const q = keyword.value.trim()
  if (!q) {
    result.value = null
    lastQuery.value = ''
    message.value = '请先输入关键词。'
    return
  }

  loading.value = true
  message.value = ''

  try {
    lastQuery.value = q
    result.value = await searchPosts({ q, page: currentPage.value, pageSize })
    if (result.value.list.length === 0) {
      message.value = '没有找到相关文章。'
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : '搜索失败'
  } finally {
    loading.value = false
  }
}

function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === currentPage.value) {
    return
  }
  currentPage.value = nextPage
  keyword.value = lastQuery.value || keyword.value
  void loadSearch()
}
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">搜索</p>
      <h1>在写作档案里找答案</h1>
      <p>检索标题、摘要和正文，继续沿着主题向下阅读。</p>
    </div>

    <form class="search-box" @submit.prevent="submitSearch">
      <input v-model="keyword" type="search" placeholder="Go、MySQL、部署..." aria-label="搜索关键词" />
      <button class="primary-button" type="submit">搜索</button>
    </form>

    <p v-if="loading" class="state-line">正在搜索...</p>
    <p v-else-if="message" class="state-line">{{ message }}</p>

    <div v-if="result?.list.length" class="post-grid reading-grid" data-test="search-result-grid">
      <PostCard v-for="post in result.list" :key="post.slug" :post="post" />
    </div>
    <OrbitPagination
      v-if="result"
      :current-page="currentPage"
      :total-pages="totalPages"
      label="搜索分页"
      @change="goToPage"
    />
  </section>
</template>
