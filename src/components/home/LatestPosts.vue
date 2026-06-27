<script setup lang="ts">
import { latestPosts } from '../../data/home'
</script>

<template>
  <section class="section-band google-flow-section" aria-labelledby="latest-posts-title">
    <div class="section-inner">
      <div class="section-heading google-flow-heading">
        <div>
          <p class="section-kicker">Writing</p>
          <h2 id="latest-posts-title">最新文章</h2>
          <p class="section-lead">把 AI、后端工程和项目复盘沉淀成可以反复阅读的技术记录。</p>
        </div>
        <RouterLink class="section-link" to="/posts">全部文章</RouterLink>
      </div>

      <div class="post-grid google-flow-grid">
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
