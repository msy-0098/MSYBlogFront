import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { searchPosts } from '../api/blog'
import SearchView from './SearchView.vue'

vi.mock('../api/blog', () => ({
  searchPosts: vi.fn()
}))

describe('SearchView', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(searchPosts).mockResolvedValue({
      list: [],
      page: 1,
      pageSize: 9,
      total: 0
    })
  })

  it('sends page and pageSize with the search keyword', async () => {
    const wrapper = mount(SearchView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    expect(wrapper.get('h1').text()).toBe('在写作档案里找答案')
    expect(wrapper.text()).toContain('继续沿着主题向下阅读')

    await wrapper.get('input[type="search"]').setValue('mysql')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(searchPosts).toHaveBeenCalledWith({ q: 'mysql', page: 1, pageSize: 9 })
    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(false)
  })

  it('renders OrbitPagination and keeps the keyword when loading the next page', async () => {
    vi.mocked(searchPosts).mockResolvedValue({
      list: [],
      page: 1,
      pageSize: 9,
      total: 20
    })

    const wrapper = mount(SearchView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await wrapper.get('input[type="search"]').setValue('mysql')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(true)

    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')
    await flushPromises()

    expect(searchPosts).toHaveBeenLastCalledWith({ q: 'mysql', page: 2, pageSize: 9 })
  })

  it('does not render pagination when there are no search results', async () => {
    const wrapper = mount(SearchView, {
      global: { stubs: { RouterLink: RouterLinkStub } }
    })

    await wrapper.get('input[type="search"]').setValue('unknown')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.find('.state-line').exists()).toBe(true)
    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(false)
  })
})
