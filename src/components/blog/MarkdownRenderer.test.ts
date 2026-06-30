import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import MarkdownRenderer from './MarkdownRenderer.vue'

describe('MarkdownRenderer', () => {
  it('renders headings, code blocks, and external links from markdown', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: [
          '# Title',
          '',
          'Body with [external link](https://example.com).',
          '',
          '```go',
          'fmt.Println("hi")',
          '```'
        ].join('\n')
      }
    })

    expect(wrapper.find('h1').text()).toBe('Title')
    expect(wrapper.find('pre code').text()).toContain('fmt.Println')
    expect(wrapper.find('a').attributes('target')).toBe('_blank')
  })

  it('adds lazy loading attributes to markdown images', () => {
    const wrapper = mount(MarkdownRenderer, {
      props: {
        content: '![cover](/uploads/cover.png)'
      }
    })

    const image = wrapper.get('img')
    expect(image.attributes('loading')).toBe('lazy')
    expect(image.attributes('decoding')).toBe('async')
  })
})
