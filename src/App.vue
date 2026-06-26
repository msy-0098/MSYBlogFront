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

  <main :class="{ 'admin-root-main': isAdminRoute }">
    <RouterView />
  </main>

  <AppFooter v-if="!isAdminRoute" />
</template>
