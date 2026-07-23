# Public Security Filing Footer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在公共页脚加入本地公安备案图标和 `冀公网安备13060602001918号` 官方查询链接，并部署到生产站点。

**Architecture:** 继续由 `AppFooter.vue` 静态展示备案信息，不增加后端配置或运行时请求。公安备案图标放在 Vite `public/images/` 下，以根路径引用；组件测试固定链接、文案、图标路径和外链安全属性，公共样式表只增加备案链接内部对齐与页脚换行规则。

**Tech Stack:** Vue 3、TypeScript、Vue Test Utils、Vitest、CSS、Vite、pnpm、Nginx

---

## 文件结构

- Create: `public/images/beian-police.png`：公安备案本地图标。
- Modify: `src/components/layout/AppFooter.test.ts`：备案链接与图标的组件回归测试。
- Modify: `src/components/layout/AppFooter.vue`：备案图标、备案号和公安部查询链接。
- Modify: `src/styles/public-shell.css`：备案链接内部对齐和窄屏换行。

### Task 1: 添加失败的组件测试

- [ ] **Step 1: 在 `AppFooter.test.ts` 中加入公安备案断言**

断言 `[data-test="public-security-filing-link"]` 文案为 `冀公网安备13060602001918号`，链接为 `https://beian.mps.gov.cn/#/query/webSearch?code=13060602001918`，并包含 `target="_blank"`、`rel="noreferrer"`；断言子图片 `src="/images/beian-police.png"`、空 `alt` 和 `aria-hidden="true"`。

- [ ] **Step 2: 运行单测验证红灯**

Run: `pnpm test -- src/components/layout/AppFooter.test.ts`

Expected: FAIL，提示找不到 `[data-test="public-security-filing-link"]`。

### Task 2: 添加图标与最小组件实现

- [ ] **Step 1: 获取并校验公安备案图标**

将公安备案盾牌图标保存为 `public/images/beian-police.png`，确认是有效 PNG 且尺寸适合页脚小图标展示。

- [ ] **Step 2: 在 `AppFooter.vue` 增加公安备案链接**

在 ICP 备案链接之后加入：

```vue
<a
  class="public-security-filing"
  data-test="public-security-filing-link"
  href="https://beian.mps.gov.cn/#/query/webSearch?code=13060602001918"
  rel="noreferrer"
  target="_blank"
>
  <img aria-hidden="true" alt="" src="/images/beian-police.png" />
  <span>冀公网安备13060602001918号</span>
</a>
```

- [ ] **Step 3: 在 `public-shell.css` 增加最小样式**

```css
.footer-links {
  flex-wrap: wrap;
}

.public-security-filing {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.public-security-filing img {
  width: 18px;
  height: 18px;
  object-fit: contain;
}
```

- [ ] **Step 4: 运行组件测试验证绿灯**

Run: `pnpm test -- src/components/layout/AppFooter.test.ts`

Expected: PASS，`AppFooter.test.ts` 全部测试通过。

### Task 3: 完整验证与视觉核验

- [ ] **Step 1: 运行完整测试**

Run: `pnpm test`

Expected: 全部测试通过，0 failures。

- [ ] **Step 2: 运行生产构建**

Run: `pnpm build`

Expected: `vue-tsc --noEmit` 与 `vite build` 均成功，退出码 0。

- [ ] **Step 3: 启动预览并检查桌面端和移动端**

在 Chromium 中检查首页页脚：桌面端图标与文字垂直居中；移动端链接自然换行、无水平溢出；点击目标与组件测试一致。

- [ ] **Step 4: 检查变更完整性**

Run: `git diff --check`

Expected: 无输出，退出码 0。

### Task 4: 提交、推送与部署

- [ ] **Step 1: 检查待提交内容**

Run: `git status --short`

Expected: 只暂存 `public/images/beian-police.png`、`src/components/layout/AppFooter.test.ts`、`src/components/layout/AppFooter.vue` 和 `src/styles/public-shell.css`；不提交 `node_modules/`、`dist/`、缓存、日志、下载包、本地规划文件或敏感配置。

- [ ] **Step 2: 提交实现**

```bash
git add public/images/beian-police.png src/components/layout/AppFooter.test.ts src/components/layout/AppFooter.vue src/styles/public-shell.css
git commit -m "feat(frontend): add public security filing footer"
```

- [ ] **Step 3: 分别推送两个远端**

```bash
git push origin master
git push gitee master
```

- [ ] **Step 4: 发布构建产物并原子切换生产版本**

将本次 `dist/` 上传到新的时间戳发布目录，确认文件完整后更新 `/var/www/blog/current` 软链接，保留现有发布目录便于回滚。

- [ ] **Step 5: 生产验收**

访问 `https://masenyu.top`，确认首页返回 200、页面含 `冀公网安备13060602001918号`、图标返回 200，并确认公安备案链接目标正确。
