<script setup lang="ts">
import { homeCategories } from '../../data/home'
</script>

<template>
  <section class="section-band section-band-soft" aria-labelledby="categories-title">
    <div class="section-inner">
      <div class="section-heading">
        <p class="section-kicker">Topics</p>
        <h2 id="categories-title">分类入口</h2>
        <RouterLink class="section-link" to="/categories">查看分类</RouterLink>
      </div>

      <div class="category-grid">
        <RouterLink
          v-for="category in homeCategories"
          :key="category.slug"
          class="category-card"
          :to="`/categories/${category.slug}`"
          :style="{ '--accent': category.accent }"
        >
          <span class="category-name">{{ category.name }}</span>
          <span class="category-summary">{{ category.summary }}</span>
          <span class="category-count">{{ category.count }} 篇文章</span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
