<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { onMounted, ref } from 'vue'

import { getAdminProfile, getAdminUsers, type AdminUser, type AdminVisitor } from '../../api/admin'
import { getFriendlyErrorMessage } from '../../utils/apiError'

const loading = ref(false)
const profile = ref<AdminUser | null>(null)
const users = ref<AdminVisitor[]>([])
const total = ref(0)

onMounted(loadUsers)

async function loadUsers() {
  loading.value = true
  try {
    const [current, result] = await Promise.all([getAdminProfile(), getAdminUsers({ page: 1, pageSize: 100 })])
    profile.value = current
    users.value = result.list
    total.value = result.total
  } catch (reason) {
    ElMessage.error(getFriendlyErrorMessage(reason, '用户信息加载失败'))
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <section class="admin-page">
    <div class="admin-page-heading"><div><p class="section-kicker">Accounts</p><h1>用户信息</h1></div><el-button @click="loadUsers">刷新</el-button></div>
    <div v-loading="loading" class="admin-dashboard-columns">
      <article class="admin-panel">
        <div class="admin-analysis-heading"><div><span>当前登录用户</span><strong>{{ profile?.nickname || '管理员' }}</strong></div></div>
        <dl class="admin-detail-list">
          <div><dt>用户名</dt><dd>{{ profile?.username || '-' }}</dd></div>
          <div><dt>邮箱</dt><dd>{{ profile?.email || '-' }}</dd></div>
          <div><dt>角色</dt><dd>{{ profile?.role || 'admin' }}</dd></div>
          <div><dt>注册时间</dt><dd>{{ profile?.createdAt || '-' }}</dd></div>
        </dl>
      </article>
      <article class="admin-panel"><div class="admin-analysis-heading"><div><span>用户总数</span><strong>{{ total }}</strong></div></div><p>这里展示管理员和邮箱注册访客的真实记录，密码哈希永远不会返回。</p></article>
    </div>
    <article class="admin-panel" v-loading="loading">
      <el-table :data="users" stripe>
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="username" label="登录标识" />
        <el-table-column prop="role" label="角色" width="100" />
        <el-table-column prop="createdAt" label="创建时间" min-width="190" />
      </el-table>
    </article>
  </section>
</template>
