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
      },
      {
        title: 'Second API Post',
        slug: 'second-api-post',
        summary: 'Another backend article',
        cover: '',
        viewCount: 4,
        category: { id: 1, name: 'Real Category', slug: 'real-category' },
        tags: [{ id: 2, name: 'Vue', slug: 'vue' }],
        publishedAt: '2026-06-29'
      }
    ],
    page: 1,
    pageSize: 6,
    total: 2
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
    aboutIntro: 'A calm place for essays and builds.',
    featuredPostSlug: 'real-api-post',
    navItems: ['Home', 'Posts', 'Categories', 'Projects', 'About']
  })
}))

describe('HomeView', () => {
  it('renders a featured essay first, then the latest post rail, and removes the particle hero', async () => {
    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-test="featured-essay"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="latest-post-rail"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="particle-dome"]').exists()).toBe(false)
    expect(wrapper.findAll('[data-test="post-card"]').length).toBeGreaterThan(0)
  })
})
