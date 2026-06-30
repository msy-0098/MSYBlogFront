import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import HomeView from './HomeView.vue'

vi.mock('../api/blog', () => ({
  getCategories: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Real Category',
      slug: 'real-category',
      postCount: 4
    }
  ]),
  getPosts: vi.fn().mockResolvedValue({
    list: [
      {
        title: 'Real API Post',
        slug: 'real-api-post',
        summary: 'Loaded from backend',
        cover: '',
        viewCount: 9,
        category: { id: 1, name: 'Real Category', slug: 'real-category' },
        tags: [{ id: 1, name: 'API', slug: 'api' }],
        publishedAt: '2026-06-30'
      }
    ],
    page: 1,
    pageSize: 6,
    total: 1
  }),
  getProjects: vi.fn().mockResolvedValue([
    {
      id: 1,
      name: 'Real API Project',
      description: 'Loaded from backend project API',
      url: 'https://masenyu.top',
      cover: '',
      techStack: ['Go', 'Vue'],
      sort: 10,
      visible: true
    }
  ])
}))

vi.mock('../api/site', () => ({
  getSiteProfile: vi.fn().mockResolvedValue({
    siteTitle: 'MSY Blog',
    subtitle: 'API backed homepage',
    owner: 'MSY',
    domain: 'masenyu.top',
    description: 'Real site profile',
    navItems: ['Home', 'Posts', 'Categories', 'Projects', 'About']
  })
}))

describe('HomeView', () => {
  it('renders visitor homepage sections from backend APIs', async () => {
    const canvasContextSpy = vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          HeroParticleDome: {
            template: '<div data-test="particle-dome"><canvas /></div>'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-test="particle-dome"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="particle-dome"] canvas').exists()).toBe(true)
    expect(wrapper.findAll('.google-flow-section').length).toBeGreaterThanOrEqual(4)
    expect(wrapper.text()).toContain('Real API Post')
    expect(wrapper.text()).toContain('Real Category')
    expect(wrapper.text()).toContain('Real API Project')
    expect(wrapper.findAll('[data-test="post-card"]')).toHaveLength(1)
    canvasContextSpy.mockRestore()
  })
})
