<script setup lang="ts">
import type { PostSummary } from '../../api/blog'

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
  <section class="section-band google-flow-section" aria-labelledby="latest-posts-title">
    <div class="section-inner">
      <div class="section-heading google-flow-heading">
        <div>
          <p class="section-kicker">文章</p>
          <h2 id="latest-posts-title">最新文章</h2>
          <p class="section-lead">来自后台发布的技术笔记、项目复盘和工程实践记录。</p>
        </div>
        <RouterLink class="section-link" to="/posts">查看全部</RouterLink>
      </div>

      <p v-if="loading" class="state-line">正在加载最新文章...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="posts.length === 0" class="state-line">暂时还没有已发布文章。</p>

      <div v-else class="bento-grid google-flow-grid">
        <RouterLink
          v-for="(post, index) in posts"
          :key="post.slug"
          :class="[
            'bento-card',
            index === 0 ? 'bento-large bento-text-light' : index === 3 ? 'bento-wide' : 'bento-standard'
          ]"
          :to="`/posts/${post.slug}`"
          :style="{ '--accent': accents[index % accents.length] }"
          data-test="post-card"
          @mousemove="handleMouseMove($event, $event.currentTarget as HTMLElement)"
        >
          <template v-if="index === 0">
            <div
              class="bento-image-bg"
              :style="{ background: `linear-gradient(135deg, ${accents[index % accents.length]}40, #111827)` }"
            />
            <div class="bento-image-overlay" />
          </template>

          <div class="bento-card-inner">
            <span class="post-meta">{{ post.publishedAt }} · {{ post.category.name }}</span>
            <span class="post-title">{{ post.title }}</span>
            <span class="post-summary">{{ post.summary }}</span>
            <div class="tag-row" style="margin-top: auto;">
              <span v-for="tag in post.tags" :key="tag.slug">{{ tag.name }}</span>
            </div>
          </div>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
