<script setup lang="ts">
defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <section class="placeholder-view">
    <p class="eyebrow">Blog Foundation</p>
    <h1>{{ title }}</h1>
    <p>{{ description }}</p>
  </section>
</template>

