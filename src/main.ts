import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

import App from './App.vue'
import { installAdminUnauthorizedRedirect, router } from './router'
import { useAuthStore } from './stores/auth'
import { initTheme } from './utils/theme'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
// global first, public-theme last so dark tokens win over legacy hardcoded colors
import './styles/global.css'
import './styles/public-theme.css'

initTheme()

const pinia = createPinia()

createApp(App).use(pinia).use(ElementPlus).use(router).mount('#app')

installAdminUnauthorizedRedirect(router, () => {
  void useAuthStore().logout(false)
})