import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
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

const route = reactive({
  path: '/admin',
  fullPath: '/admin'
})

const ElDrawerStub = {
  name: 'ElDrawer',
  props: {
    modelValue: Boolean,
    title: String,
    withHeader: Boolean
  },
  template: '<aside v-if="modelValue"><slot /></aside>'
}

function mountLayout() {
  return mount(AdminLayout, {
    global: {
      stubs: {
        ElAside: { template: '<aside><slot /></aside>' },
        ElButton: { template: '<button><slot /></button>' },
        ElContainer: { template: '<section><slot /></section>' },
        ElDrawer: ElDrawerStub,
        ElHeader: { template: '<header><slot /></header>' },
        ElIcon: { template: '<i><slot /></i>' },
        ElMain: { template: '<main><slot /></main>' },
        ElMenu: { template: '<nav><slot /></nav>' },
        ElMenuItem: { template: '<button type="button"><slot /></button>' },
        RouterLink: { template: '<a><slot /></a>' },
        RouterView: { template: '<div />' }
      }
    }
  })
}

describe('AdminLayout', () => {
  beforeEach(() => {
    route.path = '/admin'
    route.fullPath = '/admin'
    vi.mocked(useRoute).mockReturnValue(route as ReturnType<typeof useRoute>)
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

  it('renders the grouped administration navigation', () => {
    const wrapper = mountLayout()

    expect(wrapper.findAll('.admin-nav-group-title').map((group) => group.text())).toEqual([
      '概览',
      '内容',
      '互动',
      '智能工具',
      '系统'
    ])
    expect(wrapper.text()).toContain('AI 助手')
  })

  it('exposes an accessible mobile menu button', () => {
    const wrapper = mountLayout()
    const button = wrapper.get('[data-test="admin-mobile-menu"]')

    expect(button.attributes('aria-label')).toBe('打开管理导航')
    expect(button.attributes('aria-expanded')).toBe('false')
  })

  it('opens the mobile navigation drawer from the mobile menu button', async () => {
    const wrapper = mountLayout()
    const drawer = wrapper.findComponent({ name: 'ElDrawer' })
    const button = wrapper.get('[data-test="admin-mobile-menu"]')

    expect(drawer.props('modelValue')).toBe(false)

    await button.trigger('click')

    expect(drawer.props('modelValue')).toBe(true)
    expect(button.attributes('aria-expanded')).toBe('true')
  })

  it('supplies a title to the headerless mobile drawer', () => {
    const wrapper = mountLayout()
    const drawer = wrapper.findComponent({ name: 'ElDrawer' })

    expect(drawer.props('withHeader')).toBe(false)
    expect(drawer.props('title')).toBe('管理导航')
  })

  it('closes the mobile navigation drawer when only the full path changes', async () => {
    const wrapper = mountLayout()
    const drawer = wrapper.findComponent({ name: 'ElDrawer' })

    await wrapper.get('[data-test="admin-mobile-menu"]').trigger('click')
    expect(drawer.props('modelValue')).toBe(true)

    route.fullPath = '/admin?tab=posts'
    await nextTick()

    expect(route.path).toBe('/admin')
    expect(drawer.props('modelValue')).toBe(false)
  })

  it('keeps tablet sidebar controls labelled when their visible text is hidden', () => {
    const wrapper = mountLayout()
    const sidebar = wrapper.get('[data-test="admin-sidebar"]')

    const brand = sidebar.get('.admin-brand')
    expect(brand.attributes('aria-label')).toBe('博客管理台首页')
    expect(brand.attributes('title')).toBe('博客管理台')

    const navigationItems = sidebar.findAll('.admin-menu button')
    expect(navigationItems).not.toHaveLength(0)
    for (const item of navigationItems) {
      expect(item.attributes('aria-label')).toBeTruthy()
      expect(item.attributes('title')).toBeTruthy()
    }

    const logout = sidebar.get('.admin-logout-btn')
    expect(logout.attributes('aria-label')).toBe('退出登录')
    expect(logout.attributes('title')).toBe('退出登录')
  })

  it('closes the mobile navigation drawer after a navigation item is clicked', async () => {
    const wrapper = mountLayout()
    const drawer = wrapper.findComponent({ name: 'ElDrawer' })

    await wrapper.get('[data-test="admin-mobile-menu"]').trigger('click')
    await wrapper.get('[data-test="admin-mobile-nav"] .admin-mobile-menu-item').trigger('click')

    expect(drawer.props('modelValue')).toBe(false)
  })

  it('does not render the non-interactive mock search control', () => {
    const wrapper = mountLayout()

    expect(wrapper.find('.mock-search-bar').exists()).toBe(false)
  })
  it('renders AI 助手 as an enabled navigation destination instead of a placeholder', () => {
    const wrapper = mountLayout()
    const aiItem = wrapper.findAll('.admin-menu button').find((item) => item.text().includes('AI 助手'))

    expect(aiItem?.attributes('disabled')).toBeUndefined()
    expect(aiItem?.text()).not.toContain('即将推出')
  })
})
