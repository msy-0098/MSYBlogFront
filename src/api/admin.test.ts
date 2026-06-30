import type { AxiosAdapter } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_UNAUTHORIZED_EVENT,
  createAdminApiClient,
  getAdminComments,
  getAdminDashboard,
  getAdminProfile,
  loginAdmin,
  updateAdminComment,
  updateAdminSettings
} from './admin'

describe('admin api', () => {
  it('attaches a bearer token to authorized requests', async () => {
    const authHeaders: Array<string | undefined> = []
    const client = createAdminApiClient({
      getToken: () => 'admin-token',
      adapter: async (config) => {
        authHeaders.push(readAuthorizationHeader(config.headers))
        return okEnvelope({ id: 1, username: 'admin' }, config)
      }
    })

    await getAdminProfile(client)

    expect(authHeaders).toEqual(['Bearer admin-token'])
  })

  it('unwraps login responses from the unified envelope', async () => {
    const client = createAdminApiClient({
      adapter: async (config) => {
        if (config.url !== '/admin/login') {
          throw new Error(`unexpected url ${config.url}`)
        }

        return okEnvelope(
          {
            token: 'jwt-token',
            user: { id: 7, username: 'admin' }
          },
          config
        )
      }
    })

    await expect(
      loginAdmin(
        {
          username: 'admin',
          password: 'secret'
        },
        client
      )
    ).resolves.toEqual({
      token: 'jwt-token',
      user: { id: 7, username: 'admin' }
    })
  })

  it('unwraps profile responses from the unified envelope', async () => {
    const client = createAdminApiClient({
      getToken: () => 'admin-token',
      adapter: async (config) => {
        if (config.url !== '/admin/profile') {
          throw new Error(`unexpected url ${config.url}`)
        }

        return okEnvelope(
          {
            id: 7,
            username: 'admin'
          },
          config
        )
      }
    })

    await expect(getAdminProfile(client)).resolves.toEqual({
      id: 7,
      username: 'admin'
    })
  })

  it('calls onUnauthorized for 401 responses', async () => {
    const onUnauthorized = vi.fn()
    const client = createAdminApiClient({
      onUnauthorized,
      adapter: async (config) => ({
        data: {
          code: 401,
          message: 'unauthorized',
          data: null
        },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config
      })
    })

    await expect(getAdminProfile(client)).rejects.toMatchObject({
      response: expect.objectContaining({
        status: 401
      })
    })

    expect(onUnauthorized).toHaveBeenCalledTimes(1)
  })

  it('emits an admin unauthorized event for 401 responses', async () => {
    const listener = vi.fn()
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, listener)

    const client = createAdminApiClient({
      adapter: async (config) => ({
        data: {
          code: 401,
          message: 'unauthorized',
          data: null
        },
        status: 401,
        statusText: 'Unauthorized',
        headers: {},
        config
      })
    })

    try {
      await expect(getAdminProfile(client)).rejects.toMatchObject({
        response: expect.objectContaining({
          status: 401
        })
      })

      expect(listener).toHaveBeenCalledTimes(1)
    } finally {
      window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, listener)
    }
  })

  it('sends navigation items when updating site settings', async () => {
    let sentPayload: unknown
    const client = createAdminApiClient({
      adapter: async (config) => {
        sentPayload = JSON.parse(String(config.data))
        return okEnvelope(sentPayload, config)
      }
    })

    await updateAdminSettings(
      {
        siteTitle: 'Blog',
        subtitle: 'Notes',
        owner: 'Admin',
        domain: 'example.com',
        description: 'Personal site',
        github: '',
        gitee: '',
        email: '',
        icp: '',
        navItems: 'Home,Posts,Projects'
      },
      client
    )

    expect(sentPayload).toMatchObject({
      navItems: 'Home,Posts,Projects'
    })
  })

  it('reads dashboard metrics and updates comments', async () => {
    const requests: string[] = []
    const client = createAdminApiClient({
      getToken: () => 'admin-token',
      adapter: async (config) => {
        requests.push(`${config.method?.toUpperCase()} ${config.url}`)

        if (config.url === '/admin/dashboard') {
          return okEnvelope(
            {
              stats: {
                postCount: 3,
                publishedPostCount: 2,
                totalViews: 128,
                commentCount: 4,
                visitorCount: 2
              },
              aiAnalysis: {
                mode: 'local',
                summary: '评论互动正在增长',
                signals: ['累计阅读 128 次']
              },
              recentComments: []
            },
            config
          )
        }

        if (config.url === '/admin/comments' && config.method === 'get') {
          return okEnvelope({ list: [], page: 1, pageSize: 10, total: 0 }, config)
        }

        return okEnvelope({ id: 9, status: 'hidden' }, config)
      }
    })

    await expect(getAdminDashboard(client)).resolves.toMatchObject({
      stats: { totalViews: 128, commentCount: 4 },
      aiAnalysis: { mode: 'local' }
    })
    await expect(getAdminComments({}, client)).resolves.toMatchObject({ total: 0 })
    await expect(updateAdminComment(9, 'hidden', client)).resolves.toMatchObject({ status: 'hidden' })

    expect(requests).toEqual(['GET /admin/dashboard', 'GET /admin/comments', 'PUT /admin/comments/9'])
  })
})

function okEnvelope(data: unknown, config: Parameters<AxiosAdapter>[0]) {
  return {
    data: {
      code: 0,
      message: 'success',
      data
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config
  }
}

function readAuthorizationHeader(headers: unknown): string | undefined {
  if (!headers) {
    return undefined
  }

  if (typeof (headers as { get?: (key: string) => unknown }).get === 'function') {
    const value = (headers as { get: (key: string) => unknown }).get('Authorization')
    return typeof value === 'string' ? value : undefined
  }

  const record = headers as Record<string, unknown>
  const value = record.Authorization ?? record.authorization
  return typeof value === 'string' ? value : undefined
}
