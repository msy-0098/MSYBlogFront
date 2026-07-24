import type { AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'

import { useVerificationCountdown } from '../composables/useVerificationCountdown'
import { createApiClient } from './site'
import type { EmailCodeResult } from './blog'
import {
  createPostComment,
  getArchive,
  getCategories,
  getPostComments,
  getPostDetail,
  getPosts,
  getProjects,
  loginVisitor,
  registerVisitor,
  searchPosts,
  sendVisitorEmailCode
} from './blog'

describe('blog api', () => {
  it('reads paginated posts from the unified backend response', async () => {
    const client = createApiClient({ adapter: adapterFor('/posts') })

    await expect(getPosts({}, client)).resolves.toMatchObject({
      list: [
        {
          title: '用 Go 和 SQLite 搭建轻量博客',
          slug: 'go-gin-sqlite-blog',
          category: { slug: 'go' },
          tags: [{ slug: 'backend' }]
        }
      ],
      page: 1,
      pageSize: 10,
      total: 1
    })
  })

  it('reads post detail markdown and archive groups', async () => {
    const detailClient = createApiClient({ adapter: adapterFor('/posts/go-gin-sqlite-blog') })
    await expect(getPostDetail('go-gin-sqlite-blog', detailClient)).resolves.toMatchObject({
      slug: 'go-gin-sqlite-blog',
      content: expect.stringContaining('##')
    })

    const archiveClient = createApiClient({ adapter: adapterFor('/archive') })
    await expect(getArchive(archiveClient)).resolves.toHaveLength(1)
  })

  it('passes filters and search keywords as query params', async () => {
    const requests: string[] = []
    const adapter: AxiosAdapter = async (config) => {
      requests.push(`${config.url}?${new URLSearchParams(config.params).toString()}`)
      return okEnvelope({
        list: [],
        page: 1,
        pageSize: 10,
        total: 0
      }, config)
    }

    const client = createApiClient({ adapter })

    await getPosts({ category: 'go', tag: 'backend', q: 'SQLite', slug: 'go-gin-sqlite-blog' }, client)
    await searchPosts({ q: 'Vue', page: 2, pageSize: 6 }, client)

    expect(requests).toContain('/posts?category=go&tag=backend&q=SQLite&slug=go-gin-sqlite-blog')
    expect(requests).toContain('/search?q=Vue&page=2&pageSize=6')
  })

  it('reads visible projects from the backend response', async () => {
    const client = createApiClient({ adapter: adapterFor('/projects') })

    await expect(getProjects(client)).resolves.toEqual([
      {
        id: 1,
        name: 'Blog',
        description: 'Real project',
        url: 'https://masenyu.top',
        cover: '',
        techStack: ['Go', 'Vue'],
        sort: 10,
        visible: true
      }
    ])
  })

  it('uses visitor auth and comment endpoints', async () => {
    const requests: Array<{ url?: string; method?: string; data?: unknown; auth?: string }> = []
    const client = createApiClient({
      adapter: async (config) => {
        requests.push({
          url: config.url,
          method: config.method,
          data: config.data ? JSON.parse(String(config.data)) : undefined,
          auth: readAuthorizationHeader(config.headers)
        })

        if (config.url === '/auth/email-code') {
          return okEnvelope({ sent: true, cooldownSeconds: 75, expiresIn: 600 }, config)
        }

        if (config.url === '/auth/register' || config.url === '/auth/login') {
          return okEnvelope(
            {
              token: 'visitor-token',
              user: {
                id: 3,
                email: 'reader@example.com',
                nickname: '读者',
                role: 'visitor'
              }
            },
            config
          )
        }

        if (config.url === '/posts/go-gin-sqlite-blog/comments' && config.method === 'post') {
          return okEnvelope({ id: 9, content: '写得很清楚呀' }, config)
        }

        return okEnvelope({
          list: [
            {
              id: 9,
              content: '写得很清楚呀',
              status: 'approved',
              author: { email: 'reader@example.com', nickname: '读者' },
              createdAt: '2026-06-30T00:00:00Z'
            }
          ],
          page: 1,
          pageSize: 1,
          total: 1
        }, config)
      }
    })

    const emailCodeResult: EmailCodeResult = await sendVisitorEmailCode('reader@example.com', 'register', client)
    expect(emailCodeResult).toEqual({ sent: true, cooldownSeconds: 75, expiresIn: 600 })
    await expect(
      registerVisitor(
        {
          email: 'reader@example.com',
          nickname: '读者',
          password: 'reader-password',
          code: '000000'
        },
        client
      )
    ).resolves.toMatchObject({ token: 'visitor-token' })
    await expect(loginVisitor({ email: 'reader@example.com', password: 'reader-password' }, client)).resolves.toMatchObject({
      user: { role: 'visitor' }
    })
    await expect(createPostComment('go-gin-sqlite-blog', '写得很清楚呀', 'visitor-token', client)).resolves.toMatchObject({
      id: 9
    })
    await expect(getPostComments('go-gin-sqlite-blog', client)).resolves.toMatchObject({
      total: 1,
      list: [{ author: { nickname: '读者' } }]
    })

    expect(requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: '/auth/email-code', method: 'post' }),
        expect.objectContaining({ url: '/auth/register', method: 'post' }),
        expect.objectContaining({ url: '/auth/login', method: 'post' }),
        expect.objectContaining({
          url: '/posts/go-gin-sqlite-blog/comments',
          method: 'post',
          auth: 'Bearer visitor-token'
        }),
        expect.objectContaining({ url: '/posts/go-gin-sqlite-blog/comments', method: 'get' })
      ])
    )
  })

  it('preserves a trusted visitor-auth error from a failed envelope', async () => {
    const client = createApiClient({
      adapter: async (config) => ({
        data: { code: 401, message: '邮箱或密码错误', data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      })
    })

    await expect(
      loginVisitor({ email: 'reader@example.com', password: 'wrong-password' }, client)
    ).rejects.toMatchObject({
      name: 'FriendlyApiError',
      kind: 'auth',
      status: 401,
      code: 401,
      message: '邮箱或密码错误'
    })
  })

  it('does not start a verification cooldown when an email-code request fails', async () => {
    const key = 'email-code-cooldown:register:reader@example.com'
    sessionStorage.removeItem(key)
    const countdown = useVerificationCountdown()
    const client = createApiClient({
      adapter: async () => {
        throw new Error('network unavailable')
      }
    })

    await expect(sendVisitorEmailCode('reader@example.com', 'register', client)).rejects.toMatchObject({
      name: 'FriendlyApiError'
    })
    expect(countdown.remaining('reader@example.com', 'register').value).toBe(0)
    expect(sessionStorage.getItem(key)).toBeNull()

    countdown.dispose()
  })
})

function adapterFor(expectedUrl: string): AxiosAdapter {
  return async (config) => {
    if (config.url !== expectedUrl) {
      throw new Error(`unexpected url ${config.url}`)
    }

    if (expectedUrl === '/posts/go-gin-sqlite-blog') {
      return okEnvelope({
        title: '用 Go 和 SQLite 搭建轻量博客',
        slug: 'go-gin-sqlite-blog',
        content: '## 设计\n\n正文',
        tags: [],
        prev: null,
        next: null
      }, config)
    }

    if (expectedUrl === '/archive') {
      return okEnvelope({
        list: [
          {
            year: 2026,
            months: [
              {
                month: 6,
                posts: [{ title: '用 Go 和 SQLite 搭建轻量博客' }]
              }
            ]
          }
        ]
      }, config)
    }

    if (expectedUrl === '/projects') {
      return okEnvelope({
        list: [
          {
            id: 1,
            name: 'Blog',
            description: 'Real project',
            url: 'https://masenyu.top',
            cover: '',
            techStack: ['Go', 'Vue'],
            sort: 10,
            visible: true
          }
        ]
      }, config)
    }

    return okEnvelope({
      list: [
        {
          title: '用 Go 和 SQLite 搭建轻量博客',
          slug: 'go-gin-sqlite-blog',
          category: { slug: 'go' },
          tags: [{ slug: 'backend' }]
        }
      ],
      page: 1,
      pageSize: 10,
      total: 1
    }, config)
  }
}

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
