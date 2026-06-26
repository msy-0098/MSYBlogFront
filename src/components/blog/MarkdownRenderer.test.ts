import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MarkdownRenderer from './MarkdownRenderer.vue'

describe('MarkdownRenderer', () => {
  it('renders headings, code blocks, and external links from markdown', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '# 标题',
          '',
          '正文里有 [外链](https://example.com)。',
          '',
          '```go',
          'fmt.Println("hi")',
          '```'
        ].join('\n')
      }
    })

    expect(wrapper.find('h1').text()).toBe('标题')
    expect(wrapper.find('pre code').text()).toContain('fmt.Println')
    expect(wrapper.find('a').attributes('target')).toBe('_blank')
  })
})
