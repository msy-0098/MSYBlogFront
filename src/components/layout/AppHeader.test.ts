import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, it } from 'vitest'

import { routes } from '../../router'
import AppHeader from './AppHeader.vue'

describe('AppHeader', () => {
  it('renders the editorial primary navigation and closes the mobile menu after route changes', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    router.push('/posts')
    await router.isReady()

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    const labels = wrapper.findAll('[data-test="primary-nav"] a').map((link) => link.text())
    expect(labels).toEqual(['文章', '分类', '项目', '友链', '关于', '搜索'])

    const toggle = wrapper.get('[data-test="mobile-nav-toggle"]')
    await toggle.trigger('click')
    await router.push('/about')
    await nextTick()

    expect(wrapper.get('[data-test="primary-nav"]').classes()).not.toContain('is-open')
  })

  it('highlights the active route and toggles the mobile menu', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    router.push('/projects')
    await router.isReady()

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    expect(wrapper.get('.router-link-active').text()).toBe('项目')

    const toggle = wrapper.get('[data-test="mobile-nav-toggle"]')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')

    expect(toggle.attributes('aria-expanded')).toBe('true')
    expect(wrapper.get('[data-test="primary-nav"]').classes()).toContain('is-open')
  })

  it('adds a scrolled state after the page moves down', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes
    })
    router.push('/')
    await router.isReady()

    Object.defineProperty(window, 'scrollY', {
      value: 40,
      configurable: true
    })

    const wrapper = mount(AppHeader, {
      global: {
        plugins: [router]
      }
    })

    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    expect(wrapper.get('.app-header').classes()).toContain('is-scrolled')
  })
})
