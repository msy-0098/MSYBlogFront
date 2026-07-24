import { describe, expect, it } from 'vitest'
import type { AxiosAdapter } from 'axios'

import { createApiClient, getSiteProfile } from './site'

describe('getSiteProfile', () => {
  it('reads site profile from the unified backend response', async () => {
    const adapter: AxiosAdapter = async (config) => ({
      data: {
        code: 0,
        message: 'success',
        data: {
          siteTitle: '马森雨的技术博客',
          subtitle: '用 Go、Vue 和 AI 工具构建清爽可靠的技术作品',
          owner: '马森雨',
          domain: 'masenyu.top',
          description: '记录项目实践、技术复盘和持续成长。',
          navItems: ['首页', '文章', '分类', '项目', '关于']
        }
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config
    })

    const client = createApiClient({
      adapter
    })

    await expect(getSiteProfile(client)).resolves.toMatchObject({
      siteTitle: '马森雨的技术博客',
      owner: '马森雨',
      domain: 'masenyu.top'
    })
  })

  it('maps rejected HTTP responses without exposing internal server text', async () => {
    const client = createApiClient({
      adapter: async () => {
        throw {
          response: {
            status: 500,
            data: { code: 500, message: 'SQLITE_BUSY at /srv/blog/data.db' }
          }
        }
      }
    })

    await expect(client.get('/site')).rejects.toMatchObject({
      name: 'FriendlyApiError',
      kind: 'server',
      status: 500,
      code: 500,
      message: '服务暂时不可用，请稍后再试'
    })
  })

  it('maps failed site envelopes through the shared error model', async () => {
    const client = createApiClient({
      adapter: async (config) => ({
        data: { code: 404, message: '文章不存在', data: null },
        status: 200,
        statusText: 'OK',
        headers: {},
        config
      })
    })

    await expect(getSiteProfile(client)).rejects.toMatchObject({
      name: 'FriendlyApiError',
      kind: 'not-found',
      status: 404,
      code: 404,
      message: '请求的内容不存在或已被移除'
    })
  })
})
