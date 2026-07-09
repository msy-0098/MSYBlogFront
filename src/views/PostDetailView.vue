<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getPostDetail, type PostDetail } from '../api/blog'
import MarkdownRenderer from '../components/blog/MarkdownRenderer.vue'
import PostComments from '../components/blog/PostComments.vue'
import PostTableOfContents from '../components/blog/PostTableOfContents.vue'
import { extractMarkdownHeadings } from '../utils/markdownHeadings'

const route = useRoute()
const post = ref<PostDetail | null>(null)
const loading = ref(true)
const error = ref('')

const slug = computed(() => String(route.params.slug ?? ''))
const headings = computed(() => extractMarkdownHeadings(post.value?.content || ''))

async function loadPost() {
  loading.value = true
  error.value = ''

  try {
    post.value = await getPostDetail(slug.value)
  } catch (err) {
    error.value = err instanceof Error ? err.message : '文章加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadPost)
watch(slug, loadPost)
</script>

<template>
  <section class="post-detail-page">
    <p v-if="loading" class="state-line">正在加载正文呀...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <template v-else-if="post">
      <header class="post-detail-header">
        <RouterLink class="section-link" to="/posts">返回文章</RouterLink>
        <p class="post-meta">{{ post.publishedAt }} · {{ post.category.name }} · {{ post.viewCount }} 次阅读</p>
        <h1>{{ post.title }}</h1>
        <p>{{ post.summary }}</p>
        <div class="tag-row">
          <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`">
            {{ tag.name }}
          </RouterLink>
        </div>
      </header>

      <div class="post-reading-layout">
        <div class="post-reading-main">
          <MarkdownRenderer :content="post.content" />
        </div>
        <aside class="post-reading-sidebar">
          <PostTableOfContents :headings="headings" />
        </aside>
      </div>

      <nav class="adjacent-posts" aria-label="上一篇和下一篇文章">
        <RouterLink v-if="post.prev" :to="`/posts/${post.prev.slug}`">
          <span>上一篇</span>
          {{ post.prev.title }}
        </RouterLink>
        <RouterLink v-if="post.next" :to="`/posts/${post.next.slug}`">
          <span>下一篇</span>
          {{ post.next.title }}
        </RouterLink>
      </nav>

      <PostComments :slug="post.slug" />
    </template>
  </section>
</template>
