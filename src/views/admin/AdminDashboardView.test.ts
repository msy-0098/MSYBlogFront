import { flushPromises, mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../../api/admin', () => ({
  getAdminDashboard: vi.fn(),
  chatWithAdminAI: vi.fn()
}))

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
})