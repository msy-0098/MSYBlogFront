# 管理端清透专业视觉系统 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将后台样式拆成清透专业的统一设计系统，重构响应式导航、页面层级、表格表单和文章编辑器，同时不改变既有 CRUD 行为。

**Architecture:** 保留 Vue 3 和 Element Plus。新增 `admin.css` 与 admin token，迁出 `global.css` 中的后台规则；`AdminLayout` 负责分组导航和响应式，页面继续使用既有 class 但收敛到统一 panel/toolbar/table/form 规范。

**Tech Stack:** Vue 3、TypeScript、Element Plus、CSS variables、Vitest、Vue Test Utils、pnpm。

---

## File Map

- Create: `src/styles/admin.css`, `src/components/admin/AdminLayout.test.ts`
- Modify: `src/styles/tokens.css`, `src/styles/global.css`, `src/components/admin/AdminLayout.vue`
- Modify: `src/views/admin/{AdminPostsView,AdminTaxonomyView,AdminProjectsView,AdminCommentsView,AdminUsersView,AdminSecurityView,AdminSettingsView}.vue`
- Modify: `src/components/admin/PostEditor.vue`, `src/components/admin/PostEditor.test.ts`
- Create: `src/views/admin/{AdminPostsView,AdminUsersView,AdminSecurityView}.test.ts`

### Task 1: 建立 admin token 与独立样式入口

**Files:** `src/styles/tokens.css`, `src/styles/global.css`, `src/styles/admin.css`, `src/components/admin/AdminLayout.test.ts`

- [ ] **Step 1: 写失败 shell 测试**

```ts
it('renders semantic admin shell hooks and no fake search input', () => {
  const wrapper = mount(AdminLayout, { global: { stubs: { RouterView: true } } })
  expect(wrapper.find('[data-test="admin-shell"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="admin-sidebar"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="admin-topbar"]').exists()).toBe(true)
  expect(wrapper.find('[data-test="admin-fake-search"]').exists()).toBe(false)
})
```

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/components/admin/AdminLayout.test.ts
```

Expected: FAIL，因为 hooks 和 test 尚不存在。

- [ ] **Step 3: 添加 token 和样式拆分**

```css
:root {
  --admin-bg: #eef3f9; --admin-surface: #fff; --admin-surface-muted: #f8fafc;
  --admin-text-primary: #172033; --admin-text-secondary: #64748b;
  --admin-border: #e5eaf1; --admin-primary: #2563eb;
  --admin-radius-sm: 8px; --admin-radius-md: 12px; --admin-radius-lg: 16px;
  --admin-shadow-sm: 0 4px 16px rgba(30, 41, 59, .06);
}
```

`global.css` 顶部 import `admin.css`，把 `.admin-*` 规则迁入后者；将后台硬编码 surface/text/border/primary 替换为 token，游客端规则不得移动。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/components/admin/AdminLayout.test.ts src/components/admin/PostEditor.test.ts
git status --short
git add src/styles/tokens.css src/styles/global.css src/styles/admin.css src/components/admin/AdminLayout.test.ts
git commit -m "style: add admin design system"
git push origin master
git push gitee master
```

### Task 2: 分组导航与桌面/平板/手机壳层

**Files:** `src/components/admin/AdminLayout.vue`, `src/components/admin/AdminLayout.test.ts`, `src/styles/admin.css`

- [ ] **Step 1: 写失败导航测试**

```ts
it('groups navigation and opens the mobile drawer', async () => {
  const wrapper = mount(AdminLayout, { global: { stubs: { RouterView: true } } })
  expect(wrapper.text()).toContain('内容')
  expect(wrapper.text()).toContain('智能工具')
  await wrapper.get('[data-test="admin-mobile-menu"]').trigger('click')
  expect(wrapper.findComponent({ name: 'ElDrawer' }).props('modelValue')).toBe(true)
})
```

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/components/admin/AdminLayout.test.ts
```

Expected: FAIL，因为现有导航无分组/Drawer。

- [ ] **Step 3: 实现单一导航数据源**

定义概览、内容、互动、智能工具、系统五组。桌面完整侧栏；`max-width:1100px` 改图标栏；`max-width:760px` 由 `ElDrawer` 显示相同 navItems。移除无交互 mock search，顶栏只保留页面上下文和账户操作。

```vue
<el-button data-test="admin-mobile-menu" aria-label="打开管理导航" text @click="mobileNavOpen = true"><el-icon><Menu /></el-icon></el-button>
<el-drawer v-model="mobileNavOpen" direction="ltr" size="280px" title="????"><el-menu :default-active="route.path"><el-menu-item v-for="item in mobileNavItems" :key="item.path" :index="item.path" @click="navigate(item.path)">{{ item.label }}</el-menu-item></el-menu></el-drawer>
```

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/components/admin/AdminLayout.test.ts src/router/admin-routes.test.ts
git status --short
git add src/components/admin/AdminLayout.vue src/components/admin/AdminLayout.test.ts src/styles/admin.css
git commit -m "feat: make admin navigation responsive"
git push origin master
git push gitee master
```

### Task 3: 统一管理页、表格和表单

**Files:** 主要后台 views、`src/styles/admin.css`、新增三个页面测试。

- [ ] **Step 1: 写代表性页面失败测试**

```ts
it('wraps posts tables in the shared scroll panel', async () => {
  const wrapper = mount(AdminPostsView, { global: { stubs: { ElTable: true, ElTableColumn: true, ElButton: true } } })
  await flushPromises()
  expect(wrapper.get('[data-test="admin-table-scroll"]').classes()).toContain('admin-table-scroll')
  expect(wrapper.text()).toContain('内容管理')
})
```

Users/Security 测试断言统一 `.admin-page`、`.admin-panel` 和中文 kicker。

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/views/admin/AdminPostsView.test.ts src/views/admin/AdminUsersView.test.ts src/views/admin/AdminSecurityView.test.ts
```

Expected: FAIL，因为 test hooks/文案/测试不存在。

- [ ] **Step 3: 最小结构改造**

每页保留现有 API、字段和事件，只统一：

```vue
<section class="admin-page"><header class="admin-page-heading"><div><p class="section-kicker">??</p><h1>????</h1></div><div class="admin-page-actions"><el-button type="primary" @click="router.push('/admin/posts/create')">????</el-button></div></header><section class="admin-panel admin-table-panel"><div class="admin-table-scroll" data-test="admin-table-scroll"><el-table :data="posts"><el-table-column prop="title" label="??" /></el-table></div></section></section>
```

`admin.css` 增加 table scroll、低优先级列、40px 触点、form grid、empty/error/danger 状态。不得改 CRUD 接口与路由。

- [ ] **Step 4: 验证并提交**

```powershell
pnpm test -- src/views/admin/AdminPostsView.test.ts src/views/admin/AdminUsersView.test.ts src/views/admin/AdminSecurityView.test.ts src/views/admin/AdminSettingsView.test.ts
git status --short
git add src/views/admin src/styles/admin.css
git commit -m "style: unify admin management pages"
git push origin master
git push gitee master
```

### Task 4: 用 Element Plus 统一 PostEditor 且保持 payload

**Files:** `src/components/admin/PostEditor.vue`, `src/components/admin/PostEditor.test.ts`, `src/styles/admin.css`

- [ ] **Step 1: 写失败测试**

```ts
it('uses Element Plus controls and preserves submit payload', async () => {
  const wrapper = mountEditor()
  expect(wrapper.findComponent({ name: 'ElInput' }).exists()).toBe(true)
  await wrapper.get('[data-test="post-title"]').setValue('统一控件')
  await wrapper.get('[data-test="post-submit"]').trigger('click')
  expect(wrapper.emitted('submit')?.[0][0]).toMatchObject({ title: '统一控件' })
})
```

- [ ] **Step 2: 运行失败测试**

```powershell
pnpm test -- src/components/admin/PostEditor.test.ts
```

Expected: FAIL，因为原生控件仍存在。

- [ ] **Step 3: 最小替换**

标题、摘要、slug、分类、标签、状态、封面和按钮改为 `ElInput`、`ElSelect`、`ElUpload`、`ElButton`；Markdown textarea 可以保留但使用统一 admin focus/spacing。提交事件、上传 API、校验与 payload 不得改变。

- [ ] **Step 4: 最终验证与提交**

```powershell
pnpm test
pnpm build
git status --short
git add src/components/admin/PostEditor.vue src/components/admin/PostEditor.test.ts src/styles/admin.css
git commit -m "style: unify admin post editor controls"
git push origin master
git push gitee master
```

## Final Verification

- [ ] Run `pnpm test` and `pnpm build`.
- [ ] Browser QA at 1440px, 1024px, 768px, 390px: navigation, topbar, tables, forms, editor and no horizontal overflow.
- [ ] Confirm `git status --short` has no node_modules, dist, cache, coverage, logs or env files.
