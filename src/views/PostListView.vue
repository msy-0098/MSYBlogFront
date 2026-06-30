<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import {
  getCategories,
  getCategoryPosts,
  getPosts,
  getTagPosts,
  getTags,
  type PageResult,
  type PostSummary,
  type Taxonomy
} from '../api/blog'
import PostCard from '../components/blog/PostCard.vue'

const props = withDefaults(
  defineProps<{
    mode?: 'all' | 'category' | 'tag'
  }>(),
  {
    mode: 'all'
  }
)

const route = useRoute()
const page = ref<PageResult<PostSummary> | null>(null)
const taxonomyItems = ref<Taxonomy[]>([])
const currentPage = ref(1)
const pageSize = 9
const loading = ref(true)
const error = ref('')

const slug = computed(() => String(route.params.slug ?? ''))
const totalPages = computed(() => Math.max(1, Math.ceil((page.value?.total ?? 0) / pageSize)))
const taxonomyName = computed(() => taxonomyItems.value.find((item) => item.slug === slug.value)?.name || slug.value)
const title = computed(() => {
  if (props.mode === 'category') {
    return `Category: ${taxonomyName.value}`
  }
  if (props.mode === 'tag') {
    return `Tag: ${taxonomyName.value}`
  }

  return 'Posts'
})

async function loadTaxonomyNames() {
  if (props.mode === 'category') {
    taxonomyItems.value = await getCategories()
  } else if (props.mode === 'tag') {
    taxonomyItems.value = await getTags()
  } else {
    taxonomyItems.value = []
  }
}

async function loadPosts() {
  loading.value = true
  error.value = ''

  try {
    await loadTaxonomyNames()
    const params = { page: currentPage.value, pageSize }
    if (props.mode === 'category') {
      page.value = await getCategoryPosts(slug.value, params)
    } else if (props.mode === 'tag') {
      page.value = await getTagPosts(slug.value, params)
    } else {
      page.value = await getPosts(params)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Posts failed to load'
  } finally {
    loading.value = false
  }
}

function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > totalPages.value || nextPage === currentPage.value) {
    return
  }
  currentPage.value = nextPage
  void loadPosts()
}

onMounted(loadPosts)
watch(
  () => route.fullPath,
  () => {
    currentPage.value = 1
    void loadPosts()
  }
)
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">Writing</p>
      <h1>{{ title }}</h1>
      <p>Published notes ordered by time, backed by the database.</p>
    </div>

    <p v-if="loading" class="state-line">Loading posts...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <template v-else>
      <div v-if="page?.list.length" class="post-grid reading-grid">
        <PostCard v-for="post in page.list" :key="post.slug" :post="post" />
      </div>

      <p v-else class="state-line">No posts yet.</p>

      <nav v-if="page && page.total > pageSize" class="pagination-bar" aria-label="Post pagination">
        <button type="button" :disabled="currentPage <= 1" @click="goToPage(currentPage - 1)">Previous</button>
        <span>Page {{ currentPage }} / {{ totalPages }}</span>
        <button type="button" :disabled="currentPage >= totalPages" @click="goToPage(currentPage + 1)">Next</button>
      </nav>
    </template>
  </section>
</template>
