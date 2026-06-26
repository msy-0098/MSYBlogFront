import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HomeView from './HomeView.vue'

vi.mock('../api/site', () => ({
  getSiteProfile: vi.fn().mockResolvedValue({
    siteTitle: '马森雨的技术博客',
    subtitle: '用 Go、Vue 和 AI 工具构建清爽可靠的技术作品',
    owner: '马森雨',
    domain: 'masenyu.top',
    description: '记录项目实践、技术复盘和持续成长。',
    navItems: ['首页', '文章', '分类', '项目', '关于']
  })
}))

describe('HomeView', () => {
  it('renders the second-stage visitor homepage sections', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('h1').text()).toBe('你好，我是马森雨')
    expect(wrapper.find('[data-test="particle-dome"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('最新文章')
    expect(wrapper.text()).toContain('分类入口')
    expect(wrapper.text()).toContain('精选项目')
    expect(wrapper.findAll('[data-test="post-card"]')).toHaveLength(6)
  })
})
