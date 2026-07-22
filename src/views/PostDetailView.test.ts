import { flushPromises, mount, RouterLinkStub } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { sendVisitorEmailCode } from '../api/blog'
import PostDetailView from './PostDetailView.vue'

const routeState = {
  params: {
    slug: 'go-gin-sqlite-blog'
  }
}

vi.mock('vue-router', async () => {
  const actual = await vi.importActual<typeof import('vue-router')>('vue-router')
  return {
    ...actual,
    useRoute: () => routeState
  }
})

vi.mock('../api/blog', () => ({
  getPostDetail: vi.fn().mockResolvedValue({
    title: '用 Go 和 SQLite 搭建轻量博客',
    slug: 'go-gin-sqlite-blog',
    summary: '后端闭环',
    content: ['## 第一节', '', '内容', '', '### 子节', '', '更多内容'].join('\n'),
    cover: '',
    viewCount: 8,
    category: { name: 'Go', slug: 'go' },
    tags: [],
    publishedAt: '2026-06-30',
    prev: null,
    next: null
  }),
  getPostComments: vi.fn().mockResolvedValue({
    list: [
      {
        id: 1,
        content: '文章写得很清楚呀',
        status: 'approved',
        author: { email: 'reader@example.com', nickname: '读者' },
        createdAt: '2026-06-30T00:00:00Z'
      }
    ],
    page: 1,
    pageSize: 1,
    total: 1
  }),
  sendVisitorEmailCode: vi.fn().mockResolvedValue({ sent: true }),
  registerVisitor: vi.fn(),
  loginVisitor: vi.fn(),
  createPostComment: vi.fn()
}))

describe('PostDetailView', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('renders a table of contents and mounts the extracted comment section', async () => {
    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          MarkdownRenderer: {
            props: ['content'],
            template: '<article class="markdown-body">{{ content }}</article>'
          }
        }
      }
    })

    await flushPromises()

    expect(wrapper.find('[data-test="post-toc"]').exists()).toBe(true)
    expect(wrapper.findAll('[data-test="post-toc-link"]')).toHaveLength(2)
    expect(wrapper.find('[data-test="comment-section"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('评论')
    expect(wrapper.text()).toContain('文章写得很清楚呀')
    expect(wrapper.text()).toContain('登录/注册后评论')

    await wrapper.find('[data-test="open-comment-auth"]').trigger('click')

    expect(wrapper.text()).toContain('邮箱验证码')
    expect(wrapper.find('[data-test="visitor-email"]').exists()).toBe(true)
  })

  it('sends verification code and starts a 60s countdown timer', async () => {
    vi.useFakeTimers()
    const wrapper = mount(PostDetailView, {
      global: {
        stubs: {
          RouterLink: RouterLinkStub,
          MarkdownRenderer: {
            props: ['content'],
            template: '<article class="markdown-body">{{ content }}</article>'
          }
        }
      }
    })

    await flushPromises()
    await wrapper.find('[data-test="open-comment-auth"]').trigger('click')
    await wrapper.find('[data-test="visitor-email"]').setValue('new-reader@example.com')
    
    const sendBtn = wrapper.find('[data-test="send-visitor-code"]')
    expect(sendBtn.text()).toBe('发送验证码')

    await sendBtn.trigger('click')
    await flushPromises()

    expect(sendVisitorEmailCode).toHaveBeenCalledWith('new-reader@example.com', 'register')
    expect(sendBtn.text()).toBe('60s 后重发')
    expect((sendBtn.element as HTMLButtonElement).disabled).toBe(true)

    vi.advanceTimersByTime(10000)
    await wrapper.vm.$nextTick()
    expect(sendBtn.text()).toBe('50s 后重发')

    vi.useRealTimers()
  })
})
