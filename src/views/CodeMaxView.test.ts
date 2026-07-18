import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import CodeMaxView from './CodeMaxView.vue'

describe('CodeMaxView', () => {
  const mountView = () =>
    mount(CodeMaxView, {
      global: {
        stubs: {
          RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] }
        }
      }
    })

  it('shows Windows, macOS and Linux release cards', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Windows')
    expect(wrapper.get('[data-platform="macos"]').text()).toContain('macOS')
    expect(wrapper.get('[data-platform="macos"]').text()).toContain('敬请期待')
    expect(wrapper.get('[data-platform="linux"]').text()).toContain('Linux')
    expect(wrapper.get('[data-platform="linux"]').text()).toContain('敬请期待')
  })

  it('makes the Windows installer downloadable and keeps future platforms inactive', () => {
    const wrapper = mountView()

    const windowsLink = wrapper.get('a[href="/downloads/CodeMax-Setup-x64.exe"]')
    expect(windowsLink.attributes('download')).toBeDefined()
    expect(wrapper.get('[data-platform="macos"]').text()).toContain('macOS')
    expect(wrapper.get('[data-platform="macos"]').text()).toContain('敬请期待')
    expect(wrapper.get('[data-platform="linux"]').text()).toContain('Linux')
    expect(wrapper.get('[data-platform="linux"]').text()).toContain('敬请期待')
    expect(wrapper.find('[data-platform="macos"] a').exists()).toBe(false)
    expect(wrapper.find('[data-platform="linux"] a').exists()).toBe(false)
  })
})
