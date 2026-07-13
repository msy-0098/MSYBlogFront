# 独立 AI 工作区与非阻塞 Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增 `/admin/ai` 独立 AI 工作区，接入服务端 PostgreSQL 会话和 POST SSE 流式响应，并使 dashboard 非阻塞加载洞察。

**Architecture:** Axios 处理会话 JSON CRUD，`fetch + ReadableStream + AbortController` 处理流式 POST；SSE parser、stream composable、Pinia store、workspace view 分层。浏览器不保存正式历史，刷新后从服务器读取。

**Tech Stack:** Vue 3、TypeScript、Pinia、Axios、Fetch Streams、Element Plus、Vitest、pnpm。

---

## File Map

- Create: `src/types/admin-ai.ts`, `src/api/admin-ai.ts`, `src/api/admin-ai.test.ts`, `src/test/admin-test-helpers.ts`
- Create: `src/utils/sse.ts`, `src/utils/sse.test.ts`
- Create: `src/composables/useAiStream.ts`, `src/composables/useAiStream.test.ts`
- Create: `src/stores/ai.ts`, `src/stores/ai.test.ts`
- Create: `src/views/admin/AdminAIWorkspaceView.vue`, `src/views/admin/AdminAIWorkspaceView.test.ts`, `src/views/admin/AdminDashboardView.test.ts`
- Modify: `src/router/index.ts`, `src/router/admin-routes.test.ts`, `src/components/admin/AdminLayout.vue`
- Modify: `src/views/admin/AdminDashboardView.vue`, `src/api/admin.ts`, `src/styles/admin.css`

### Task 1: 会话类型和 Axios CRUD API

**Files:** `src/types/admin-ai.ts`, `src/api/admin-ai.ts`, `src/api/admin-ai.test.ts`, `src/test/admin-test-helpers.ts`

- [ ] **Step 1: 写失败 API 测试**

```ts
it('lists and creates server-backed conversations', async () => {
  const client = createMockAxiosClient()
  client.get.mockResolvedValue({ data: { code: 0, data: [{ id: 9, title: '新对话', messageCount: 0, lastMessageAt: null }] } })
  client.post.mockResolvedValue({ data: { code: 0, data: { id: 10, title: '新对话', messageCount: 0, lastMessageAt: null } } })
  await expect(listAIConversations(client)).resolves.toHaveLength(1)
  await expect(createAIConversation(client)).resolves.toMatchObject({ id: 10 })
  expect(client.post).toHaveBeenCalledWith('/admin/ai/conversations', {})
})
```

覆盖 detail、rename、delete、clear 和 `generateAdminAIInsights`。

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/api/admin-ai.test.ts
```

Expected: FAIL，因为类型和 API 不存在。

- [ ] **Step 3: 实现类型/API**

```ts
export interface AIMessage { id: number; role: 'user' | 'assistant'; content: string; status: 'streaming'|'completed'|'aborted'|'failed'; sequence: number; createdAt: string }
export interface AIConversationSummary { id: number; title: string; messageCount: number; lastMessageAt: string | null }
export interface AIConversationDetail extends AIConversationSummary { messages: AIMessage[] }
export const listAIConversations = (client = adminApiClient) => unwrap<AIConversationSummary[]>(client.get('/admin/ai/conversations'))
export const createAIConversation = (client = adminApiClient) => unwrap<AIConversationSummary>(client.post('/admin/ai/conversations', {}))
```

沿用 admin API 的 envelope 解包，SSE 不经过 Axios。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/api/admin-ai.test.ts src/api/admin.test.ts
git status --short
git add src/types/admin-ai.ts src/api/admin-ai.ts src/api/admin-ai.test.ts
git commit -m "feat: add admin AI conversation API"
git push origin master
git push gitee master
```

### Task 2: 纯 SSE parser 与 AbortController stream composable

**Files:** `src/utils/sse.ts`, `src/utils/sse.test.ts`, `src/composables/useAiStream.ts`, `src/composables/useAiStream.test.ts`

- [ ] **Step 1: 写失败 parser 测试**

```ts
it('joins split frames and emits delta then done', () => {
  const parser = createSSEParser()
  expect(parser.push('event: delta\ndata: {"content":"你"}')).toEqual([])
  expect(parser.push('好"}\n\nevent: done\ndata: {"messageId":8}\n\n')).toEqual([
    { event: 'delta', data: { content: '你好' } }, { event: 'done', data: { messageId: 8 } }
  ])
})
```

覆盖多事件、UTF-8 分包、坏 JSON、error 和尾部 flush。

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/utils/sse.test.ts
```

Expected: FAIL，因为 parser 不存在。

- [ ] **Step 3: 实现 parser/stream**

```ts
export function createSSEParser() { let buffer = ''; return { push(chunk: string): SSEEvent[] { buffer += chunk; const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() ?? ''; return frames.filter(Boolean).map(parseFrame) }, finish(): SSEEvent[] { const frame = buffer; buffer = ''; return frame.trim() ? [parseFrame(frame)] : [] } } }
```

```ts
const response = await fetch(`/api/admin/ai/conversations/${conversationId}/messages/stream`, {
  method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('admin_token') ?? ''}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ content }), signal: controller.signal,
})
```

使用 `TextDecoder.decode(value, { stream: true })`；AbortError 变为中止状态而非未知错误。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/utils/sse.test.ts src/composables/useAiStream.test.ts
git status --short
git add src/utils/sse.ts src/utils/sse.test.ts src/composables/useAiStream.ts src/composables/useAiStream.test.ts
git commit -m "feat: stream admin AI responses"
git push origin master
git push gitee master
```

### Task 3: Pinia store 管理服务端会话与流式状态

**Files:** `src/stores/ai.ts`, `src/stores/ai.test.ts`

- [ ] **Step 1: 写失败 store 测试**

```ts
it('appends user content immediately and completes assistant stream', async () => {
  setActivePinia(createPinia())
  const store = useAIStore()
  vi.mocked(stream).mockImplementation(async (_id, _content, h) => { h.onMeta({ messageId: 8 }); h.onDelta({ content: '第一段' }); h.onDelta({ content: '第二段' }); h.onDone({ messageId: 8, status: 'completed' }) })
  store.current = { id: 1, title: '新对话', messageCount: 0, lastMessageAt: null, messages: [] }
  await store.send('分析访问量')
  expect(store.current.messages.map(m => m.content)).toEqual(['分析访问量', '第一段第二段'])
})
```

增加 rename、delete 选中下一会话、clear、stop/aborted、failed 测试。

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/stores/ai.test.ts
```

Expected: FAIL，因为 store 不存在。

- [ ] **Step 3: 实现 store**

State：`conversations/current/loadingList/loadingDetail/streaming/error`。`send` 立即 append user 和 streaming placeholder；delta 按 message id 累积；reload 只读服务器历史；`stop()` 调用 composable；不会用 localStorage 存消息。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/stores/ai.test.ts
git status --short
git add src/stores/ai.ts src/stores/ai.test.ts
git commit -m "feat: manage server AI conversations"
git push origin master
git push gitee master
```

### Task 4: 受保护路由、导航与三栏工作区

**Files:** `src/views/admin/AdminAIWorkspaceView.vue`, `src/views/admin/AdminAIWorkspaceView.test.ts`, `src/router/index.ts`, `src/router/admin-routes.test.ts`, `src/components/admin/AdminLayout.vue`, `src/styles/admin.css`

- [ ] **Step 1: 写失败路由/页面测试**

```ts
it('registers protected admin AI route', () => {
  const route = router.getRoutes().find(item => item.name === 'admin-ai')
  expect(route?.path).toBe('/admin/ai')
  expect(route?.meta.requiresAuth).toBe(true)
})
it('renders conversations, composer and stop action', () => {
  const wrapper = mount(AdminAIWorkspaceView, { global: { plugins: [testingPinia] } })
  expect(wrapper.get('[data-test="ai-new-conversation"]').exists()).toBe(true)
  expect(wrapper.get('[data-test="ai-message-list"]').exists()).toBe(true)
  expect(wrapper.get('[data-test="ai-composer"]').exists()).toBe(true)
})
```

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/router/admin-routes.test.ts src/views/admin/AdminAIWorkspaceView.test.ts
```

Expected: FAIL，因为 route/view 不存在。

- [ ] **Step 3: 实现工作区**

```vue
<section class="admin-ai-workspace" data-test="admin-ai-workspace"><aside class="ai-conversation-list"><el-button data-test="ai-new-conversation" @click="store.create">???</el-button><button v-for="conversation in store.conversations" :key="conversation.id" @click="store.open(conversation.id)">{{ conversation.title }}</button></aside><main class="ai-chat-panel"><ol data-test="ai-message-list"><li v-for="message in store.current?.messages" :key="message.id">{{ message.content }}</li></ol><form data-test="ai-composer" @submit.prevent="send"><el-input v-model="draft" type="textarea" /><el-button native-type="submit">??</el-button></form></main></section>
```

新增 `/admin/ai`、导航项“AI 助手”。桌面显示会话栏+聊天区，手机会话栏进 Drawer。Enter 发送、Shift+Enter 换行；streaming 时发送变停止；删除/清空使用 Element Plus 二次确认。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/router/admin-routes.test.ts src/views/admin/AdminAIWorkspaceView.test.ts src/stores/ai.test.ts
git status --short
git add src/views/admin/AdminAIWorkspaceView.vue src/views/admin/AdminAIWorkspaceView.test.ts src/router/index.ts src/router/admin-routes.test.ts src/components/admin/AdminLayout.vue src/styles/admin.css
git commit -m "feat: add admin AI workspace"
git push origin master
git push gitee master
```

### Task 5: 去除 dashboard 整页 loading 和内嵌单轮问答

**Files:** `src/views/admin/AdminDashboardView.vue`, `src/views/admin/AdminDashboardView.test.ts`, `src/api/admin.ts`, `src/styles/admin.css`

- [ ] **Step 1: 写失败非阻塞测试**

```ts
it('renders stats before AI insight resolves', async () => {
  const pendingInsight = createDeferred<AIInsight>()
  vi.mocked(getAdminDashboard).mockResolvedValue(dashboardFixture)
  vi.mocked(generateAdminAIInsights).mockReturnValue(pendingInsight.promise)
  const wrapper = mount(AdminDashboardView, { global: { stubs: elementPlusStubs } })
  await flushPromises()
  expect(wrapper.text()).toContain('文章总数')
  expect(wrapper.find('[data-test="admin-page-loading"]').exists()).toBe(false)
  expect(wrapper.get('[data-test="ai-insight-skeleton"]').exists()).toBe(true)
})
```

增加 insight 失败时仅卡片显示 retry 测试。

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/views/admin/AdminDashboardView.test.ts
```

Expected: FAIL，因为现有 `v-loading` 遮罩整页。

- [ ] **Step 3: 实现分离加载**

`loadDashboard` 只调用普通 dashboard；`loadInsight` 调用新 insight API 并独立控制 skeleton/error/refresh。删除 textarea/alert、`assistantPrompt`、`assistantAnswer`、旧 `chatWithAdminAI` 使用，改为跳转 `/admin/ai` 的快捷入口和最近会话摘要。

- [ ] **Step 4: 最终验证与提交**

```powershell
pnpm test
pnpm build
git status --short
git add src/views/admin/AdminDashboardView.vue src/views/admin/AdminDashboardView.test.ts src/api/admin.ts src/styles/admin.css
git commit -m "fix: load admin AI insights without blocking dashboard"
git push origin master
git push gitee master
```

## Final Verification

- [ ] Browser QA：新建/切换/重命名/删除/清空、首个 delta、停止生成、刷新恢复、dashboard AI 失败与手机 Drawer。
- [ ] `git status --short` 不得出现 node_modules、dist、cache、coverage、logs、.env 或敏感文件。
