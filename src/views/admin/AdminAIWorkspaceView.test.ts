import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const store = vi.hoisted(() => ({
  conversations: [],
  current: null,
  loadingList: false,
  loadingDetail: false,
  streaming: false,
  error: null,
  loadConversations: vi.fn(),
  createConversation: vi.fn(),
  renameConversation: vi.fn(),
  deleteConversation: vi.fn(),
  clearConversations: vi.fn(),
  openConversation: vi.fn(),
  send: vi.fn(),
  stop: vi.fn(),
  dispose: vi.fn()
})) as any

vi.mock('../../stores/ai', () => ({ useAIStore: vi.fn(() => store) }))

import AdminAIWorkspaceView from './AdminAIWorkspaceView.vue'

function mountWorkspace() {
  return mount(AdminAIWorkspaceView, {
    global: {
      stubs: {
        ElButton: { template: '<button><slot /></button>' },
        ElEmpty: { template: '<div><slot /></div>' },
        ElIcon: { template: '<i><slot /></i>' },
        ElInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
        ElPopconfirm: { template: '<span><slot /></span>' }
      }
    }
  })
}

describe('AdminAIWorkspaceView', () => {
  beforeEach(() => {
    Object.assign(store, {
      conversations: [], current: null, loadingList: false, loadingDetail: false, streaming: false, error: null
    })
    vi.clearAllMocks()
  })

  it('renders conversation controls, the empty state, and composer', () => {
    const wrapper = mountWorkspace()

    expect(wrapper.get('[data-test="ai-new-conversation"]')).toBeTruthy()
    expect(wrapper.get('[data-test="ai-message-list"]')).toBeTruthy()
    expect(wrapper.get('[data-test="ai-composer"]')).toBeTruthy()
    expect(wrapper.get('[data-test="ai-empty-state"]')).toBeTruthy()
  })

  it('sends a drafted message and shows a stop action while streaming', async () => {
    store.current = { id: 1, title: '新对话', messageCount: 0, lastMessageAt: null, messages: [] }
    const wrapper = mountWorkspace()

    await wrapper.get('textarea').setValue('帮我整理待办')
    await wrapper.get('[data-test="ai-composer"]').trigger('submit')
    expect(store.send).toHaveBeenCalledWith('帮我整理待办')

    wrapper.unmount()
    store.streaming = true
    const streamingWrapper = mountWorkspace()
    await streamingWrapper.get('[data-test="ai-stop"]').trigger('click')
    expect(store.stop).toHaveBeenCalledOnce()
  })
})