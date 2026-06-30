<script setup lang="ts">
const metrics = [
  { label: '文章维护', value: 'Posts', detail: '发布、草稿、隐藏状态管理', color: '#4285F4' },
  { label: '内容归类', value: 'Tags', detail: '分类和标签保持清晰', color: '#34A853' },
  { label: '项目展示', value: 'Works', detail: '控制项目排序和可见性', color: '#FBBC05' },
  { label: '站点设置', value: 'Site', detail: '更新标题、简介和外链', color: '#EA4335' }
]

// 鼠标光效计算
const handleMouseMove = (e: MouseEvent, target: HTMLElement) => {
  const rect = target.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  target.style.setProperty('--mouse-x', `${x}px`)
  target.style.setProperty('--mouse-y', `${y}px`)
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">Workspace</p>
        <h1>管理工作台</h1>
      </div>
      <RouterLink class="admin-link-button admin-link-button-primary" to="/">
        <el-icon style="margin-right: 6px;"><View /></el-icon>
        查看前台
      </RouterLink>
    </div>

    <!-- 借用首页的 Bento 网格系统 -->
    <div class="bento-grid" style="margin-top: 2rem;">
      <!-- Welcome 大卡片 -->
      <article
        class="bento-card bento-wide"
        style="padding: 2.5rem; background: linear-gradient(135deg, #4285F4, #1A73E8); color: white;"
        @mousemove="handleMouseMove($event, $event.currentTarget as HTMLElement)"
      >
        <div style="position: relative; z-index: 1;">
          <h2 style="color: white; font-size: 2.2rem; margin-bottom: 0.5rem;">Welcome back!</h2>
          <p style="color: rgba(255,255,255,0.85); font-size: 1.1rem; max-width: 400px;">
            Here's what's happening with your blog today. Check your metrics and manage your latest content.
          </p>
        </div>
      </article>

      <!-- Metrics 小卡片 -->
      <article
        v-for="(metric, index) in metrics"
        :key="metric.label"
        class="bento-card bento-standard admin-metric-bento"
        :style="{ '--metric-color': metric.color }"
        @mousemove="handleMouseMove($event, $event.currentTarget as HTMLElement)"
      >
        <div class="metric-icon-wrap" :style="{ color: metric.color }">
          <div class="metric-icon-bg" :style="{ backgroundColor: metric.color + '20' }"></div>
          <!-- 可以根据 index 放入不同图标，这里先用圆点占位 -->
          <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><circle cx="12" cy="12" r="10"></circle></svg>
        </div>
        <div class="metric-content">
          <span>{{ metric.label }}</span>
          <strong>{{ metric.value }}</strong>
          <p>{{ metric.detail }}</p>
        </div>
      </article>
    </div>
  </section>
</template>
