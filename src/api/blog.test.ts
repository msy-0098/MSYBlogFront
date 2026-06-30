import type { AxiosAdapter } from 'axios'
import { describe, expect, it } from 'vitest'

import { createApiClient } from './site'
import { getArchive, getCategories, getPostDetail, getPosts, getProjects, searchPosts } from './blog'

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

    await getPosts({ category: 'go', tag: 'backend', q: 'SQLite' }, client)
    await searchPosts({ q: 'Vue', page: 2, pageSize: 6 }, client)

    expect(requests).toContain('/posts?category=go&tag=backend&q=SQLite')
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
