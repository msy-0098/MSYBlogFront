# Phase 2 Frontend: Admin AI Creation and Operations Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完善管理端 AI 健康状态、会话/消息分页、停止与可靠重试、Markdown/代码复制、创作模板、润色差异预览和运营报告。

**Architecture:** admin API 定义稳定合同；Pinia store 管理游标、活动流和重试；工作台拆出消息渲染与模板组件；润色候选不直接覆盖编辑器；Dashboard 展示并管理最近 20 份运营报告。

**Tech Stack:** Vue 3、TypeScript、Pinia、fetch SSE、markdown-it、highlight.js、Element Plus、Vitest、pnpm。

---

**前置条件：** backend/docs/superpowers/plans/2026-07-23-phase-2-admin-ai-backend.md 已完成并推送。

### Task 1: 定义 AI 状态、游标、重试与报告 API

**Files:**
- Modify: src/api/admin.ts
- Modify: src/api/admin.test.ts

- [ ] **Step 1: 写合同红灯测试**

~~~ts
it('passes conversation cursor and unwraps cursor metadata', async () => {
  adapter.mockResolvedValue(ok({ items: [], nextCursor: 'next', hasMore: true }))
  const result = await listAdminAIConversations({ limit: 20, cursor: 'cur' }, client)
  expect(adapter).toHaveBeenCalledWith(expect.objectContaining({ params: { limit: 20, cursor: 'cur' } }))
  expect(result.hasMore).toBe(true)
})
~~~

覆盖 getAdminAIStatus、healthCheckAdminAI、retryAdminAIMessage、stopAdminAIConversation、报告生成/列表/详情/删除/重新生成。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/api/admin.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现类型和函数**

~~~ts
export interface CursorResult<T> { items: T[]; nextCursor?: string; hasMore: boolean }
export interface AdminAIHealth { healthy: boolean; checkedAt: string; durationMS: number; message: string }
export interface AdminAIStatus {
  enabled: boolean; provider: string; model: string; configured: boolean
  baseURLSummary: string; lastHealth?: AdminAIHealth
}
export interface AdminAIReport {
  id: number; rangeDays: 7 | 30 | 90; status: 'pending' | 'completed' | 'failed'
  markdown: string; provider: string; model: string; totalTokens: number
  durationMS: number; createdAt: string; errorMessage?: string
}
~~~

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/api/admin.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/api/admin.ts src/api/admin.test.ts
git diff --cached --check
git commit -m "feat(ai): add admin assistant api contracts"
git push origin master
git push gitee master
~~~

### Task 2: 改造 AI Store 的游标、停止和重试语义

**Files:**
- Modify: src/stores/ai.ts
- Modify: src/stores/ai.test.ts
- Modify: src/composables/useAiStream.ts
- Modify: src/composables/useAiStream.test.ts

- [ ] **Step 1: 写状态红灯测试**

~~~ts
it('does not reuse failed or aborted assistant content when retrying', async () => {
  store.current = conversationWithFailedAssistant()
  await store.retry(failedMessageId)
  expect(retryAdminAIMessageMock).toHaveBeenCalledWith(conversationId, failedMessageId)
  expect(streamMock).not.toHaveBeenCalledWith(expect.stringContaining('partial provider output'))
})
~~~

增加 loadMoreConversations、loadOlderMessages、服务端 stop 调用、陈旧请求隔离和 retryAfter 展示测试。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/stores/ai.test.ts src/composables/useAiStream.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现游标状态**

~~~ts
const conversationCursor = ref<string>()
const hasMoreConversations = ref(false)
const messageCursor = ref<string>()
const hasOlderMessages = ref(false)

async function loadMoreConversations() { /* append unique IDs and update cursor */ }
async function loadOlderMessages() { /* prepend unique sequence messages and preserve scroll anchor */ }
async function retry(messageId: number) { /* call retry API and attach new streaming attempt */ }
async function stop() { streamClient.abort(); await stopAdminAIConversation(current.value!.id) }
~~~

实现时用 Map/Set 按 ID 去重；aborted/failed 不进入后续 completed 上下文显示逻辑，但历史记录仍可见。

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/stores/ai.test.ts src/composables/useAiStream.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/stores/ai.ts src/stores/ai.test.ts src/composables/useAiStream.ts src/composables/useAiStream.test.ts
git diff --cached --check
git commit -m "feat(ai): support cursor history stop and retry"
git push origin master
git push gitee master
~~~

### Task 3: 完善工作台 Markdown、复制与 Prompt 模板

**Files:**
- Create: src/components/admin/AIMessageContent.vue
- Create: src/components/admin/AIMessageContent.test.ts
- Create: src/components/admin/AIPromptTemplates.vue
- Create: src/components/admin/AIPromptTemplates.test.ts
- Modify: src/views/admin/AdminAIWorkspaceView.vue
- Modify: src/views/admin/AdminAIWorkspaceView.test.ts
- Modify: src/styles/admin.css

- [ ] **Step 1: 写渲染与交互红灯测试**

~~~ts
it('renders highlighted code and copies one code block', async () => {
  const writeText = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue()
  const wrapper = mount(AIMessageContent, { props: { content: '~~~go\nfmt.Println("ok")\n~~~' } })
  await wrapper.get('[data-test="copy-code"]').trigger('click')
  expect(writeText).toHaveBeenCalledWith('fmt.Println("ok")')
})
~~~

模板测试断言点击“SEO 检查”只填充输入框、不自动发送。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/components/admin/AIMessageContent.test.ts src/components/admin/AIPromptTemplates.test.ts src/views/admin/AdminAIWorkspaceView.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现组件和工作台接线**

AIMessageContent 复用 markdown-it 和 highlight.js，所有链接增加安全属性，不启用原始 HTML；每条助手消息提供“复制回答”，每个 pre 提供“复制代码”。模板覆盖选题大纲、标题摘要关键词、扩写精简、语气润色、SEO 检查、评论运营总结。

工作台增加“加载更多会话”和顶部“加载更早消息”；输入区显示字符数和上限，超限禁用发送；失败消息展示重试按钮，streaming 展示停止按钮。

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/components/admin src/views/admin/AdminAIWorkspaceView.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/components/admin/AIMessageContent.vue src/components/admin/AIMessageContent.test.ts src/components/admin/AIPromptTemplates.vue src/components/admin/AIPromptTemplates.test.ts src/views/admin/AdminAIWorkspaceView.vue src/views/admin/AdminAIWorkspaceView.test.ts src/styles/admin.css
git diff --cached --check
git commit -m "feat(ai): improve assistant writing workspace"
git push origin master
git push gitee master
~~~

### Task 4: 增加状态健康检查与运营报告

**Files:**
- Modify: src/views/admin/AdminSettingsView.vue
- Modify: src/views/admin/AdminSettingsView.test.ts
- Modify: src/views/admin/AdminDashboardView.vue
- Modify: src/views/admin/AdminDashboardView.test.ts
- Modify: src/styles/admin.css

- [ ] **Step 1: 写健康检查和报告红灯测试**

~~~ts
it('runs an AI health check without exposing a secret', async () => {
  healthCheckMock.mockResolvedValue({ healthy: true, checkedAt: '2026-07-23T12:00:00Z', durationMS: 88, message: '连接正常' })
  await wrapper.get('[data-test="ai-health-check"]').trigger('click')
  expect(wrapper.text()).toContain('88 ms')
  expect(wrapper.text()).not.toContain('apiKey')
})
~~~

Dashboard 测试覆盖 7/30/90 天、生成、查看 Markdown、删除、重新生成、最近 20 份分页列表和失败状态。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/views/admin/AdminSettingsView.test.ts src/views/admin/AdminDashboardView.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现 UI**

设置页展示 enabled/provider/model/configured/baseURLSummary/lastHealth，只提供测试连接，不新增复杂 Provider 管理。Dashboard 增加“AI 运营分析”卡片和报告抽屉；列表显示模型、Token、耗时、状态和时间，报告正文使用安全 Markdown 渲染。

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/views/admin/AdminSettingsView.test.ts src/views/admin/AdminDashboardView.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/views/admin/AdminSettingsView.vue src/views/admin/AdminSettingsView.test.ts src/views/admin/AdminDashboardView.vue src/views/admin/AdminDashboardView.test.ts src/styles/admin.css
git diff --cached --check
git commit -m "feat(ai): expose health and operations reports"
git push origin master
git push gitee master
~~~

### Task 5: 把文章润色改为差异预览、确认和撤销

**Files:**
- Modify: src/components/admin/PostEditor.vue
- Modify: src/components/admin/PostEditor.test.ts
- Modify: src/views/admin/AdminPostEditView.vue

- [ ] **Step 1: 写不直接覆盖的红灯测试**

~~~ts
it('keeps the editor unchanged until preview is applied', async () => {
  beautifyMock.mockResolvedValue({ title: '新标题', summary: '新摘要', content: '新正文', status: 'completed' })
  await wrapper.get('[data-test="beautify"]').trigger('click')
  expect(wrapper.find('input[name="title"]').element.value).toBe('原标题')
  expect(wrapper.get('[data-test="beautify-preview"]').text()).toContain('新标题')
  await wrapper.get('[data-test="apply-beautify"]').trigger('click')
  expect(wrapper.find('input[name="title"]').element.value).toBe('新标题')
})
~~~

增加取消、失败保留原文、应用后撤销一次、重复请求禁用测试。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/components/admin/PostEditor.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现候选快照与差异预览**

~~~ts
interface EditorSnapshot { title: string; summary: string; content: string }
const beautifyCandidate = ref<EditorSnapshot | null>(null)
const undoSnapshot = ref<EditorSnapshot | null>(null)
function applyBeautify() { undoSnapshot.value = snapshot(); assign(beautifyCandidate.value!); beautifyCandidate.value = null }
function undoBeautify() { if (undoSnapshot.value) assign(undoSnapshot.value); undoSnapshot.value = null }
~~~

差异预览至少逐字段显示原文和候选；正文使用只读 diff 样式，不在本期引入大型 diff 依赖。

- [ ] **Step 4: 阶段全测、构建、提交并双推送**

~~~powershell
pnpm exec vitest run src/api/admin.test.ts src/composables/useAiStream.test.ts src/stores/ai.test.ts src/components/admin src/views/admin/AdminAIWorkspaceView.test.ts src/views/admin/AdminSettingsView.test.ts src/views/admin/AdminDashboardView.test.ts
pnpm test
pnpm build
git status --short
git add src/components/admin/PostEditor.vue src/components/admin/PostEditor.test.ts src/views/admin/AdminPostEditView.vue
git diff --cached --check
git commit -m "feat(ai): preview and undo post beautification"
git push origin master
git push gitee master
~~~

Expected: PASS。
