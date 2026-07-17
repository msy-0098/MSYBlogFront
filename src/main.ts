import { createPinia } from 'pinia'
import { createApp } from 'vue'

import App from './App.vue'
import { ensureAdminRuntime } from './plugins/adminRuntime'
import { installAdminUnauthorizedRedirect, router } from './router'
import { useAuthStore } from './stores/auth'
import { initTheme } from './utils/theme'
// global first, public-theme last so dark tokens win over legacy hardcoded colors
import './styles/global.css'
import './styles/public-theme.css'

initTheme()

const pinia = createPinia()
const app = createApp(App)

app.use(pinia).use(router)

// Admin-only UI kit + CSS: keep public first paint free of Element Plus.
router.beforeEach(async (to) => {
  if (!to.path.startsWith('/admin')) {
    return true
  }

  await ensureAdminRuntime(app)
  return true
})

app.mount('#app')

installAdminUnauthorizedRedirect(router, () => {
  void useAuthStore().logout(false)
})
