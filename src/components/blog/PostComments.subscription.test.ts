import { flushPromises, mount } from '@vue/test-utils'
import { ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import PostComments from './PostComments.vue'

const remaining = vi.fn(() => ref(0))
const release = vi.fn()

vi.mock('../../api/blog', () => ({
  createPostComment: vi.fn(), getPostComments: vi.fn(() => Promise.resolve({ list: [], page: 1, pageSize: 10, total: 0 })),
  loginVisitor: vi.fn(), logoutVisitor: vi.fn(), registerVisitor: vi.fn(), resetVisitorPassword: vi.fn(), sendVisitorEmailCode: vi.fn()
}))

vi.mock('../../composables/useVerificationCountdown', () => ({
  useVerificationCountdown: () => ({ remaining, start: vi.fn(), release, dispose: vi.fn() })
}))

describe('PostComments verification subscription', () => {
  beforeEach(() => {
    remaining.mockClear()
    release.mockClear()
    sessionStorage.clear()
    localStorage.clear()
  })

  it('releases the previous email and purpose while keeping only the current dialog subscription', async () => {
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('first@example.com')
    await wrapper.get('[data-test="visitor-email"]').setValue('second@example.com')

    expect(release).toHaveBeenCalledWith('first@example.com', 'register')
    expect(remaining).toHaveBeenLastCalledWith('second@example.com', 'register')

    await wrapper.get('[data-test="switch-visitor-auth-mode"]').trigger('click')
    await wrapper.get('[data-test="open-visitor-reset"]').trigger('click')
    expect(release).toHaveBeenCalledWith('second@example.com', 'register')
    expect(remaining).toHaveBeenLastCalledWith('second@example.com', 'reset')

    await wrapper.get('[data-test="close-auth-panel"]').trigger('click')
    expect(release).toHaveBeenLastCalledWith('second@example.com', 'reset')

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    expect(remaining).toHaveBeenLastCalledWith('second@example.com', 'register')
    wrapper.unmount()
    expect(release).toHaveBeenLastCalledWith('second@example.com', 'register')
  })
})
