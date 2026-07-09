<script setup lang="ts">
import type { PostSummary } from '../../api/blog'

defineProps<{
  post: PostSummary
}>()
</script>

<template>
  <article class="post-card blog-post-card post-card-shell" data-test="post-card">
    <RouterLink class="post-card-shell__link" :to="`/posts/${post.slug}`">
      <span class="post-cover blog-post-cover post-card-shell__cover" aria-hidden="true">
        <img v-if="post.cover" :src="post.cover" :alt="post.title" loading="lazy" decoding="async" />
        <span v-else>{{ post.category.name }}</span>
      </span>
      <span class="post-meta">{{ post.publishedAt }} · {{ post.category.name }} · {{ post.viewCount }} 次阅读</span>
      <span class="post-title">{{ post.title }}</span>
      <span class="post-summary">{{ post.summary }}</span>
    </RouterLink>

    <span v-if="post.tags.length" class="tag-row post-card-shell__tags">
      <RouterLink v-for="tag in post.tags" :key="tag.slug" class="tag-link" :to="`/tags/${tag.slug}`">
        {{ tag.name }}
      </RouterLink>
    </span>
  </article>
</template>

<style scoped>
.post-card-shell {
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  transition:
    transform 220ms ease,
    box-shadow 220ms ease,
    border-color 220ms ease;
}

.post-card-shell:hover {
  transform: translateY(-3px);
}

.post-card-shell__link {
  display: grid;
  gap: 0.55rem;
  min-height: 100%;
  color: inherit;
}

.post-card-shell__cover {
  position: relative;
  min-height: 210px;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.22)),
    linear-gradient(135deg, rgba(59, 130, 246, 0.18), rgba(148, 163, 184, 0.35));
}

.post-card-shell__cover::after {
  position: absolute;
  inset: auto 0 0;
  height: 45%;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.16));
  content: '';
}

.post-card-shell__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-card-shell__cover > span {
  position: relative;
  z-index: 1;
}

.post-card-shell__tags {
  margin-top: 0;
  padding-bottom: 0.15rem;
}
</style>
