import { flushPromises, mount } from '@vue/test-utils'
import { ElMessage } from 'element-plus'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../api/admin', () => ({
  getAdminDashboard: vi.fn(),
  chatWithAdminAI: vi.fn()
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual<typeof import('element-plus')>('element-plus')
  return { ...actual, ElMessage: { error: vi.fn() } }
})

import { getAdminDashboard } from '../../api/admin'
import AdminDashboardView from './AdminDashboardView.vue'

const dashboard = {
  stats: { postCount: 3, publishedPostCount: 2, totalViews: 120, commentCount: 1, visitorCount: 5 },
  analytics: { totalRequests: 8, todayRequests: 8, failedRequests: 0, uniqueIPs: 4, topIPs: [], topPaths: [], recentBans: [] },
  aiAnalysis: { mode: 'local', summary: '本地洞察', signals: [] },
  recentComments: []
}

describe('AdminDashboardView', () => {
  beforeEach(() => {
    vi.mocked(getAdminDashboard).mockResolvedValue(dashboard)
    vi.mocked(ElMessage.error).mockReset()
  })

  it('removes the synchronous chat panel and links administrators to the AI workspace', async () => {
    const wrapper = mount(AdminDashboardView, {
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' },
          ElIcon: { template: '<i><slot /></i>' },
          ElTable: { template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div />' },
          ElInput: { template: '<textarea />' },
          ElAlert: { template: '<div />' },
          ElTag: { template: '<span><slot /></span>' },
          RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' },
          directives: { loading: {} }
        }
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('文章总数')
    expect(wrapper.find('textarea').exists()).toBe(false)
    expect(wrapper.get('[data-test="ai-workspace-link"]').attributes('data-to')).toBe('/admin/ai')
  })
  it('keeps the dashboard renderable when the backend omits aiAnalysis', async () => {
    vi.mocked(getAdminDashboard).mockResolvedValue({ ...dashboard, aiAnalysis: undefined } as any)
    const wrapper = mount(AdminDashboardView, {
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' },
          ElIcon: { template: '<i><slot /></i>' },
          ElTable: { template: '<div><slot /></div>' },
          ElTableColumn: { template: '<div />' },
          ElTag: { template: '<span><slot /></span>' },
          RouterLink: { props: ['to'], template: '<a :data-to="to"><slot /></a>' }
        }
      }
    })
    await flushPromises()

    expect(wrapper.text()).toContain('本地兜底分析')
    expect(wrapper.text()).toContain('正在等待数据呀...')
  })

  it('maps dashboard server failures to a friendly message without exposing internal details', async () => {
    vi.mocked(getAdminDashboard).mockRejectedValue({
      response: { status: 500, data: { code: 500, message: 'database host 10.0.0.1 refused connection' } }
    })
    mount(AdminDashboardView, {
      global: {
        stubs: {
          ElButton: { template: '<button><slot /></button>' }, ElIcon: { template: '<i><slot /></i>' },
          ElTable: { template: '<div><slot /></div>' }, ElTableColumn: { template: '<div />' },
          ElTag: { template: '<span><slot /></span>' }, RouterLink: { template: '<a><slot /></a>' }
        }
      }
    })
    await flushPromises()

    expect(ElMessage.error).toHaveBeenCalledWith('服务暂时不可用，请稍后再试')
    expect(ElMessage.error).not.toHaveBeenCalledWith(expect.stringContaining('10.0.0.1'))
  })
})
