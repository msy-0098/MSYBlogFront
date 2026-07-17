<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { getFriendLinks, type FriendLink } from '../api/blog'

const links = ref<FriendLink[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    links.value = await getFriendLinks()
  } catch (err) {
    error.value = err instanceof Error ? err.message : '友链加载失败'
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">链接</p>
      <h1>友情链接</h1>
      <p>与志同道合的技术站点互相发现，欢迎长期交流。</p>
    </div>

    <p v-if="loading" class="state-line">正在加载友链...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else-if="links.length" class="friend-link-grid reading-grid" data-test="friend-link-grid">
      <a
        v-for="link in links"
        :key="link.id"
        class="friend-link-card"
        :href="link.url"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="friend-link-logo" aria-hidden="true">
          <img v-if="link.logo" :src="link.logo" :alt="link.name" loading="lazy" decoding="async" />
          <span v-else>{{ link.name.slice(0, 1) }}</span>
        </span>
        <strong>{{ link.name }}</strong>
        <span>{{ link.description || link.url }}</span>
      </a>
    </div>

    <p v-else class="state-line">暂时还没有友情链接。</p>
  </section>
</template>

<style scoped>
.friend-link-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 1rem;
}

.friend-link-card {
  display: grid;
  gap: 0.55rem;
  padding: 1.1rem 1.15rem;
  border: 1px solid var(--border-subtle, rgba(15, 23, 42, 0.08));
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.82);
  color: inherit;
  text-decoration: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.friend-link-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.friend-link-logo {
  display: inline-flex;
  width: 2.4rem;
  height: 2.4rem;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: rgba(37, 99, 235, 0.08);
  color: #2563eb;
  font-weight: 700;
  overflow: hidden;
}

.friend-link-logo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.friend-link-card strong {
  font-size: 1.05rem;
}

.friend-link-card span:last-child {
  color: var(--text-muted, #64748b);
  font-size: 0.92rem;
  line-height: 1.5;
}
</style>