import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const streamClient = vi.hoisted(() => ({ stream: vi.fn(), abort: vi.fn() }))

vi.mock('../api/admin', () => ({
  clearAdminAIConversations: vi.fn(),
  createAdminAIConversation: vi.fn(),
  deleteAdminAIConversation: vi.fn(),
  getAdminAIConversation: vi.fn(),
  listAdminAIConversations: vi.fn(),
  renameAdminAIConversation: vi.fn()
}))
vi.mock('../composables/useAiStream', () => ({
  useAiStream: vi.fn(() => streamClient)
}))

import {
  clearAdminAIConversations,
  createAdminAIConversation,
  deleteAdminAIConversation,
  getAdminAIConversation,
  listAdminAIConversations,
  renameAdminAIConversation
} from '../api/admin'
import { useAIStore } from './ai'

describe('AI conversation store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('appends the user message immediately and completes the assistant stream', async () => {
    const store = useAIStore()
    store.current = conversationDetail()
    streamClient.stream.mockImplementation(async (_id, _content, handlers) => {
      handlers.onMeta({ messageId: 8 })
      handlers.onDelta({ content: '第一段' })
      handlers.onDelta({ content: '第二段' })
      handlers.onDone({ messageId: 8 })
      return { status: 'completed' }
    })

    await store.send('分析访问量')

    expect(store.current?.messages.map((message) => [message.role, message.content, message.status])).toEqual([
      ['user', '分析访问量', 'completed'],
      ['assistant', '第一段第二段', 'completed']
    ])
  })

  it('aborts and ignores stale stream events after the active conversation is deleted', async () => {
    const store = useAIStore()
    store.current = conversationDetail()
    let handlers: any
    streamClient.stream.mockImplementation(async (_id, _content, nextHandlers) => {
      handlers = nextHandlers
      return new Promise(() => undefined)
    })
    vi.mocked(deleteAdminAIConversation).mockResolvedValue({ deleted: true })

    void store.send('不会落到已删除会话')
    await Promise.resolve()
    await store.deleteConversation(1)
    handlers.onDelta({ content: '陈旧内容' })

    expect(streamClient.abort).toHaveBeenCalledOnce()
    expect(store.current).toBeNull()
    expect(store.error).toBeNull()
  })

  it('creates, renames, and clears server-backed conversations', async () => {
    const store = useAIStore()
    const created = { id: 2, title: '新对话', messageCount: 0, lastMessageAt: null }
    vi.mocked(createAdminAIConversation).mockResolvedValue(created)
    vi.mocked(getAdminAIConversation).mockResolvedValue({ ...created, messages: [] })
    vi.mocked(renameAdminAIConversation).mockResolvedValue({ ...created, title: '改名后' })
    vi.mocked(clearAdminAIConversations).mockResolvedValue({ deleted: true })

    await store.createConversation()
    await store.renameConversation(2, '改名后')
    await store.clearConversations()

    expect(store.current).toBeNull()
    expect(store.conversations).toEqual([])
    expect(renameAdminAIConversation).toHaveBeenCalledWith(2, '改名后')
    expect(clearAdminAIConversations).toHaveBeenCalledOnce()
  })
  it('suppresses late stream events after switching conversations', async () => {
    const store = useAIStore()
    store.current = conversationDetail()
    let handlers: any
    streamClient.stream.mockImplementation(async (_id, _content, nextHandlers) => {
      handlers = nextHandlers
      return new Promise(() => undefined)
    })
    vi.mocked(getAdminAIConversation).mockResolvedValue({ id: 2, title: '第二个会话', messageCount: 0, lastMessageAt: null, messages: [] })

    void store.send('切换前的问题')
    await Promise.resolve()
    await store.openConversation(2)
    handlers.onDelta({ content: '过期内容' })

    expect(streamClient.abort).toHaveBeenCalledOnce()
    expect(store.current).toMatchObject({ id: 2, messages: [] })
  })

  it('suppresses late stream events after workspace disposal', async () => {
    const store = useAIStore()
    store.current = conversationDetail()
    let handlers: any
    streamClient.stream.mockImplementation(async (_id, _content, nextHandlers) => {
      handlers = nextHandlers
      return new Promise(() => undefined)
    })

    void store.send('卸载前的问题')
    await Promise.resolve()
    const assistant = store.current?.messages.find((message) => message.role === 'assistant')
    store.dispose()
    handlers.onDelta({ content: '卸载后的内容' })

    expect(streamClient.abort).toHaveBeenCalledOnce()
    expect(assistant).toMatchObject({ content: '', status: 'aborted' })
  })
  it('restores the newest server conversation when the workspace loads', async () => {
    const store = useAIStore()
    const summary = { id: 3, title: '已恢复的会话', messageCount: 1, lastMessageAt: '2026-07-13T12:00:00Z' }
    vi.mocked(listAdminAIConversations).mockResolvedValue([summary])
    vi.mocked(getAdminAIConversation).mockResolvedValue({ ...summary, messages: [] })

    await store.loadConversations()

    expect(store.conversations).toEqual([summary])
    expect(store.current).toMatchObject({ id: 3, title: '已恢复的会话' })
  })
})

function conversationDetail() {
  return {
    id: 1,
    title: '当前会话',
    messageCount: 0,
    lastMessageAt: null,
    messages: []
  }
}