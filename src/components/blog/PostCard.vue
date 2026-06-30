<script setup lang="ts">
import type { PostSummary } from '../../api/blog'

defineProps<{
  post: PostSummary
}>()
</script>

<template>
  <RouterLink class="post-card blog-post-card" :to="`/posts/${post.slug}`">
    <span class="post-cover blog-post-cover" aria-hidden="true">
      <img v-if="post.cover" :src="post.cover" :alt="post.title" loading="lazy" decoding="async" />
      <span v-else>{{ post.category.name }}</span>
    </span>
    <span class="post-meta">{{ post.publishedAt }} · {{ post.category.name }} · {{ post.viewCount }} 次阅读</span>
    <span class="post-title">{{ post.title }}</span>
    <span class="post-summary">{{ post.summary }}</span>
    <span class="tag-row">
      <RouterLink
        v-for="tag in post.tags"
        :key="tag.slug"
        class="tag-link"
        :to="`/tags/${tag.slug}`"
        @click.stop
      >
        {{ tag.name }}
      </RouterLink>
    </span>
  </RouterLink>
</template>
