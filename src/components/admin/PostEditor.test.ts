import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import type { AdminPostPayload, AdminTaxonomy } from '../../api/admin'
import PostEditor from './PostEditor.vue'

describe('PostEditor', () => {
  it('emits a backend-ready post payload', async () => {
    const categories: AdminTaxonomy[] = [
      { id: 2, name: 'Engineering', slug: 'engineering' },
      { id: 3, name: 'Notes', slug: 'notes' }
    ]
    const tags: AdminTaxonomy[] = [
      { id: 5, name: 'Go', slug: 'go' },
      { id: 8, name: 'Vue', slug: 'vue' }
    ]

    const wrapper = mount(PostEditor, {
      props: {
        categories,
        tags,
        initialValue: {
          title: '',
          slug: '',
          summary: '',
          content: '',
          cover: '',
          status: 'draft',
          categoryId: 0,
          tagIds: [],
          publishedAt: ''
        }
      }
    })

    await wrapper.find('[data-test="post-title-input"] input').setValue('Fourth Stage Notes')
    await wrapper.find('[data-test="post-slug-input"] input').setValue('fourth-stage-notes')
    await wrapper.find('[data-test="post-summary-input"] textarea').setValue('Admin MVP delivery notes')
    await wrapper.find('[data-test="post-content-input"] textarea').setValue('# Done\n\nUseful content.')
    await wrapper.find('[data-test="post-cover-input"] input').setValue('/uploads/cover.png')
    await wrapper.find('[data-test="post-status-select"]').setValue('published')
    await wrapper.find('[data-test="post-category-select"]').setValue('2')
    await wrapper.find('[data-test="post-tags-select"]').setValue(['5', '8'])
    await wrapper.find('[data-test="post-published-at-input"] input').setValue('2026-06-26T10:15')
    await wrapper.find('form').trigger('submit')

    const emitted = wrapper.emitted('submit')?.[0]?.[0] as AdminPostPayload | undefined

    const expectedPublishedAt = new Date(2026, 5, 26, 10, 15, 0).toISOString()

    expect(emitted).toEqual({
      title: 'Fourth Stage Notes',
      slug: 'fourth-stage-notes',
      summary: 'Admin MVP delivery notes',
      content: '# Done\n\nUseful content.',
      cover: '/uploads/cover.png',
      status: 'published',
      categoryId: 2,
      tagIds: [5, 8],
      publishedAt: expectedPublishedAt
    })
  })
})
