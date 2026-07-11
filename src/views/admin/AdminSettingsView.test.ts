import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus from 'element-plus'
import { describe, expect, it, vi } from 'vitest'

import AdminSettingsView from './AdminSettingsView.vue'

const getAdminSettings = vi.fn()
const updateAdminSettings = vi.fn()

vi.mock('../../api/admin', () => ({
  getAdminSettings: () => getAdminSettings(),
  updateAdminSettings: (payload: unknown) => updateAdminSettings(payload)
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
})
