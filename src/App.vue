<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'
import { getScrollMotionState } from './utils/scrollMotion'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const isHomeRoute = computed(() => route.path === '/')
const motionBlur = ref(0)
const motionShift = ref(0)

let lastScrollY = 0
let lastScrollTime = 0
let settleFrame = 0

function settleMotion() {
  motionBlur.value += (0 - motionBlur.value) * 0.18
  motionShift.value += (0 - motionShift.value) * 0.18

  if (Math.abs(motionBlur.value) < 0.04 && Math.abs(motionShift.value) < 0.04) {
    motionBlur.value = 0
    motionShift.value = 0
    settleFrame = 0
    return
  }

  settleFrame = window.requestAnimationFrame(settleMotion)
}

function handleScrollMotion() {
  if (!isHomeRoute.value || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
    motionBlur.value = 0
    motionShift.value = 0
    lastScrollY = window.scrollY
    lastScrollTime = performance.now()
    return
  }

  const now = performance.now()
  const scrollY = window.scrollY
  const motion = getScrollMotionState(scrollY - lastScrollY, now - lastScrollTime)
  lastScrollY = scrollY
  lastScrollTime = now
  motionBlur.value = motion.blurPx
  motionShift.value = motion.shiftPx

  if (!settleFrame) {
    settleFrame = window.requestAnimationFrame(settleMotion)
  }
}

onMounted(() => {
  lastScrollY = window.scrollY
  lastScrollTime = performance.now()
  window.addEventListener('scroll', handleScrollMotion, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', handleScrollMotion)
  if (settleFrame) {
    window.cancelAnimationFrame(settleFrame)
  }
})
</script>

<template>
  <AppHeader v-if="!isAdminRoute" />

  <main
    class="app-motion-shell"
    :class="{ 'admin-root-main': isAdminRoute, 'is-scroll-blurring': isHomeRoute }"
    :style="{
      '--scroll-blur': `${motionBlur}px`,
      '--scroll-shift': `${motionShift}px`
    }"
  >
    <RouterView />
  </main>

  <AppFooter v-if="!isAdminRoute" />
</template>
