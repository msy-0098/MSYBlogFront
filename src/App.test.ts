import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn()
}))

const route = reactive({
  path: '/'
})

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value
  })
}

function mountApp() {
  return mount(App, {
    global: {
      stubs: {
        AppFooter: true,
        AppHeader: true,
        RouterView: true
      }
    }
  })
}

describe('App scroll motion', () => {
  beforeEach(() => {
    route.path = '/'
    setScrollY(0)
    vi.mocked(useRoute).mockReturnValue(route as ReturnType<typeof useRoute>)
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false })
    })
  })

  it('does not apply page transition blur to ordinary non-home scrolling', async () => {
    route.path = '/posts'
    const wrapper = mountApp()

    vi.mocked(performance.now).mockReturnValue(32)
    setScrollY(640)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const main = wrapper.get('main')
    expect(main.classes()).not.toContain('is-scroll-blurring')
    expect(main.attributes('style')).toContain('--scroll-blur: 0px')
  })

  it('keeps the homepage main surface free of global blur for faster navigation', async () => {
    const wrapper = mountApp()

    vi.mocked(performance.now).mockReturnValue(32)
    setScrollY(640)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const main = wrapper.get('main')
    expect(main.classes()).not.toContain('is-scroll-blurring')
    expect(main.attributes('style')).toContain('--scroll-blur: 0px')
  })
})
