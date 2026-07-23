# Phase 3 Frontend: Admin GeoIP Lookup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在管理端访问安全页提供不留历史记录的 IPv4/IPv6 归属地查询，并支持从 Top IP 与封禁记录一键发起查询。

**Architecture:** admin API 层定义与后端一致的只读查询合同；独立 IPLookupPanel 负责输入、请求、状态和结果展示；AdminSecurityView 只负责把现有 IP 行传给面板。查询结果仅保存在组件内存，刷新和离开页面后自动清空。

**Tech Stack:** Vue 3 Composition API、TypeScript、Axios、Element Plus、Vitest、Vue Test Utils、pnpm。

---

**前置条件：** backend/docs/superpowers/plans/2026-07-23-phase-3-geoip-backend.md 已完成并推送，`POST /api/admin/ip-lookup` 可用。

### Task 1: 定义管理员 IP 查询 API 合同

**Files:**
- Modify: src/api/admin.ts
- Modify: src/api/admin.test.ts

- [ ] **Step 1: 写请求和解包红灯测试**

~~~ts
it('posts a single IP and unwraps the DB-IP lookup result', async () => {
  adapter.mockResolvedValue(ok({
    ip: '8.8.8.8',
    family: 'IPv4',
    countryCode: 'US',
    country: 'United States',
    region: 'California',
    city: 'Mountain View',
    latitude: 37.386,
    longitude: -122.0838,
    asn: 15169,
    organization: 'Google LLC',
    source: 'DB-IP Lite City + ASN',
    databaseUpdatedAt: '2026-07-01T00:00:00Z',
    found: true
  }))

  const result = await lookupAdminIP('8.8.8.8', client)

  expect(adapter).toHaveBeenCalledWith(expect.objectContaining({
    method: 'post',
    url: '/admin/ip-lookup',
    data: JSON.stringify({ ip: '8.8.8.8' })
  }))
  expect(result.asn).toBe(15169)
})
~~~

再覆盖 IPv6、`found: false`、`databaseUpdatedAt: null`，确保前端不自行猜测地区或数据更新时间。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/api/admin.test.ts`

Expected: FAIL，`AdminIPLookupResult` 与 `lookupAdminIP` 尚不存在。

- [ ] **Step 3: 实现精确类型和请求函数**

~~~ts
export interface AdminIPLookupResult {
  ip: string
  family: 'IPv4' | 'IPv6'
  countryCode: string
  country: string
  region: string
  city: string
  latitude: number
  longitude: number
  asn: number
  organization: string
  source: string
  databaseUpdatedAt: string | null
  found: boolean
}

export async function lookupAdminIP(
  ip: string,
  client: AxiosInstance = adminApiClient
): Promise<AdminIPLookupResult> {
  return unwrap(
    (await client.post<ApiEnvelope<AdminIPLookupResult>>('/admin/ip-lookup', { ip })).data
  )
}
~~~

请求体只能包含修剪后的单个 `ip` 字段，不增加浏览器端第三方定位请求，也不把查询写入 localStorage、sessionStorage 或任何统计接口。

- [ ] **Step 4: 运行绿灯测试**

Run: `pnpm exec vitest run src/api/admin.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交并双推送**

~~~powershell
git status --short
git add src/api/admin.ts src/api/admin.test.ts
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): add geoip lookup api"
git push origin master
git push gitee master
~~~

### Task 2: 创建可独立测试的 IP 查询面板

**Files:**
- Create: src/components/admin/IPLookupPanel.vue
- Create: src/components/admin/IPLookupPanel.test.ts
- Modify: src/styles/admin.css

- [ ] **Step 1: 写输入、键盘和状态红灯测试**

~~~ts
it('trims an IPv6 address and queries when Enter is pressed', async () => {
  lookupAdminIPMock.mockResolvedValue(ipv6Result)
  const wrapper = mount(IPLookupPanel)

  await wrapper.get('[data-test="ip-lookup-input"]').setValue(' 2001:4860:4860::8888 ')
  await wrapper.get('[data-test="ip-lookup-input"]').trigger('keydown.enter')

  expect(lookupAdminIPMock).toHaveBeenCalledWith('2001:4860:4860::8888')
  expect(wrapper.get('[data-test="ip-lookup-country"]').text()).toContain('United States')
})
~~~

增加以下断言：空输入不请求并显示“请输入 IPv4 或 IPv6 地址”；请求期间按钮禁用；`found: false` 显示“数据库中暂无该公网 IP 的定位记录”；400/特殊地址显示“请输入可公开定位的 IPv4 或 IPv6 地址”；503 显示统一友好错误；第二次查询清除旧错误和旧结果。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/components/admin/IPLookupPanel.test.ts`

Expected: FAIL，组件文件不存在。

- [ ] **Step 3: 实现输入、请求和外部触发接口**

~~~ts
const input = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<AdminIPLookupResult | null>(null)

async function lookup(candidate = input.value) {
  const value = candidate.trim()
  input.value = value
  result.value = null
  error.value = ''

  if (!value) {
    error.value = '请输入 IPv4 或 IPv6 地址'
    return
  }

  loading.value = true
  try {
    result.value = await lookupAdminIP(value)
  } catch (reason) {
    const friendly = reason instanceof FriendlyApiError ? reason : toFriendlyApiError(reason)
    error.value = friendly.kind === 'validation'
      ? '请输入可公开定位的 IPv4 或 IPv6 地址'
      : friendly.message
  } finally {
    loading.value = false
  }
}

defineExpose({ lookup })
~~~

组件模板必须提供：

- `data-test="ip-lookup-input"` 的单行输入框，支持 IPv4、IPv6 和 Enter；
- 明确的“查询归属地”按钮与局部 loading；
- 国家与国家代码、省份/地区、城市；
- 纬度与经度，固定最多 6 位小数，不生成外部地图链接；
- `AS${asn}` 与组织名称；
- 数据源与格式化后的数据库更新时间；
- `found: false`、特殊/私有地址、数据库不可用的独立友好状态；
- 不渲染查询历史列表，不持久化输入或结果。

- [ ] **Step 4: 添加管理端响应式样式**

在 `src/styles/admin.css` 增加 `.admin-ip-lookup`、`.admin-ip-lookup__form`、`.admin-ip-lookup__result`、`.admin-ip-lookup__grid`、`.admin-ip-lookup__empty`，沿用现有 `--admin-*` token。窄屏下输入框和按钮纵向排列，结果网格降为单列；不引入新颜色常量。

- [ ] **Step 5: 运行绿灯测试**

Run: `pnpm exec vitest run src/components/admin/IPLookupPanel.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交并双推送**

~~~powershell
git status --short
git add src/components/admin/IPLookupPanel.vue src/components/admin/IPLookupPanel.test.ts src/styles/admin.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): build ip lookup panel"
git push origin master
git push gitee master
~~~

### Task 3: 接入访问安全页和现有 IP 数据

**Files:**
- Modify: src/views/admin/AdminSecurityView.vue
- Create: src/views/admin/AdminSecurityView.test.ts
- Modify: src/styles/admin.css

- [ ] **Step 1: 写一键查询和既有功能回归红灯测试**

~~~ts
it.each([
  ['top-ip-lookup-8.8.8.8', '8.8.8.8'],
  ['ban-ip-lookup-2001:4860:4860::8888', '2001:4860:4860::8888']
])('starts lookup from %s', async (testId, ip) => {
  const wrapper = mountSecurityView()
  await flushPromises()

  await wrapper.get(`[data-test="${testId}"]`).trigger('click')

  expect(ipLookupPanelLookupMock).toHaveBeenCalledWith(ip)
})
~~~

同时断言：页面只创建一个查询面板；刷新分析数据不会清空面板正在展示的结果；手动封禁仍使用原输入框；解除封禁确认框和请求仍工作；Top IP、封禁记录为空时不渲染虚假查询按钮。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/views/admin/AdminSecurityView.test.ts`

Expected: FAIL，查询面板尚未接入，行级查询按钮不存在。

- [ ] **Step 3: 实现面板接入并从表格行触发查询**

~~~ts
import { ref } from 'vue'
import IPLookupPanel from '../../components/admin/IPLookupPanel.vue'

const lookupPanel = ref<InstanceType<typeof IPLookupPanel> | null>(null)

function inspectIP(value: string) {
  void lookupPanel.value?.lookup(value)
}
~~~

把 `<IPLookupPanel ref="lookupPanel" />` 放在访问指标和封禁操作之间。Top IP 操作列及封禁记录操作列增加“查询归属地”按钮，分别使用稳定的 `data-test`：

~~~vue
<el-button
  link
  type="primary"
  :data-test="`top-ip-lookup-${scope.row.ip}`"
  @click="inspectIP(scope.row.ip)"
>
  查询归属地
</el-button>
~~~

封禁记录保持“解除”操作不变；查询操作不改变封禁输入、不自动封禁、不保存历史。

- [ ] **Step 4: 完善表格和移动端布局**

为操作列设置足够宽度，窄屏允许按钮换行；IP 文本使用等宽字体和 `word-break: break-all`，确保完整 IPv6 不撑破面板。

- [ ] **Step 5: 运行绿灯与相关回归测试**

Run: `pnpm exec vitest run src/views/admin/AdminSecurityView.test.ts src/components/admin/IPLookupPanel.test.ts src/api/admin.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交并双推送**

~~~powershell
git status --short
git add src/views/admin/AdminSecurityView.vue src/views/admin/AdminSecurityView.test.ts src/styles/admin.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): integrate geoip security lookup"
git push origin master
git push gitee master
~~~

## Phase 3 Exit Gate: 完成前端验证

**Files:**
- Test: src/api/admin.test.ts
- Test: src/components/admin/IPLookupPanel.test.ts
- Test: src/views/admin/AdminSecurityView.test.ts

- [ ] **Step 1: 运行 Phase 3 定向测试**

Run: `pnpm exec vitest run src/api/admin.test.ts src/components/admin/IPLookupPanel.test.ts src/views/admin/AdminSecurityView.test.ts`

Expected: PASS，无未处理 Promise、Vue warning 或 console error。

- [ ] **Step 2: 运行前端全量测试**

Run: `pnpm test`

Expected: PASS。

- [ ] **Step 3: 构建生产资源**

Run: `pnpm build`

Expected: PASS，TypeScript 与 Vite 构建无错误；`dist/` 不加入 Git。

- [ ] **Step 4: 人工验收并记录结果**

在管理端访问安全页依次验证：IPv4、IPv6、未命中公网地址、私有地址、非法格式、数据库不可用；从 Top IP 和封禁记录发起查询；刷新页面后确认查询结果没有被保存；确认封禁和解除封禁不受影响。

- [ ] **Step 5: 处理验证结果**

Run: `git status --short; git diff --check`

Expected: 仅出现本任务已知源码/测试改动，不出现 `dist/`、coverage、本地缓存或敏感配置。若发现回归，返回产生该回归的 Task，补写对应红灯测试、实现修正，并使用该 Task 已列出的精确暂存与提交命令重新验证；若无回归，不创建空提交。
