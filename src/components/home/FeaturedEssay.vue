<script setup lang="ts">
import type { PostSummary } from '../../api/blog'

defineProps<{
  post: PostSummary | null
  loading?: boolean
  error?: string
  owner?: string
  intro?: string
}>()

function formatReadingTime(summary: string) {
  const normalized = summary.trim()

  if (!normalized) {
    return '3 分钟速读'
  }

  const estimatedMinutes = Math.max(3, Math.ceil(normalized.length / 55))

  return `${estimatedMinutes} 分钟速读`
}
</script>

<template>
  <section
    class="featured-essay google-flow-section"
    aria-labelledby="featured-essay-title"
    data-test="featured-essay"
  >
    <div class="section-inner featured-essay__inner">
      <p class="section-kicker">精选文章</p>

      <p v-if="loading" class="state-line">正在加载首页主文章...</p>
      <p v-else-if="error && !post" class="state-line error-line">{{ error }}</p>
      <p v-else-if="!post" class="state-line">暂时还没有适合放在首页的文章。</p>

      <article v-else class="featured-essay__card">
        <RouterLink class="featured-essay__visual" :to="`/posts/${post.slug}`" :aria-label="`阅读 ${post.title}`">
          <img
            v-if="post.cover"
            class="featured-essay__image"
            :src="post.cover"
            :alt="post.title"
            loading="eager"
            decoding="async"
          />
          <div v-else class="featured-essay__placeholder" aria-hidden="true">
            <span>{{ post.category.name }}</span>
            <strong>Featured Essay</strong>
          </div>
        </RouterLink>

        <div class="featured-essay__copy">
          <div class="featured-essay__meta">
            <span>{{ post.category.name }}</span>
            <span>{{ post.publishedAt }}</span>
            <span>{{ formatReadingTime(post.summary) }}</span>
          </div>

          <div class="featured-essay__content">
            <h1 id="featured-essay-title">{{ post.title }}</h1>
            <p class="featured-essay__summary">{{ post.summary }}</p>
            <p class="featured-essay__intro">
              {{ intro || '把一篇值得停留的文章放在首页最前面，让访客先读到你的核心观点与真实实践。' }}
            </p>
          </div>

          <div class="featured-essay__footer">
            <div class="featured-essay__author">
              <span class="featured-essay__eyebrow">作者</span>
              <strong>{{ owner || '站点作者' }}</strong>
            </div>
            <RouterLink class="primary-button featured-essay__cta" :to="`/posts/${post.slug}`">
              阅读这篇文章
            </RouterLink>
          </div>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.featured-essay {
  padding: clamp(2.5rem, 4vw, 4rem) 1.5rem 1rem;
}

.featured-essay__inner {
  display: grid;
  gap: 1.25rem;
}

.featured-essay__card {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: clamp(1.5rem, 3vw, 2.5rem);
  align-items: stretch;
  padding: clamp(1.4rem, 2.5vw, 2rem);
  border: 1px solid var(--border-subtle);
  border-radius: 2rem;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--accent) 18%, transparent), transparent 40%),
    linear-gradient(145deg, var(--surface-card), var(--surface-soft));
  box-shadow: var(--shadow-soft);
}

.featured-essay__visual {
  display: block;
  min-height: 100%;
  border-radius: 1.5rem;
  overflow: hidden;
  background: var(--surface-soft);
}

.featured-essay__image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.featured-essay__placeholder {
  display: grid;
  align-content: space-between;
  min-height: 100%;
  padding: clamp(1.5rem, 3vw, 2rem);
  background:
    linear-gradient(155deg, rgba(17, 24, 39, 0.92), color-mix(in srgb, var(--accent) 55%, #1e293b)),
    linear-gradient(180deg, #0f172a, #1e293b);
  color: #ffffff;
}

.featured-essay__placeholder span {
  display: inline-flex;
  width: fit-content;
  border: 1px solid rgba(255, 255, 255, 0.16);
  border-radius: 999px;
  padding: 0.45rem 0.85rem;
  background: rgba(255, 255, 255, 0.1);
  font-size: 0.82rem;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.featured-essay__placeholder strong {
  max-width: 11ch;
  font-size: clamp(2rem, 4vw, 3.5rem);
  line-height: 0.95;
}

.featured-essay__copy {
  display: grid;
  gap: 1.4rem;
}

.featured-essay__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.featured-essay__meta span {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.featured-essay__meta span::before {
  width: 0.35rem;
  height: 0.35rem;
  border-radius: 999px;
  background: color-mix(in srgb, var(--accent) 55%, transparent);
  content: '';
}

.featured-essay__content h1 {
  margin: 0;
  color: var(--text-strong);
  font-size: clamp(2.3rem, 5vw, 4.4rem);
  line-height: 0.98;
  letter-spacing: -0.04em;
}

.featured-essay__summary {
  margin: 1rem 0 0;
  color: var(--text-body);
  font-size: clamp(1.05rem, 1.8vw, 1.35rem);
  line-height: 1.75;
}

.featured-essay__intro {
  max-width: 54ch;
  margin: 1rem 0 0;
  color: var(--text-muted);
  font-size: 1rem;
  line-height: 1.85;
}

.featured-essay__footer {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 1rem;
  margin-top: auto;
  padding-top: 1rem;
  border-top: 1px solid var(--border-subtle);
}

.featured-essay__author {
  display: grid;
  gap: 0.2rem;
}

.featured-essay__eyebrow {
  color: var(--text-muted);
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.featured-essay__author strong {
  color: var(--text-strong);
  font-size: 1.05rem;
}

.featured-essay__cta {
  white-space: nowrap;
}

@media (max-width: 980px) {
  .featured-essay__card {
    grid-template-columns: 1fr;
  }

  .featured-essay__visual {
    min-height: 320px;
  }
}

@media (max-width: 720px) {
  .featured-essay {
    padding: 2rem 1rem 0.5rem;
  }

  .featured-essay__card {
    padding: 1.15rem;
    border-radius: 1.5rem;
  }

  .featured-essay__visual {
    min-height: 250px;
  }

  .featured-essay__footer {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
