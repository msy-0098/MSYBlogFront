<script setup lang="ts">
import { ChatDotRound, Delete, EditPen, Plus, Promotion } from '@element-plus/icons-vue'
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import type { AdminAIConversationMessage } from '../../api/admin'
import { useAIStore } from '../../stores/ai'

const store = useAIStore()
const draft = ref('')
const renamingId = ref<number | null>(null)
const renameDraft = ref('')
const messageList = ref<HTMLElement | null>(null)
const keepPinnedToBottom = ref(true)
const mobileConversationsOpen = ref(false)

const messages = computed(() => store.current?.messages ?? [])
const canSend = computed(() => Boolean(store.current && draft.value.trim() && !store.streaming))

onMounted(() => {
  void store.loadConversations()
})

onBeforeUnmount(() => {
  store.dispose()
})

watch(
  () => messages.value.map((message) => `${message.id}:${message.content}:${message.status}`).join('|'),
  () => {
    void scrollToLatestMessage()
  }
)

async function createConversation() {
  await store.createConversation()
}

async function send() {
  const content = draft.value.trim()
  if (!content || !store.current || store.streaming) return

  await store.send(content)
  draft.value = ''
}

function onComposerKeydown(event: KeyboardEvent) {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault()
    void send()
  }
}

function startRename(id: number, title: string) {
  renamingId.value = id
  renameDraft.value = title
}

async function saveRename(id: number) {
  const updated = await store.renameConversation(id, renameDraft.value)
  if (updated) renamingId.value = null
}

function onMessageListScroll() {
  const element = messageList.value
  if (!element) return
  keepPinnedToBottom.value = element.scrollHeight - element.scrollTop - element.clientHeight < 80
}

async function scrollToLatestMessage() {
  if (!keepPinnedToBottom.value) return
  await nextTick()
  const element = messageList.value
  if (element) element.scrollTop = element.scrollHeight
}

function retry(message: AdminAIConversationMessage) {
  const index = messages.value.indexOf(message)
  const previousUser = messages.value.slice(0, index).reverse().find((item) => item.role === 'user')
  if (previousUser) void store.send(previousUser.content)
}

function formatTime(value: string | null | undefined) {
  if (!value) return '刚刚'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '刚刚' : date.toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <section class="admin-ai-workspace" data-test="admin-ai-workspace">
    <aside class="ai-conversation-list" aria-label="AI 会话列表">
      <div class="ai-sidebar-heading">
        <div>
          <p class="section-kicker">智能工作区</p>
          <h1>AI 助手</h1>
        </div>
        <el-button type="primary" circle aria-label="新建会话" title="新建会话" data-test="ai-new-conversation" @click="createConversation">
          <el-icon><Plus /></el-icon>
        </el-button>
      </div>

      <div class="ai-conversation-scroll">
        <p v-if="store.loadingList" class="ai-sidebar-status">正在读取会话呀…</p>
        <p v-else-if="!store.conversations.length" class="ai-sidebar-status">还没有会话，创建一个开始吧。</p>
        <article v-for="conversation in store.conversations" :key="conversation.id" class="ai-conversation-item" :class="{ active: store.current?.id === conversation.id }">
          <button class="ai-conversation-select" type="button" @click="store.openConversation(conversation.id)">
            <strong>{{ conversation.title || '新对话' }}</strong>
            <span>{{ conversation.messageCount }} 条消息 · {{ formatTime(conversation.lastMessageAt) }}</span>
          </button>
          <div class="ai-conversation-actions">
            <el-button text circle aria-label="重命名会话" title="重命名会话" @click="startRename(conversation.id, conversation.title)"><el-icon><EditPen /></el-icon></el-button>
            <el-popconfirm title="删除后无法恢复，确定删除此会话吗？" confirm-button-text="删除" cancel-button-text="保留" @confirm="store.deleteConversation(conversation.id)">
              <template #reference><el-button text circle type="danger" aria-label="删除会话" title="删除会话"><el-icon><Delete /></el-icon></el-button></template>
            </el-popconfirm>
          </div>
          <form v-if="renamingId === conversation.id" class="ai-rename-form" @submit.prevent="saveRename(conversation.id)">
            <el-input v-model="renameDraft" aria-label="会话标题" maxlength="80" />
            <el-button native-type="submit" type="primary">保存</el-button>
          </form>
        </article>
      </div>

      <el-popconfirm title="这会删除全部 AI 会话记录，确定继续吗？" confirm-button-text="清空全部" cancel-button-text="取消" @confirm="store.clearConversations()">
        <template #reference><el-button class="ai-clear-button" text type="danger" :disabled="!store.conversations.length">清空全部记录</el-button></template>
      </el-popconfirm>
    </aside>
    <el-drawer v-model="mobileConversationsOpen" class="ai-mobile-drawer" title="AI 会话" direction="ltr" size="min(90vw, 320px)">
      <div class="ai-drawer-actions"><el-button type="primary" @click="createConversation">新建会话</el-button></div>
      <div class="ai-conversation-scroll">
        <button v-for="conversation in store.conversations" :key="conversation.id" class="ai-conversation-select" type="button" @click="store.openConversation(conversation.id); mobileConversationsOpen = false">
          <strong>{{ conversation.title || '新对话' }}</strong><span>{{ conversation.messageCount }} 条消息 · {{ formatTime(conversation.lastMessageAt) }}</span>
        </button>
      </div>
      <el-popconfirm title="这会删除全部 AI 会话记录，确定继续吗？" @confirm="store.clearConversations(); mobileConversationsOpen = false"><template #reference><el-button text type="danger">清空全部记录</el-button></template></el-popconfirm>
    </el-drawer>
    <main class="ai-chat-panel">

      <header class="ai-chat-header">
        <div><p class="section-kicker">会话</p><h2>{{ store.current?.title || '选择或新建一个会话' }}</h2></div>
        <el-button class="ai-mobile-conversation-button" text @click="mobileConversationsOpen = true">会话</el-button>
        <span v-if="store.streaming" class="ai-stream-indicator" role="status">正在生成</span>
      </header>

      <div ref="messageList" class="ai-message-list" data-test="ai-message-list" aria-live="polite" @scroll="onMessageListScroll">
        <div v-if="!store.current" class="ai-empty-state" data-test="ai-empty-state">
          <el-icon><ChatDotRound /></el-icon><h3>从一个清晰的问题开始</h3><p>新建会话后，可以让 AI 帮你整理内容、分析数据或生成灵感呀。</p><el-button type="primary" @click="createConversation">新建 AI 会话</el-button>
        </div>
        <div v-else-if="store.loadingDetail" class="ai-empty-state"><p>正在加载历史消息呀…</p></div>
        <ol v-else class="ai-message-stack">
          <li v-for="message in messages" :key="message.id" class="ai-message" :class="`ai-message-${message.role}`">
            <div class="ai-message-meta"><span>{{ message.role === 'user' ? '你' : 'AI 助手' }}</span><span v-if="message.status === 'streaming'">生成中</span><span v-else-if="message.status === 'aborted'">已停止</span><span v-else-if="message.status === 'failed'">生成失败</span></div>
            <div class="ai-message-bubble">{{ message.content || (message.status === 'streaming' ? '正在思考…' : '暂时没有内容') }}</div>
            <el-button v-if="message.status === 'failed'" text type="primary" @click="retry(message)">重试</el-button>
          </li>
        </ol>
      </div>

      <p v-if="store.error" class="ai-chat-error" role="alert">{{ store.error }}</p>
      <form class="ai-composer" data-test="ai-composer" @submit.prevent="send">
        <el-input v-model="draft" type="textarea" :rows="3" resize="none" aria-label="AI 提问内容" placeholder="输入问题，Enter 发送，Shift + Enter 换行" @keydown="onComposerKeydown" />
        <div class="ai-composer-actions"><span>服务端会保存此会话历史</span><el-button v-if="store.streaming" type="danger" data-test="ai-stop" @click="store.stop">停止生成</el-button><el-button v-else type="primary" native-type="submit" :disabled="!canSend"><el-icon><Promotion /></el-icon>发送</el-button></div>
      </form>
    </main>
  </section>
</template>