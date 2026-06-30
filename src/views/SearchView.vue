<script setup lang="ts">
import { computed, ref } from 'vue'

import { searchPosts, type PageResult, type PostSummary } from '../api/blog'
import PostCard from '../components/blog/PostCard.vue'

const keyword = ref('')
const lastQuery = ref('')
const result = ref<PageResult<PostSummary> | null>(null)
const currentPage = ref(1)
const pageSize = 9
const loading = ref(false)
const message = ref('Enter a keyword to search posts.')

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
    message.value = 'Please enter a keyword.'
    return
  }

  loading.value = true
  message.value = ''

  try {
    lastQuery.value = q
    result.value = await searchPosts({ q, page: currentPage.value, pageSize })
    if (result.value.list.length === 0) {
      message.value = 'No related posts found.'
    }
  } catch (err) {
    message.value = err instanceof Error ? err.message : 'Search failed'
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
      <p class="section-kicker">Search</p>
      <h1>Search</h1>
      <p>Search post titles, summaries, and body content.</p>
    </div>

    <form class="search-box" @submit.prevent="submitSearch">
      <input v-model="keyword" type="search" placeholder="Go, MySQL, deploy..." aria-label="Search keyword" />
      <button class="primary-button" type="submit">Search</button>
    </form>

    <p v-if="loading" class="state-line">Searching...</p>
    <p v-else-if="message" class="state-line">{{ message }}</p>

    <div v-if="result?.list.length" class="post-grid reading-grid">
      <PostCard v-for="post in result.list" :key="post.slug" :post="post" />
    </div>

    <nav v-if="result && result.total > pageSize" class="pagination-bar" aria-label="Search pagination">
      <button type="button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Previous</button>
      <span>Page {{ currentPage }} / {{ totalPages }}</span>
      <button type="button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
    </nav>
  </section>
</template>
