# ICP 备案页脚展示 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在博客公共页脚展示可点击的 ICP 备案号，并修复页脚现有中文乱码。

**Architecture:** 继续使用现有 `AppFooter.vue` 的静态展示结构，不新增状态、接口或样式系统。通过独立的 `AppFooter.test.ts` 锁定备案链接、版权文案、描述文案和现有 RSS/Sitemap 链接，再用最小模板改动实现。

**Tech Stack:** Vue 3、`<script setup lang="ts">`、Vue Test Utils、Vitest、Vite、pnpm。

---

### Task 1: 为页脚备案信息建立失败测试

**Files:**
- Create: `D:\AllTools\Go\Blog\frontend\src\components\layout\AppFooter.test.ts`
- Reference: `D:\AllTools\Go\Blog\frontend\src\components\layout\AppFooter.vue`

- [ ] **Step 1: 创建组件测试，覆盖备案链接和文案要求**

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppFooter from './AppFooter.vue'

describe('AppFooter', () => {
  it('renders the current year, owner copy, and filing link', () => {
    const wrapper = mount(AppFooter)
    const filingLink = wrapper.get('[data-test="icp-filing-link"]')
    const currentYear = new Date().getFullYear()

    expect(wrapper.text()).toContain(`© ${currentYear} 马森雨`)
    expect(wrapper.text()).toContain('写作、项目与持续成长的公开记录')
    expect(filingLink.text()).toBe('豫ICP备2026032113号-1')
    expect(filingLink.attributes('href')).toBe('https://beian.miit.gov.cn/')
    expect(filingLink.attributes('target')).toBe('_blank')
    expect(filingLink.attributes('rel')).toBe('noreferrer')
  })

  it('keeps the public resource links in the footer', () => {
    const wrapper = mount(AppFooter)

    expect(wrapper.get('a[href="/api/rss.xml"]').text()).toBe('RSS')
    expect(wrapper.get('a[href="/api/sitemap.xml"]').text()).toBe('Sitemap')
  })
})
```

- [ ] **Step 2: 运行新增测试，确认当前实现先失败**

Run from `D:\AllTools\Go\Blog\frontend`:

```powershell
pnpm vitest run src/components/layout/AppFooter.test.ts
```

Expected: FAIL because the current component contains mojibake instead of the required Chinese copy and has no `[data-test="icp-filing-link"]` filing link.

---

### Task 2: 实现备案链接和页脚中文文案

**Files:**
- Modify: `D:\AllTools\Go\Blog\frontend\src\components\layout\AppFooter.vue`

- [ ] **Step 1: 替换页脚模板为目标实现**

保留现有脚本中的动态年份，并将组件模板调整为：

```vue
<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <p>© {{ currentYear }} 马森雨</p>
      <p>写作、项目与持续成长的公开记录</p>
      <p class="footer-links">
        <a href="/api/rss.xml">RSS</a>
        <span aria-hidden="true">·</span>
        <a href="/api/sitemap.xml">Sitemap</a>
        <span aria-hidden="true">·</span>
        <a
          data-test="icp-filing-link"
          href="https://beian.miit.gov.cn/"
          rel="noreferrer"
          target="_blank"
        >
          豫ICP备2026032113号-1
        </a>
        <span aria-hidden="true">·</span>
        <span>Powered by Vue + Go</span>
      </p>
    </div>
  </footer>
</template>
```

- [ ] **Step 2: 运行新增测试，确认实现通过**

Run:

```powershell
pnpm vitest run src/components/layout/AppFooter.test.ts
```

Expected: PASS with 2 tests passed.

---

### Task 3: 执行前端完整验证

**Files:**
- Verify: `D:\AllTools\Go\Blog\frontend\src\components\layout\AppFooter.vue`
- Verify: `D:\AllTools\Go\Blog\frontend\src\components\layout\AppFooter.test.ts`

- [ ] **Step 1: 运行完整前端测试**

Run:

```powershell
pnpm test
```

Expected: Vitest exits with code 0 and all discovered tests pass.

- [ ] **Step 2: 运行 TypeScript 检查和生产构建**

Run:

```powershell
pnpm build
```

Expected: `vue-tsc --noEmit` completes successfully, followed by a successful Vite production build.

- [ ] **Step 3: 检查差异格式和提交范围**

Run:

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only the intended source/test files remain as tracked changes. Existing untracked local artifacts such as `.playwright-cli/`, `.superpowers/`, `output/`, `progress.md`, and `task_plan.md` must not be staged.

- [ ] **Step 4: 提交前端实现**

```powershell
git add -- src/components/layout/AppFooter.vue src/components/layout/AppFooter.test.ts
git commit -m "feat(frontend): add ICP filing footer link"
```

- [ ] **Step 5: 分别推送两个远端**

```powershell
git push origin master
git push gitee master
```

只推送前端仓库当前分支；本次没有后端改动，不操作 `backend/` 仓库。

