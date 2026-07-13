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

const ElDrawerStub = {
  name: 'ElDrawer',
  props: { modelValue: Boolean },
  emits: ['update:modelValue'],
  template: '<aside v-if="modelValue" role="dialog"><slot /></aside>'
}

const ElPopconfirmStub = {
  name: 'ElPopconfirm',
  emits: ['confirm'],
  template: '<span><slot name="reference" /><button class="popconfirm-confirm" type="button" @click="$emit(\'confirm\')">确认</button></span>'
}

function mountWorkspace() {
  return mount(AdminAIWorkspaceView, {
    global: {
      stubs: {
        ElButton: { template: '<button><slot /></button>' },
        ElDrawer: ElDrawerStub,
        ElEmpty: { template: '<div><slot /></div>' },
        ElIcon: { template: '<i><slot /></i>' },
        ElInput: { props: ['modelValue'], emits: ['update:modelValue'], template: '<textarea :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
        ElPopconfirm: ElPopconfirmStub
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

  it('provides accessible mobile rename and delete controls for each conversation', async () => {
    const conversation = { id: 7, title: '移动端会话', messageCount: 2, lastMessageAt: null }
    store.conversations = [conversation]
    store.current = { ...conversation, messages: [] }
    store.renameConversation.mockResolvedValue({ ...conversation, title: '新标题' })
    const wrapper = mountWorkspace()
    const toggle = wrapper.get('[data-test="ai-mobile-conversation-toggle"]')

    expect(toggle.attributes('aria-label')).toBe('打开 AI 会话列表')
    expect(toggle.attributes('aria-expanded')).toBe('false')
    await toggle.trigger('click')

    expect(wrapper.get('[data-test="ai-mobile-drawer"]').attributes('aria-label')).toBe('AI 会话列表')
    expect(wrapper.get('[data-test="ai-mobile-conversation-7"]').attributes('aria-current')).toBe('true')
    await wrapper.get('[data-test="ai-mobile-rename-7"]').trigger('click')
    await wrapper.get('[data-test="ai-mobile-rename-input"]').setValue('新标题')
    await wrapper.get('[data-test="ai-mobile-rename-form"]').trigger('submit')
    expect(store.renameConversation).toHaveBeenCalledWith(7, '新标题')

    await wrapper.get('[data-test="ai-mobile-delete-confirm-7"] .popconfirm-confirm').trigger('click')
    expect(store.deleteConversation).toHaveBeenCalledWith(7)
  })
})