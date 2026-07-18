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
    <div class="orbit-pagination__side orbit-pagination__side--previous">
      <span class="orbit-pagination__orbit" aria-hidden="true">
        <span class="orbit-pagination__dot orbit-pagination__dot--one"></span>
        <span class="orbit-pagination__dot orbit-pagination__dot--two"></span>
        <span class="orbit-pagination__dot orbit-pagination__dot--three"></span>
      </span>
      <button
        class="orbit-pagination__button orbit-pagination__button--previous"
        type="button"
        :disabled="!canGoPrevious"
        :aria-disabled="!canGoPrevious"
        aria-label="上一页"
        data-test="orbit-pagination-prev"
        @click="goToPage(currentPage - 1)"
      >
        <span class="orbit-pagination__button-icon" aria-hidden="true">←</span>
        <span class="orbit-pagination__button-label orbit-pagination__button-label--long">上一篇</span>
        <span class="orbit-pagination__button-label orbit-pagination__button-label--short">上一页</span>
      </button>
    </div>

    <span
      class="orbit-pagination__current"
      aria-current="page"
      data-test="orbit-pagination-current"
    >
      第 {{ currentPage }} / {{ totalPages }} 页
    </span>

    <div class="orbit-pagination__side orbit-pagination__side--next">
      <button
        class="orbit-pagination__button orbit-pagination__button--next"
        type="button"
        :disabled="!canGoNext"
        :aria-disabled="!canGoNext"
        aria-label="下一页"
        data-test="orbit-pagination-next"
        @click="goToPage(currentPage + 1)"
      >
        <span class="orbit-pagination__button-label orbit-pagination__button-label--long">下一篇</span>
        <span class="orbit-pagination__button-label orbit-pagination__button-label--short">下一页</span>
        <span class="orbit-pagination__button-icon" aria-hidden="true">→</span>
      </button>
      <span class="orbit-pagination__orbit orbit-pagination__orbit--next" aria-hidden="true">
        <span class="orbit-pagination__dot orbit-pagination__dot--one"></span>
        <span class="orbit-pagination__dot orbit-pagination__dot--two"></span>
        <span class="orbit-pagination__dot orbit-pagination__dot--three"></span>
      </span>
    </div>
  </nav>
</template>

<style scoped>
.orbit-pagination {
  --orbit-accent: var(--accent);
  --orbit-accent-hover: var(--accent-hover);
  --orbit-accent-soft: var(--accent-soft);
  --orbit-border: var(--border-subtle);
  --orbit-surface: var(--surface-elevated);
  --orbit-text: var(--text-body);
  --orbit-muted: var(--text-muted);
  --orbit-shadow: var(--shadow-soft);

  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(0.55rem, 2vw, 1rem);
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  overflow: hidden;
  color: var(--orbit-text);
}

.orbit-pagination--admin {
  --orbit-accent: var(--admin-primary);
  --orbit-accent-hover: var(--admin-primary-hover);
  --orbit-accent-soft: color-mix(in srgb, var(--admin-primary) 18%, transparent);
  --orbit-border: var(--admin-border);
  --orbit-surface: var(--admin-surface-solid);
  --orbit-text: var(--admin-text-primary);
  --orbit-muted: var(--admin-text-secondary);
  --orbit-shadow: var(--admin-shadow-sm);
}

.orbit-pagination__side {
  display: flex;
  align-items: center;
  flex: 1 1 0;
  gap: clamp(0.45rem, 1.5vw, 0.85rem);
  min-width: 0;
}

.orbit-pagination__side--previous {
  justify-content: flex-end;
}

.orbit-pagination__side--next {
  justify-content: flex-start;
}

.orbit-pagination__button,
.orbit-pagination__current {
  position: relative;
  z-index: 1;
  border: 1px solid var(--orbit-border);
  border-radius: var(--radius-pill);
  font: inherit;
  line-height: 1.2;
}

.orbit-pagination__button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  min-width: 0;
  padding: 0.62rem 0.85rem;
  background: var(--orbit-surface);
  color: var(--orbit-text);
  cursor: pointer;
  box-shadow: 0 0.35rem 1rem color-mix(in srgb, var(--orbit-border) 28%, transparent);
  transition:
    transform 180ms ease,
    border-color 180ms ease,
    background-color 180ms ease,
    color 180ms ease,
    box-shadow 180ms ease;
}

.orbit-pagination__button:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: var(--orbit-accent);
  background: color-mix(in srgb, var(--orbit-accent-soft) 38%, var(--orbit-surface));
  color: var(--orbit-accent-hover);
  box-shadow: var(--orbit-shadow);
}

.orbit-pagination__button:active:not(:disabled) {
  transform: translateY(0);
}

.orbit-pagination__button:focus-visible,
.orbit-pagination__current:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--orbit-accent) 36%, transparent);
  outline-offset: 3px;
}

.orbit-pagination__button:disabled {
  cursor: not-allowed;
  opacity: 0.42;
}

.orbit-pagination__button-icon {
  color: var(--orbit-accent);
  font-size: 1.05em;
}

.orbit-pagination__button-label--short {
  display: none;
}

.orbit-pagination__current {
  display: inline-flex;
  flex: 0 1 auto;
  align-items: center;
  justify-content: center;
  max-width: 100%;
  padding: 0.68rem 1rem;
  overflow: hidden;
  background: var(--orbit-accent);
  color: var(--text-on-accent);
  white-space: nowrap;
  box-shadow: 0 0.4rem 1.2rem var(--orbit-accent-soft);
}

.orbit-pagination__orbit {
  position: relative;
  display: block;
  flex: 0 0 3.8rem;
  width: 3.8rem;
  height: 2.2rem;
  border: 1px dashed color-mix(in srgb, var(--orbit-accent) 44%, var(--orbit-border));
  border-radius: 50%;
  transform: rotate(-8deg);
  pointer-events: none;
}

.orbit-pagination__orbit--next {
  transform: rotate(8deg);
}

.orbit-pagination__dot {
  position: absolute;
  width: 0.4rem;
  height: 0.4rem;
  border-radius: 50%;
  background: var(--orbit-accent);
  opacity: 0.72;
  pointer-events: none;
}

.orbit-pagination__dot--one {
  top: -0.18rem;
  left: 0.62rem;
}

.orbit-pagination__dot--two {
  right: 0.3rem;
  bottom: 0.18rem;
}

.orbit-pagination__dot--three {
  top: 0.28rem;
  right: -0.18rem;
}

.orbit-pagination:hover .orbit-pagination__dot--one {
  animation: orbit-drift-one 900ms ease both;
}

.orbit-pagination:hover .orbit-pagination__dot--two {
  animation: orbit-drift-two 900ms ease both;
}

.orbit-pagination:hover .orbit-pagination__dot--three {
  animation: orbit-drift-three 900ms ease both;
}

@keyframes orbit-drift-one {
  to {
    transform: translate(-0.15rem, -0.08rem);
  }
}

@keyframes orbit-drift-two {
  to {
    transform: translate(0.12rem, 0.08rem);
  }
}

@keyframes orbit-drift-three {
  to {
    transform: translate(0.08rem, -0.12rem);
  }
}

@media (max-width: 640px) {
  .orbit-pagination {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
    gap: 0.55rem;
    padding-inline: 0.25rem;
  }

  .orbit-pagination__side {
    gap: 0.4rem;
  }

  .orbit-pagination__orbit {
    display: none;
  }

  .orbit-pagination__button {
    width: 100%;
    padding-inline: 0.65rem;
  }

  .orbit-pagination__button-label--long {
    display: none;
  }

  .orbit-pagination__button-label--short {
    display: inline;
  }

  .orbit-pagination__side--previous {
    grid-column: 1;
  }

  .orbit-pagination__current {
    grid-column: 2;
    grid-row: 1;
    padding-inline: 0.7rem;
    font-size: 0.92rem;
  }

  .orbit-pagination__side--next {
    grid-column: 3;
  }
}

@media (max-width: 360px) {
  .orbit-pagination {
    gap: 0.35rem;
  }

  .orbit-pagination__button {
    gap: 0.25rem;
    padding-inline: 0.45rem;
  }

  .orbit-pagination__current {
    padding-inline: 0.55rem;
    font-size: 0.86rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .orbit-pagination__button,
  .orbit-pagination__dot {
    transition: none;
    animation: none !important;
  }
}
</style>
