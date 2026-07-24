import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { FriendlyApiError } from '../../utils/apiError'
import PostComments from './PostComments.vue'

const getPostComments = vi.fn()
const sendVisitorEmailCode = vi.fn()

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (reason?: unknown) => void
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

vi.mock('../../api/blog', () => ({
  createPostComment: vi.fn(),
  getPostComments: (...args: unknown[]) => getPostComments(...args),
  loginVisitor: vi.fn(),
  logoutVisitor: vi.fn(),
  registerVisitor: vi.fn(),
  resetVisitorPassword: vi.fn(),
  sendVisitorEmailCode: (...args: unknown[]) => sendVisitorEmailCode(...args)
}))

describe('PostComments', () => {
  beforeEach(() => {
    sessionStorage.clear()
    localStorage.clear()
    getPostComments.mockReset()
    sendVisitorEmailCode.mockReset()
    getPostComments.mockResolvedValue({ list: [], page: 1, pageSize: 10, total: 0 })
  })

  it('starts the server-provided register cooldown only after a successful code send', async () => {
    sendVisitorEmailCode.mockResolvedValue({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue(' Reader@Example.com ')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await flushPromises()

    expect(sendVisitorEmailCode).toHaveBeenCalledWith(' Reader@Example.com ', 'register')
    expect(wrapper.get('[data-test="send-code"]').text()).toContain('60s')
    expect(wrapper.text()).toContain('验证码已发送')
  })

  it('uses retryAfter as the cooldown when the server rate-limits a code request', async () => {
    sendVisitorEmailCode.mockRejectedValue(new FriendlyApiError('操作过于频繁，请稍后再试', 'rate-limit', 429, 429, 37))
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('reader@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="send-code"]').text()).toContain('37s')
    expect(wrapper.text()).toContain('操作过于频繁')
  })

  it('shows an authentication error without starting a cooldown for a non-rate-limit failure', async () => {
    sendVisitorEmailCode.mockRejectedValue(new FriendlyApiError('网络连接失败，请检查网络后重试', 'network'))
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('reader@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await flushPromises()

    expect(wrapper.get('[data-test="send-code"]').text()).toContain('发送验证码')
    expect(wrapper.text()).toContain('网络连接失败')
  })

  it('uses reset as a separate verification purpose and restores it after reopening the dialog', async () => {
    sendVisitorEmailCode.mockResolvedValue({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="switch-visitor-auth-mode"]').trigger('click')
    await wrapper.get('[data-test="open-visitor-reset"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('reader@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await flushPromises()
    expect(sendVisitorEmailCode).toHaveBeenLastCalledWith('reader@example.com', 'reset')

    await wrapper.get('[data-test="close-auth-panel"]').trigger('click')
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="switch-visitor-auth-mode"]').trigger('click')
    await wrapper.get('[data-test="open-visitor-reset"]').trigger('click')
    expect(wrapper.get('[data-test="send-code"]').text()).toContain('60s')
  })

  it('keeps comment loading errors visible when an authentication operation succeeds', async () => {
    getPostComments.mockRejectedValueOnce(new Error('评论加载失败'))
    sendVisitorEmailCode.mockResolvedValue({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('reader@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('评论加载失败')
    expect(wrapper.text()).toContain('验证码已发送')
  })

  it('ignores a successful code response after the authentication dialog closes', async () => {
    const pending = deferred<{ sent: boolean; cooldownSeconds: number; expiresIn: number }>()
    sendVisitorEmailCode.mockReturnValue(pending.promise)
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('closed@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await wrapper.get('[data-test="close-auth-panel"]').trigger('click')
    pending.resolve({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    await flushPromises()

    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送验证码')
    expect(wrapper.text()).not.toContain('验证码已发送')
  })

  it('ignores a successful code response after the email changes', async () => {
    const pending = deferred<{ sent: boolean; cooldownSeconds: number; expiresIn: number }>()
    sendVisitorEmailCode.mockReturnValue(pending.promise)
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('first@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('second@example.com')
    pending.resolve({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    await flushPromises()

    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送验证码')
    expect(wrapper.text()).not.toContain('验证码已发送')
  })

  it('ignores a successful register response after switching to reset', async () => {
    const pending = deferred<{ sent: boolean; cooldownSeconds: number; expiresIn: number }>()
    sendVisitorEmailCode.mockReturnValue(pending.promise)
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('reader@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await wrapper.get('[data-test="switch-visitor-auth-mode"]').trigger('click')
    await wrapper.get('[data-test="open-visitor-reset"]').trigger('click')
    pending.resolve({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    await flushPromises()

    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送验证码')
    expect(wrapper.text()).not.toContain('验证码已发送')
  })

  it('ignores a stale rate-limit error after the email changes', async () => {
    const pending = deferred<never>()
    sendVisitorEmailCode.mockReturnValue(pending.promise)
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('first@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('second@example.com')
    pending.reject(new FriendlyApiError('操作过于频繁，请稍后再试', 'rate-limit', 429, 429, 37))
    await flushPromises()

    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送验证码')
    expect(wrapper.text()).not.toContain('操作过于频繁')
  })

  it('keeps a newer code request loading when an older request settles', async () => {
    const first = deferred<{ sent: boolean; cooldownSeconds: number; expiresIn: number }>()
    const second = deferred<{ sent: boolean; cooldownSeconds: number; expiresIn: number }>()
    sendVisitorEmailCode.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const wrapper = mount(PostComments, { props: { slug: 'first-post' } })
    await flushPromises()
    await wrapper.get('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('first@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    await wrapper.get('[data-test="visitor-email"]').setValue('second@example.com')
    await wrapper.get('[data-test="send-code"]').trigger('click')
    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送中...')

    first.resolve({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    await flushPromises()
    expect(wrapper.get('[data-test="send-code"]').text()).toBe('发送中...')

    second.resolve({ sent: true, cooldownSeconds: 60, expiresIn: 300 })
    await flushPromises()
    expect(wrapper.get('[data-test="send-code"]').text()).toBe('60s 后重发')
  })
})
