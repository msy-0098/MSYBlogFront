<script setup lang="ts">
import { latestPosts } from '../../data/home'
</script>

<template>
  <section class="section-band" aria-labelledby="latest-posts-title">
    <div class="section-inner">
      <div class="section-heading">
        <p class="section-kicker">Writing</p>
        <h2 id="latest-posts-title">最新文章</h2>
        <RouterLink class="section-link" to="/posts">全部文章</RouterLink>
      </div>

      <div class="post-grid">
        <RouterLink
          v-for="post in latestPosts"
          :key="post.slug"
          class="post-card"
          :to="`/posts/${post.slug}`"
          :style="{ '--accent': post.accent }"
          data-test="post-card"
        >
          <span class="post-cover" aria-hidden="true" />
          <span class="post-meta">{{ post.publishedAt }} · {{ post.category }}</span>
          <span class="post-title">{{ post.title }}</span>
          <span class="post-summary">{{ post.summary }}</span>
          <span class="tag-row">
            <span v-for="tag in post.tags" :key="tag">{{ tag }}</span>
          </span>
        </RouterLink>
      </div>
    </div>
  </section>
</template>
