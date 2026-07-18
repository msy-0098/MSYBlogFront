import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrbitPagination from './OrbitPagination.vue'

describe('OrbitPagination', () => {
  it.each([1, 0, -1])('does not render when totalPages is %i', (totalPages) => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages }
    })

    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(false)
  })

  it('renders the orbit page indicator and disables the first-page previous button', () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages: 5 }
    })

    expect(wrapper.get('[data-test="orbit-pagination"]').attributes('aria-label')).toBe('文章分页')
    expect(wrapper.get('[data-test="orbit-pagination-current"]').text()).toBe('第 1 / 5 页')
    expect(wrapper.get('[data-test="orbit-pagination-current"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-test="orbit-pagination-prev"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="orbit-pagination-prev"]').attributes('aria-disabled')).toBe('true')
    expect(wrapper.get('[data-test="orbit-pagination-next"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-test="orbit-pagination-next"]').attributes('aria-disabled')).toBe('false')
  })

  it('emits the previous and next pages and ignores out-of-range navigation', async () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 2, totalPages: 3 }
    })

    await wrapper.get('[data-test="orbit-pagination-prev"]').trigger('click')
    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')

    expect(wrapper.emitted('change')).toEqual([[1], [3]])

    await wrapper.setProps({ currentPage: 3 })
    expect(wrapper.get('[data-test="orbit-pagination-prev"]').attributes('disabled')).toBeUndefined()
    expect(wrapper.get('[data-test="orbit-pagination-next"]').attributes('disabled')).toBeDefined()
    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  it('supports the admin visual variant without changing the event contract', () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages: 2, variant: 'admin' }
    })

    expect(wrapper.get('[data-test="orbit-pagination"]').classes()).toContain('orbit-pagination--admin')
  })
})
