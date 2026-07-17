import type { RouteRecordRaw, Router } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

import { ADMIN_UNAUTHORIZED_EVENT } from '../api/admin'
import AdminLayout from '../components/admin/AdminLayout.vue'
import { useAuthStore } from '../stores/auth'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminAIWorkspaceView from '../views/admin/AdminAIWorkspaceView.vue'
import AdminLoginView from '../views/admin/AdminLoginView.vue'
import AdminCommentsView from '../views/admin/AdminCommentsView.vue'
import AdminPostEditView from '../views/admin/AdminPostEditView.vue'
import AdminPostsView from '../views/admin/AdminPostsView.vue'
import AdminProjectsView from '../views/admin/AdminProjectsView.vue'
import AdminSettingsView from '../views/admin/AdminSettingsView.vue'
import AdminUsersView from '../views/admin/AdminUsersView.vue'
import AdminSecurityView from '../views/admin/AdminSecurityView.vue'
import AdminTaxonomyView from '../views/admin/AdminTaxonomyView.vue'
import AdminLinksView from '../views/admin/AdminLinksView.vue'

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue')
  },
  {
    path: '/posts',
    name: 'posts',
    component: () => import('../views/PostListView.vue')
  },
  {
    path: '/posts/:slug',
    name: 'post-detail',
    component: () => import('../views/PostDetailView.vue')
  },
  {
    path: '/categories',
    name: 'categories',
    component: () => import('../views/TaxonomyView.vue'),
    props: {
      type: 'categories'
    }
  },
  {
    path: '/categories/:slug',
    name: 'category-posts',
    component: () => import('../views/PostListView.vue'),
    props: {
      mode: 'category'
    }
  },
  {
    path: '/tags',
    name: 'tags',
    component: () => import('../views/TaxonomyView.vue'),
    props: {
      type: 'tags'
    }
  },
  {
    path: '/tags/:slug',
    name: 'tag-posts',
    component: () => import('../views/PostListView.vue'),
    props: {
      mode: 'tag'
    }
  },
  {
    path: '/archive',
    name: 'archive',
    component: () => import('../views/ArchiveView.vue')
  },
  {
    path: '/projects',
    name: 'projects',
    component: () => import('../views/ProjectsView.vue')
  },
  {
    path: '/links',
    name: 'links',
    component: () => import('../views/LinksView.vue')
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutView.vue')
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue')
  },
  {
    path: '/admin/login',
    name: 'admin-login',
    component: AdminLoginView
  },
  {
    path: '/admin',
    name: 'admin',
    component: AdminLayout,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '',
        name: 'admin-dashboard',
        component: AdminDashboardView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'ai',
        name: 'admin-ai',
        component: AdminAIWorkspaceView,
        meta: {
          requiresAuth: true
        }
      },      {
        path: 'posts',
        name: 'admin-posts',
        component: AdminPostsView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'posts/create',
        name: 'admin-post-create',
        component: AdminPostEditView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'posts/:id/edit',
        name: 'admin-post-edit',
        component: AdminPostEditView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'categories',
        name: 'admin-categories',
        component: AdminTaxonomyView,
        meta: {
          requiresAuth: true
        },
        props: {
          mode: 'categories'
        }
      },
      {
        path: 'tags',
        name: 'admin-tags',
        component: AdminTaxonomyView,
        meta: {
          requiresAuth: true
        },
        props: {
          mode: 'tags'
        }
      },
      {
        path: 'projects',
        name: 'admin-projects',
        component: AdminProjectsView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'links',
        name: 'admin-links',
        component: AdminLinksView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'comments',
        name: 'admin-comments',
        component: AdminCommentsView,
        meta: {
          requiresAuth: true
        }
      },
      {
        path: 'users',
        name: 'admin-users',
        component: AdminUsersView,
        meta: { requiresAuth: true }
      },
      {
        path: 'security',
        name: 'admin-security',
        component: AdminSecurityView,
        meta: { requiresAuth: true }
      },
      {
        path: 'settings',
        name: 'admin-settings',
        component: AdminSettingsView,
        meta: {
          requiresAuth: true
        }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue')
  }
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

router.beforeEach((to) => {
  if (!to.matched.some((record) => record.meta.requiresAuth)) {
    return true
  }

  const authStore = useAuthStore()

  if (authStore.isAuthenticated) {
    return true
  }

  return {
    path: '/admin/login',
    query: {
      redirect: to.fullPath
    }
  }
})

export function installAdminUnauthorizedRedirect(targetRouter: Router, onUnauthorized?: () => void) {
  const redirectToLogin = () => {
    onUnauthorized?.()

    const currentRoute = targetRouter.currentRoute.value
    if (!currentRoute.path.startsWith('/admin') || currentRoute.path === '/admin/login') {
      return
    }

    void targetRouter.push({
      path: '/admin/login',
      query: {
        redirect: currentRoute.fullPath
      }
    })
  }

  window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, redirectToLogin)

  return () => {
    window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, redirectToLogin)
  }
}
