import type { App } from 'vue'

let adminRuntimePromise: Promise<void> | null = null

/** Load Element Plus + admin CSS once, only when entering /admin. */
export function ensureAdminRuntime(app: App): Promise<void> {
  if (!adminRuntimePromise) {
    adminRuntimePromise = (async () => {
      const [{ default: ElementPlus }] = await Promise.all([
        import('element-plus'),
        import('element-plus/dist/index.css'),
        import('element-plus/theme-chalk/dark/css-vars.css'),
        import('../styles/admin.css')
      ])
      app.use(ElementPlus)
    })()
  }

  return adminRuntimePromise
}
