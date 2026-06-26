<script setup lang="ts">
const metrics = [
  { label: '文章维护', value: 'Posts', detail: '发布、草稿、隐藏状态管理' },
  { label: '内容归类', value: 'Tags', detail: '分类和标签保持清晰' },
  { label: '项目展示', value: 'Works', detail: '控制项目排序和可见性' },
  { label: '站点设置', value: 'Site', detail: '更新标题、简介和外链' }
]
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">Dashboard</p>
        <h1>管理工作台</h1>
      </div>
      <RouterLink class="admin-link-button" to="/">查看前台</RouterLink>
    </div>

    <div class="admin-dashboard-grid">
      <article v-for="metric in metrics" :key="metric.label" class="admin-metric-card">
        <span>{{ metric.label }}</span>
        <strong>{{ metric.value }}</strong>
        <p>{{ metric.detail }}</p>
      </article>
    </div>
  </section>
</template>
