# CodeMax 下载体验页 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在博客公开端新增 CodeMax 发现、介绍与下载体验，让首页和主导航都能进入 `/codemax`，并提供 Windows 安装包以及 macOS/Linux“敬请期待”状态。

**Architecture:** 复用现有 Vue 3 + Vue Router + 公开端 shell 和 CSS token。CodeMax 页面与首页宣传卡片分别由独立 Vue 组件负责；安装包和脱敏后的 Windows 使用手册作为 `frontend/public/downloads/` 静态资源，不改后端 API、数据库或管理端。

**Tech Stack:** Vue 3 `<script setup>`、TypeScript、Vue Router、现有公开端 CSS、Vitest、Vue Test Utils、pnpm。

---

## 文件地图

- Create: `frontend/src/components/home/FeaturedCodeMax.vue` — 首页 CodeMax Bento 宣传卡片，只负责展示和跳转。
- Create: `frontend/src/components/home/FeaturedCodeMax.test.ts` — 首页卡片渲染与入口链接测试。
- Create: `frontend/src/views/CodeMaxView.vue` — CodeMax 下载页、平台卡片、安装流程和使用手册入口。
- Create: `frontend/src/views/CodeMaxView.test.ts` — 三个平台状态、Windows 下载语义和安装说明测试。
- Create: `frontend/public/downloads/CodeMax-Setup-x64.exe` — 用户提供的 Windows x64 安装包。
- Create: `frontend/public/downloads/codemax-windows-guide.md` — 从用户手册提炼并脱敏后的可下载说明。
- Modify: `frontend/src/router/index.ts` — 增加公开 `/codemax` 路由。
- Modify: `frontend/src/router/routes.test.ts` — 断言公开 CodeMax 路由存在且不是后台路由。
- Modify: `frontend/src/components/layout/AppHeader.vue` — 在主导航中加入 CodeMax 入口。
- Modify: `frontend/src/components/layout/AppHeader.test.ts` — 断言导航文本和目标地址。
- Modify: `frontend/src/views/HomeView.vue` — 在项目展示后插入 CodeMax 卡片。

## Task 1: 先补路由与入口测试（RED）

**Files:**
- Modify: `frontend/src/router/routes.test.ts`
- Modify: `frontend/src/components/layout/AppHeader.test.ts`
- Create: `frontend/src/components/home/FeaturedCodeMax.test.ts`
- Create: `frontend/src/views/CodeMaxView.test.ts`

- [ ] **Step 1: 在路由测试中写失败断言**

在已有 `routes` 测试中增加：

```ts
it('exposes the public CodeMax download route', () => {
  const route = routes.find((item) => item.name === 'codemax')

  expect(route?.path).toBe('/codemax')
  expect(route?.meta?.requiresAuth).not.toBe(true)
})
```

- [ ] **Step 2: 在导航测试中写失败断言**

沿用 `AppHeader.test.ts` 当前挂载方式，增加：

```ts
it('includes a CodeMax entry in the public navigation', () => {
  const wrapper = mountHeader()

  const link = wrapper.get('a[href="/codemax"]')
  expect(link.text()).toContain('CodeMax')
})
```

- [ ] **Step 3: 为首页卡片写失败测试**

使用现有 Vue Test Utils 配置，新增：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import FeaturedCodeMax from './FeaturedCodeMax.vue'

describe('FeaturedCodeMax', () => {
  it('renders a CodeMax CTA linking to the download page', () => {
    const wrapper = mount(FeaturedCodeMax)

    expect(wrapper.text()).toContain('CodeMax')
    expect(wrapper.text()).toContain('终端里的 AI 编程助手')
    expect(wrapper.get('a[href="/codemax"]').text()).toContain('下载体验')
  })
})
```

- [ ] **Step 4: 为下载页写失败测试**

新增 `CodeMaxView.test.ts`，对 `RouterLink` 做简单 stub：

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CodeMaxView from './CodeMaxView.vue'

describe('CodeMaxView', () => {
  const mountView = () =>
    mount(CodeMaxView, {
      global: {
        stubs: {
          RouterLink: { template: '<a :href="to"><slot /></a>', props: ['to'] }
        }
      }
    })

  it('shows Windows, macOS and Linux release cards', () => {
    const wrapper = mountView()

    expect(wrapper.text()).toContain('Windows')
    expect(wrapper.text()).toContain('macOS')
    expect(wrapper.text()).toContain('Linux')
  })

  it('makes the Windows installer downloadable and keeps future platforms inactive', () => {
    const wrapper = mountView()

    const windowsLink = wrapper.get('a[href="/downloads/CodeMax-Setup-x64.exe"]')
    expect(windowsLink.attributes('download')).toBeDefined()
    expect(wrapper.text()).toContain('macOS 敬请期待')
    expect(wrapper.text()).toContain('Linux 敬请期待')
    expect(wrapper.find('[data-platform="macos"] a').exists()).toBe(false)
    expect(wrapper.find('[data-platform="linux"] a').exists()).toBe(false)
  })
})
```

- [ ] **Step 5: 运行新增测试确认失败**

Run:

```powershell
pnpm test -- src/router/routes.test.ts src/components/layout/AppHeader.test.ts src/components/home/FeaturedCodeMax.test.ts src/views/CodeMaxView.test.ts
```

Expected: FAIL because the route, card, view and resource links do not exist yet；失败原因应是缺少 CodeMax 路由/组件，而不是 TypeScript 语法错误。

## Task 2: 接入公开路由和顶部导航（GREEN）

**Files:**
- Modify: `frontend/src/router/index.ts`
- Modify: `frontend/src/components/layout/AppHeader.vue`
- Modify: `frontend/src/components/layout/AppHeader.test.ts`

- [ ] **Step 1: 增加公开路由**

在 `/projects` 或其他公开页面路由附近增加：

```ts
{
  path: '/codemax',
  name: 'codemax',
  component: () => import('../views/CodeMaxView.vue')
},
```

不增加 `requiresAuth`，保持与其他游客端路由一致。

- [ ] **Step 2: 将 CodeMax 加入 `navItems`**

在 `frontend/src/components/layout/AppHeader.vue` 中把数组更新为包含：

```ts
{ label: 'CodeMax', to: '/codemax' },
```

保留现有移动端菜单、自动关闭和主题切换逻辑。

- [ ] **Step 3: 实现最小首页卡片以通过入口测试**

创建 `FeaturedCodeMax.vue`，使用 `<RouterLink class="featured-codemax" to="/codemax">` 作为主要交互元素，至少包含：

```vue
<script setup lang="ts">
</script>

<template>
  <section class="featured-codemax google-flow-section" aria-labelledby="featured-codemax-title">
    <div class="featured-codemax__copy">
      <p class="section-kicker">工具体验</p>
      <h2 id="featured-codemax-title">CodeMax</h2>
      <p class="section-lead">终端里的 AI 编程助手，陪你看代码、改代码、解决项目问题。</p>
      <RouterLink class="primary-button" to="/codemax">下载体验</RouterLink>
    </div>
    <div class="featured-codemax__terminal" aria-hidden="true">
      <span>$ codemax</span>
      <span>Ready to build.</span>
    </div>
  </section>
</template>
```

- [ ] **Step 4: 在 `HomeView.vue` 插入卡片**

导入 `FeaturedCodeMax`，并在 `FeaturedProjects` 之后、关于区域之前插入：

```vue
<FeaturedCodeMax />
```

- [ ] **Step 5: 运行入口测试确认通过**

Run:

```powershell
pnpm test -- src/router/routes.test.ts src/components/layout/AppHeader.test.ts src/components/home/FeaturedCodeMax.test.ts
```

Expected: PASS。

## Task 3: 实现 CodeMax 下载页（GREEN）

**Files:**
- Create: `frontend/src/views/CodeMaxView.vue`
- Create: `frontend/src/views/CodeMaxView.test.ts`

- [ ] **Step 1: 实现下载页结构**

创建页面，遵循现有公开端 class 命名和 token；页面必须包含：

```vue
<script setup lang="ts">
const platforms = [
  { key: 'windows', name: 'Windows', version: 'x64 安装包', status: '可用' },
  { key: 'macos', name: 'macOS', version: '即将支持', status: '敬请期待' },
  { key: 'linux', name: 'Linux', version: '即将支持', status: '敬请期待' }
]
</script>

<template>
  <div class="codemax-page page-shell">
    <section class="codemax-hero google-flow-section" aria-labelledby="codemax-title">
      <div class="codemax-hero__copy">
        <p class="section-kicker">CodeMax / AI coding companion</p>
        <h1 id="codemax-title">让终端成为你的编程工作台</h1>
        <p class="section-lead">在项目目录里输入 <code>codemax</code>，开始阅读、修改和解决代码问题。</p>
        <a class="primary-button" href="/downloads/CodeMax-Setup-x64.exe" download>
          下载 Windows 版
        </a>
      </div>
      <div class="codemax-terminal" aria-label="CodeMax terminal preview">
        <code><span>$ codemax</span><span>AI coding companion is ready.</span><span>Ask. Build. Ship.</span></code>
      </div>
    </section>

    <section class="codemax-platforms google-flow-section" aria-labelledby="codemax-platforms-title">
      <div class="section-heading">
        <div><p class="section-kicker">选择你的平台</p><h2 id="codemax-platforms-title">现在就开始体验</h2></div>
      </div>
      <div class="codemax-platform-grid">
        <article v-for="platform in platforms" :key="platform.key" class="codemax-platform-card" :data-platform="platform.key">
          <p class="codemax-platform-card__eyebrow">{{ platform.name }}</p>
          <h3>{{ platform.status }}</h3>
          <p>{{ platform.version }}</p>
          <a v-if="platform.key === 'windows'" class="primary-button" href="/downloads/CodeMax-Setup-x64.exe" download>立即下载</a>
          <span v-else class="codemax-platform-card__coming-soon" aria-disabled="true">敬请期待</span>
        </article>
      </div>
    </section>

    <section class="codemax-guide google-flow-section" aria-labelledby="codemax-guide-title">
      <div class="section-heading"><div><p class="section-kicker">Windows 快速开始</p><h2 id="codemax-guide-title">三步开始使用</h2></div></div>
      <ol class="codemax-steps">
        <li><strong>安装</strong><span>运行安装包，并保留“Add CodeMax to the user PATH”选项。</span></li>
        <li><strong>配置</strong><span>在 `%USERPROFILE%\\.config\\codemax\\codemax.jsonc` 中填入你自己的模型配置和 API Key。</span></li>
        <li><strong>启动</strong><span>关闭并重新打开终端，在项目目录运行 `codemax`。</span></li>
      </ol>
      <a class="secondary-button" href="/downloads/codemax-windows-guide.md" download>下载 Windows 使用手册</a>
    </section>
  </div>
</template>
```

实际实现中可将重复平台数据抽成 `computed` 或小模板，但要保持 Windows 是唯一可下载平台；macOS/Linux 不要渲染 `<a>`。

- [ ] **Step 2: 添加页面样式**

将 CodeMax 页面样式放入 `frontend/src/styles/public-content.css` 或现有公开端页面样式文件，复用 `--surface-card`、`--border-subtle`、`--accent`、`--radius-card` 等 token。要求：

- 桌面端 hero 两列，移动端 `@media` 下单列；
- 平台卡片三列，移动端一列；
- Windows 卡片有 accent 边框/背景，未来平台有弱化视觉；
- terminal 视觉只用 CSS，不能引入新依赖；
- focus-visible 状态清晰；
- `prefers-reduced-motion: reduce` 下不新增明显过渡。

- [ ] **Step 3: 运行下载页测试确认通过**

Run:

```powershell
pnpm test -- src/views/CodeMaxView.test.ts
```

Expected: PASS，且 Windows 下载 href 为 `/downloads/CodeMax-Setup-x64.exe`，macOS/Linux 没有可点击 `<a>`。

## Task 4: 安装包与使用手册资源

**Files:**
- Create: `frontend/public/downloads/CodeMax-Setup-x64.exe`
- Create: `frontend/public/downloads/codemax-windows-guide.md`

- [ ] **Step 1: 复制安装包**

使用 PowerShell 复制用户提供的文件：

```powershell
New-Item -ItemType Directory -Force frontend/public/downloads | Out-Null
Copy-Item -LiteralPath 'D:\AllTools\CLI-AI\CodeMax-TUI\packages\opencode\dist\release\CodeMax-Setup-x64.exe' -Destination 'frontend/public/downloads/CodeMax-Setup-x64.exe'
```

复制后检查文件存在且大小大于 0；不要把其他构建产物复制进仓库。

- [ ] **Step 2: 生成脱敏说明文件**

从 `D:\缓存\xwechat_files\wxid_rz7aipzfyt2o22_a4c0\msg\file\2026-07\codemax-使用手册.md` 提取安装、PATH、首次配置和启动内容，保存为 `codemax-windows-guide.md`。只保留通用占位符，例如“这里填你自己的 API Key”；禁止出现真实 Token、密码、服务器 IP、私钥或本地敏感路径。

- [ ] **Step 3: 校验静态资源内容**

Run:

```powershell
$exe = Get-Item frontend/public/downloads/CodeMax-Setup-x64.exe
if ($exe.Length -le 0) { throw 'installer is empty' }
Select-String -Path frontend/public/downloads/codemax-windows-guide.md -Pattern '4810fe5a|5201314|192\.144\.150\.187|BEGIN .* PRIVATE KEY' -Quiet
if ($?) { throw 'sensitive content found in guide' }
```

Expected: 安装包非空；敏感信息检查返回 false。

## Task 5: 全量验证与审查

**Files:**
- Modify as needed only if verification finds a defect.

- [ ] **Step 1: 运行全量前端测试**

Run:

```powershell
pnpm test
```

Expected: PASS，不能只运行新增测试。

- [ ] **Step 2: 运行生产构建**

Run:

```powershell
pnpm build
```

Expected: `vue-tsc --noEmit` 和 Vite build 都成功；构建产物 `frontend/dist/` 不得提交。

- [ ] **Step 3: 检查 Git 改动范围**

Run：

```powershell
git -C frontend status --short
```

确认只包含 CodeMax 功能相关源代码、测试、静态资源和设计/计划文档；不包含 `node_modules/`、`dist/`、`.env`、数据库、日志、上传资源、AGENTS.md、`需求文档.md` 或任何密钥。

- [ ] **Step 4: 运行本地预览并检查核心交互**

Run:

```powershell
pnpm dev
```

浏览检查 `/` 与 `/codemax`：桌面端/移动端导航、首页卡片、Windows 下载按钮、macOS/Linux 禁用状态和使用手册下载入口。

- [ ] **Step 5: 提交前执行格式检查并提交 frontend 仓库**

Run:

```powershell
git -C frontend diff --check
git -C frontend status --short
```

只暂存明确的 CodeMax 文件，然后：

```powershell
git -C frontend add src/components/home/FeaturedCodeMax.vue src/components/home/FeaturedCodeMax.test.ts src/components/layout/AppHeader.vue src/components/layout/AppHeader.test.ts src/router/index.ts src/router/routes.test.ts src/views/CodeMaxView.vue src/views/CodeMaxView.test.ts public/downloads/CodeMax-Setup-x64.exe public/downloads/codemax-windows-guide.md docs/superpowers/specs/2026-07-18-codemax-download-design.md docs/superpowers/plans/2026-07-18-codemax-download.md
 git -C frontend status --short
 git -C frontend commit -m "feat(frontend): add CodeMax download experience"
```

提交前再次确认没有误加入缓存、依赖、构建产物、数据库、上传文件、日志或敏感配置。

- [ ] **Step 6: 分别推送 GitHub 和 Gitee**

确认远端仍为 GitHub `origin` 与 Gitee `gitee`，获取当前分支后分别推送：

```powershell
$branch = git -C frontend branch --show-current
git -C frontend push origin $branch
git -C frontend push gitee $branch
```

若远端认证失败，保留本地提交并报告具体失败原因，不把 Token 写入命令、文件或日志。
