<script setup lang="ts">
import { ElMessage, ElMessageBox } from 'element-plus'
import { onMounted, ref } from 'vue'

import { createAdminBan, getAdminAnalytics, removeAdminBan, type AdminAnalytics, type AdminIPBan } from '../../api/admin'
import { getFriendlyErrorMessage } from '../../utils/apiError'

const loading = ref(false)
const analytics = ref<AdminAnalytics | null>(null)
const ip = ref('')
const reason = ref('管理员手动封禁')

onMounted(load)

async function load() {
  loading.value = true
  try { analytics.value = await getAdminAnalytics() } catch (reason) { ElMessage.error(getFriendlyErrorMessage(reason, '访问分析加载失败')) } finally { loading.value = false }
}

async function banIP() {
  const value = ip.value.trim()
  if (!value) { ElMessage.warning('请先填写 IP 地址呀'); return }
  try {
    await createAdminBan({ ip: value, reason: reason.value, duration: 24 })
    ip.value = ''
    ElMessage.success('IP 已封禁 24 小时')
    await load()
  } catch (reason) { ElMessage.error(getFriendlyErrorMessage(reason, '封禁失败')) }
}

async function unban(ban: AdminIPBan) {
  await ElMessageBox.confirm(`确认解除 ${ban.ip} 的封禁吗？`, '解除封禁', { type: 'warning' })
  try { await removeAdminBan(ban.id); ElMessage.success('已解除封禁'); await load() } catch (reason) { ElMessage.error(getFriendlyErrorMessage(reason, '解除封禁失败')) }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading"><div><p class="section-kicker">Security</p><h1>访问安全</h1></div><el-button @click="load">刷新</el-button></div>
    <div v-loading="loading" class="admin-dashboard-grid">
      <article class="admin-metric-card"><div class="metric-content"><span>总请求</span><strong>{{ analytics?.totalRequests || 0 }}</strong><p>访问日志累计记录</p></div></article>
      <article class="admin-metric-card"><div class="metric-content"><span>今日请求</span><strong>{{ analytics?.todayRequests || 0 }}</strong><p>按服务器时间统计</p></div></article>
      <article class="admin-metric-card"><div class="metric-content"><span>独立 IP</span><strong>{{ analytics?.uniqueIPs || 0 }}</strong><p>真实访问来源</p></div></article>
      <article class="admin-metric-card"><div class="metric-content"><span>失败请求</span><strong>{{ analytics?.failedRequests || 0 }}</strong><p>异常请求会触发自动封禁</p></div></article>
    </div>
    <div class="admin-dashboard-columns">
      <article class="admin-panel"><div class="admin-analysis-heading"><div><span>手动封禁</span><strong>拦截恶意 IP</strong></div></div><el-input v-model="ip" placeholder="例如 203.0.113.10" /><el-input v-model="reason" class="security-reason" placeholder="封禁原因" /><div class="admin-editor-actions"><el-button type="danger" @click="banIP">封禁 24 小时</el-button></div><p class="admin-form-hint">命中 /.env、wp-admin、phpmyadmin 等扫描路径的 IP 会自动封禁 24 小时；连续失败请求也会自动处理。</p></article>
      <article class="admin-panel"><div class="admin-analysis-heading"><div><span>Top IP</span><strong>请求来源</strong></div></div><el-table :data="analytics?.topIPs || []" size="small"><el-table-column prop="ip" label="IP" /><el-table-column prop="requests" label="请求" width="80" /><el-table-column prop="failures" label="失败" width="80" /><el-table-column label="状态" width="90"><template #default="scope"><el-tag :type="scope.row.banned ? 'danger' : 'success'">{{ scope.row.banned ? '封禁' : '正常' }}</el-tag></template></el-table-column></el-table></article>
    </div>
    <article class="admin-panel"><div class="admin-analysis-heading"><div><span>Ban list</span><strong>封禁记录</strong></div></div><el-table :data="analytics?.recentBans || []"><el-table-column prop="ip" label="IP" /><el-table-column prop="reason" label="原因" /><el-table-column prop="expiresAt" label="到期时间" /><el-table-column label="操作" width="100"><template #default="scope"><el-button v-if="scope.row.active" type="primary" link @click="unban(scope.row)">解除</el-button><el-tag v-else type="info">已解除</el-tag></template></el-table-column></el-table></article>
  </section>
</template>
