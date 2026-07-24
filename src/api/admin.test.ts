import type { AxiosAdapter } from 'axios'
import { describe, expect, it, vi } from 'vitest'

import {
  ADMIN_UNAUTHORIZED_EVENT,
  createAdminApiClient,
  createAdminBan,
  getAdminAnalytics,
  getAdminComments,
  getAdminDashboard,
  getAdminProfile,
  getAdminUsers,
  chatWithAdminAI,
  beautifyAdminPost,
  removeAdminBan,
  loginAdmin,
  updateAdminComment,
  updateAdminSettings,
  clearAdminAIConversations,
  createAdminAIConversation,
  deleteAdminAIConversation,
  getAdminAIConversation,
  listAdminAIConversations,
  renameAdminAIConversation
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
      name: 'FriendlyApiError',
      kind: 'auth',
      status: 401,
      code: 401,
      message: '登录状态已失效，请重新登录'
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
        name: 'FriendlyApiError',
        kind: 'auth',
        status: 401
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

  it('maps rejected admin responses with the shared error model', async () => {
    const client = createAdminApiClient({
      adapter: async () => {
        throw {
          response: {
            status: 403,
            data: { code: 403, message: 'internal permission resolver stack' }
          }
        }
      }
    })

    await expect(getAdminProfile(client)).rejects.toMatchObject({
      name: 'FriendlyApiError',
      kind: 'permission',
      status: 403,
      message: '暂无权限执行此操作'
    })
  })

  it('maps failed admin envelopes instead of exposing their message', async () => {
    const client = createAdminApiClient({
      adapter: async (config) => ({
        data: { code: 409, message: 'database transaction conflict at /srv/blog', data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      })
    })

    await expect(getAdminProfile(client)).rejects.toMatchObject({
      name: 'FriendlyApiError',
      kind: 'conflict',
      status: 409,
      code: 409,
      message: '当前数据已发生变化，请刷新后重试'
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
  it('calls real user, analytics, security and AI endpoints', async () => {
    const requests: string[] = []
    const client = createAdminApiClient({
      adapter: async (config) => {
        requests.push(`${config.method?.toUpperCase()} ${config.url}`)
        if (config.url === '/admin/users') return okEnvelope({ list: [], page: 1, pageSize: 10, total: 0 }, config)
        if (config.url === '/admin/analytics') return okEnvelope({ totalRequests: 1, todayRequests: 1, uniqueIPs: 1, failedRequests: 0, topIPs: [], topPaths: [], recentBans: [] }, config)
        if (config.url === '/admin/ip-bans' && config.method === 'post') return okEnvelope({ id: 1, ip: '203.0.113.1', active: true }, config)
        if (config.url === '/admin/ip-bans/1') return okEnvelope({ deleted: true }, config)
        if (config.url === '/admin/ai/chat') return okEnvelope({ answer: 'ok', mode: 'deepseek', model: 'deepseek-chat' }, config)
        if (config.url === '/admin/ai/beautify') return okEnvelope({ title: 'T', summary: 'S', content: '# C' }, config)
        throw new Error(`unexpected url ${config.url}`)
      }
    })

    await expect(getAdminUsers({}, client)).resolves.toMatchObject({ total: 0 })
    await expect(getAdminAnalytics(client)).resolves.toMatchObject({ uniqueIPs: 1 })
    await expect(createAdminBan({ ip: '203.0.113.1' }, client)).resolves.toMatchObject({ active: true })
    await expect(removeAdminBan(1, client)).resolves.toEqual({ deleted: true })
    await expect(chatWithAdminAI([{ role: 'user', content: 'hi' }], client)).resolves.toMatchObject({ mode: 'deepseek' })
    await expect(beautifyAdminPost({ title: 'T', summary: 'S', content: 'C' }, client)).resolves.toMatchObject({ content: '# C' })
    expect(requests).toEqual([
      'GET /admin/users',
      'GET /admin/analytics',
      'POST /admin/ip-bans',
      'DELETE /admin/ip-bans/1',
      'POST /admin/ai/chat',
      'POST /admin/ai/beautify'
    ])
  })

  it('uses the server-backed admin AI conversation endpoints', async () => {
    const requests: Array<{ method: string; url: string; data?: unknown }> = []
    const conversation = { id: 7, title: '运营建议', messageCount: 2, lastMessageAt: '2026-07-13T12:00:00Z' }
    const client = createAdminApiClient({
      adapter: async (config) => {
        requests.push({
          method: String(config.method).toUpperCase(),
          url: String(config.url),
          data: config.data ? JSON.parse(String(config.data)) : undefined
        })

        if (config.url === '/admin/ai/conversations' && config.method === 'get') return okEnvelope([conversation], config)
        if (config.url === '/admin/ai/conversations' && config.method === 'post') return okEnvelope(conversation, config)
        if (config.url === '/admin/ai/conversations/7' && config.method === 'get') return okEnvelope({ ...conversation, messages: [] }, config)
        if (config.url === '/admin/ai/conversations/7' && config.method === 'patch') return okEnvelope({ ...conversation, title: '重命名后' }, config)
        if (config.url === '/admin/ai/conversations/7' && config.method === 'delete') return okEnvelope({ deleted: true }, config)
        if (config.url === '/admin/ai/conversations' && config.method === 'delete') return okEnvelope({ deleted: true }, config)
        throw new Error(`unexpected request ${config.method} ${config.url}`)
      }
    })

    await expect(listAdminAIConversations(client)).resolves.toEqual([conversation])
    await expect(createAdminAIConversation(client)).resolves.toEqual(conversation)
    await expect(getAdminAIConversation(7, client)).resolves.toMatchObject({ id: 7, messages: [] })
    await expect(renameAdminAIConversation(7, '重命名后', client)).resolves.toMatchObject({ title: '重命名后' })
    await expect(deleteAdminAIConversation(7, client)).resolves.toEqual({ deleted: true })
    await expect(clearAdminAIConversations(client)).resolves.toEqual({ deleted: true })

    expect(requests).toEqual([
      { method: 'GET', url: '/admin/ai/conversations', data: undefined },
      { method: 'POST', url: '/admin/ai/conversations', data: {} },
      { method: 'GET', url: '/admin/ai/conversations/7', data: undefined },
      { method: 'PATCH', url: '/admin/ai/conversations/7', data: { title: '重命名后' } },
      { method: 'DELETE', url: '/admin/ai/conversations/7', data: undefined },
      { method: 'DELETE', url: '/admin/ai/conversations', data: undefined }
    ])
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
