import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getCategories,
  getPostDetail,
  getPosts,
  getProjects,
  type PostDetail,
  type PostSummary
} from '../api/blog'
import { getSiteProfile } from '../api/site'
import HomeView from './HomeView.vue'

vi.mock('../api/blog', () => ({
  getCategories: vi.fn(),
  getPostDetail: vi.fn(),
  getPosts: vi.fn(),
  getProjects: vi.fn()
}))

vi.mock('../api/site', () => ({
  getSiteProfile: vi.fn()
}))

describe('HomeView', () => {
  beforeEach(() => {
    vi.mocked(getCategories).mockResolvedValue([
      {
        id: 1,
        name: 'Real Category',
        slug: 'real-category',
        postCount: 4
      }
    ])
    vi.mocked(getProjects).mockResolvedValue([
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
    vi.mocked(getSiteProfile).mockResolvedValue({
      siteTitle: 'MSY Blog',
      subtitle: 'API backed homepage',
      owner: 'MSY',
      domain: 'masenyu.top',
      description: 'Real site profile',
      aboutIntro: 'A calm place for essays and builds.',
      featuredPostSlug: 'real-api-post',
      navItems: ['Home', 'Posts', 'Categories', 'Projects', 'About']
    })
    vi.mocked(getPosts).mockResolvedValue({
      list: [makePost('real-api-post', 'Real API Post'), makePost('second-api-post', 'Second API Post')],
      page: 1,
      pageSize: 6,
      total: 2
    })
    vi.mocked(getPostDetail).mockResolvedValue(makePostDetail('real-api-post', 'Real API Post'))
  })

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

  it('loads the curated featured article even when it is not in the latest homepage rail', async () => {
    vi.mocked(getSiteProfile).mockResolvedValue({
      siteTitle: 'MSY Blog',
      subtitle: 'API backed homepage',
      owner: 'MSY',
      domain: 'masenyu.top',
      description: 'Real site profile',
      aboutIntro: 'A calm place for essays and builds.',
      featuredPostSlug: 'curated-deep-dive',
      navItems: ['Home', 'Posts', 'Categories', 'Projects', 'About']
    })
    vi.mocked(getPosts).mockResolvedValue({
      list: [makePost('latest-one', 'Latest One'), makePost('latest-two', 'Latest Two')],
      page: 1,
      pageSize: 6,
      total: 2
    })
    vi.mocked(getPostDetail).mockResolvedValue(makePostDetail('curated-deep-dive', 'Curated Deep Dive'))

    const wrapper = mount(HomeView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    await flushPromises()

    expect(getPostDetail).toHaveBeenCalledWith('curated-deep-dive')
    expect(wrapper.get('[data-test="featured-essay"]').text()).toContain('Curated Deep Dive')
    expect(wrapper.get('[data-test="latest-post-rail"]').text()).toContain('Latest One')
    expect(wrapper.get('[data-test="latest-post-rail"]').text()).toContain('Latest Two')
    expect(wrapper.findAll('[data-test="post-card"]')).toHaveLength(2)
  })
})

function makePost(slug: string, title: string): PostSummary {
  return {
    title,
    slug,
    summary: `${title} summary`,
    cover: '',
    viewCount: 9,
    category: { id: 1, name: 'Real Category', slug: 'real-category' },
    tags: [{ id: 1, name: 'API', slug: 'api' }],
    publishedAt: '2026-06-30'
  }
}

function makePostDetail(slug: string, title: string): PostDetail {
  return {
    ...makePost(slug, title),
    content: `# ${title}`,
    prev: null,
    next: null
  }
}
