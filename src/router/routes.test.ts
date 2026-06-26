import { describe, expect, it } from 'vitest'

import { routes } from './index'

describe('routes', () => {
  it('defines the first-stage visitor and admin entry routes', () => {
    const paths = routes.map((route) => route.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        '/',
        '/posts',
        '/categories',
        '/projects',
        '/about',
        '/admin/login'
      ])
    )
  })
})

