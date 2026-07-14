import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import {
  clearAdminAIConversations,
  createAdminAIConversation,
  deleteAdminAIConversation,
  getAdminAIConversation,
  listAdminAIConversations,
  renameAdminAIConversation,
  type AdminAIConversationDetail,
  type AdminAIConversationMessage,
  type AdminAIConversationSummary
} from '../api/admin'
import { useAiStream } from '../composables/useAiStream'

export const useAIStore = defineStore('admin-ai', () => {
  const conversations = ref<AdminAIConversationSummary[]>([])
  const current = ref<AdminAIConversationDetail | null>(null)
  const loadingList = ref(false)
  const loadingDetail = ref(false)
  const streaming = ref(false)
  const error = ref<string | null>(null)
  const hasConversations = computed(() => conversations.value.length > 0)

  const streamClient = useAiStream()
  let operation = 0
  let listRevision = 0
  let nextLocalMessageId = -1

  async function loadConversations() {
    const request = ++listRevision
    loadingList.value = true
    try {
      const listed = await listAdminAIConversations()
      if (request !== listRevision) return
      conversations.value = listed
      if (!current.value && listed[0]) {
        loadingList.value = false
        await openConversation(listed[0].id)
      }
    } catch (reason) {
      if (request === listRevision) error.value = errorMessage(reason, '会话列表加载失败')
    } finally {
      if (request === listRevision) loadingList.value = false
    }
  }

  async function openConversation(id: number) {
    invalidateListRequests()
    invalidateActiveStream()
    const request = ++operation
    loadingDetail.value = true
    error.value = null

    try {
      const detail = await getAdminAIConversation(id)
      if (request !== operation) return
      current.value = normalizeDetail(detail)
    } catch (reason) {
      if (request === operation) error.value = errorMessage(reason, '会话加载失败')
    } finally {
      if (request === operation) loadingDetail.value = false
    }
  }

  async function createConversation() {
    invalidateListRequests()
    error.value = null
    try {
      const created = await createAdminAIConversation()
      conversations.value = [created, ...conversations.value.filter((item) => item.id !== created.id)]
      await openConversation(created.id)
      return created
    } catch (reason) {
      error.value = errorMessage(reason, '新建会话失败')
      return null
    }
  }

  async function renameConversation(id: number, title: string) {
    const nextTitle = title.trim()
    if (!nextTitle) return null

    invalidateListRequests()
    error.value = null
    try {
      const updated = await renameAdminAIConversation(id, nextTitle)
      replaceConversation(updated)
      if (current.value?.id === id) current.value.title = updated.title
      return updated
    } catch (reason) {
      error.value = errorMessage(reason, '重命名会话失败')
      return null
    }
  }

  async function deleteConversation(id: number) {
    invalidateListRequests()
    const wasCurrent = current.value?.id === id
    if (wasCurrent) invalidateActiveStream()

    error.value = null
    try {
      await deleteAdminAIConversation(id)
      conversations.value = conversations.value.filter((item) => item.id !== id)
      if (wasCurrent) {
        current.value = null
        const next = conversations.value[0]
        if (next) void openConversation(next.id)
      }
    } catch (reason) {
      error.value = errorMessage(reason, '删除会话失败')
    }
  }

  async function clearConversations() {
    invalidateListRequests()
    invalidateActiveStream()
    error.value = null
    try {
      await clearAdminAIConversations()
      conversations.value = []
      current.value = null
    } catch (reason) {
      error.value = errorMessage(reason, '清空会话失败')
    }
  }

  async function send(rawContent: string) {
    const content = rawContent.trim()
    const conversation = current.value
    if (!content || !conversation || streaming.value) return

    const request = ++operation
    const conversationId = conversation.id
    const userMessage: AdminAIConversationMessage = {
      id: nextLocalMessageId--,
      role: 'user',
      content,
      status: 'completed'
    }
    const assistantMessage: AdminAIConversationMessage = {
      id: nextLocalMessageId--,
      role: 'assistant',
      content: '',
      status: 'streaming'
    }

    conversation.messages.push(userMessage, assistantMessage)
    conversation.messageCount += 1
    streaming.value = true
    error.value = null

    const isCurrentRun = () => operation === request && current.value?.id === conversationId && current.value.messages.includes(assistantMessage)
    const complete = () => {
      if (isCurrentRun()) assistantMessage.status = 'completed'
    }

    const result = await streamClient.stream(conversationId, content, {
      onMeta(data) {
        if (!isCurrentRun()) return
        if (typeof data.messageId === 'number') assistantMessage.id = data.messageId
      },
      onDelta(data) {
        if (!isCurrentRun() || typeof data.content !== 'string') return
        assistantMessage.content += data.content
      },
      onDone() {
        complete()
      },
      onAbort() {
        if (isCurrentRun()) assistantMessage.status = 'aborted'
      },
      onError(reason) {
        if (!isCurrentRun()) return
        assistantMessage.status = 'failed'
        error.value = reason.message
      }
    })

    if (!isCurrentRun()) return
    if (result.status === 'completed') complete()
    if (result.status === 'aborted') assistantMessage.status = 'aborted'
    if (result.status === 'failed') assistantMessage.status = 'failed'
    streaming.value = false
    void refreshSummary(conversationId)
  }

  function stop() {
    invalidateActiveStream()
  }

  function dispose() {
    invalidateActiveStream()
  }

  function invalidateActiveStream() {
    operation += 1
    if (streaming.value && current.value) {
      const active = current.value.messages.find((message) => message.role === 'assistant' && message.status === 'streaming')
      if (active) active.status = 'aborted'
    }
    streaming.value = false
    streamClient.abort()
  }

  function invalidateListRequests() {
    listRevision += 1
    loadingList.value = false
  }

  async function refreshSummary(id: number) {
    const request = ++listRevision
    try {
      const latest = await listAdminAIConversations()
      if (request !== listRevision) return
      const activeId = current.value?.id
      conversations.value = latest
      if (activeId && activeId !== id && !latest.some((item) => item.id === activeId)) current.value = null
    } catch {
      // The completed message remains readable even when the secondary summary refresh fails.
    }
  }

  function replaceConversation(updated: AdminAIConversationSummary) {
    const index = conversations.value.findIndex((item) => item.id === updated.id)
    if (index === -1) conversations.value = [updated, ...conversations.value]
    else conversations.value.splice(index, 1, updated)
  }

  return {
    conversations,
    current,
    loadingList,
    loadingDetail,
    streaming,
    error,
    hasConversations,
    loadConversations,
    openConversation,
    createConversation,
    renameConversation,
    deleteConversation,
    clearConversations,
    send,
    stop,
    dispose
  }
})

function normalizeDetail(detail: AdminAIConversationDetail): AdminAIConversationDetail {
  return {
    ...detail,
    messages: detail.messages.map((message) => ({
      ...message,
      status: message.status ?? 'completed'
    }))
  }
}

function errorMessage(reason: unknown, fallback: string): string {
  return reason instanceof Error && reason.message ? reason.message : fallback
}