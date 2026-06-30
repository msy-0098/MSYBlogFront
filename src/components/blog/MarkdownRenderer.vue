<script setup lang="ts">
import hljs from 'highlight.js/lib/common'
import MarkdownIt from 'markdown-it'
import { computed } from 'vue'

const props = defineProps<{
  content: string
}>()

const markdown: MarkdownIt = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  highlight(code: string, language: string): string {
    const canHighlight = language && hljs.getLanguage(language)
    if (canHighlight) {
      return hljs.highlight(code, { language }).value
    }

    return escapeHtml(code)
  }
})

type RenderRule = NonNullable<(typeof markdown.renderer.rules)['link_open']>

const fallbackRender: RenderRule = (tokens, index, options, _env, self) =>
  self.renderToken(tokens, index, options)

const defaultRender: RenderRule =
  markdown.renderer.rules.link_open ??
  fallbackRender
const defaultImageRender: RenderRule =
  markdown.renderer.rules.image ??
  fallbackRender

markdown.renderer.rules.link_open = (tokens, index, options, env, self) => {
  const token = tokens[index]
  const href = token.attrGet('href') ?? ''

  if (/^https?:\/\//.test(href)) {
    token.attrSet('target', '_blank')
    token.attrSet('rel', 'noreferrer')
  }

  return defaultRender(tokens, index, options, env, self)
}

markdown.renderer.rules.image = (tokens, index, options, env, self) => {
  const token = tokens[index]
  token.attrSet('loading', 'lazy')
  token.attrSet('decoding', 'async')

  return defaultImageRender(tokens, index, options, env, self)
}

const rendered = computed(() => markdown.render(props.content || ''))

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
</script>

<template>
  <article class="markdown-body" v-html="rendered" />
</template>
