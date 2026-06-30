<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { getCategories, getTags, type Taxonomy } from '../api/blog'

const props = defineProps<{
  type: 'categories' | 'tags'
}>()

const items = ref<Taxonomy[]>([])
const loading = ref(true)
const error = ref('')

const title = computed(() => (props.type === 'categories' ? '分类' : '标签'))
const linkPrefix = computed(() => (props.type === 'categories' ? '/categories' : '/tags'))

onMounted(async () => {
  try {
    items.value = props.type === 'categories' ? await getCategories() : await getTags()
  } catch (err) {
    error.value = err instanceof Error ? err.message : `${title.value}加载失败`
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <section class="reading-page">
    <div class="reading-heading">
      <p class="section-kicker">主题</p>
      <h1>{{ title }}</h1>
      <p>从主题入口进入文章，把同一类实践放在一起复盘。</p>
    </div>

    <p v-if="loading" class="state-line">正在加载{{ title }}呀...</p>
    <p v-else-if="error" class="state-line error-line">{{ error }}</p>

    <div v-else class="taxonomy-grid">
      <RouterLink v-for="item in items" :key="item.slug" class="taxonomy-card" :to="`${linkPrefix}/${item.slug}`">
        <span>{{ item.name }}</span>
        <strong>{{ item.postCount ?? 0 }} 篇文章</strong>
      </RouterLink>
    </div>
  </section>
</template>
