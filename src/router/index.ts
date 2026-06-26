import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/posts',
    name: 'posts',
    component: PlaceholderView,
    props: {
      title: '文章',
      description: '文章列表将在第三阶段接入真实数据。'
    }
  },
  {
    path: '/categories',
    name: 'categories',
    component: PlaceholderView,
    props: {
      title: '分类',
      description: '分类入口将在文章系统阶段完善。'
    }
  },
  {
    path: '/projects',
    name: 'projects',
    component: PlaceholderView,
    props: {
      title: '项目',
      description: '精选项目展示将在首页阶段逐步丰富。'
    }
  },
  {
    path: '/about',
    name: 'about',
    component: PlaceholderView,
    props: {
      title: '关于',
      description: '这里会展示个人介绍、技能栈和联系方式。'
    }
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: PlaceholderView,
    props: {
      title: '后台登录',
      description: '后台登录将在第四阶段接入 JWT 鉴权。'
    }
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

