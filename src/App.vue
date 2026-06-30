<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <AppHeader v-if="!isAdminRoute" />

  <main
    class="app-motion-shell"
    :class="{ 'admin-root-main': isAdminRoute }"
    :style="{
      '--scroll-blur': '0px',
      '--scroll-shift': '0px'
    }"
  >
    <RouterView />
  </main>

  <AppFooter v-if="!isAdminRoute" />
</template>
