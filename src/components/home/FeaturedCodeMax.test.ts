import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import FeaturedCodeMax from './FeaturedCodeMax.vue'

describe('FeaturedCodeMax', () => {
  it('renders a CodeMax CTA linking to the download page', () => {
    const wrapper = mount(FeaturedCodeMax, {
      global: {
        stubs: {
          RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] }
        }
      }
    })

    expect(wrapper.text()).toContain('CodeMax')
    expect(wrapper.text()).toContain('终端里的 AI 编程助手')
    expect(wrapper.get('a[href="/codemax"]').text()).toContain('下载体验')
  })
})
