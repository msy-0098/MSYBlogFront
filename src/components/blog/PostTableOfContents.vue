<script setup lang="ts">
import type { MarkdownHeading } from '../../utils/markdownHeadings'

defineProps<{
  headings: MarkdownHeading[]
}>()
</script>

<template>
  <nav v-if="headings.length" class="post-toc" data-test="post-toc" aria-label="文章目录">
    <p class="section-kicker">目录</p>
    <ol class="post-toc-list">
      <li
        v-for="heading in headings"
        :key="heading.id"
        :class="['post-toc-item', `is-level-${heading.level}`]"
      >
        <a :href="`#${heading.id}`" data-test="post-toc-link">{{ heading.text }}</a>
      </li>
    </ol>
  </nav>
</template>
