<script setup lang="ts">
import {
  Collection,
  ChatDotRound,
  Files,
  FolderOpened,
  House,
  Lock,
  Menu,
  UserFilled,
  PriceTag,
  Setting,
  SwitchButton
} from '@element-plus/icons-vue'
import { computed, onMounted, ref, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'

type AdminNavItem = {
  label: string
  icon: Component
  path?: string
  disabled?: boolean
  comingSoon?: boolean
}

type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const mobileNavOpen = ref(false)

const navGroups: AdminNavGroup[] = [
  {
    label: '概览',
    items: [{ path: '/admin', label: '工作台', icon: House }]
  },
  {
    label: '内容',
    items: [
      { path: '/admin/posts', label: '文章', icon: Files },
      { path: '/admin/categories', label: '分类', icon: Collection },
      { path: '/admin/tags', label: '标签', icon: PriceTag },
      { path: '/admin/projects', label: '项目', icon: FolderOpened }
    ]
  },
  {
    label: '互动',
    items: [
      { path: '/admin/comments', label: '评论', icon: ChatDotRound },
      { path: '/admin/users', label: '用户', icon: UserFilled }
    ]
  },
  {
    label: '智能工具',
    items: [{ label: 'AI 助手', icon: ChatDotRound, disabled: true, comingSoon: true }]
  },
  {
    label: '系统',
    items: [
      { path: '/admin/security', label: '访问安全', icon: Lock },
      { path: '/admin/settings', label: '设置', icon: Setting }
    ]
  }
]

const navItems = navGroups.flatMap((group) => group.items)
const activeRoute = computed(() => route.path)
const currentNav = computed(() =>
  [...navItems]
    .filter((item) => item.path)
    .sort((left, right) => (right.path?.length ?? 0) - (left.path?.length ?? 0))
    .find((item) => item.path && (route.path === item.path || route.path.startsWith(`${item.path}/`)))
)

onMounted(async () => {
  if (!authStore.token) return

  try {
    await authStore.loadProfile()
  } catch {
    // The API interceptor handles an expired session; keep the shell renderable
    // if the profile request fails for a transient reason.
  }
})

function menuIndex(item: AdminNavItem) {
  return item.path ?? `coming-soon-${item.label}`
}

function closeMobileNav() {
  mobileNavOpen.value = false
}

function logout() {
  authStore.logout()
  router.push('/admin/login')
}
</script>

<template>
  <el-container class="admin-shell" data-test="admin-shell">
    <el-aside class="admin-sidebar" data-test="admin-sidebar" width="248px">
      <RouterLink class="admin-brand" to="/admin">
        <span class="admin-brand-mark"></span>
        <div class="admin-brand-text">
          <strong>博客管理台</strong>
          <small>内容 · 评论 · 统计</small>
        </div>
      </RouterLink>

      <div class="admin-menu-wrapper">
        <section v-for="group in navGroups" :key="group.label" class="admin-nav-group">
          <p class="admin-nav-group-title">{{ group.label }}</p>
          <el-menu class="admin-menu" :default-active="activeRoute" router>
            <el-menu-item
              v-for="item in group.items"
              :key="menuIndex(item)"
              :index="menuIndex(item)"
              :disabled="item.disabled"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="admin-nav-item-label">{{ item.label }}</span>
              <small v-if="item.comingSoon" class="admin-nav-coming-soon">即将推出</small>
            </el-menu-item>
          </el-menu>
        </section>
      </div>

      <div class="admin-sidebar-footer">
        <el-button class="admin-logout-btn" :icon="SwitchButton" text @click="logout">
          <span class="admin-logout-label">退出登录</span>
        </el-button>
      </div>
    </el-aside>

    <el-container class="admin-content-wrapper">
      <el-header class="admin-topbar" data-test="admin-topbar" height="72px">
        <el-button
          class="admin-mobile-menu-button"
          :icon="Menu"
          circle
          text
          data-test="admin-mobile-menu"
          aria-label="打开管理导航"
          @click="mobileNavOpen = true"
        />

        <div class="topbar-context">
          <span>当前模块</span>
          <strong>{{ currentNav?.label || '管理台' }}</strong>
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

  <el-drawer v-model="mobileNavOpen" class="admin-mobile-drawer" direction="ltr" size="min(20rem, 88vw)" :with-header="false">
    <nav class="admin-mobile-nav" data-test="admin-mobile-nav" aria-label="管理导航">
      <RouterLink class="admin-brand" to="/admin" @click="closeMobileNav">
        <span class="admin-brand-mark"></span>
        <div class="admin-brand-text">
          <strong>博客管理台</strong>
          <small>内容 · 评论 · 统计</small>
        </div>
      </RouterLink>

      <div class="admin-menu-wrapper">
        <section v-for="group in navGroups" :key="group.label" class="admin-nav-group">
          <p class="admin-nav-group-title">{{ group.label }}</p>
          <el-menu class="admin-menu admin-mobile-menu" :default-active="activeRoute" router>
            <el-menu-item
              v-for="item in group.items"
              :key="menuIndex(item)"
              class="admin-mobile-menu-item"
              :index="menuIndex(item)"
              :disabled="item.disabled"
              @click="closeMobileNav"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="admin-nav-item-label">{{ item.label }}</span>
              <small v-if="item.comingSoon" class="admin-nav-coming-soon">即将推出</small>
            </el-menu-item>
          </el-menu>
        </section>
      </div>

      <div class="admin-sidebar-footer">
        <el-button class="admin-logout-btn" :icon="SwitchButton" text @click="logout">
          <span class="admin-logout-label">退出登录</span>
        </el-button>
      </div>
    </nav>
  </el-drawer>
</template>