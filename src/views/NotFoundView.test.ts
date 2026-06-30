import { mount, RouterLinkStub } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'

import NotFoundView from './NotFoundView.vue'

describe('NotFoundView', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the interactive particle 404 recovery interface', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null)

    const wrapper = mount(NotFoundView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    expect(wrapper.find('[data-test="not-found-canvas"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('Signal Lost · Target Not Found')
    expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/')
  })
})
