import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PostCard from './PostCard.vue'

describe('PostCard', () => {
  it('uses a single article RouterLink so the whole card is clickable', () => {
    const wrapper = mount(PostCard, {
      props: {
        post: {
          title: 'Curated Post',
          slug: 'curated-post',
          summary: 'Summary',
          cover: '',
          viewCount: 6,
          category: { id: 1, name: 'Go', slug: 'go' },
          tags: [
            { id: 2, name: 'Vue', slug: 'vue' },
            { id: 3, name: 'Testing', slug: 'testing' }
          ],
          publishedAt: '2026-07-09'
        }
      },
      global: {
        stubs: {
          RouterLink: RouterLinkStub
        }
      }
    })

    const links = wrapper.findAllComponents(RouterLinkStub)
    expect(links).toHaveLength(1)
    expect(links[0].props('to')).toBe('/posts/curated-post')
    expect(wrapper.text()).toContain('Vue')
    expect(wrapper.text()).toContain('Testing')
    expect(wrapper.find('.post-card-shell__link').exists()).toBe(true)
  })
})