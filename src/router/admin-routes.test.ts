import { describe, expect, it } from 'vitest'
import { createMemoryHistory, createRouter } from 'vue-router'

import { ADMIN_UNAUTHORIZED_EVENT } from '../api/admin'
import AdminDashboardView from '../views/admin/AdminDashboardView.vue'
import AdminLayout from '../components/admin/AdminLayout.vue'
import AdminLoginView from '../views/admin/AdminLoginView.vue'
import { installAdminUnauthorizedRedirect, routes } from './index'

describe('admin routes', () => {
  it('registers the protected admin shell routes', () => {
    const flattened = flattenRoutes(routes)
    const paths = flattened.map((entry) => entry.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        '/admin/login',
        '/admin',
        '/admin/posts',
        '/admin/categories',
        '/admin/tags',
        '/admin/projects',
        '/admin/comments',
        '/admin/users',
        '/admin/security',
        '/admin/settings'
      ])
    )

    expect(findRoute(flattened, '/admin')?.record.component).toBe(AdminLayout)
    expect(findRoute(flattened, '/admin/login')?.record.component).toBe(AdminLoginView)
    expect(
      findRoute(flattened, '/admin')?.record.children?.some(
        (child: { path: string; component: unknown }) => child.path === '' && child.component === AdminDashboardView
      )
    ).toBe(true)
  })

  it('marks non-login admin routes as requiring auth', () => {
    const flattened = flattenRoutes(routes)

    for (const path of ['/admin', '/admin/posts', '/admin/categories', '/admin/tags', '/admin/projects', '/admin/comments', '/admin/users', '/admin/security', '/admin/settings']) {
      expect(findRoute(flattened, path)?.record.meta?.requiresAuth).toBe(true)
    }

    expect(findRoute(flattened, '/admin/login')?.record.meta?.requiresAuth).not.toBe(true)
  })

  it('redirects an active admin route to login after unauthorized events', async () => {
    const testRouter = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/admin/login', component: AdminLoginView },
        { path: '/admin/posts', component: AdminDashboardView }
      ]
    })
    const cleanup = installAdminUnauthorizedRedirect(testRouter)

    try {
      await testRouter.push('/admin/posts')
      await testRouter.isReady()

      window.dispatchEvent(new Event(ADMIN_UNAUTHORIZED_EVENT))
      await new Promise((resolve) => setTimeout(resolve, 0))
      await testRouter.isReady()

      expect(testRouter.currentRoute.value.path).toBe('/admin/login')
      expect(testRouter.currentRoute.value.query.redirect).toBe('/admin/posts')
    } finally {
      cleanup()
    }
  })
})

type FlattenedRoute = {
  path: string
  record: any
}

function flattenRoutes(records: any[], parentPath = ''): FlattenedRoute[] {
  const flattened: FlattenedRoute[] = []

  for (const record of records) {
    const path = joinPath(parentPath, record.path)
    flattened.push({ path, record })

    if (Array.isArray(record.children) && record.children.length > 0) {
      flattened.push(...flattenRoutes(record.children, path))
    }
  }

  return flattened
}

function joinPath(parentPath: string, childPath: string): string {
  if (childPath.startsWith('/')) {
    return childPath
  }

  const normalizedParent = parentPath === '/' ? '' : parentPath
  const combined = `${normalizedParent}/${childPath}`.replace(/\/+/g, '/')

  return combined === '' ? '/' : combined.replace(/\/$/, '') || '/'
}

function findRoute(routes: FlattenedRoute[], path: string): FlattenedRoute | undefined {
  return routes.find((route) => route.path === path)
}
