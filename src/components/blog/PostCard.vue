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
        <img v-if="post.cover" :src="post.cover" :alt="''" loading="lazy" decoding="async" />
        <span v-else class="post-card-shell__cover-label">{{ post.category?.name || '文章' }}</span>
      </span>
      <span class="post-meta">
        {{ post.publishedAt }} · {{ post.category?.name || '未分类' }} · {{ post.viewCount ?? 0 }} 次阅读
      </span>
      <span class="post-title">{{ post.title }}</span>
      <span class="post-summary">{{ post.summary }}</span>
      <span v-if="post.tags?.length" class="tag-row post-card-shell__tags">
        <span v-for="tag in post.tags" :key="tag.slug" class="tag-chip">{{ tag.name }}</span>
      </span>
    </RouterLink>
  </article>
</template>

<style scoped>
.post-card-shell {
  position: relative;
  display: block;
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
  position: relative;
  z-index: 1;
  display: grid;
  gap: 0.55rem;
  min-height: 100%;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.post-card-shell__cover {
  position: relative;
  display: block;
  min-height: 210px;
  overflow: hidden;
  background:
    linear-gradient(180deg, rgba(15, 23, 42, 0.05), rgba(15, 23, 42, 0.22)),
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 20%, transparent), var(--surface-soft));
  pointer-events: none;
}

.post-card-shell__cover::after {
  position: absolute;
  inset: auto 0 0;
  height: 45%;
  background: linear-gradient(180deg, transparent, rgba(15, 23, 42, 0.16));
  content: '';
  pointer-events: none;
}

.post-card-shell__cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.post-card-shell__cover-label {
  position: relative;
  z-index: 1;
  display: inline-flex;
  margin: 1rem;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--surface-card) 80%, transparent);
  color: var(--text-strong);
  font-weight: 700;
}

.post-card-shell__tags {
  margin-top: 0.35rem;
  padding-bottom: 0.15rem;
}

.tag-chip {
  border: 1px solid var(--border-subtle);
  border-radius: 4px;
  padding: 0.25rem 0.6rem;
  background: var(--surface-soft);
  color: var(--text-muted);
  font-size: 0.75rem;
  font-weight: 500;
}
</style>