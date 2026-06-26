import { mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '../../stores/auth'
import AdminLoginView from './AdminLoginView.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn()
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      warning: vi.fn()
    }
  }
})

describe('AdminLoginView', () => {
  beforeEach(() => {
    const pinia = createPinia()
    setActivePinia(pinia)
  })

  it('falls back to the admin dashboard for unsafe redirects', async () => {
    const push = vi.fn()
    vi.mocked(useRoute).mockReturnValue({
      query: {
        redirect: 'https://example.com/phishing'
      }
    } as unknown as ReturnType<typeof useRoute>)
    vi.mocked(useRouter).mockReturnValue({
      push
    } as unknown as ReturnType<typeof useRouter>)

    const authStore = useAuthStore()
    authStore.login = vi.fn().mockResolvedValue(undefined)

    const wrapper = mount(AdminLoginView, {
      global: {
        plugins: [ElementPlus]
      }
    })

    await wrapper.find('input[autocomplete="username"]').setValue('admin')
    await wrapper.find('input[autocomplete="current-password"]').setValue('password')
    await wrapper.find('form').trigger('submit')

    expect(push).toHaveBeenCalledWith('/admin')
  })
})
