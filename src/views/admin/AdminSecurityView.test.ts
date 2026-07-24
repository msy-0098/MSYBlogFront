import { flushPromises, mount } from '@vue/test-utils'
import ElementPlus, { ElMessage, ElMessageBox } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import AdminSecurityView from './AdminSecurityView.vue'

const createAdminBan = vi.fn()
const getAdminAnalytics = vi.fn()
const removeAdminBan = vi.fn()

vi.mock('../../api/admin', () => ({
  createAdminBan: (...args: unknown[]) => createAdminBan(...args),
  getAdminAnalytics: (...args: unknown[]) => getAdminAnalytics(...args),
  removeAdminBan: (...args: unknown[]) => removeAdminBan(...args)
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')

  return {
    ...actual,
    ElMessage: { error: vi.fn(), success: vi.fn(), warning: vi.fn() },
    ElMessageBox: { confirm: vi.fn() }
  }
})

const analytics = {
  totalRequests: 1,
  todayRequests: 1,
  uniqueIPs: 1,
  failedRequests: 0,
  topIPs: [],
  recentBans: [{ id: 7, ip: '203.0.113.10', reason: 'manual', expiresAt: '2026-07-25T00:00:00Z', active: true }]
}

function findUnbanButton(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll('button').find((button) => button.text() === '解除')
}

describe('AdminSecurityView', () => {
  beforeEach(() => {
    createAdminBan.mockReset()
    getAdminAnalytics.mockReset()
    removeAdminBan.mockReset()
    vi.mocked(ElMessage.error).mockReset()
    vi.mocked(ElMessageBox.confirm).mockReset()
    getAdminAnalytics.mockResolvedValue(analytics)
  })

  it('silently ignores a cancelled unban confirmation', async () => {
    vi.mocked(ElMessageBox.confirm).mockRejectedValue('cancel')
    const wrapper = mount(AdminSecurityView, { global: { plugins: [ElementPlus] } })
    await flushPromises()

    const unbanButton = findUnbanButton(wrapper)
    expect(unbanButton).toBeDefined()
    await unbanButton?.trigger('click')
    await flushPromises()

    expect(removeAdminBan).not.toHaveBeenCalled()
    expect(ElMessage.error).not.toHaveBeenCalled()
  })

  it('shows a friendly error when the unban request fails after confirmation', async () => {
    vi.mocked(ElMessageBox.confirm).mockResolvedValue(undefined as never)
    removeAdminBan.mockRejectedValue({ response: { status: 500, data: { code: 500 } } })
    const wrapper = mount(AdminSecurityView, { global: { plugins: [ElementPlus] } })
    await flushPromises()

    await findUnbanButton(wrapper)?.trigger('click')
    await flushPromises()

    expect(removeAdminBan).toHaveBeenCalledWith(7)
    expect(ElMessage.error).toHaveBeenCalledWith('服务暂时不可用，请稍后再试')
  })
})
