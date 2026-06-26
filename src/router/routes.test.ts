import { describe, expect, it } from 'vitest'

import PlaceholderView from '../views/PlaceholderView.vue'
import { routes } from './index'

describe('routes', () => {
  it('defines the visitor reading routes with concrete view components', () => {
    const paths = routes.map((route) => route.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        '/',
        '/posts',
        '/posts/:slug',
        '/categories',
        '/categories/:slug',
        '/tags',
        '/tags/:slug',
        '/archive',
        '/search',
        '/projects',
        '/about',
        '/admin/login'
      ])
    )

    const readingRoutes = routes.filter((route) =>
      ['/posts', '/posts/:slug', '/categories', '/categories/:slug', '/tags', '/tags/:slug', '/archive', '/search'].includes(route.path)
    )

    expect(readingRoutes.every((route) => route.component !== undefined && route.component !== PlaceholderView)).toBe(true)
  })
})
