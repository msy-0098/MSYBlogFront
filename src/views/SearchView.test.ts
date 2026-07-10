import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { searchPosts } from '../api/blog'
import SearchView from './SearchView.vue'

vi.mock('../api/blog', () => ({
  searchPosts: vi.fn().mockResolvedValue({
    list: [],
    page: 1,
    pageSize: 9,
    total: 0
  })
}))

describe('SearchView', () => {
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
  })
})
