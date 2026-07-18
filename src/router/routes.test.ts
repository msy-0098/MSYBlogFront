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
        '/codemax',
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
        '/codemax',
        '/links',
        '/about'
      ].includes(route.path)
    )

    expect(readingRoutes.every((route) => typeof route.component === 'function')).toBe(true)
  })

  it('exposes the public CodeMax download route', () => {
    const route = routes.find((item) => item.name === 'codemax')

    expect(route?.path).toBe('/codemax')
    expect(route?.meta?.requiresAuth).not.toBe(true)
  })

  it('defines concrete projects, about, and not found routes', () => {
    expect(routes.find((route) => route.path === '/projects')?.name).toBe('projects')
    expect(routes.find((route) => route.path === '/about')?.name).toBe('about')
    expect(routes.find((route) => route.path === '/:pathMatch(.*)*')?.name).toBe('not-found')
  })
})

  it('lazy-loads admin shell so public entry stays free of admin views', () => {
    const adminLogin = routes.find((route) => route.path === '/admin/login')
    const adminRoot = routes.find((route) => route.path === '/admin')

    expect(typeof adminLogin?.component).toBe('function')
    expect(typeof adminRoot?.component).toBe('function')
  })
