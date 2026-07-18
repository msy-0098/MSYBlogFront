# CodeMax 下载体验页设计

- 日期：2026-07-18
- 范围：`frontend/`
- 状态：待用户审阅

## 目标

在博客公开端增加 CodeMax 的发现、介绍和下载入口，让访客可以从首页或主导航进入 `/codemax`，了解 CodeMax 是什么，并下载当前可用的 Windows 安装包。macOS 和 Linux 暂时展示“敬请期待”，不提供无效下载链接。

## 用户流程

1. 用户从主导航点击“CodeMax”，进入 `/codemax`。
2. 用户也可以在首页 CodeMax 宣传卡片中点击 CTA 进入下载页。
3. 下载页首屏展示产品定位、当前版本状态和“下载 Windows 版”主按钮。
4. 用户在平台卡片中看到三个版本：
   - Windows：可用，点击下载 `CodeMax-Setup-x64.exe`。
   - macOS：敬请期待，按钮禁用或非交互。
   - Linux：敬请期待，按钮禁用或非交互。
5. 用户可继续阅读 Windows 安装步骤和首次配置说明，并打开随项目提供的使用手册。

## 页面与视觉设计

### 首页宣传卡片

- 位置：沿用首页现有 Bento/项目卡片节奏，放在项目展示区域附近，不替换 Hero 或文章主入口。
- 内容：CodeMax 标识性标题、终端 AI 编程助手的一句话说明、Windows 可下载状态、进入下载页 CTA。
- 风格：复用现有公开端 token、圆角、边框、阴影和蓝色 accent；可以用终端提示符、网格/光晕作为轻量装饰，但不新增重量级动画。
- 交互：整个卡片或 CTA 可进入 `/codemax`，保持键盘可聚焦和明确的 hover/focus 状态。

### `/codemax` 下载页

- 使用公开端现有页面壳层和响应式布局。
- 首屏采用左右分栏：左侧产品介绍和 CTA，右侧用代码终端/安装摘要卡片表达“终端里的 AI 编程助手”。移动端改为单列。
- 下载区域采用三张平台卡片，Windows 使用主色强调，macOS/Linux 使用弱化状态并明确“敬请期待”。
- 内容区包含“安装 CodeMax”“首次配置模型”“启动方式”三个步骤，文字基于现有 Windows 使用手册改写，不能内嵌 API Key 或服务器敏感信息。
- 页面底部提供使用手册入口，优先链接到静态 Markdown 文件或站内可访问的文档资源；如果当前静态托管不适合直接打开 Markdown，则提供下载/查看该文档的资源链接。

## 路由与资源

- 在 `frontend/src/router/index.ts` 增加公开路由：`/codemax`，名称为 `codemax`。
- 新增 `frontend/src/views/CodeMaxView.vue`。
- 新增或扩展首页组件，推荐使用独立 `frontend/src/components/home/FeaturedCodeMax.vue`，避免 HomeView 继续膨胀。
- 在 `frontend/src/components/layout/AppHeader.vue` 增加主导航链接。
- 在 `frontend/public/downloads/` 放置 `CodeMax-Setup-x64.exe`，使用固定、无空格的文件名。
- 使用手册作为下载页可访问的静态资源；若复制到 `frontend/public/downloads/`，只复制不含任何敏感配置的 Windows 使用手册内容。
- 不修改后端 API、数据库或管理端。

## 下载行为

- Windows 主按钮使用 `/downloads/CodeMax-Setup-x64.exe`，设置 `download` 属性，浏览器直接下载。
- macOS/Linux 按钮使用 disabled/aria-disabled 语义，不设置 href，避免产生 404 或误导。
- 页面中说明安装包为 x64 Windows 版本；不声称支持 ARM 或其他平台。

## 测试与验收

新增或更新前端测试，覆盖：

- 路由表包含 `/codemax` 公开路由。
- 首页宣传卡片渲染 CodeMax 文案并链接到 `/codemax`。
- 下载页渲染三个平台卡片。
- Windows 下载链接指向正确静态资源并带有下载语义。
- macOS/Linux 显示“敬请期待”且不提供可点击下载地址。

验证命令：

```bash
pnpm test
pnpm build
```

必要时使用本地预览检查桌面端和移动端：导航入口、首页卡片、下载页布局、安装包响应和禁用平台交互。

## 非目标

- 不实现 macOS/Linux 安装包。
- 不增加下载统计、版本管理后台或 CDN 接入。
- 不把服务器密码、Gitee Token、`.env`、数据库和其他敏感信息写入页面、文档或 Git。
- 不改造博客现有全局主题和 Hero 动效。
