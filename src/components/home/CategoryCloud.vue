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
          <p class="section-kicker">Topics</p>
          <h2 id="categories-title">Categories</h2>
          <p class="section-lead">Real category counts from the backend, grouped by published articles.</p>
        </div>
        <RouterLink class="section-link" to="/categories">View categories</RouterLink>
      </div>

      <p v-if="loading" class="state-line">Loading categories...</p>
      <p v-else-if="error" class="state-line error-line">{{ error }}</p>
      <p v-else-if="categories.length === 0" class="state-line">No categories with published posts yet.</p>

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
          <span class="category-count">{{ category.postCount ?? 0 }} posts</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
