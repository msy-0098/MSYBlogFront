import { describe, expect, it } from 'vitest'

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
        '/links',
        '/about',
        '/admin/login'
      ])
    )

    const readingRoutes = routes.filter((route) =>
      [
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
        '/links',
        '/about'
      ].includes(route.path)
    )

    expect(readingRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('defines concrete projects, about, and not found routes', () => {
    expect(routes.find((route) => route.path === '/projects')?.name).toBe('projects')
    expect(routes.find((route) => route.path === '/about')?.name).toBe('about')
    expect(routes.find((route) => route.path === '/:pathMatch(.*)*')?.name).toBe('not-found')
  })
})
