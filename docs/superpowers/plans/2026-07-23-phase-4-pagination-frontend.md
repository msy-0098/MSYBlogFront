# Phase 4 Frontend: Site-wide Pagination Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为评论、归档和六类管理列表补齐稳定分页，同时限制首页项目请求，并保证文章编辑器始终取得完整分类与标签选项。

**Architecture:** 新建共享分页类型与纯函数，公共端的评论和归档使用后端游标增量加载，管理端统一复用 OrbitPagination 做页码分页。API 层保留后端 `list/items` 兼容合同，编辑器改走独立 options 接口，删除当前页最后一项时由共享函数回退到有效页。

**Tech Stack:** Vue 3 Composition API、TypeScript、Axios、Element Plus、Vitest、Vue Test Utils、OrbitPagination、pnpm。

---

**前置条件：** backend/docs/superpowers/plans/2026-07-23-phase-4-pagination-backend.md 已完成并推送；Phase 1 至 Phase 3 已通过各自验收。AI 会话和消息游标分页已在 Phase 2 完成，本阶段不得重复改造 AI 分页。

### Task 1: 建立共享分页类型并升级 API 合同

**Files:**
- Create: src/types/pagination.ts
- Create: src/types/pagination.test.ts
- Modify: src/api/blog.ts
- Modify: src/api/blog.test.ts
- Modify: src/api/admin.ts
- Modify: src/api/admin.test.ts

- [ ] **Step 1: 写纯函数和请求参数红灯测试**

~~~ts
it('moves to the previous page when deleting the only row', () => {
  expect(pageAfterDelete(3, 1)).toBe(2)
  expect(pageAfterDelete(1, 1)).toBe(1)
  expect(pageAfterDelete(3, 2)).toBe(3)
})

it('requests the next comment cursor', async () => {
  adapter.mockResolvedValue(ok({ items: [], nextCursor: 'next', hasMore: true }))
  await getPostComments('hello', { limit: 20, cursor: 'cur' }, client)
  expect(adapter).toHaveBeenCalledWith(expect.objectContaining({
    url: '/posts/hello/comments',
    params: { limit: 20, cursor: 'cur' }
  }))
})

it('requests a paged admin category list', async () => {
  adapter.mockResolvedValue(ok({ list: [], items: [], page: 2, pageSize: 20, total: 25 }))
  await getAdminCategories({ page: 2, pageSize: 20 }, client)
  expect(adapter).toHaveBeenCalledWith(expect.objectContaining({
    url: '/admin/categories',
    params: { page: 2, pageSize: 20 }
  }))
})
~~~

API 测试还要覆盖：归档游标、首页项目 `limit=3`、管理用户/标签/项目/友链/IPBan 页码参数、分类 options、标签 options，以及 `items` 与 `list` 同时解包。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/types/pagination.test.ts src/api/blog.test.ts src/api/admin.test.ts`

Expected: FAIL，共享类型与新函数签名尚不存在。

- [ ] **Step 3: 实现共享类型和页码纯函数**

~~~ts
export interface PageQuery {
  page?: number
  pageSize?: number
}

export interface PageResult<T> {
  list: T[]
  items?: T[]
  page: number
  pageSize: number
  total: number
}

export interface CursorQuery {
  cursor?: string
  limit?: number
}

export interface CursorResult<T> {
  items: T[]
  nextCursor?: string
  hasMore: boolean
}

export function pageItems<T>(result: PageResult<T>): T[] {
  return result.items ?? result.list
}

export function totalPages(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / Math.max(1, pageSize)))
}

export function pageAfterDelete(currentPage: number, currentItemCount: number): number {
  return currentPage > 1 && currentItemCount === 1 ? currentPage - 1 : currentPage
}
~~~

`src/api/blog.ts` 和 `src/api/admin.ts` 删除各自重复的 PageResult/CursorResult 定义，统一从 `src/types/pagination.ts` 导入。Phase 2 已有 AI 游标接口只迁移类型来源，不改变路由、参数、store 或流式行为；旧分页响应没有 `items` 时统一通过 `pageItems(result)` 回退到 `list`。

- [ ] **Step 4: 升级公共端 API 签名**

~~~ts
export async function getArchive(
  params: CursorQuery = {},
  client: AxiosInstance = apiClient
): Promise<CursorResult<ArchiveYear>>

export async function getPostComments(
  slug: string,
  params: CursorQuery = {},
  client: AxiosInstance = apiClient
): Promise<CursorResult<PostComment>>

export async function getProjects(
  params: { limit?: number } = {},
  client: AxiosInstance = apiClient
): Promise<Project[]>
~~~

归档和评论直接返回 `items/nextCursor/hasMore`；项目继续向调用者返回数组，但必须把 `limit` 传给 `/projects`。

- [ ] **Step 5: 升级管理端 API 签名与 options**

~~~ts
export async function getAdminCategories(params: PageQuery = {}, client = adminApiClient): Promise<PageResult<AdminTaxonomy>>
export async function getAdminTags(params: PageQuery = {}, client = adminApiClient): Promise<PageResult<AdminTaxonomy>>
export async function getAdminProjects(params: PageQuery = {}, client = adminApiClient): Promise<PageResult<AdminProject>>
export async function getAdminLinks(params: PageQuery = {}, client = adminApiClient): Promise<PageResult<AdminFriendLink>>
export async function getAdminBans(params: PageQuery = {}, client = adminApiClient): Promise<PageResult<AdminIPBan>>
export async function getAdminCategoryOptions(client = adminApiClient): Promise<AdminTaxonomy[]>
export async function getAdminTagOptions(client = adminApiClient): Promise<AdminTaxonomy[]>
~~~

options 分别请求 `/admin/categories/options` 与 `/admin/tags/options`，只供编辑器选择器使用；普通管理列表不得绕过分页改用 options。

- [ ] **Step 6: 运行绿灯测试**

Run: `pnpm exec vitest run src/types/pagination.test.ts src/api/blog.test.ts src/api/admin.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交并双推送**

~~~powershell
git status --short
git add src/types/pagination.ts src/types/pagination.test.ts src/api/blog.ts src/api/blog.test.ts src/api/admin.ts src/api/admin.test.ts
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(api): unify pagination contracts"
git push origin master
git push gitee master
~~~

### Task 2: 为评论和归档实现游标加载更多

**Files:**
- Create: src/utils/archive.ts
- Create: src/utils/archive.test.ts
- Create: src/components/blog/PostComments.test.ts
- Modify: src/components/blog/PostComments.vue
- Create: src/views/ArchiveView.test.ts
- Modify: src/views/ArchiveView.vue
- Modify: src/styles/public-content.css

- [ ] **Step 1: 写跨页合并和重复请求红灯测试**

~~~ts
it('merges the same archive month without duplicating posts', () => {
  expect(mergeArchiveYears(
    [{ year: 2026, months: [{ month: 7, posts: [post('a')] }] }],
    [{ year: 2026, months: [{ month: 7, posts: [post('b'), post('a')] }] }]
  )[0].months[0].posts.map((item) => item.slug)).toEqual(['a', 'b'])
})

it('appends the next comment page and disables duplicate loads', async () => {
  getPostCommentsMock
    .mockResolvedValueOnce({ items: [comment(2)], nextCursor: 'next', hasMore: true })
    .mockResolvedValueOnce({ items: [comment(1)], hasMore: false })

  const wrapper = mountPostComments()
  await flushPromises()
  await wrapper.get('[data-test="comments-load-more"]').trigger('click')
  await flushPromises()

  expect(getPostCommentsMock).toHaveBeenNthCalledWith(2, 'hello', { limit: 20, cursor: 'next' })
  expect(wrapper.findAll('[data-test="comment-item"]')).toHaveLength(2)
})
~~~

归档页面测试同样覆盖首屏 50 条、下一游标、加载期间按钮禁用、无更多数据后按钮消失、第二页失败时保留第一页内容。评论测试还覆盖 slug 变化后清空旧 cursor，以及提交评论成功后从第一页重新加载。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/utils/archive.test.ts src/components/blog/PostComments.test.ts src/views/ArchiveView.test.ts`

Expected: FAIL，游标状态和合并函数尚不存在。

- [ ] **Step 3: 实现无重复的归档合并函数**

~~~ts
export function mergeArchiveYears(current: ArchiveYear[], incoming: ArchiveYear[]): ArchiveYear[] {
  const years = current.map((year) => ({
    ...year,
    months: year.months.map((month) => ({ ...month, posts: [...month.posts] }))
  }))

  for (const nextYear of incoming) {
    let targetYear = years.find((year) => year.year === nextYear.year)
    if (!targetYear) {
      targetYear = { year: nextYear.year, months: [] }
      years.push(targetYear)
    }
    for (const nextMonth of nextYear.months) {
      let targetMonth = targetYear.months.find((month) => month.month === nextMonth.month)
      if (!targetMonth) {
        targetMonth = { month: nextMonth.month, posts: [] }
        targetYear.months.push(targetMonth)
      }
      const seen = new Set(targetMonth.posts.map((post) => post.slug))
      targetMonth.posts.push(...nextMonth.posts.filter((post) => !seen.has(post.slug)))
    }
  }

  years.sort((a, b) => b.year - a.year)
  years.forEach((year) => year.months.sort((a, b) => b.month - a.month))
  return years
}
~~~

- [ ] **Step 4: 改造评论加载状态**

~~~ts
const nextCommentCursor = ref<string>()
const hasMoreComments = ref(false)
const commentsLoadingMore = ref(false)

async function loadComments(reset = false) {
  if (reset) {
    comments.value = []
    nextCommentCursor.value = undefined
    hasMoreComments.value = false
  }
  const result = await getPostComments(props.slug, {
    limit: 20,
    cursor: reset ? undefined : nextCommentCursor.value
  })
  comments.value = reset ? result.items : [...comments.value, ...result.items]
  nextCommentCursor.value = result.nextCursor
  hasMoreComments.value = result.hasMore
}
~~~

首次加载与 slug 变化调用 `loadComments(true)`；“加载更多评论”调用 `loadComments(false)` 并使用独立 loading，防止按钮连点；新评论成功后调用 `loadComments(true)`。

- [ ] **Step 5: 改造归档页面和公共样式**

归档首屏请求 `{ limit: 50 }`，后续请求携带 `nextCursor`，使用 `mergeArchiveYears` 合并。添加 `data-test="archive-load-more"` 按钮和独立错误提示；按钮文案在请求期间显示“正在加载...”，无更多时不渲染。样式沿用公共按钮 token，移动端保持满宽可点击。

- [ ] **Step 6: 运行绿灯测试**

Run: `pnpm exec vitest run src/utils/archive.test.ts src/components/blog/PostComments.test.ts src/views/ArchiveView.test.ts src/views/PostDetailView.test.ts`

Expected: PASS。

- [ ] **Step 7: 提交并双推送**

~~~powershell
git status --short
git add src/utils/archive.ts src/utils/archive.test.ts src/components/blog/PostComments.vue src/components/blog/PostComments.test.ts src/views/ArchiveView.vue src/views/ArchiveView.test.ts src/styles/public-content.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(blog): add cursor loading for comments and archive"
git push origin master
git push gitee master
~~~

### Task 3: 限制首页项目并保护编辑器完整选项

**Files:**
- Modify: src/views/HomeView.vue
- Modify: src/views/HomeView.test.ts
- Modify: src/components/admin/PostEditor.vue
- Modify: src/components/admin/PostEditor.test.ts

- [ ] **Step 1: 写首页 limit 与编辑器 options 红灯测试**

~~~ts
it('requests only three featured projects for the home page', async () => {
  mountHomeView()
  await flushPromises()
  expect(getProjectsMock).toHaveBeenCalledWith({ limit: 3 })
})

it('loads complete taxonomy options instead of paged admin lists', async () => {
  mountPostEditor()
  await flushPromises()
  expect(getAdminCategoryOptionsMock).toHaveBeenCalledOnce()
  expect(getAdminTagOptionsMock).toHaveBeenCalledOnce()
  expect(getAdminCategoriesMock).not.toHaveBeenCalled()
  expect(getAdminTagsMock).not.toHaveBeenCalled()
})
~~~

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/views/HomeView.test.ts src/components/admin/PostEditor.test.ts`

Expected: FAIL，首页仍无参数获取全部项目，编辑器仍调用管理列表接口。

- [ ] **Step 3: 实现最小调用替换**

在 `HomeView.vue` 的并行请求中使用 `getProjects({ limit: 3 })`。在 `PostEditor.vue` 中导入并调用 `getAdminCategoryOptions()`、`getAdminTagOptions()`；保留表单值、编辑文章回填和选择器行为不变。

- [ ] **Step 4: 运行绿灯测试**

Run: `pnpm exec vitest run src/views/HomeView.test.ts src/components/admin/PostEditor.test.ts`

Expected: PASS；`pnpm build` 在 Phase 4 Exit Gate 覆盖 AdminPostEditView 的 TypeScript 集成。

- [ ] **Step 5: 提交并双推送**

~~~powershell
git status --short
git add src/views/HomeView.vue src/views/HomeView.test.ts src/components/admin/PostEditor.vue src/components/admin/PostEditor.test.ts
git diff --cached --name-status
git diff --cached --check
git commit -m "perf(frontend): bound home data and keep editor options"
git push origin master
git push gitee master
~~~

### Task 4: 为用户、分类和标签管理增加页码分页

**Files:**
- Create: src/views/admin/AdminUsersView.test.ts
- Modify: src/views/admin/AdminUsersView.vue
- Create: src/views/admin/AdminTaxonomyView.test.ts
- Modify: src/views/admin/AdminTaxonomyView.vue
- Modify: src/styles/admin.css

- [ ] **Step 1: 写翻页和删除回退红灯测试**

~~~ts
it('loads page two of users through OrbitPagination', async () => {
  const wrapper = mountAdminUsersView()
  await flushPromises()
  wrapper.findComponent(OrbitPagination).vm.$emit('change', 2)
  await flushPromises()
  expect(getAdminUsersMock).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 })
})

it('returns to page one after deleting the only category on page two', async () => {
  getAdminCategoriesMock
    .mockResolvedValueOnce(pageResult([taxonomy(21)], 2, 20, 21))
    .mockResolvedValueOnce(pageResult(taxonomies(20), 1, 20, 20))
  const wrapper = mountTaxonomyView('categories')
  await flushPromises()
  await wrapper.get('[data-test="taxonomy-delete-21"]').trigger('click')
  await flushPromises()
  expect(getAdminCategoriesMock).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 })
})
~~~

标签模式重复相同断言；另测刷新保持当前页、切换 categories/tags 时重置到第一页、总数不足两页时 OrbitPagination 不显示。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/views/admin/AdminUsersView.test.ts src/views/admin/AdminTaxonomyView.test.ts`

Expected: FAIL，页面仍一次加载全部数据。

- [ ] **Step 3: 实现统一页码状态**

~~~ts
const page = ref(1)
const pageSize = 20
const total = ref(0)
const pageCount = computed(() => totalPages(total.value, pageSize))

async function changePage(next: number) {
  page.value = next
  await loadItems()
}
~~~

用户页调用 `getAdminUsers({ page: page.value, pageSize })`；分类/标签页按 mode 调用对应分页 API。模板在表格下加入：

~~~vue
<OrbitPagination
  variant="admin"
  :current-page="page"
  :total-pages="pageCount"
  label="管理列表分页"
  @change="changePage"
/>
~~~

分类或标签删除成功前保存 `items.value.length`，随后用 `pageAfterDelete(page.value, previousCount)` 修正页码再重载。创建项目后留在当前页；分类/标签 mode 改变时页码重置为 1。

- [ ] **Step 4: 添加分页间距样式并运行绿灯测试**

在 `src/styles/admin.css` 增加 `.admin-panel > .orbit-pagination` 的上下间距，不修改 OrbitPagination 组件合同。

Run: `pnpm exec vitest run src/views/admin/AdminUsersView.test.ts src/views/admin/AdminTaxonomyView.test.ts src/components/common/OrbitPagination.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交并双推送**

~~~powershell
git status --short
git add src/views/admin/AdminUsersView.vue src/views/admin/AdminUsersView.test.ts src/views/admin/AdminTaxonomyView.vue src/views/admin/AdminTaxonomyView.test.ts src/styles/admin.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): paginate users and taxonomies"
git push origin master
git push gitee master
~~~

### Task 5: 为项目和友链管理增加页码分页

**Files:**
- Create: src/views/admin/AdminProjectsView.test.ts
- Modify: src/views/admin/AdminProjectsView.vue
- Create: src/views/admin/AdminLinksView.test.ts
- Modify: src/views/admin/AdminLinksView.vue
- Modify: src/styles/admin.css

- [ ] **Step 1: 写页码、保存刷新和删除回退红灯测试**

~~~ts
it.each([
  ['projects', getAdminProjectsMock],
  ['links', getAdminLinksMock]
])('loads page two for %s', async (kind, listMock) => {
  const wrapper = kind === 'projects' ? mountProjectsView() : mountLinksView()
  await flushPromises()
  wrapper.findComponent(OrbitPagination).vm.$emit('change', 2)
  await flushPromises()
  expect(listMock).toHaveBeenLastCalledWith({ page: 2, pageSize: 20 })
})
~~~

分别增加：编辑保存后刷新当前页；新增后回到第一页以看到稳定排序后的新数据；删除当前页唯一一项回退上一页；取消编辑不触发列表请求。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/views/admin/AdminProjectsView.test.ts src/views/admin/AdminLinksView.test.ts`

Expected: FAIL，列表 API 和页面尚未使用分页结果。

- [ ] **Step 3: 实现项目页分页**

项目页维护 `page/pageSize/total/pageCount`，使用 `pageItems(result)` 渲染。新增成功后设置 `page.value = 1` 再加载；编辑成功保持当前页；删除前记录当前行数，通过 `pageAfterDelete` 修正页码。表格下复用 `OrbitPagination variant="admin"`。

- [ ] **Step 4: 实现友链页分页**

友链页使用完全相同的页码语义，但保留现有抽屉/弹窗字段和可见性操作。不得把项目与友链表单抽成新的通用组件；只共享分页类型、纯函数和 OrbitPagination。

- [ ] **Step 5: 运行绿灯测试**

Run: `pnpm exec vitest run src/views/admin/AdminProjectsView.test.ts src/views/admin/AdminLinksView.test.ts src/components/common/OrbitPagination.test.ts`

Expected: PASS。

- [ ] **Step 6: 提交并双推送**

~~~powershell
git status --short
git add src/views/admin/AdminProjectsView.vue src/views/admin/AdminProjectsView.test.ts src/views/admin/AdminLinksView.vue src/views/admin/AdminLinksView.test.ts src/styles/admin.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): paginate projects and links"
git push origin master
git push gitee master
~~~

### Task 6: 为完整 IP 封禁记录增加分页

**Files:**
- Modify: src/views/admin/AdminSecurityView.vue
- Modify: src/views/admin/AdminSecurityView.test.ts
- Modify: src/styles/admin.css

- [ ] **Step 1: 写分析数据与封禁页码解耦红灯测试**

~~~ts
it('loads analytics and the first ban page independently', async () => {
  mountAdminSecurityView()
  await flushPromises()
  expect(getAdminAnalyticsMock).toHaveBeenCalledOnce()
  expect(getAdminBansMock).toHaveBeenCalledWith({ page: 1, pageSize: 20 })
})

it('returns to a valid page after unbanning the last row', async () => {
  getAdminBansMock
    .mockResolvedValueOnce(pageResult([ban(21)], 2, 20, 21))
    .mockResolvedValueOnce(pageResult(bans(20), 1, 20, 20))
  const wrapper = mountAdminSecurityView({ initialBanPage: 2 })
  await flushPromises()
  await wrapper.get('[data-test="unban-21"]').trigger('click')
  await flushPromises()
  expect(getAdminBansMock).toHaveBeenLastCalledWith({ page: 1, pageSize: 20 })
})
~~~

继续保留 Phase 3 的 IPv4/IPv6 查询、Top IP 一键查询和封禁记录一键查询测试。新增测试确保切换封禁页不会重复请求 analytics，页面刷新按钮才同时刷新两部分。

- [ ] **Step 2: 运行红灯测试**

Run: `pnpm exec vitest run src/views/admin/AdminSecurityView.test.ts`

Expected: FAIL，封禁表仍读取 `analytics.recentBans`。

- [ ] **Step 3: 实现 analytics 与 bans 状态拆分**

~~~ts
const bans = ref<AdminIPBan[]>([])
const banPage = ref(1)
const banPageSize = 20
const banTotal = ref(0)
const banPageCount = computed(() => totalPages(banTotal.value, banPageSize))

async function loadBans() {
  const result = await getAdminBans({ page: banPage.value, pageSize: banPageSize })
  bans.value = pageItems(result)
  banTotal.value = result.total
}
~~~

页面首次进入并行调用 `loadAnalytics()` 与 `loadBans()`；封禁分页只调用 `loadBans()`；顶部刷新调用两者。封禁成功后设置 `banPage.value = 1` 并刷新；解除封禁后使用 `pageAfterDelete` 回退有效页。封禁表从 `bans` 渲染，仍保留 Phase 3 查询按钮。

- [ ] **Step 4: 接入 OrbitPagination 并运行绿灯测试**

在封禁表下加入 `OrbitPagination variant="admin"`，label 为“IP 封禁记录分页”。

Run: `pnpm exec vitest run src/views/admin/AdminSecurityView.test.ts src/components/admin/IPLookupPanel.test.ts src/components/common/OrbitPagination.test.ts`

Expected: PASS。

- [ ] **Step 5: 提交并双推送**

~~~powershell
git status --short
git add src/views/admin/AdminSecurityView.vue src/views/admin/AdminSecurityView.test.ts src/styles/admin.css
git diff --cached --name-status
git diff --cached --check
git commit -m "feat(admin): paginate ip ban records"
git push origin master
git push gitee master
~~~

## Phase 4 Exit Gate: 全量验证并完成四阶段统一部署准备

**Files:**
- Test: src/types/pagination.test.ts
- Test: src/api/blog.test.ts
- Test: src/api/admin.test.ts
- Test: src/components/blog/PostComments.test.ts
- Test: src/views/ArchiveView.test.ts
- Test: src/views/HomeView.test.ts
- Test: src/components/admin/PostEditor.test.ts
- Test: src/views/admin/AdminUsersView.test.ts
- Test: src/views/admin/AdminTaxonomyView.test.ts
- Test: src/views/admin/AdminProjectsView.test.ts
- Test: src/views/admin/AdminLinksView.test.ts
- Test: src/views/admin/AdminSecurityView.test.ts

- [ ] **Step 1: 运行分页定向测试**

~~~powershell
pnpm exec vitest run src/types/pagination.test.ts src/api/blog.test.ts src/api/admin.test.ts src/components/blog/PostComments.test.ts src/views/ArchiveView.test.ts src/views/HomeView.test.ts src/components/admin/PostEditor.test.ts src/views/admin/AdminUsersView.test.ts src/views/admin/AdminTaxonomyView.test.ts src/views/admin/AdminProjectsView.test.ts src/views/admin/AdminLinksView.test.ts src/views/admin/AdminSecurityView.test.ts
~~~

Expected: PASS，无未处理 Promise、Vue warning 或 console error。

- [ ] **Step 2: 运行前端全量测试和构建**

~~~powershell
pnpm test
pnpm build
~~~

Expected: PASS；`frontend/dist/` 仅作为本地构建产物，不得暂存或提交。

- [ ] **Step 3: 检查分页交互和边界**

人工验证：

- 评论与归档可以连续加载至 `hasMore=false`，同一秒数据不重复；
- 首页 `/projects` 请求仅携带 `limit=3`；
- 管理用户、分类、标签、项目、友链、IPBan 默认每页 20；
- 创建、编辑、刷新保持计划定义的页码语义；
- 删除或解除当前页最后一项后回到有效页；
- 文章编辑器可看到超过 20 个分类/标签选项；
- AI 会话和消息分页仍通过 Phase 2 合同工作，没有被页码分页改写。

- [ ] **Step 4: 确认无遗漏改动**

Run: `git status --short; git diff --check`

Expected: 不出现 `dist/`、coverage、本地缓存、数据库、上传文件或敏感配置。若发现回归，返回负责该页面或 API 的 Task，补写对应红灯测试并使用该 Task 的精确提交清单重新执行；若无回归，不创建空提交。

- [ ] **Step 5: 与后端完成统一部署门禁**

确认 frontend 与 backend 两个仓库的本地 `master`、`origin/master`、`gitee/master` 分别一致。按后端 Phase 4 部署清单先发布后端与 AutoMigrate，验证健康检查及新分页/IP/AI 接口，再发布前端静态 release 并切换软链接。

验收范围：验证码倒计时与友好错误、CID 品牌邮件、AI 状态/生成/停止/重试/运营报告、DB-IP 查询、评论与归档加载更多、六类管理分页、文章编辑器完整 options。

回滚时先恢复旧前端 release 软链接，再恢复旧后端二进制并重启；新增数据库对象保持向后兼容，不执行紧急破坏性删除。
