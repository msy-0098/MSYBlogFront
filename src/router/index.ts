import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

import ArchiveView from '../views/ArchiveView.vue'
import HomeView from '../views/HomeView.vue'
import PlaceholderView from '../views/PlaceholderView.vue'
import PostDetailView from '../views/PostDetailView.vue'
import PostListView from '../views/PostListView.vue'
import SearchView from '../views/SearchView.vue'
import TaxonomyView from '../views/TaxonomyView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/posts',
    name: 'posts',
    component: PostListView
  },
  {
    path: '/posts/:slug',
    name: 'post-detail',
    component: PostDetailView
  },
  {
    path: '/categories',
    name: 'categories',
    component: TaxonomyView,
    props: {
      type: 'categories'
    }
  },
  {
    path: '/categories/:slug',
    name: 'category-posts',
    component: PostListView,
    props: {
      mode: 'category'
    }
  },
  {
    path: '/tags',
    name: 'tags',
    component: TaxonomyView,
    props: {
      type: 'tags'
    }
  },
  {
    path: '/tags/:slug',
    name: 'tag-posts',
    component: PostListView,
    props: {
      mode: 'tag'
    }
  },
  {
    path: '/archive',
    name: 'archive',
    component: ArchiveView
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
    path: '/search',
    name: 'search',
    component: SearchView
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
