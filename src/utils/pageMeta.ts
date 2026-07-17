export function setPageMeta(options: { title?: string; description?: string }) {
  if (typeof document === 'undefined') return

  const title = options.title?.trim()
  if (title) {
    document.title = title
  }

  const description = options.description?.trim()
  if (description) {
    let meta = document.querySelector('meta[name="description"]')
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)
  }
}

export function setDefaultPageMeta() {
  setPageMeta({
    title: '马森雨的技术博客',
    description: '用 Go、Vue 和 AI 工具记录项目实践、技术复盘与持续成长。'
  })
}