import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

import { mount } from '@vue/test-utils'
import { nextTick, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import App from './App.vue'

vi.mock('vue-router', () => ({
  useRoute: vi.fn()
}))

const route = reactive({
  path: '/'
})

function setScrollY(value: number) {
  Object.defineProperty(window, 'scrollY', {
    configurable: true,
    value
  })
}

function mountApp() {
  return mount(App, {
    global: {
      stubs: {
        AppFooter: true,
        AppHeader: true,
        RouterView: true
      }
    }
  })
}

describe('App scroll motion', () => {
  beforeEach(() => {
    route.path = '/'
    setScrollY(0)
    vi.mocked(useRoute).mockReturnValue(route as ReturnType<typeof useRoute>)
    vi.spyOn(performance, 'now').mockReturnValue(0)
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1)
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {})
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false })
    })
  })

  it('wraps public routes in the editorial shell but keeps admin routes isolated', () => {
    route.path = '/posts'
    let wrapper = mountApp()

    expect(wrapper.get('main').classes()).toContain('public-root-main')
    expect(wrapper.get('main').classes()).not.toContain('admin-root-main')
    expect(wrapper.find('app-header-stub').exists()).toBe(true)
    expect(wrapper.find('app-footer-stub').exists()).toBe(true)

    wrapper.unmount()

    route.path = '/admin'
    wrapper = mountApp()

    expect(wrapper.get('main').classes()).toContain('admin-root-main')
    expect(wrapper.get('main').classes()).not.toContain('public-root-main')
    expect(wrapper.find('app-header-stub').exists()).toBe(false)
    expect(wrapper.find('app-footer-stub').exists()).toBe(false)
  })

  it('keeps editorial shell selectors out of legacy global css and scopes public content rules', () => {
    const globalCss = readFileSync(resolve(process.cwd(), 'src/styles/global.css'), 'utf8')
    const adminCss = readFileSync(resolve(process.cwd(), 'src/styles/admin.css'), 'utf8')
    const publicContentCss = readFileSync(resolve(process.cwd(), 'src/styles/public-content.css'), 'utf8')

    expect(globalCss).not.toMatch(/^\s*\.app-header\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.brand\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.brand-mark\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.nav-links\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.mobile-nav-toggle\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.app-footer\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.footer-inner\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.reading-page\s*,/m)
    expect(globalCss).not.toMatch(/^\s*\.reading-heading\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.section-kicker\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.primary-button\s*,/m)
    expect(globalCss).not.toMatch(/^\s*\.primary-button\s*\{/m)
    expect(globalCss).not.toMatch(/^\s*\.secondary-button\s*,/m)
    expect(globalCss).not.toMatch(/^\s*\.section-link\s*\{/m)
    expect(globalCss).not.toMatch(/\.section-heading\s+\.section-kicker/m)
    expect(globalCss).not.toContain("@import './admin.css';")
    expect(globalCss).not.toMatch(/\.admin-page-heading\s+\.section-kicker/m)
    expect(globalCss).not.toMatch(/\.admin-login-panel\s+\.section-kicker/m)
    expect(adminCss).toMatch(/\.admin-page-heading\s+\.section-kicker/m)
    expect(adminCss).toMatch(/\.admin-login-panel\s+\.section-kicker/m)

    expect(publicContentCss).not.toMatch(/^\s*body\s*\{/m)
    expect(publicContentCss).not.toMatch(/^\s*#app\s*\{/m)
    expect(publicContentCss).not.toMatch(/^\s*main\s*\{/m)
    expect(publicContentCss).not.toMatch(/^\s*img\s*\{/m)
  })

  it('loads admin css only through admin runtime entry', () => {
    const adminRuntime = readFileSync(resolve(process.cwd(), 'src/plugins/adminRuntime.ts'), 'utf8')
    const mainTs = readFileSync(resolve(process.cwd(), 'src/main.ts'), 'utf8')

    expect(adminRuntime).toContain("import('../styles/admin.css')")
    expect(mainTs).toContain('ensureAdminRuntime')
    expect(mainTs).not.toContain("from 'element-plus'")
  })

  it('keeps Element Plus overrides inside admin surfaces', () => {
    const adminCss = readFileSync(resolve(process.cwd(), 'src/styles/admin.css'), 'utf8')

    expect(adminCss).not.toMatch(/^\s*body\s*\{/m)
    expect(adminCss).not.toMatch(/^\s*\.el-button\b/m)
    expect(adminCss).not.toMatch(/^\s*\.el-table\b/m)
    expect(adminCss).not.toMatch(/^\s*\.el-menu-item\b/m)
    expect(adminCss).not.toMatch(/^\s*\.el-drawer__body\b/m)
    expect(adminCss).toMatch(/\.admin-mobile-menu\s+\.el-menu-item/m)
  })

  it('does not apply page transition blur to ordinary non-home scrolling', async () => {
    route.path = '/posts'
    const wrapper = mountApp()

    vi.mocked(performance.now).mockReturnValue(32)
    setScrollY(640)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const main = wrapper.get('main')
    expect(main.classes()).not.toContain('is-scroll-blurring')
    expect(main.attributes('style')).toContain('--scroll-blur: 0px')
  })

  it('keeps the homepage main surface free of global blur for faster navigation', async () => {
    const wrapper = mountApp()

    vi.mocked(performance.now).mockReturnValue(32)
    setScrollY(640)
    window.dispatchEvent(new Event('scroll'))
    await nextTick()

    const main = wrapper.get('main')
    expect(main.classes()).not.toContain('is-scroll-blurring')
    expect(main.attributes('style')).toContain('--scroll-blur: 0px')
  })
})
