import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useRoute, useRouter } from 'vue-router'

import AdminLayout from './AdminLayout.vue'
import { useAuthStore } from '../../stores/auth'

vi.mock('vue-router', () => ({
  useRoute: vi.fn(),
  useRouter: vi.fn()
}))

vi.mock('../../stores/auth', () => ({
  useAuthStore: vi.fn()
}))

const authStore = {
  token: '',
  user: {
    username: 'admin',
    nickname: 'Admin',
    email: 'admin@example.com'
  },
  loadProfile: vi.fn(),
  logout: vi.fn()
}

function mountLayout() {
  return mount(AdminLayout, {
    global: {
      stubs: {
        ElAside: { template: '<aside><slot /></aside>' },
        ElButton: { template: '<button><slot /></button>' },
        ElContainer: { template: '<section><slot /></section>' },
        ElHeader: { template: '<header><slot /></header>' },
        ElIcon: { template: '<i><slot /></i>' },
        ElMain: { template: '<main><slot /></main>' },
        ElMenu: { template: '<nav><slot /></nav>' },
        ElMenuItem: { template: '<a><slot /></a>' },
        RouterLink: { template: '<a><slot /></a>' },
        RouterView: { template: '<div />' }
      }
    }
  })
}

describe('AdminLayout', () => {
  beforeEach(() => {
    vi.mocked(useRoute).mockReturnValue({ path: '/admin' } as ReturnType<typeof useRoute>)
    vi.mocked(useRouter).mockReturnValue({ push: vi.fn() } as unknown as ReturnType<typeof useRouter>)
    vi.mocked(useAuthStore).mockReturnValue(authStore as unknown as ReturnType<typeof useAuthStore>)
  })

  it.each([
    ['shell', '[data-test="admin-shell"]'],
    ['sidebar', '[data-test="admin-sidebar"]'],
    ['topbar', '[data-test="admin-topbar"]']
  ])('exposes the admin %s hook', (_name, selector) => {
    const wrapper = mountLayout()

    expect(wrapper.find(selector).exists()).toBe(true)
  })

  it('does not render the non-interactive mock search control', () => {
    const wrapper = mountLayout()

    expect(wrapper.find('.mock-search-bar').exists()).toBe(false)
  })
})
