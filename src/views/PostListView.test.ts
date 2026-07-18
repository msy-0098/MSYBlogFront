import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import { getCategories, getCategoryPosts, getPosts, getTagPosts, getTags } from '../api/blog'
import PostListView from './PostListView.vue'

const route = ref({
  fullPath: '/categories/go',
  params: { slug: 'go' }
})

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')

  return {
    ...actual,
    useRoute: () => route.value
  }
})

vi.mock('../api/blog', () => ({
  getCategories: vi.fn(),
  getCategoryPosts: vi.fn(),
  getPosts: vi.fn(),
  getTagPosts: vi.fn(),
  getTags: vi.fn()
}))

describe('PostListView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    route.value = {
      fullPath: '/categories/go',
      params: { slug: 'go' }
    }
    vi.mocked(getPosts).mockResolvedValue(pageResult())
    vi.mocked(getCategoryPosts).mockResolvedValue(pageResult())
    vi.mocked(getTagPosts).mockResolvedValue(pageResult())
    vi.mocked(getCategories).mockResolvedValue([{ id: 1, name: 'Go', slug: 'go', postCount: 1 }])
    vi.mocked(getTags).mockResolvedValue([{ id: 2, name: 'Backend', slug: 'backend', postCount: 1 }])
  })

  it('uses category display name and sends pagination to the category API', async () => {
    const wrapper = mount(PostListView, {
      props: { mode: 'category' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await flushPromises()

    expect(wrapper.get('h1').text()).toContain('Go')
    expect(wrapper.text()).toContain('继续阅读')
    expect(wrapper.find('[data-test="post-list-grid"]').exists()).toBe(true)
    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(true)
    expect(getCategoryPosts).toHaveBeenCalledWith('go', { page: 1, pageSize: 9 })
  })

  it('uses the all-posts API and loads the next page through OrbitPagination', async () => {
    const wrapper = mount(PostListView, {
      props: { mode: 'all' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await flushPromises()

    expect(getPosts).toHaveBeenCalledWith({ page: 1, pageSize: 9 })

    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')
    await flushPromises()

    expect(getPosts).toHaveBeenLastCalledWith({ page: 2, pageSize: 9 })
  })

  it('uses the tag display name and sends pagination to the tag API', async () => {
    route.value = {
      fullPath: '/tags/backend',
      params: { slug: 'backend' }
    }

    const wrapper = mount(PostListView, {
      props: { mode: 'tag' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await flushPromises()

    expect(wrapper.get('h1').text()).toContain('Backend')
    expect(getTagPosts).toHaveBeenCalledWith('backend', { page: 1, pageSize: 9 })
  })

  it('does not render pagination for an empty single-page result', async () => {
    vi.mocked(getPosts).mockResolvedValue({ ...pageResult(), list: [], total: 0 })

    const wrapper = mount(PostListView, {
      props: { mode: 'all' },
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await flushPromises()

    expect(wrapper.find('.state-line').exists()).toBe(true)
    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(false)
  })
})

function pageResult() {
  return {
    list: [
      {
        title: 'Post',
        slug: 'post',
        summary: 'Summary',
        cover: '',
        viewCount: 1,
        category: { id: 1, name: 'Go', slug: 'go' },
        tags: [],
        publishedAt: '2026-06-30'
      }
    ],
    page: 1,
    pageSize: 9,
    total: 20
  }
}
