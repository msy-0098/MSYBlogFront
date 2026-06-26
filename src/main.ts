import { createPinia } from 'pinia'
import { createApp } from 'vue'
import ElementPlus from 'element-plus'

import App from './App.vue'
import { installAdminUnauthorizedRedirect, router } from './router'
import { useAuthStore } from './stores/auth'
import 'element-plus/dist/index.css'
import './styles/global.css'

const pinia = createPinia()

createApp(App).use(pinia).use(ElementPlus).use(router).mount('#app')

installAdminUnauthorizedRedirect(router, () => {
  useAuthStore().logout()
})
