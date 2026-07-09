import MarkdownIt from 'markdown-it'

const markdown = new MarkdownIt({
  html: false,
  linkify: false,
  typographer: false
})

export interface MarkdownHeading {
  id: string
  level: 2 | 3
  text: string
}

interface InlineChildToken {
  content: string
  type: string
}

interface InlineToken {
  content: string
  children?: InlineChildToken[]
}

export function extractMarkdownHeadings(content: string): MarkdownHeading[] {
  const headings: MarkdownHeading[] = []
  const slugCounts = new Map<string, number>()
  const tokens = markdown.parse(content || '', {})

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token.type !== 'heading_open') {
      continue
    }

    const level = Number(token.tag.slice(1))
    if (level !== 2 && level !== 3) {
      continue
    }

    const inlineToken = tokens[index + 1] as InlineToken | undefined
    if (!inlineToken || tokens[index + 1]?.type !== 'inline') {
      continue
    }

    const text = getInlineText(inlineToken).trim()
    if (!text) {
      continue
    }

    headings.push({
      id: createStableHeadingId(text, slugCounts),
      level,
      text
    })
  }

  return headings
}

function getInlineText(token: InlineToken): string {
  if (!token.children?.length) {
    return token.content
  }

  return token.children
    .map((child) => {
      if (child.type === 'softbreak' || child.type === 'hardbreak') {
        return ' '
      }

      return child.content
    })
    .join('')
}

function createStableHeadingId(text: string, slugCounts: Map<string, number>): string {
  const baseId = slugifyHeading(text) || 'section'
  const nextCount = (slugCounts.get(baseId) ?? 0) + 1

  slugCounts.set(baseId, nextCount)

  return nextCount === 1 ? baseId : `${baseId}-${nextCount}`
}

function slugifyHeading(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, '')
    .trim()
    .replace(/[-\s]+/g, '-')
}
