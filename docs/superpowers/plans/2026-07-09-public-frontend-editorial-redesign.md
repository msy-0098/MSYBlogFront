# Public Frontend Editorial Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the public-facing blog into the approved content-first editorial experience without blocking on the later admin UI and backend storage tracks.

**Architecture:** Keep the existing Vue Router public route map, but replace the public presentation layer with smaller editorial components and split the overloaded public CSS into focused style files imported from `src/styles/global.css`. Read optional `featuredPostSlug` metadata from `/api/site`, fall back to the newest article when that field is absent, and keep comments async so the public redesign ships independently of the later admin/backend plans.

**Tech Stack:** Vue 3, TypeScript, Vue Router, Axios, Markdown-it, Highlight.js, Vitest, Vue Test Utils, plain CSS

---

## Scope Split

The approved redesign spec spans three independent subprojects. This plan covers only the first one.

1. Public frontend editorial redesign: this document
2. Admin pure-CSS management UI replacement: handled by the next dedicated plan
3. Backend `SQLite` / `FTS5` / upload-path realignment: handled by the next dedicated plan

## File Structure

### Public shell and CSS foundation

- Create: `src/styles/tokens.css`
  - Design tokens for surfaces, borders, typography, spacing, and editorial accent colors.
- Create: `src/styles/public-shell.css`
  - Header, footer, page container, section rhythm, and public route shell classes.
- Create: `src/styles/public-content.css`
  - Shared public card, typography, grid, empty-state, pagination, and reading-layout rules.
- Modify: `src/styles/global.css`
  - Import the new public CSS files first, keep existing admin styles below a clear boundary comment, and remove public particle-era rules as they are replaced.
- Modify: `src/App.vue`
  - Add a `public-root-main` class for non-admin routes so public shell styling is isolated from admin layout rules.
- Modify: `src/components/layout/AppHeader.vue`
  - Reduce the top nav to the approved editorial primary links and keep mobile-toggle behavior.
- Modify: `src/components/layout/AppFooter.vue`
  - Replace placeholder footer copy with the approved editorial footer content.

### Homepage and shared public cards

- Modify: `src/api/site.ts`
  - Extend `SiteProfile` with optional editorial metadata consumed by the public UI.
- Create: `src/components/home/FeaturedEssay.vue`
  - Dedicated featured-story hero block for the homepage.
- Modify: `src/views/HomeView.vue`
  - Compute featured story + latest stream, remove particle hero usage, and render the approved section order.
- Modify: `src/components/home/LatestPosts.vue`
  - Render an editorial article rail rather than the current particle-era block.
- Modify: `src/components/home/CategoryCloud.vue`
  - Convert to compact topic-entry cards with counts and descriptions.
- Modify: `src/components/home/FeaturedProjects.vue`
  - Restyle as supporting editorial content rather than equal-weight homepage tiles.
- Modify: `src/components/blog/PostCard.vue`
  - Promote large-cover visual hierarchy and add stable `data-test` hooks for list-based views.

### Reading layout

- Create: `src/utils/markdownHeadings.ts`
  - Extract heading metadata and slugify anchors from Markdown content.
- Create: `src/components/blog/PostTableOfContents.vue`
  - Sticky desktop / collapsible mobile table of contents component.
- Create: `src/components/blog/PostComments.vue`
  - Extract the current inline comment/auth flow out of `PostDetailView.vue`.
- Modify: `src/components/blog/MarkdownRenderer.vue`
  - Add stable heading IDs so TOC links jump to rendered sections.
- Modify: `src/views/PostDetailView.vue`
  - Switch to a two-column editorial reading layout and delegate comments to the extracted component.

### Secondary public pages

- Modify: `src/views/PostListView.vue`
  - Apply editorial list intro copy, large-cover grid, and public pagination treatment.
- Modify: `src/views/SearchView.vue`
  - Reframe search as an editorial discovery page with stronger empty states.
- Modify: `src/views/ArchiveView.vue`
  - Present archive as a time-indexed reading map.
- Modify: `src/views/ProjectsView.vue`
  - Make projects feel like supporting portfolio essays rather than admin-fed tiles.
- Modify: `src/views/AboutView.vue`
  - Build a richer author introduction with stronger section hierarchy.
- Modify: `src/views/NotFoundView.vue`
  - Replace the particle/canvas 404 with a static editorial recovery page that matches the new public brand.

### Tests

- Modify: `src/App.test.ts`
- Modify: `src/components/layout/AppHeader.test.ts`
- Modify: `src/views/HomeView.test.ts`
- Modify: `src/views/PostDetailView.test.ts`
- Modify: `src/views/PostListView.test.ts`
- Modify: `src/views/SearchView.test.ts`
- Modify: `src/views/NotFoundView.test.ts`

## Task 1: Build the Public Shell and CSS Foundation

**Files:**
- Create: `src/styles/tokens.css`
- Create: `src/styles/public-shell.css`
- Create: `src/styles/public-content.css`
- Modify: `src/styles/global.css`
- Modify: `src/App.vue`
- Modify: `src/components/layout/AppHeader.vue`
- Modify: `src/components/layout/AppFooter.vue`
- Test: `src/App.test.ts`
- Test: `src/components/layout/AppHeader.test.ts`

- [ ] **Step 1: Write the failing shell tests**

```ts
// src/App.test.ts
it('wraps public routes in the editorial shell but keeps admin routes isolated', () => {
  route.path = '/posts'
  let wrapper = mountApp()
  expect(wrapper.get('main').classes()).toContain('public-root-main')
  wrapper.unmount()

  route.path = '/admin'
  wrapper = mountApp()
  expect(wrapper.get('main').classes()).toContain('admin-root-main')
})

// src/components/layout/AppHeader.test.ts
it('renders the editorial primary navigation and closes the mobile menu after route changes', async () => {
  const router = createRouter({
    history: createMemoryHistory(),
    routes
  })
  router.push('/posts')
  await router.isReady()

  const wrapper = mount(AppHeader, {
    global: {
      plugins: [router]
    }
  })

  const labels = wrapper.findAll('[data-test=\"primary-nav\"] a').map((link) => link.text())
  expect(labels).toEqual(['文章', '分类', '项目', '关于', '搜索'])

  const toggle = wrapper.get('[data-test=\"mobile-nav-toggle\"]')
  await toggle.trigger('click')
  await router.push('/about')
  await nextTick()

  expect(wrapper.get('[data-test=\"primary-nav\"]').classes()).not.toContain('is-open')
})
```

- [ ] **Step 2: Run the shell tests to verify they fail**

Run: `pnpm vitest run src/App.test.ts src/components/layout/AppHeader.test.ts`

Expected: FAIL because `public-root-main` is not rendered yet and the current nav still contains `首页` / `标签` / `归档`.

- [ ] **Step 3: Write the minimal shell implementation**

```vue
<!-- src/App.vue -->
<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import AppFooter from './components/layout/AppFooter.vue'
import AppHeader from './components/layout/AppHeader.vue'

const route = useRoute()
const isAdminRoute = computed(() => route.path.startsWith('/admin'))
const mainClass = computed(() => (isAdminRoute.value ? 'admin-root-main' : 'public-root-main'))
</script>

<template>
  <AppHeader v-if="!isAdminRoute" />
  <main class="app-motion-shell" :class="mainClass">
    <RouterView />
  </main>
  <AppFooter v-if="!isAdminRoute" />
</template>
```

```vue
<!-- src/components/layout/AppHeader.vue -->
<script setup lang="ts">
const navItems = [
  { label: '文章', to: '/posts' },
  { label: '分类', to: '/categories' },
  { label: '项目', to: '/projects' },
  { label: '关于', to: '/about' },
  { label: '搜索', to: '/search' }
]
</script>
```

```vue
<!-- src/components/layout/AppFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <p>© {{ currentYear }} 马森雨</p>
      <p>写作、项目与持续成长的公开记录</p>
      <p>Powered by Vue + Go</p>
    </div>
  </footer>
</template>
```

```css
/* src/styles/global.css */
@import './tokens.css';
@import './public-shell.css';
@import './public-content.css';

/* existing admin styles continue below this line */
```

```css
/* src/styles/public-shell.css */
.public-root-main {
  min-height: calc(100vh - 156px);
  background: var(--surface-page);
}

.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  min-height: 72px;
  border-bottom: 1px solid var(--border-subtle);
  background: rgba(252, 251, 247, 0.94);
  backdrop-filter: blur(14px);
}
```

- [ ] **Step 4: Run the shell tests to verify they pass**

Run: `pnpm vitest run src/App.test.ts src/components/layout/AppHeader.test.ts`

Expected: PASS with both tests green.

- [ ] **Step 5: Commit the shell foundation**

```bash
git add src/App.vue src/styles/global.css src/styles/tokens.css src/styles/public-shell.css src/styles/public-content.css src/components/layout/AppHeader.vue src/components/layout/AppFooter.vue src/App.test.ts src/components/layout/AppHeader.test.ts
git commit -m "feat: add editorial public shell foundation"
```

## Task 2: Rebuild the Homepage Around a Featured Essay

**Files:**
- Modify: `src/api/site.ts`
- Create: `src/components/home/FeaturedEssay.vue`
- Modify: `src/views/HomeView.vue`
- Modify: `src/components/home/LatestPosts.vue`
- Modify: `src/components/home/CategoryCloud.vue`
- Modify: `src/components/home/FeaturedProjects.vue`
- Modify: `src/components/blog/PostCard.vue`
- Test: `src/views/HomeView.test.ts`

- [ ] **Step 1: Write the failing homepage test**

```ts
// src/views/HomeView.test.ts
it('renders a featured essay first, then the latest post rail, and removes the particle hero', async () => {
  const wrapper = mount(HomeView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  })

  await flushPromises()

  expect(wrapper.find('[data-test=\"featured-essay\"]').exists()).toBe(true)
  expect(wrapper.find('[data-test=\"latest-post-rail\"]').exists()).toBe(true)
  expect(wrapper.find('[data-test=\"particle-dome\"]').exists()).toBe(false)
  expect(wrapper.findAll('[data-test=\"post-card\"]').length).toBeGreaterThan(0)
})
```

- [ ] **Step 2: Run the homepage test to verify it fails**

Run: `pnpm vitest run src/views/HomeView.test.ts`

Expected: FAIL because `HomeView.vue` still renders `HomeHero` / particle-era markup and does not expose `featured-essay` or `latest-post-rail`.

- [ ] **Step 3: Write the minimal homepage implementation**

```ts
// src/api/site.ts
export interface SiteProfile {
  siteTitle: string
  subtitle: string
  owner: string
  domain: string
  description: string
  navItems: string[]
  featuredPostSlug?: string
  aboutIntro?: string
}
```

```ts
// src/views/HomeView.vue
const featuredPost = computed(() => {
  if (!posts.value.length) return null
  const picked = profile.value.featuredPostSlug
    ? posts.value.find((item) => item.slug === profile.value.featuredPostSlug)
    : null
  return picked ?? posts.value[0]
})

const latestPosts = computed(() =>
  posts.value.filter((item) => item.slug !== featuredPost.value?.slug)
)
```

```vue
<!-- src/components/home/FeaturedEssay.vue -->
<script setup lang="ts">
import type { PostSummary } from '../../api/blog'

defineProps<{
  post: PostSummary
  owner: string
  description: string
}>()
</script>

<template>
  <section class="featured-essay" data-test="featured-essay">
    <RouterLink class="featured-essay-media" :to="`/posts/${post.slug}`">
      <img v-if="post.cover" :src="post.cover" :alt="post.title" loading="eager" decoding="async" />
      <span v-else>{{ post.category.name }}</span>
    </RouterLink>
    <div class="featured-essay-copy">
      <p class="section-kicker">精选文章</p>
      <h1>{{ post.title }}</h1>
      <p class="featured-essay-summary">{{ post.summary }}</p>
      <p class="featured-essay-meta">{{ post.publishedAt }} · {{ owner }}</p>
      <p class="featured-essay-intro">{{ description }}</p>
      <RouterLink class="primary-button" :to="`/posts/${post.slug}`">开始阅读</RouterLink>
    </div>
  </section>
</template>
```

```vue
<!-- src/views/HomeView.vue -->
<template>
  <div class="home-page">
    <FeaturedEssay
      v-if="featuredPost"
      :post="featuredPost"
      :owner="profile.owner"
      :description="profile.aboutIntro || profile.description"
    />
    <LatestPosts :posts="latestPosts" :loading="contentLoading" :error="contentError" />
    <CategoryCloud :categories="categories" :loading="contentLoading" :error="contentError" />
    <FeaturedProjects :projects="projects" :loading="contentLoading" :error="contentError" />
  </div>
</template>
```

```vue
<!-- src/components/blog/PostCard.vue -->
<template>
  <RouterLink class="post-card editorial-post-card" :to="`/posts/${post.slug}`" data-test="post-card">
    <span class="post-cover editorial-post-cover">
      <img v-if="post.cover" :src="post.cover" :alt="post.title" loading="lazy" decoding="async" />
      <span v-else>{{ post.category.name }}</span>
    </span>
    <span class="post-meta">{{ post.publishedAt }} · {{ post.category.name }}</span>
    <span class="post-title">{{ post.title }}</span>
    <span class="post-summary">{{ post.summary }}</span>
  </RouterLink>
</template>
```

- [ ] **Step 4: Run the homepage test to verify it passes**

Run: `pnpm vitest run src/views/HomeView.test.ts`

Expected: PASS with the featured essay and latest rail rendered, and no particle hero hook left in the DOM.

- [ ] **Step 5: Commit the homepage redesign**

```bash
git add src/api/site.ts src/views/HomeView.vue src/components/home/FeaturedEssay.vue src/components/home/LatestPosts.vue src/components/home/CategoryCloud.vue src/components/home/FeaturedProjects.vue src/components/blog/PostCard.vue src/views/HomeView.test.ts
git commit -m "feat: rebuild homepage as editorial landing"
```

## Task 3: Convert the Article Page into a Reading Layout with TOC

**Files:**
- Create: `src/utils/markdownHeadings.ts`
- Create: `src/components/blog/PostTableOfContents.vue`
- Create: `src/components/blog/PostComments.vue`
- Modify: `src/components/blog/MarkdownRenderer.vue`
- Modify: `src/views/PostDetailView.vue`
- Test: `src/views/PostDetailView.test.ts`
- Test: `src/components/blog/MarkdownRenderer.test.ts`

- [ ] **Step 1: Write the failing reading-layout tests**

```ts
// src/views/PostDetailView.test.ts
vi.mock('../api/blog', () => ({
  getPostDetail: vi.fn().mockResolvedValue({
    title: 'Go + SQLite',
    slug: 'go-gin-sqlite-blog',
    summary: '后端闭环',
    content: '## 第一节\\n\\n内容\\n\\n### 子节\\n\\n更多内容',
    cover: '',
    viewCount: 8,
    category: { name: 'Go', slug: 'go' },
    tags: [],
    publishedAt: '2026-06-30',
    prev: null,
    next: null
  }),
  getPostComments: vi.fn().mockResolvedValue({ list: [], page: 1, pageSize: 10, total: 0 }),
  sendVisitorEmailCode: vi.fn().mockResolvedValue({ sent: true }),
  registerVisitor: vi.fn(),
  loginVisitor: vi.fn(),
  createPostComment: vi.fn()
}))

it('renders a table of contents and mounts the extracted comment section', async () => {
  const wrapper = mount(PostDetailView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  })

  await flushPromises()

  expect(wrapper.find('[data-test=\"post-toc\"]').exists()).toBe(true)
  expect(wrapper.findAll('[data-test=\"post-toc-link\"]')).toHaveLength(2)
  expect(wrapper.find('[data-test=\"comment-section\"]').exists()).toBe(true)
})
```

- [ ] **Step 2: Run the reading-layout tests to verify they fail**

Run: `pnpm vitest run src/views/PostDetailView.test.ts src/components/blog/MarkdownRenderer.test.ts`

Expected: FAIL because there is no TOC component yet and the comment flow still lives inline inside `PostDetailView.vue`.

- [ ] **Step 3: Write the minimal reading-layout implementation**

```ts
// src/utils/markdownHeadings.ts
export type MarkdownHeading = {
  level: 2 | 3
  text: string
  id: string
}

export function slugifyHeading(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
}

export function extractHeadings(markdown: string): MarkdownHeading[] {
  return markdown
    .split('\n')
    .map((line) => line.match(/^(##|###)\s+(.*)$/))
    .filter((match): match is RegExpMatchArray => Boolean(match))
    .map((match) => ({
      level: match[1] === '##' ? 2 : 3,
      text: match[2].trim(),
      id: slugifyHeading(match[2])
    }))
}
```

```ts
// src/components/blog/MarkdownRenderer.vue
markdown.renderer.rules.heading_open = (tokens, index, options, env, self) => {
  const inlineToken = tokens[index + 1]
  const title = inlineToken?.content ?? ''
  if (title) {
    tokens[index].attrSet('id', slugifyHeading(title))
  }
  return self.renderToken(tokens, index, options)
}
```

```vue
<!-- src/components/blog/PostTableOfContents.vue -->
<script setup lang="ts">
import type { MarkdownHeading } from '../../utils/markdownHeadings'

defineProps<{
  headings: MarkdownHeading[]
}>()
</script>

<template>
  <aside class="post-toc" data-test="post-toc">
    <p class="post-toc-label">目录</p>
    <a
      v-for="heading in headings"
      :key="heading.id"
      :href="`#${heading.id}`"
      :class="[`level-${heading.level}`]"
      data-test="post-toc-link"
    >
      {{ heading.text }}
    </a>
  </aside>
</template>
```

```vue
<!-- src/components/blog/PostComments.vue -->
<script setup lang="ts">
import type { PostComment, VisitorUser } from '../../api/blog'

defineProps<{
  slug: string
  comments: PostComment[]
  commentsLoading: boolean
  commentError: string
  commentContent: string
  commentSubmitting: boolean
  visitorUser: VisitorUser | null
  isVisitorLoggedIn: boolean
}>()

defineEmits<{
  submitComment: []
  openAuth: []
  logoutVisitor: []
  updateCommentContent: [value: string]
}>()
</script>
```

```vue
<!-- src/views/PostDetailView.vue -->
<script setup lang="ts">
const headings = computed(() => extractHeadings(post.value?.content ?? ''))
</script>

<template>
  <section class="post-detail-page">
    <div v-if="post" class="post-detail-layout">
      <article class="post-detail-main">
        <!-- existing header + markdown -->
        <MarkdownRenderer :content="post.content" />
        <PostComments
          data-test="comment-section"
          :slug="slug.value"
          :comments="comments"
          :comments-loading="commentsLoading"
          :comment-error="commentError"
          :comment-content="commentContent"
          :comment-submitting="commentSubmitting"
          :visitor-user="visitorUser"
          :is-visitor-logged-in="isVisitorLoggedIn"
          @submit-comment="submitComment"
          @open-auth="openAuthPanel('login')"
          @logout-visitor="logoutVisitor"
          @update-comment-content="commentContent = $event"
        />
      </article>
      <PostTableOfContents v-if="headings.length" :headings="headings" />
    </div>
  </section>
</template>
```

- [ ] **Step 4: Run the reading-layout tests to verify they pass**

Run: `pnpm vitest run src/views/PostDetailView.test.ts src/components/blog/MarkdownRenderer.test.ts`

Expected: PASS with two TOC links rendered and the extracted comment section mounted.

- [ ] **Step 5: Commit the reading-layout work**

```bash
git add src/utils/markdownHeadings.ts src/components/blog/PostTableOfContents.vue src/components/blog/PostComments.vue src/components/blog/MarkdownRenderer.vue src/views/PostDetailView.vue src/views/PostDetailView.test.ts src/components/blog/MarkdownRenderer.test.ts
git commit -m "feat: add editorial article reading layout"
```

## Task 4: Polish Secondary Public Pages and Remove the Particle-era 404

**Files:**
- Modify: `src/views/PostListView.vue`
- Modify: `src/views/SearchView.vue`
- Modify: `src/views/ArchiveView.vue`
- Modify: `src/views/ProjectsView.vue`
- Modify: `src/views/AboutView.vue`
- Modify: `src/views/NotFoundView.vue`
- Test: `src/views/PostListView.test.ts`
- Test: `src/views/SearchView.test.ts`
- Test: `src/views/NotFoundView.test.ts`

- [ ] **Step 1: Write the failing secondary-page tests**

```ts
// src/views/PostListView.test.ts
it('renders the editorial list intro and a stable post-list grid hook', async () => {
  const wrapper = mount(PostListView, {
    props: { mode: 'category' },
    global: { stubs: { RouterLink: RouterLinkStub } }
  })

  await flushPromises()

  expect(wrapper.text()).toContain('继续阅读')
  expect(wrapper.find('[data-test=\"post-list-grid\"]').exists()).toBe(true)
})

// src/views/NotFoundView.test.ts
it('renders the static editorial 404 recovery page', () => {
  const wrapper = mount(NotFoundView, {
    global: {
      stubs: {
        RouterLink: RouterLinkStub
      }
    }
  })

  expect(wrapper.find('[data-test=\"not-found-canvas\"]').exists()).toBe(false)
  expect(wrapper.text()).toContain('这页暂时走失了')
  expect(wrapper.getComponent(RouterLinkStub).props('to')).toBe('/')
})
```

- [ ] **Step 2: Run the secondary-page tests to verify they fail**

Run: `pnpm vitest run src/views/PostListView.test.ts src/views/SearchView.test.ts src/views/NotFoundView.test.ts`

Expected: FAIL because `PostListView.vue` does not expose `post-list-grid`, the list intro copy is still old, and `NotFoundView.vue` still renders the interactive canvas recovery page.

- [ ] **Step 3: Write the minimal secondary-page implementation**

```vue
<!-- src/views/PostListView.vue -->
<template>
  <section class="reading-page editorial-list-page">
    <div class="reading-heading">
      <p class="section-kicker">文章</p>
      <h1>{{ title }}</h1>
      <p>继续阅读 {{ taxonomyName }} 相关的公开笔记与项目复盘。</p>
    </div>

    <div v-if="page?.list.length" class="post-grid reading-grid" data-test="post-list-grid">
      <PostCard v-for="post in page.list" :key="post.slug" :post="post" />
    </div>
  </section>
</template>
```

```vue
<!-- src/views/SearchView.vue -->
<template>
  <section class="reading-page editorial-search-page">
    <div class="reading-heading">
      <p class="section-kicker">搜索</p>
      <h1>在写作档案里找答案</h1>
      <p>检索标题、摘要和正文，继续沿着主题向下阅读。</p>
    </div>
  </section>
</template>
```

```vue
<!-- src/views/NotFoundView.vue -->
<template>
  <section class="not-found-page">
    <p class="section-kicker">404</p>
    <h1>这页暂时走失了</h1>
    <p>链接可能已经迁移，也可能只是这次检索没有命中。先回首页继续阅读吧。</p>
    <RouterLink class="primary-button" data-test="not-found-return" to="/">
      返回首页
    </RouterLink>
  </section>
</template>
```

- [ ] **Step 4: Run the secondary-page tests to verify they pass**

Run: `pnpm vitest run src/views/PostListView.test.ts src/views/SearchView.test.ts src/views/NotFoundView.test.ts`

Expected: PASS with the new list-grid hook, editorial search framing, and static 404 copy in place.

- [ ] **Step 5: Commit the secondary-page polish**

```bash
git add src/views/PostListView.vue src/views/SearchView.vue src/views/ArchiveView.vue src/views/ProjectsView.vue src/views/AboutView.vue src/views/NotFoundView.vue src/views/PostListView.test.ts src/views/SearchView.test.ts src/views/NotFoundView.test.ts
git commit -m "feat: polish public content pages"
```

## Final Verification

- [ ] Run the focused public test suite:

```bash
pnpm vitest run src/App.test.ts src/components/layout/AppHeader.test.ts src/views/HomeView.test.ts src/views/PostDetailView.test.ts src/views/PostListView.test.ts src/views/SearchView.test.ts src/views/NotFoundView.test.ts
```

Expected: PASS

- [ ] Run the full frontend test suite:

```bash
pnpm test
```

Expected: PASS

- [ ] Run the production build:

```bash
pnpm build
```

Expected: PASS with the public homepage no longer bundling the particle-era public UI path.

## Spec Coverage Notes

This plan intentionally covers only the public frontend subset of the approved redesign spec:

- Covered here: editorial shell, homepage, list/detail reading flow, secondary public pages
- Deferred to admin plan: pure-CSS admin UI, post editor workflow refresh, upload UI changes
- Deferred to backend plan: `SQLite` migration, `FTS5` index creation, featured-post setting persistence, upload-path conventions
