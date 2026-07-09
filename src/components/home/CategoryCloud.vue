<script setup lang="ts">
import type { Taxonomy } from '../../api/blog'

defineProps<{
  categories: Taxonomy[]
  loading?: boolean
  error?: string
}>()

const accents = ['#3B82F6', '#10B981', '#F59E0B', '#06B6D4', '#8B5CF6', '#EF4444']
</script>

<template>
  <section class="section-band section-band-soft google-flow-section" aria-labelledby="categories-title">
    <div class="section-inner">
      <div class="section-heading google-flow-heading">
        <div>
          <p class="section-kicker">主题</p>
          <h2 id="categories-title">从主题进入阅读</h2>
          <p class="section-lead">把常写的方向压缩成紧凑入口，方便访客从一个明确主题开始读下去。</p>
        </div>
        <RouterLink class="section-link" to="/categories">查看分类</RouterLink>
      </div>

      <p v-if="loading" class="state-line">正在加载分类...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="categories.length === 0" class="state-line">暂时还没有包含文章的分类。</p>

      <div v-else class="category-grid google-flow-grid category-cloud-grid">
        <RouterLink
          v-for="(category, index) in categories"
          :key="category.slug"
          class="category-card category-cloud-card"
          :to="`/categories/${category.slug}`"
          :style="{ '--accent': accents[index % accents.length] }"
        >
          <span class="category-cloud-card__eyebrow">专题入口</span>
          <span class="category-name">{{ category.name }}</span>
          <span class="category-summary">从 {{ category.name }} 相关文章继续延展阅读</span>
          <span class="category-count">{{ category.postCount ?? 0 }} 篇文章</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>

<style scoped>
.category-cloud-grid {
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.9rem;
}

.category-cloud-card {
  min-height: 0;
  gap: 0.5rem;
  padding: 1rem 1.1rem;
  border-radius: 1.25rem;
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.98)),
    rgba(255, 255, 255, 0.9);
}

.category-cloud-card__eyebrow {
  color: var(--accent);
  font-size: 0.76rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.category-cloud-card .category-name {
  margin-top: 0;
  font-size: 1.05rem;
}

.category-cloud-card .category-summary {
  margin-top: 0;
  color: #64748b;
  font-size: 0.92rem;
  line-height: 1.6;
}

.category-cloud-card .category-count {
  margin-top: 0.4rem;
}

@media (max-width: 980px) {
  .category-cloud-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .category-cloud-grid {
    grid-template-columns: 1fr;
  }
}
</style>
