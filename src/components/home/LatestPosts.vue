<script setup lang="ts">
import type { PostSummary } from '../../api/blog'
import PostCard from '../blog/PostCard.vue'

defineProps<{
  posts: PostSummary[]
  loading?: boolean
  error?: string
}>()

const accents = ['#3B82F6', '#06B6D4', '#8B5CF6', '#F59E0B', '#EF4444', '#10B981']

const handleMouseMove = (event: MouseEvent, target: HTMLElement) => {
  const rect = target.getBoundingClientRect()
  const x = event.clientX - rect.left
  const y = event.clientY - rect.top
  target.style.setProperty('--mouse-x', `${x}px`)
  target.style.setProperty('--mouse-y', `${y}px`)
}
</script>

<template>
  <section
    class="section-band google-flow-section latest-post-rail"
    aria-labelledby="latest-posts-title"
    data-test="latest-post-rail"
  >
    <div class="section-inner">
      <div class="section-heading google-flow-heading">
        <div>
          <p class="section-kicker">继续阅读</p>
          <h2 id="latest-posts-title">最新文章轨道</h2>
          <p class="section-lead">精选文章之后，顺着时间继续浏览最近发布的复盘、笔记与工程记录。</p>
        </div>
        <RouterLink class="section-link" to="/posts">查看全部</RouterLink>
      </div>

      <p v-if="loading" class="state-line">正在加载最新文章...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="posts.length === 0" class="state-line">暂时还没有已发布文章。</p>

      <div v-else class="latest-post-rail__track">
        <article
          v-for="(post, index) in posts"
          :key="post.slug"
          class="latest-post-rail__slot"
          :style="{ '--accent': accents[index % accents.length] }"
          @mousemove="handleMouseMove($event, $event.currentTarget as HTMLElement)"
        >
          <span class="latest-post-rail__index">0{{ index + 1 }}</span>
          <PostCard :post="post" />
        </article>
      </div>
    </div>
  </section>
</template>

<style scoped>
.latest-post-rail__track {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.latest-post-rail__slot {
  display: grid;
  gap: 0.8rem;
}

.latest-post-rail__index {
  color: var(--accent);
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

@media (max-width: 980px) {
  .latest-post-rail__track {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .latest-post-rail__track {
    grid-template-columns: 1fr;
  }
}
</style>
