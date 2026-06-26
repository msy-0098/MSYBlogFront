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
})
