<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'

import { useTheme } from '../../composables/useTheme'

const navItems = [
  { label: '文章', to: '/posts' },
  { label: '分类', to: '/categories' },
  { label: '项目', to: '/projects' },
  { label: '友链', to: '/links' },
  { label: '关于', to: '/about' },
  { label: '搜索', to: '/search' }
]

const route = useRoute()
const menuOpen = ref(false)
const scrolled = ref(false)
const { theme, switchTheme } = useTheme()

const updateScrolled = () => {
  scrolled.value = window.scrollY > 12
}

onMounted(() => {
  updateScrolled()
  window.addEventListener('scroll', updateScrolled, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updateScrolled)
})

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  }
)
</script>

<template>
  <header class="app-header" :class="{ 'is-scrolled': scrolled }">
    <RouterLink class="brand" to="/" aria-label="马森雨的技术博客首页">
      <span class="brand-mark">M</span>
      <span>马森雨</span>
    </RouterLink>

    <div class="header-actions">
      <button
        class="theme-toggle"
        type="button"
        data-test="theme-toggle"
        :aria-label="theme === 'dark' ? '切换到浅色模式' : '切换到深色模式'"
        @click="switchTheme"
      >
        {{ theme === 'dark' ? '浅色' : '深色' }}
      </button>

      <button
        class="mobile-nav-toggle"
        type="button"
        aria-label="切换导航菜单"
        aria-controls="primary-nav"
        :aria-expanded="menuOpen"
        data-test="mobile-nav-toggle"
        @click="menuOpen = !menuOpen"
      >
        <span />
        <span />
        <span />
      </button>
    </div>

    <nav
      id="primary-nav"
      class="nav-links"
      :class="{ 'is-open': menuOpen }"
      aria-label="主导航"
      data-test="primary-nav"
    >
      <RouterLink v-for="item in navItems" :key="item.to" :to="item.to">
        {{ item.label }}
      </RouterLink>
      <button
        class="theme-toggle theme-toggle-inline"
        type="button"
        data-test="theme-toggle-inline"
        @click="switchTheme"
      >
        {{ theme === 'dark' ? '浅色模式' : '深色模式' }}
      </button>
    </nav>
  </header>
</template>