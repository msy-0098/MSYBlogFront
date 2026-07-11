<script setup lang="ts">
import {
  Collection,
  ChatDotRound,
  Files,
  FolderOpened,
  House,
  Lock,
  UserFilled,
  PriceTag,
  Search,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeRoute = computed(() => route.path)
const currentNav = computed(() =>
  [...navItems]
    .sort((left, right) => right.path.length - left.path.length)
    .find((item) => route.path === item.path || route.path.startsWith(`${item.path}/`))
)

const navItems = [
  { path: '/admin', label: '工作台', icon: House },
  { path: '/admin/posts', label: '文章', icon: Files },
  { path: '/admin/categories', label: '分类', icon: Collection },
  { path: '/admin/tags', label: '标签', icon: PriceTag },
  { path: '/admin/projects', label: '项目', icon: FolderOpened },
  { path: '/admin/comments', label: '评论', icon: ChatDotRound },
  { path: '/admin/users', label: '用户', icon: UserFilled },
  { path: '/admin/security', label: '访问安全', icon: Lock },
  { path: '/admin/settings', label: '设置', icon: Setting }
]

onMounted(async () => {
  if (!authStore.token) return

  try {
    await authStore.loadProfile()
  } catch {
    // The API interceptor handles an expired session; keep the shell renderable
    // if the profile request fails for a transient reason.
  }
})

function logout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <el-container class="admin-shell">
    <el-aside class="admin-sidebar" width="248px">
      <RouterLink class="admin-brand" to="/admin">
        <span class="admin-brand-mark"></span>
        <div class="admin-brand-text">
          <strong>博客管理台</strong>
          <small>内容 · 评论 · 统计</small>
        </div>
      </RouterLink>

      <div class="admin-menu-wrapper">
        <el-menu class="admin-menu" :default-active="activeRoute" router>
          <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
            <el-icon><component :is="item.icon" /></el-icon>
            <span>{{ item.label }}</span>
          </el-menu-item>
        </el-menu>
      </div>

      <div class="admin-sidebar-footer">
        <el-button class="admin-logout-btn" :icon="SwitchButton" text @click="logout">退出登录</el-button>
      </div>
    </el-aside>

    <el-container class="admin-content-wrapper">
      <el-header class="admin-topbar" height="72px">
        <div class="topbar-context">
          <span>当前模块</span>
          <strong>{{ currentNav?.label || '管理台' }}</strong>
        </div>

        <div class="topbar-search">
          <div class="mock-search-bar" aria-label="后台检索入口">
            <el-icon><Search /></el-icon>
            <span>检索文章、评论或设置...</span>
          </div>
        </div>

        <div class="topbar-actions">
          <div class="admin-topbar-user">
            <div class="admin-avatar">{{ authStore.user?.nickname?.charAt(0) || authStore.user?.username?.charAt(0).toUpperCase() || 'A' }}</div>
            <div><strong>{{ authStore.user?.nickname || authStore.user?.username || '管理员' }}</strong><small>{{ authStore.user?.email || authStore.user?.username || '管理员账号' }}</small></div>
          </div>
        </div>
      </el-header>

      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
