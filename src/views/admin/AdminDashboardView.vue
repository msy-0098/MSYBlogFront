<script setup lang="ts">
import { ChatDotRound, DataAnalysis, Files, TrendCharts, User, View } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { computed, onMounted, ref } from 'vue'

import { getAdminDashboard, type AdminDashboard } from '../../api/admin'

const loading = ref(false)
const dashboard = ref<AdminDashboard | null>(null)

const metrics = computed(() => [
  { label: '文章总数', value: String(dashboard.value?.stats.postCount ?? 0), detail: `已发布 ${dashboard.value?.stats.publishedPostCount ?? 0} 篇`, color: '#4285F4', icon: Files },
  { label: '文章阅读', value: String(dashboard.value?.stats.totalViews ?? 0), detail: `今日请求 ${dashboard.value?.analytics?.todayRequests ?? 0} 次`, color: '#34A853', icon: TrendCharts },
  { label: '独立 IP', value: String(dashboard.value?.analytics?.uniqueIPs ?? 0), detail: `失败请求 ${dashboard.value?.analytics?.failedRequests ?? 0} 次`, color: '#FBBC05', icon: DataAnalysis },
  { label: '访客用户', value: String(dashboard.value?.stats.visitorCount ?? 0), detail: '可在用户页查看详情', color: '#EA4335', icon: User }
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
      <div class="admin-heading-actions">
        <el-button @click="loadDashboard">刷新数据</el-button>
        <RouterLink class="admin-link-button admin-link-button-primary" to="/">
          <el-icon style="margin-right: 6px"><View /></el-icon>
          查看前台
        </RouterLink>
      </div>
    </div>

    <div class="admin-dashboard-stack">
      <p v-if="loading" class="admin-dashboard-loading-note">正在更新工作台数据呀…</p>
      <article class="admin-brief-panel">
        <div>
          <span>实时概览</span>
          <h2>内容、访问、安全和 AI 一屏掌握</h2>
          <p>访问日志会持续记录真实请求，发现扫描型恶意 IP 后自动封禁，并可在访问安全页复核。</p>
        </div>
        <strong>{{ dashboard?.aiAnalysis?.mode === 'deepseek' ? 'DeepSeek 已接入' : '本地兜底分析' }}</strong>
      </article>

      <div class="admin-dashboard-grid">
        <article v-for="metric in metrics" :key="metric.label" class="admin-metric-card" :style="{ '--metric-color': metric.color }">
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
            <div><span>AI 运营分析</span><strong>{{ dashboard?.aiAnalysis?.mode === 'deepseek' ? 'DeepSeek 分析' : '本地分析' }}</strong></div>
          </div>
          <p>{{ dashboard?.aiAnalysis?.summary || '正在等待数据呀...' }}</p>
          <ul><li v-for="signal in dashboard?.aiAnalysis?.signals || []" :key="signal">{{ signal }}</li></ul>
        </article>

        <article class="admin-panel admin-recent-comments">
          <div class="admin-analysis-heading"><el-icon><ChatDotRound /></el-icon><div><span>评论动态</span><strong>近期评论</strong></div></div>
          <div class="admin-comment-feed">
            <p v-if="!dashboard?.recentComments.length">暂时还没有评论哦。</p>
            <article v-for="comment in dashboard?.recentComments || []" :key="comment.id">
              <strong>{{ comment.author.nickname || comment.author.email }}</strong><span>{{ comment.postTitle || '文章' }}</span><p>{{ comment.content }}</p>
            </article>
          </div>
        </article>
      </div>

      <div class="admin-dashboard-columns">
        <article class="admin-panel">
          <div class="admin-analysis-heading"><el-icon><TrendCharts /></el-icon><div><span>访问分析</span><strong>Top IP</strong></div></div>
          <el-table :data="dashboard?.analytics?.topIPs || []" size="small">
            <el-table-column prop="ip" label="IP" />
            <el-table-column prop="requests" label="请求" width="80" />
            <el-table-column prop="failures" label="失败" width="80" />
            <el-table-column label="状态" width="90"><template #default="scope"><el-tag :type="scope.row.banned ? 'danger' : 'success'">{{ scope.row.banned ? '已封禁' : '正常' }}</el-tag></template></el-table-column>
          </el-table>
        </article>

        <article class="admin-panel">
          <div class="admin-analysis-heading"><el-icon><ChatDotRound /></el-icon><div><span>AI 工作区</span><strong>持续会话</strong></div></div>
          <p>需要深入分析、写作或整理任务时，在独立工作区中保留完整上下文呀。</p>
          <RouterLink class="admin-link-button admin-link-button-primary" data-test="ai-workspace-link" to="/admin/ai">进入 AI 工作区</RouterLink>
        </article>
      </div>
    </div>
  </section>
</template>
