import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminSettingsView from './AdminSettingsView.vue'

const getAdminSettings = vi.fn()
const updateAdminSettings = vi.fn()
const changeAdminPassword = vi.fn()

vi.mock('../../api/admin', () => ({
  getAdminSettings: () => getAdminSettings(),
  updateAdminSettings: (payload: unknown) => updateAdminSettings(payload),
  changeAdminPassword: (payload: unknown) => changeAdminPassword(payload)
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: {
      error: vi.fn(),
      success: vi.fn()
    }
  }
})

describe('AdminSettingsView', () => {
  beforeEach(() => {
    getAdminSettings.mockReset()
    updateAdminSettings.mockReset()
    changeAdminPassword.mockReset()
    vi.mocked(ElMessage.error).mockReset()
  })

  it('edits and saves navigation items', async () => {
    getAdminSettings.mockResolvedValue({
      siteTitle: 'Blog',
      subtitle: 'Notes',
      owner: 'Admin',
      domain: 'example.com',
      description: 'Personal site',
      github: '',
      gitee: '',
      email: '',
      icp: '',
      navItems: 'Home,Posts'
    })
    updateAdminSettings.mockResolvedValue({})

    const wrapper = mount(AdminSettingsView, {
      global: {
        plugins: [ElementPlus]
      }
    })
    await flushPromises()

    const navInput = wrapper.find('[data-test="settings-nav-items-input"] input')
    await navInput.setValue('Home,Posts,Projects')
    await wrapper.find('[data-test="settings-save-button"]').trigger('click')

    expect(updateAdminSettings).toHaveBeenCalledWith(
      expect.objectContaining({
        navItems: 'Home,Posts,Projects'
      })
    )
  })

  it('shows the actual AI runtime configuration without exposing the API key', async () => {
    getAdminSettings.mockResolvedValue({
      siteTitle: 'Blog',
      subtitle: 'Notes',
      owner: 'Admin',
      domain: 'example.com',
      description: 'Personal site',
      github: '',
      gitee: '',
      email: '',
      icp: '',
      navItems: 'Home,Posts',
      aiProvider: 'deepseek',
      aiModel: 'deepseek-chat',
      aiBaseURL: 'https://api.deepseek.com',
      aiConfigured: 'true'
    })

    const wrapper = mount(AdminSettingsView, {
      global: {
        plugins: [ElementPlus]
      }
    })
    await flushPromises()

    const runtime = wrapper.find('[data-test="admin-runtime-config"]')
    expect(runtime.text()).toContain('deepseek')
    expect(runtime.text()).toContain('deepseek-chat')
    expect(runtime.text()).toContain('https://api.deepseek.com')
    expect(runtime.text()).toContain('API Key')
  })

  it('submits password change after confirmation matches', async () => {
    getAdminSettings.mockResolvedValue({
      siteTitle: 'Blog',
      subtitle: 'Notes',
      owner: 'Admin',
      domain: 'example.com',
      description: 'Personal site',
      github: '',
      gitee: '',
      email: '',
      icp: '',
      navItems: 'Home,Posts'
    })
    changeAdminPassword.mockResolvedValue({ updated: true })

    const wrapper = mount(AdminSettingsView, {
      global: {
        plugins: [ElementPlus]
      }
    })
    await flushPromises()

    await wrapper.find('[data-test="settings-current-password"] input').setValue('old-password')
    await wrapper.find('[data-test="settings-new-password"] input').setValue('new-password')
    await wrapper.find('[data-test="settings-confirm-password"] input').setValue('new-password')
    await wrapper.find('[data-test="settings-password-save"]').trigger('click')
    await flushPromises()

    expect(changeAdminPassword).toHaveBeenCalledWith({
      currentPassword: 'old-password',
      newPassword: 'new-password'
    })
  })

  it('shows a normalized friendly message when saving settings fails', async () => {
    getAdminSettings.mockResolvedValue({
      siteTitle: 'Blog', subtitle: 'Notes', owner: 'Admin', domain: 'example.com', description: 'Personal site',
      github: '', gitee: '', email: '', icp: '', navItems: 'Home,Posts'
    })
    updateAdminSettings.mockRejectedValue({ response: { status: 500, data: { code: 500 } } })

    const wrapper = mount(AdminSettingsView, { global: { plugins: [ElementPlus] } })
    await flushPromises()
    await wrapper.find('[data-test="settings-save-button"]').trigger('click')
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('服务暂时不可用，请稍后再试')
  })

  it('shows discovery links for rss sitemap and robots', async () => {
    getAdminSettings.mockResolvedValue({
      siteTitle: 'Blog',
      subtitle: 'Notes',
      owner: 'Admin',
      domain: 'example.com',
      description: 'Personal site',
      github: '',
      gitee: '',
      email: '',
      icp: '',
      navItems: 'Home,Posts'
    })

    const wrapper = mount(AdminSettingsView, {
      global: {
        plugins: [ElementPlus]
      }
    })
    await flushPromises()

    const discovery = wrapper.find('[data-test="admin-discovery-links"]')
    expect(discovery.text()).toContain('/api/rss.xml')
    expect(discovery.text()).toContain('/api/sitemap.xml')
    expect(discovery.text()).toContain('/robots.txt')
  })
})
