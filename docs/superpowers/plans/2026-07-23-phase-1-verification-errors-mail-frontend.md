# Phase 1 Frontend: Verification Countdown and Friendly Errors Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让验证码倒计时按邮箱与用途跨弹窗/刷新恢复，并让公共端、管理端和 AI SSE 全部展示安全友好的中文错误。

**Architecture:** 新建单一 apiError 工具统一解析 Axios、业务 envelope 与 fetch Response；公共和管理 Axios 仅负责调用它，管理端 401 额外保留登出事件。验证码倒计时抽成 composable，使用 sessionStorage 保存绝对过期时间。

**Tech Stack:** Vue 3 Composition API、TypeScript、Axios、Pinia、Vitest、Vue Test Utils、Element Plus、pnpm。

---

**前置条件：** backend/docs/superpowers/plans/2026-07-23-phase-1-verification-errors-mail-backend.md 已完成并推送。

### Task 1: 建立统一 FriendlyApiError

**Files:**
- Create: src/utils/apiError.ts
- Create: src/utils/apiError.test.ts
- Modify: src/api/site.ts
- Modify: src/api/admin.ts
- Modify: src/api/blog.ts
- Test: src/api/site.test.ts
- Test: src/api/admin.test.ts
- Test: src/api/blog.test.ts

- [ ] **Step 1: 写错误映射红灯测试**

~~~ts
it.each([
  [400, '提交内容有误，请检查后重试'],
  [403, '暂无权限执行此操作'],
  [404, '请求的内容不存在或已被移除'],
  [409, '当前数据已发生变化，请刷新后重试'],
  [422, '提交内容未通过校验，请检查后重试'],
  [429, '操作过于频繁，请稍后再试'],
  [500, '服务暂时不可用，请稍后再试']
])('maps %s to friendly text', (status, message) => {
  expect(toFriendlyApiError({ response: { status, data: {} } }).message).toBe(message)
})
~~~

覆盖网络离线、ECONNABORTED、可信业务消息、SQL/SMTP/Provider/Axios 英文消息被隐藏、retryAfter 提取。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/utils/apiError.test.ts src/api/site.test.ts src/api/admin.test.ts src/api/blog.test.ts

Expected: FAIL，apiError 工具不存在。

- [ ] **Step 3: 实现统一类型和安全白名单**

~~~ts
export type FriendlyErrorKind =
  | 'validation' | 'auth' | 'permission' | 'not-found' | 'conflict'
  | 'rate-limit' | 'network' | 'timeout' | 'server' | 'unknown'

export class FriendlyApiError extends Error {
  constructor(
    message: string,
    readonly kind: FriendlyErrorKind,
    readonly status?: number,
    readonly code?: number,
    readonly retryAfter?: number
  ) { super(message) }
}

export function getFriendlyErrorMessage(reason: unknown, fallback = '操作失败，请稍后重试'): string {
  return reason instanceof FriendlyApiError || reason instanceof Error
    ? reason.message || fallback
    : fallback
}
~~~

可信业务消息采用明确白名单或业务 code 映射，例如“验证码错误或已过期”“邮箱或密码错误”；包含 SQL、SMTP、provider、stack、AxiosError、status code 英文的文本不透传。

- [ ] **Step 4: 接入三套 API 解包路径**

createApiClient 与 createAdminApiClient 的失败分支调用 toFriendlyApiError；admin 401 在抛错前调用 handleAdminUnauthorized。blog.ts/admin.ts 的 unwrap 在 code 非 0 时调用 fromApiEnvelope，而不是直接 new Error(message)。

- [ ] **Step 5: 运行测试、提交并双推送**

Run: pnpm exec vitest run src/utils/apiError.test.ts src/api/site.test.ts src/api/admin.test.ts src/api/blog.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/utils/apiError.ts src/utils/apiError.test.ts src/api/site.ts src/api/site.test.ts src/api/admin.ts src/api/admin.test.ts src/api/blog.ts src/api/blog.test.ts
git diff --cached --check
git commit -m "refactor(api): unify friendly error handling"
git push origin master
git push gitee master
~~~

### Task 2: 让 AI SSE fetch 复用友好错误

**Files:**
- Modify: src/composables/useAiStream.ts
- Modify: src/composables/useAiStream.test.ts

- [ ] **Step 1: 写非 2xx 红灯测试**

~~~ts
it('maps an SSE 429 response without exposing a status code', async () => {
  fetchMock.mockResolvedValue(new Response(
    JSON.stringify({ code: 429, message: 'provider quota exceeded', data: { retryAfter: 12 } }),
    { status: 429, headers: { 'Content-Type': 'application/json' } }
  ))
  const result = await client.stream(1, 'hello', handlers)
  expect(result.status).toBe('failed')
  expect(handlers.onError).toHaveBeenCalledWith(expect.objectContaining({
    message: '操作过于频繁，请稍后再试', retryAfter: 12
  }))
})
~~~

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/composables/useAiStream.test.ts

Expected: FAIL，当前仍返回“AI 请求失败（429）”。

- [ ] **Step 3: 实现 Response 解析与友好映射**

~~~ts
async function errorFromResponse(response: Response): Promise<FriendlyApiError> {
  const payload = await response.clone().json().catch(() => null)
  return fromFetchResponse(response.status, payload)
}
~~~

AbortError 保持 status=aborted，不显示失败；其余 fetch 网络错误映射为 network。

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/composables/useAiStream.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/composables/useAiStream.ts src/composables/useAiStream.test.ts
git diff --cached --check
git commit -m "fix(ai): map stream failures to friendly errors"
git push origin master
git push gitee master
~~~

### Task 3: 抽离可恢复验证码倒计时

**Files:**
- Create: src/composables/useVerificationCountdown.ts
- Create: src/composables/useVerificationCountdown.test.ts
- Modify: src/api/blog.ts

- [ ] **Step 1: 写 sessionStorage 与 fake timer 红灯测试**

~~~ts
it('restores cooldown by normalized email and purpose', () => {
  vi.setSystemTime(new Date('2026-07-23T12:00:00Z'))
  const countdown = useVerificationCountdown()
  countdown.start(' User@Example.com ', 'register', 60)
  vi.setSystemTime(new Date('2026-07-23T12:00:20Z'))
  expect(useVerificationCountdown().remaining('user@example.com', 'register').value).toBe(40)
  expect(useVerificationCountdown().remaining('user@example.com', 'reset').value).toBe(0)
})
~~~

同时覆盖发送失败不 start、倒计时归零清理、组件卸载清理 interval、retryAfter 覆盖本地值。

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/composables/useVerificationCountdown.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现 composable 与 API 类型**

~~~ts
export type VerificationPurpose = 'register' | 'reset'
export interface EmailCodeResult {
  sent: boolean
  cooldownSeconds: number
  expiresIn: number
}

const keyOf = (email: string, purpose: VerificationPurpose) =>
  'email-code-cooldown:' + purpose + ':' + email.trim().toLowerCase()
~~~

sessionStorage 存 expiresAt 毫秒值；remaining 使用 Math.ceil；start 前清理同实例 timer；dispose 在 onScopeDispose 调用。

- [ ] **Step 4: 测试、提交并双推送**

Run: pnpm exec vitest run src/composables/useVerificationCountdown.test.ts src/api/blog.test.ts

Expected: PASS。

~~~powershell
git status --short
git add src/composables/useVerificationCountdown.ts src/composables/useVerificationCountdown.test.ts src/api/blog.ts src/api/blog.test.ts
git diff --cached --check
git commit -m "feat(auth): persist verification cooldowns"
git push origin master
git push gitee master
~~~

### Task 4: 接入评论认证弹窗并统一页面错误显示

**Files:**
- Create: src/components/blog/PostComments.test.ts
- Modify: src/components/blog/PostComments.vue
- Modify: src/views/admin/AdminPostsView.vue
- Modify: src/views/admin/AdminCommentsView.vue
- Modify: src/views/admin/AdminUsersView.vue
- Modify: src/views/admin/AdminTaxonomyView.vue
- Modify: src/views/admin/AdminProjectsView.vue
- Modify: src/views/admin/AdminLinksView.vue
- Modify: src/views/admin/AdminSecurityView.vue
- Modify: src/views/admin/AdminPostEditView.vue
- Modify: src/views/admin/AdminSettingsView.vue
- Modify: src/components/admin/PostEditor.vue

- [ ] **Step 1: 写弹窗交互红灯测试**

~~~ts
it('starts the backend cooldown only after a successful send', async () => {
  sendVisitorEmailCodeMock.mockResolvedValue({ sent: true, cooldownSeconds: 60, expiresIn: 600 })
  await wrapper.get('[data-test="send-code"]').trigger('click')
  expect(wrapper.get('[data-test="send-code"]').text()).toContain('60s')
})

it('uses retryAfter when the backend rejects the request', async () => {
  sendVisitorEmailCodeMock.mockRejectedValue(new FriendlyApiError('操作过于频繁，请稍后再试', 'rate-limit', 429, 429, 37))
  await wrapper.get('[data-test="send-code"]').trigger('click')
  expect(wrapper.get('[data-test="send-code"]').text()).toContain('37s')
})
~~~

- [ ] **Step 2: 运行红灯测试**

Run: pnpm exec vitest run src/components/blog/PostComments.test.ts

Expected: FAIL。

- [ ] **Step 3: 实现 composable 接入并分离消息状态**

sendCode 从 authMode 映射 purpose；读取当前 email/purpose 的 remaining；成功才 start(cooldownSeconds)，429 使用 error.retryAfter 同步。新增 authNotice 与 authError，评论加载错误继续使用 commentError。

所有列出的管理页面 catch(reason) 使用 getFriendlyErrorMessage(reason, 页面兜底文案)；移除对 error.response 的重复读取和 alert()。

- [ ] **Step 4: 运行阶段全测和构建**

~~~powershell
pnpm exec vitest run src/utils/apiError.test.ts src/composables/useAiStream.test.ts src/composables/useVerificationCountdown.test.ts src/components/blog/PostComments.test.ts src/api/site.test.ts src/api/blog.test.ts src/api/admin.test.ts
pnpm test
pnpm build
~~~

Expected: PASS。

- [ ] **Step 5: 提交并双推送**

~~~powershell
git status --short
git add src/components/blog/PostComments.vue src/components/blog/PostComments.test.ts src/views/admin src/components/admin/PostEditor.vue
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(ui): finish verification and friendly errors"
git push origin master
git push gitee master
~~~

确认未暂存 node_modules、dist、coverage、.playwright-cli、output、progress.md 或 task_plan.md。
