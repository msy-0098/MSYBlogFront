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
          <h2 id="categories-title">文章分类</h2>
          <p class="section-lead">按已发布文章实时统计分类数量，快速进入感兴趣的技术方向。</p>
        </div>
        <RouterLink class="section-link" to="/categories">查看分类</RouterLink>
      </div>

      <p v-if="loading" class="state-line">正在加载分类...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="categories.length === 0" class="state-line">暂时还没有包含文章的分类。</p>

      <div v-else class="category-grid google-flow-grid">
        <RouterLink
          v-for="(category, index) in categories"
          :key="category.slug"
          class="category-card"
          :to="`/categories/${category.slug}`"
          :style="{ '--accent': accents[index % accents.length] }"
        >
          <span class="category-name">{{ category.name }}</span>
          <span class="category-summary">{{ category.slug }}</span>
          <span class="category-count">{{ category.postCount ?? 0 }} 篇文章</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
