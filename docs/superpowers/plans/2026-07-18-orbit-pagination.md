# Orbit Pagination Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace every frontend pagination control with an accessible, responsive “Orbit Pagination” component while preserving existing API requests, page boundaries, and admin table behavior.

**Architecture:** Add one reusable `OrbitPagination.vue` component with public/admin visual variants. Page views continue owning request state and only pass `currentPage`, `totalPages`, and a change callback; the component emits a validated target page. Its scoped CSS uses existing public and admin design tokens, includes the orbit decoration, responsive layout, dark mode inheritance, and reduced-motion support.

**Tech Stack:** Vue 3 `<script setup>`, TypeScript, Vue Test Utils, Vitest, CSS custom properties, Element Plus pages migrated to the shared component.

---

## File map

- Create: `D:\AllTools\Go\Blog\frontend\src\components\common\OrbitPagination.vue` — shared markup, accessibility behavior, public/admin variants, and responsive visual treatment.
- Create: `D:\AllTools\Go\Blog\frontend\src\components\common\OrbitPagination.test.ts` — component boundary, disabled states, event behavior, ARIA, and variant coverage.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\PostListView.vue` — replace the public article/category/tag pagination markup.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\SearchView.vue` — replace search pagination markup.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\PostListView.test.ts` — assert the shared pagination is rendered and still requests the next page.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\SearchView.test.ts` — provide a multi-page result and assert shared pagination behavior.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\admin\AdminPostsView.vue` — replace Element Plus pagination while preserving `page`, `pageSize`, `total`, and `loadPosts()`.
- Modify: `D:\AllTools\Go\Blog\frontend\src\views\admin\AdminCommentsView.vue` — replace Element Plus pagination while preserving query state and `loadComments()`.
- Modify: `D:\AllTools\Go\Blog\frontend\src\styles\admin.css` — remove only obsolete `.admin-pagination` alignment assumptions if the shared component needs the admin panel wrapper to stretch; keep all unrelated admin styles unchanged.
- Verify: `D:\AllTools\Go\Blog\frontend\package.json` scripts `pnpm test` and `pnpm build`.

---

### Task 1: Add failing tests for the shared pagination contract

**Files:**
- Create: `src/components/common/OrbitPagination.test.ts`

- [ ] **Step 1: Write the failing component tests**

Create the test file with these cases:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import OrbitPagination from './OrbitPagination.vue'

describe('OrbitPagination', () => {
  it('does not render for a single page', () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages: 1 }
    })

    expect(wrapper.find('[data-test="orbit-pagination"]').exists()).toBe(false)
  })

  it('renders the orbit page indicator and disables the first-page previous button', () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages: 5, label: '文章分页' }
    })

    expect(wrapper.get('[data-test="orbit-pagination"]').attributes('aria-label')).toBe('文章分页')
    expect(wrapper.get('[data-test="orbit-pagination-current"]').text()).toBe('第 1 / 5 页')
    expect(wrapper.get('[data-test="orbit-pagination-current"]').attributes('aria-current')).toBe('page')
    expect(wrapper.get('[data-test="orbit-pagination-prev"]').attributes('disabled')).toBeDefined()
    expect(wrapper.get('[data-test="orbit-pagination-next"]').attributes('disabled')).toBeUndefined()
  })

  it('emits the next page and ignores out-of-range navigation', async () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 2, totalPages: 3 }
    })

    await wrapper.get('[data-test="orbit-pagination-prev"]').trigger('click')
    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')

    expect(wrapper.emitted('change')).toEqual([[1], [3]])

    await wrapper.setProps({ currentPage: 3 })
    await wrapper.get('[data-test="orbit-pagination-next"]').trigger('click')
    expect(wrapper.emitted('change')).toHaveLength(2)
  })

  it('supports the admin visual variant without changing the event contract', () => {
    const wrapper = mount(OrbitPagination, {
      props: { currentPage: 1, totalPages: 2, variant: 'admin' }
    })

    expect(wrapper.get('[data-test="orbit-pagination"]').classes()).toContain('orbit-pagination--admin')
  })
})
```

- [ ] **Step 2: Run only the new test and confirm it fails for the missing component**

Run:

```powershell
pnpm vitest run src/components/common/OrbitPagination.test.ts
```

Expected: FAIL because `src/components/common/OrbitPagination.vue` does not exist yet.

- [ ] **Step 3: Commit the red test**

```powershell
git add src/components/common/OrbitPagination.test.ts
git diff --cached --check
git commit -m "test(frontend): define orbit pagination contract"
```

---

### Task 2: Implement the reusable OrbitPagination component

**Files:**
- Create: `src/components/common/OrbitPagination.vue`
- Test: `src/components/common/OrbitPagination.test.ts`

- [ ] **Step 1: Implement the minimal component behavior**

Use this interface and behavior:

```vue
<script setup lang="ts">
import { computed } from 'vue'

type OrbitPaginationVariant = 'public' | 'admin'

const props = withDefaults(
  defineProps<{
    currentPage: number
    totalPages: number
    label?: string
    variant?: OrbitPaginationVariant
  }>(),
  {
    label: '文章分页',
    variant: 'public'
  }
)

const emit = defineEmits<{
  change: [page: number]
}>()

const canGoPrevious = computed(() => props.currentPage > 1)
const canGoNext = computed(() => props.currentPage < props.totalPages)

function goToPage(page: number) {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return
  }

  emit('change', page)
}
</script>

<template>
  <nav
    v-if="totalPages > 1"
    class="orbit-pagination"
    :class="`orbit-pagination--${variant}`"
    :aria-label="label"
    data-test="orbit-pagination"
  >
    <button
      class="orbit-pagination__button orbit-pagination__button--previous"
      type="button"
      :disabled="!canGoPrevious"
      :aria-disabled="!canGoPrevious"
      data-test="orbit-pagination-prev"
      @click="goToPage(currentPage - 1)"
    >
      <span aria-hidden="true">←</span>
      <span>上一页</span>
    </button>

    <span class="orbit-pagination__orbit" aria-hidden="true">
      <i class="orbit-pagination__dot orbit-pagination__dot--one" />
      <i class="orbit-pagination__dot orbit-pagination__dot--two" />
      <i class="orbit-pagination__dot orbit-pagination__dot--three" />
    </span>

    <span
      class="orbit-pagination__current"
      aria-current="page"
      data-test="orbit-pagination-current"
    >
      第 {{ currentPage }} / {{ totalPages }} 页
    </span>

    <span class="orbit-pagination__orbit" aria-hidden="true">
      <i class="orbit-pagination__dot orbit-pagination__dot--one" />
      <i class="orbit-pagination__dot orbit-pagination__dot--two" />
      <i class="orbit-pagination__dot orbit-pagination__dot--three" />
    </span>

    <button
      class="orbit-pagination__button orbit-pagination__button--next"
      type="button"
      :disabled="!canGoNext"
      :aria-disabled="!canGoNext"
      data-test="orbit-pagination-next"
      @click="goToPage(currentPage + 1)"
    >
      <span>下一页</span>
      <span aria-hidden="true">→</span>
    </button>
  </nav>
</template>

<style scoped>
.orbit-pagination {
  --orbit-accent: var(--accent);
  --orbit-accent-hover: var(--accent-hover);
  --orbit-accent-soft: var(--accent-soft);
  --orbit-border: var(--border-subtle);
  --orbit-surface: var(--surface-card);
  --orbit-text: var(--text-strong);
  --orbit-muted: var(--text-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  width: 100%;
  margin: 2rem auto 0;
}

.orbit-pagination--admin {
  --orbit-accent: var(--admin-primary);
  --orbit-accent-hover: var(--admin-primary-hover);
  --orbit-accent-soft: color-mix(in srgb, var(--admin-primary) 16%, transparent);
  --orbit-border: var(--admin-border);
  --orbit-surface: var(--admin-surface-solid);
  --orbit-text: var(--admin-text-primary);
  --orbit-muted: var(--admin-text-secondary);
  margin: 0;
}

.orbit-pagination__button,
.orbit-pagination__current {
  position: relative;
  z-index: 1;
  min-height: 2.65rem;
  border: 1px solid var(--orbit-border);
  border-radius: var(--radius-pill);
  background: var(--orbit-surface);
  color: var(--orbit-text);
  font: inherit;
  line-height: 1;
}

.orbit-pagination__button {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.65rem 0.9rem;
  cursor: pointer;
  transition: transform 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
}

.orbit-pagination__button:hover:not(:disabled),
.orbit-pagination__button:focus-visible:not(:disabled) {
  border-color: var(--orbit-accent);
  color: var(--orbit-accent-hover);
  box-shadow: 0 0 0 4px var(--orbit-accent-soft);
  transform: translateY(-1px);
}

.orbit-pagination__button:active:not(:disabled) {
  transform: translateY(0);
}

.orbit-pagination__button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.orbit-pagination__current {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.65rem 1rem;
  border-color: var(--orbit-accent);
  background: var(--orbit-accent);
  color: var(--text-on-accent);
  box-shadow: 0 0.4rem 1.2rem var(--orbit-accent-soft);
  white-space: nowrap;
}

.orbit-pagination__orbit {
  position: relative;
  display: block;
  width: 3.8rem;
  height: 2.2rem;
  border: 1px dashed color-mix(in srgb, var(--orbit-accent) 44%, var(--orbit-border));
  border-radius: 50%;
  transform: rotate(-8deg);
  pointer-events: none;
}

.orbit-pagination__dot {
  position: absolute;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--orbit-accent);
  opacity: 0.72;
}

.orbit-pagination__dot--one { top: -0.18rem; left: 0.62rem; }
.orbit-pagination__dot--two { right: 0.3rem; bottom: 0.18rem; }
.orbit-pagination__dot--three { top: 0.28rem; right: -0.18rem; }

.orbit-pagination:hover .orbit-pagination__dot--one { animation: orbit-drift-one 900ms ease both; }
.orbit-pagination:hover .orbit-pagination__dot--two { animation: orbit-drift-two 900ms ease both; }
.orbit-pagination:hover .orbit-pagination__dot--three { animation: orbit-drift-three 900ms ease both; }

@keyframes orbit-drift-one { to { transform: translate(-0.15rem, -0.08rem); } }
@keyframes orbit-drift-two { to { transform: translate(0.12rem, 0.08rem); } }
@keyframes orbit-drift-three { to { transform: translate(0.08rem, -0.12rem); } }

@media (max-width: 560px) {
  .orbit-pagination { display: grid; grid-template-columns: 1fr auto 1fr; gap: 0.55rem; }
  .orbit-pagination__button { justify-content: center; padding-inline: 0.65rem; }
  .orbit-pagination__button--previous { grid-column: 1; }
  .orbit-pagination__current { grid-column: 2; grid-row: 1; }
  .orbit-pagination__button--next { grid-column: 3; }
  .orbit-pagination__orbit { display: none; }
  .orbit-pagination__button span:nth-child(2) { display: none; }
  .orbit-pagination__button--previous span:first-child::after { content: ' 上一页'; }
  .orbit-pagination__button--next span:last-child::before { content: ' 下一页'; }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-pagination__button,
  .orbit-pagination__dot { transition: none; animation: none !important; }
}
</style>
```

- [ ] **Step 2: Run the component tests and confirm they pass**

Run:

```powershell
pnpm vitest run src/components/common/OrbitPagination.test.ts
```

Expected: all OrbitPagination tests pass.

- [ ] **Step 3: Commit the component**

```powershell
git add src/components/common/OrbitPagination.vue src/components/common/OrbitPagination.test.ts
git diff --cached --check
git commit -m "feat(frontend): add orbit pagination component"
```

---

### Task 3: Integrate all public pagination entry points

**Files:**
- Modify: `src/views/PostListView.vue`
- Modify: `src/views/SearchView.vue`
- Modify: `src/views/PostListView.test.ts`
- Modify: `src/views/SearchView.test.ts`

- [ ] **Step 1: Add failing integration assertions**

In `PostListView.test.ts`, after the existing category assertions, add:

```ts
const pagination = wrapper.get('[data-test="orbit-pagination"]')
expect(pagination.get('[data-test="orbit-pagination-next"]').exists()).toBe(true)
await pagination.get('[data-test="orbit-pagination-next"]').trigger('click')
await flushPromises()
expect(getCategoryPosts).toHaveBeenLastCalledWith('go', { page: 2, pageSize: 9 })
```

In `SearchView.test.ts`, change the mocked result from `total: 0` to `total: 20`, then add after the first request assertion:

```ts
const pagination = wrapper.get('[data-test="orbit-pagination"]')
await pagination.get('[data-test="orbit-pagination-next"]').trigger('click')
await flushPromises()
expect(searchPosts).toHaveBeenLastCalledWith({ q: 'mysql', page: 2, pageSize: 9 })
```

Run:

```powershell
pnpm vitest run src/views/PostListView.test.ts src/views/SearchView.test.ts
```

Expected: FAIL because both views still render `.pagination-bar` instead of `OrbitPagination`.

- [ ] **Step 2: Replace the public markup and import the component**

In both views, add:

```ts
import OrbitPagination from '../components/common/OrbitPagination.vue'
```

Replace each public `<nav class="pagination-bar">...</nav>` block with:

```vue
<OrbitPagination
  v-if="page && page.total > pageSize"
  :current-page="currentPage"
  :total-pages="totalPages"
  label="文章分页"
  @change="goToPage"
/>
```

For `SearchView.vue`, use `result` and `label="搜索分页"`:

```vue
<OrbitPagination
  v-if="result && result.total > pageSize"
  :current-page="currentPage"
  :total-pages="totalPages"
  label="搜索分页"
  @change="goToPage"
/>
```

Do not change `goToPage`, `loadPosts`, `loadSearch`, `pageSize`, or the API request shape.

- [ ] **Step 3: Run the public integration tests**

Run:

```powershell
pnpm vitest run src/views/PostListView.test.ts src/views/SearchView.test.ts
```

Expected: all existing and new public pagination assertions pass.

- [ ] **Step 4: Commit the public integration**

```powershell
git add src/views/PostListView.vue src/views/SearchView.vue src/views/PostListView.test.ts src/views/SearchView.test.ts
git diff --cached --check
git commit -m "feat(frontend): apply orbit pagination to public lists"
```

---

### Task 4: Integrate admin article and comment pagination

**Files:**
- Modify: `src/views/admin/AdminPostsView.vue`
- Modify: `src/views/admin/AdminCommentsView.vue`
- Modify: `src/styles/admin.css` only if the existing wrapper prevents the shared component from using the full panel width.

- [ ] **Step 1: Add the shared component imports and total-page computations**

In both admin views, add:

```ts
import OrbitPagination from '../../components/common/OrbitPagination.vue'
import { computed } from 'vue'
```

For `AdminPostsView.vue`, add:

```ts
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / pageSize.value)))
```

For `AdminCommentsView.vue`, preserve its existing `pageSize` and `total` refs and add the same computed expression using those refs.

- [ ] **Step 2: Replace Element Plus pagination without changing request behavior**

Replace the `<el-pagination ... />` in `AdminPostsView.vue` with:

```vue
<OrbitPagination
  v-if="total > pageSize"
  :current-page="page"
  :total-pages="totalPages"
  label="文章管理分页"
  variant="admin"
  @change="changePage"
/>
```

Replace the `<el-pagination ... />` in `AdminCommentsView.vue` with:

```vue
<OrbitPagination
  v-if="total > pageSize"
  :current-page="page"
  :total-pages="totalPages"
  label="评论管理分页"
  variant="admin"
  @change="changePage"
/>
```

Keep the existing `changePage(nextPage)` handlers and `loadPosts`/`loadComments` calls. Do not remove `pageSize`; it remains the API query size.

- [ ] **Step 3: Run type checking and the full test suite**

Run:

```powershell
pnpm test
pnpm build
```

Expected: Vitest exits 0 and `vue-tsc --noEmit && vite build` exits 0.

- [ ] **Step 4: Commit the admin integration**

```powershell
git add src/views/admin/AdminPostsView.vue src/views/admin/AdminCommentsView.vue src/styles/admin.css
 git diff --cached --check
git commit -m "feat(frontend): apply orbit pagination to admin lists"
```

---

### Task 5: Browser QA and final verification

**Files:**
- Verify: `src/components/common/OrbitPagination.vue`
- Verify: all four migrated views and their tests

- [ ] **Step 1: Start the frontend dev server**

Run:

```powershell
pnpm dev
```

Open the printed local URL and inspect:

- `/posts` or the current article list route;
- a category route;
- a tag route;
- `/search` after searching for a keyword;
- `/admin/posts`;
- `/admin/comments`.

- [ ] **Step 2: Check the required visual states**

Confirm manually:

- page 1 disables only the previous button;
- the last page disables only the next button;
- the current page uses the blue orbit capsule;
- the orbit dots and dashed ellipse do not intercept clicks;
- narrow viewport keeps all controls visible without horizontal scroll;
- dark mode inherits readable contrast;
- reduced-motion setting disables decorative animation;
- keyboard focus is visible and Enter/Space activates buttons.

- [ ] **Step 3: Run final verification from a clean staged diff**

Run:

```powershell
pnpm test
pnpm build
git status --short
git diff --check
```

Expected: tests/build exit 0; `git status --short` contains only intentional frontend source/test changes plus any pre-existing untracked files; no `node_modules`, `dist`, `.vite`, coverage, logs, databases, uploads, `.env`, or secrets are staged.

- [ ] **Step 4: Push each completed frontend commit**

For each implementation commit after verification:

```powershell
git push origin master
git push gitee master
```

The final response should list the files changed, tests/build results, commit hashes, and whether both frontend remotes received the commits.
