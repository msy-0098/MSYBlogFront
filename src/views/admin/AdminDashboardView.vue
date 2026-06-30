<script setup lang="ts">
import { ChatDotRound, DataAnalysis, Files, TrendCharts, User, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

import { getAdminDashboard, type AdminDashboard } from '../../api/admin'

const loading = ref(false)
const dashboard = ref<AdminDashboard | null>(null)

const metrics = computed(() => [
  {
    label: '文章总数',
    value: String(dashboard.value?.stats.postCount ?? 0),
    detail: `已发布 ${dashboard.value?.stats.publishedPostCount ?? 0} 篇`,
    color: '#4285F4',
    icon: Files
  },
  {
    label: '访问统计',
    value: String(dashboard.value?.stats.totalViews ?? 0),
    detail: '基于文章阅读量汇总',
    color: '#34A853',
    icon: TrendCharts
  },
  {
    label: '评论统计',
    value: String(dashboard.value?.stats.commentCount ?? 0),
    detail: `隐藏 ${dashboard.value?.stats.hiddenCommentCount ?? 0} 条`,
    color: '#FBBC05',
    icon: ChatDotRound
  },
  {
    label: '访客用户',
    value: String(dashboard.value?.stats.visitorCount ?? 0),
    detail: '邮箱注册用户',
    color: '#EA4335',
    icon: User
  }
])

onMounted(loadDashboard)

async function loadDashboard() {
  loading.value = true

  try {
    dashboard.value = await getAdminDashboard()
  } catch {
    ElMessage.error('工作台数据加载失败')
  } finally {
    loading.value = false
  }
}

</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading">
      <div>
        <p class="section-kicker">总览</p>
        <h1>管理工作台</h1>
      </div>
      <RouterLink class="admin-link-button admin-link-button-primary" to="/">
        <el-icon style="margin-right: 6px;"><View /></el-icon>
        查看前台
      </RouterLink>
    </div>

    <div v-loading="loading" class="admin-dashboard-stack">
      <article class="admin-brief-panel">
        <div>
          <span>今日视图</span>
          <h2>内容、访问、评论一屏掌握</h2>
          <p>访问统计、评论统计和 AI 分析都在这里汇总，方便快速判断站点状态。</p>
        </div>
        <strong>{{ dashboard?.aiAnalysis.mode === 'configured' ? 'AI 已接入' : '本地分析' }}</strong>
      </article>

      <div class="admin-dashboard-grid">
        <article
          v-for="metric in metrics"
          :key="metric.label"
          class="admin-metric-card"
          :style="{ '--metric-color': metric.color }"
        >
          <div class="metric-icon-wrap" :style="{ color: metric.color }">
            <div class="metric-icon-bg" :style="{ backgroundColor: metric.color + '20' }"></div>
            <el-icon><component :is="metric.icon" /></el-icon>
          </div>
          <div class="metric-content">
            <span>{{ metric.label }}</span>
            <strong>{{ metric.value }}</strong>
            <p>{{ metric.detail }}</p>
          </div>
        </article>
      </div>

      <div class="admin-dashboard-columns">
        <article class="admin-panel admin-analysis-card">
          <div class="admin-analysis-heading">
            <el-icon><DataAnalysis /></el-icon>
            <div>
              <span>AI 分析</span>
              <strong>{{ dashboard?.aiAnalysis.mode === 'configured' ? '模型分析' : '本地分析' }}</strong>
            </div>
          </div>
          <p>{{ dashboard?.aiAnalysis.summary || '正在等待数据呀...' }}</p>
          <ul>
            <li v-for="signal in dashboard?.aiAnalysis.signals || []" :key="signal">{{ signal }}</li>
          </ul>
        </article>

        <article class="admin-panel admin-recent-comments">
          <div class="admin-analysis-heading">
            <el-icon><ChatDotRound /></el-icon>
            <div>
              <span>评论动态</span>
              <strong>近期评论</strong>
            </div>
          </div>
          <div class="admin-comment-feed">
            <p v-if="!dashboard?.recentComments.length">暂时还没有评论哦。</p>
            <article v-for="comment in dashboard?.recentComments || []" :key="comment.id">
              <strong>{{ comment.author.nickname || comment.author.email }}</strong>
              <span>{{ comment.postTitle || '文章' }}</span>
              <p>{{ comment.content }}</p>
            </article>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
