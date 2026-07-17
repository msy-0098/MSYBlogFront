import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig } from 'vitest/config'

const apiProxyTarget = process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:8080'

export default defineConfig({
  plugins: [vue()],
  server: {
    host: '127.0.0.1',
    port: 5173,
    proxy: {
      '/api': {
        target: apiProxyTarget,
        changeOrigin: true
      }
    }
  },
  build: {
    // Keep public entry lean; heavy admin / markdown code stays in separate chunks.
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return
          }
          if (id.includes('element-plus') || id.includes('@element-plus')) {
            return 'element-plus'
          }
          if (id.includes('markdown-it') || id.includes('highlight.js')) {
            return 'markdown'
          }
          if (id.includes('axios')) {
            return 'axios'
          }
          if (
            id.includes('/vue/') ||
            id.includes('\\vue\\') ||
            id.includes('vue-router') ||
            id.includes('pinia')
          ) {
            return 'vue-vendor'
          }
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    exclude: [...configDefaults.exclude, '**/.worktrees/**']
  }
})
