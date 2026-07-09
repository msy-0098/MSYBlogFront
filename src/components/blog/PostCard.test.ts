import { mount, RouterLinkStub } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PostCard from './PostCard.vue'

describe('PostCard', () => {
  it('keeps the main article link and tag links navigable without nesting RouterLinks', () => {
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
    const destinations = links.map((link) => link.props('to'))

    expect(destinations).toContain('/posts/curated-post')
    expect(destinations).toContain('/tags/vue')
    expect(destinations).toContain('/tags/testing')
    expect(wrapper.find('.post-card-shell__tags').findAllComponents(RouterLinkStub)).toHaveLength(2)
  })
})
