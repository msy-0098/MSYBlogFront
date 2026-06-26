<script setup lang="ts">
const navItems = [
  { label: '首页', to: '/' },
  { label: '文章', to: '/posts' },
  { label: '分类', to: '/categories' },
  { label: '项目', to: '/projects' },
  { label: '关于', to: '/about' }
]
</script>

<template>
  <header class="app-header">
    <RouterLink class="brand" to="/">马森雨</RouterLink>
    <nav class="nav-links" aria-label="主导航">
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
        {{ item.label }}
      </RouterLink>
    </nav>
  </header>

  <main>
    <RouterView />
  </main>
</template>

