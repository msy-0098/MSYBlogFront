<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { getPostDetail, likePost, type PostDetail } from '../api/blog'
import MarkdownRenderer from '../components/blog/MarkdownRenderer.vue'
import PostComments from '../components/blog/PostComments.vue'
import PostTableOfContents from '../components/blog/PostTableOfContents.vue'
import { extractMarkdownHeadings } from '../utils/markdownHeadings'
import { setDefaultPageMeta, setPageMeta } from '../utils/pageMeta'

const route = useRoute()
const post = ref<PostDetail | null>(null)
const loading = ref(true)
const error = ref('')
const likeBusy = ref(false)
const likeMessage = ref('')

const slug = computed(() => String(route.params.slug ?? ''))
const headings = computed(() => extractMarkdownHeadings(post.value?.content || ''))
const likedKey = computed(() => (slug.value ? `post_liked_${slug.value}` : ''))
const alreadyLiked = computed(() => {
  if (!likedKey.value || typeof localStorage === 'undefined') return false
  return localStorage.getItem(likedKey.value) === '1'
})

async function loadPost() {
  loading.value = true
  error.value = ''
  likeMessage.value = ''

  try {
    post.value = await getPostDetail(slug.value)
    setPageMeta({
      title: `${post.value.title} · 马森雨的技术博客`,
      description: post.value.summary || post.value.title
    })
  } catch (err) {
    post.value = null
    error.value = err instanceof Error ? err.message : '文章加载失败'
    setDefaultPageMeta()
  } finally {
    loading.value = false
  }
}

async function onLike() {
  if (!post.value || likeBusy.value) return
  likeBusy.value = true
  likeMessage.value = ''
  try {
    const result = await likePost(post.value.slug)
    post.value = { ...post.value, likeCount: result.likeCount }
    if (likedKey.value) localStorage.setItem(likedKey.value, '1')
    likeMessage.value = '感谢点赞'
  } catch (err) {
    likeMessage.value = err instanceof Error ? err.message : '点赞失败'
  } finally {
    likeBusy.value = false
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
        <p class="post-meta">
          {{ post.publishedAt }} · {{ post.category.name }} · {{ post.viewCount }} 次阅读 ·
          {{ post.likeCount ?? 0 }} 赞
        </p>
        <h1>{{ post.title }}</h1>
        <p>{{ post.summary }}</p>
        <div class="tag-row">
          <RouterLink v-for="tag in post.tags" :key="tag.slug" :to="`/tags/${tag.slug}`">
            {{ tag.name }}
          </RouterLink>
        </div>
        <div class="post-like-row">
          <button
            class="primary-button"
            type="button"
            data-test="post-like-button"
            :disabled="likeBusy || alreadyLiked"
            @click="onLike"
          >
            {{ alreadyLiked ? '已点赞' : likeBusy ? '点赞中...' : '点个赞' }}
          </button>
          <span v-if="likeMessage" class="state-line">{{ likeMessage }}</span>
        </div>
      </header>

      <div class="post-reading-layout">
        <div class="post-reading-main">
          <MarkdownRenderer :content="post.content" />
        </div>
        <aside v-if="headings.length" class="post-reading-sidebar">
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

<style scoped>
.post-like-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
  margin-top: 1rem;
}
</style>