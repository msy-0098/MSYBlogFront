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
    <el-aside class="admin-sidebar" width="232px">
      <RouterLink class="admin-brand" to="/admin">
        <span class="admin-brand-mark">M</span>
        <span>
          <strong>Blog Admin</strong>
          <small>内容管理</small>
        </span>
      </RouterLink>

      <el-menu class="admin-menu" :default-active="activeRoute" router>
        <el-menu-item v-for="item in navItems" :key="item.path" :index="item.path">
          <el-icon><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="admin-topbar" height="64px">
        <div>
          <strong>{{ authStore.user?.username || 'admin' }}</strong>
          <span>管理后台</span>
        </div>

        <el-button :icon="SwitchButton" @click="logout">退出</el-button>
      </el-header>

      <el-main class="admin-main">
        <RouterView />
      </el-main>
    </el-container>
  </el-container>
</template>
