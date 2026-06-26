<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getCategoryPosts, getPosts, getTagPosts, type PageResult, type PostSummary } from '../api/blog'
import PostCard from '../components/blog/PostCard.vue'

const props = defineProps<{
  mode?: 'all' | 'category' | 'tag'
}>()

const route = useRoute()
const page = ref<PageResult<PostSummary> | null>(null)
const loading = ref(true)
const error = ref('')

const title = computed(() => {
  if (props.mode === 'category') {
    return `分类：${route.params.slug}`
  }
  if (props.mode === 'tag') {
    return `标签：${route.params.slug}`
  }

  return '文章'
})

async function loadPosts() {
  loading.value = true
  error.value = ''

  try {
    const slug = String(route.params.slug ?? '')
    if (props.mode === 'category') {
      page.value = await getCategoryPosts(slug)
    } else if (props.mode === 'tag') {
      page.value = await getTagPosts(slug)
    } else {
      page.value = await getPosts()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadPosts)
watch(() => route.fullPath, loadPosts)
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">Writing</p>
      <h1>{{ title }}</h1>
      <p>按发布时间倒序整理项目实践、技术复盘和工具协作记录。</p>
    </div>

    <p v-if="loading" class="state-line">正在加载文章呀...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else-if="page?.list.length" class="post-grid reading-grid">
      <PostCard v-for="post in page.list" :key="post.slug" :post="post" />
    </div>

    <p v-else class="state-line">暂时没有文章哦。</p>
  </section>
</template>
