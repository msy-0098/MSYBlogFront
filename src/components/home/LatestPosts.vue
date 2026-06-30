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
          <p class="section-kicker">Writing</p>
          <h2 id="latest-posts-title">Latest posts</h2>
          <p class="section-lead">Backend-published notes, project retrospectives, and engineering practice records.</p>
        </div>
        <RouterLink class="section-link" to="/posts">All posts</RouterLink>
      </div>

      <p v-if="loading" class="state-line">Loading latest posts...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="posts.length === 0" class="state-line">No published posts yet.</p>

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
