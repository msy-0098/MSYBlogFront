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
    const canvasContextSpy = vi
      .spyOn(HTMLCanvasElement.prototype, 'getContext')
      .mockReturnValue(null)
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()

    expect(wrapper.get('h1').text()).toContain('构建清爽可靠的')
    expect(wrapper.get('h1').text()).toContain('技术作品')
    expect(wrapper.text()).toContain('马森雨 Blog')
    expect(wrapper.get('[data-test="typed-intro"]').attributes('aria-label')).toBe(
      '专注于AI 融入JAVA GO 业务，项目实践沉淀成技术作品'
    )
    const typedText = wrapper.get('[data-test="typed-intro-text"]')
    expect(typedText.attributes('data-typing-stream')).toBe('true')
    expect(wrapper.find('[data-test="particle-dome"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="particle-dome"] canvas').exists()).toBe(true)
    expect(wrapper.text()).toContain('最新文章')
    expect(wrapper.text()).toContain('分类入口')
    expect(wrapper.text()).toContain('精选项目')
    expect(wrapper.findAll('.google-flow-section').length).toBeGreaterThanOrEqual(4)
    expect(wrapper.findAll('[data-test="post-card"]')).toHaveLength(6)
    canvasContextSpy.mockRestore()
  })
})
