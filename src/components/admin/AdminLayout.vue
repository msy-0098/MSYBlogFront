<script setup lang="ts">
import {
  Collection,
  Files,
  FolderOpened,
  House,
  PriceTag,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeRoute = computed(() => route.path)

const navItems = [
  { path: '/admin', label: '工作台', icon: House },
  { path: '/admin/posts', label: '文章', icon: Files },
  { path: '/admin/categories', label: '分类', icon: Collection },
  { path: '/admin/tags', label: '标签', icon: PriceTag },
  { path: '/admin/projects', label: '项目', icon: FolderOpened },
  { path: '/admin/settings', label: '设置', icon: Setting }
]

function logout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <el-container class="admin-shell">
    <el-aside class="admin-sidebar" width="280px">
      <RouterLink class="admin-brand" to="/admin">
        <span class="admin-brand-mark"></span>
        <div class="admin-brand-text">
          <strong>Workspace</strong>
          <small>Admin Panel</small>
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
        <div class="topbar-search">
           <!-- Placeholder for global search or breadcrumbs -->
           <div class="mock-search-bar">
             <el-icon><Search /></el-icon>
             <span>Search or type a command... (Ctrl+K)</span>
           </div>
        </div>

        <div class="topbar-actions">
          <div class="admin-avatar">
            {{ authStore.user?.username?.charAt(0).toUpperCase() || 'A' }}
          </div>
        </div>
      </el-header>

      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
