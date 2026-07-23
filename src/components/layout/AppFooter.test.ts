import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import AppFooter from './AppFooter.vue'

describe('AppFooter', () => {
  it('renders the current year, owner copy, and filing link', () => {
    const wrapper = mount(AppFooter)
    const filingLink = wrapper.get('[data-test="icp-filing-link"]')
    const currentYear = new Date().getFullYear()

    expect(wrapper.text()).toContain(`© ${currentYear} 马森雨`)
    expect(wrapper.text()).toContain('写作、项目与持续成长的公开记录')
    expect(filingLink.text()).toBe('豫ICP备2026032113号-1')
    expect(filingLink.attributes('href')).toBe('https://beian.miit.gov.cn/')
    expect(filingLink.attributes('target')).toBe('_blank')
    expect(filingLink.attributes('rel')).toBe('noreferrer')
  })

  it('renders the public security filing icon and official query link', () => {
    const wrapper = mount(AppFooter)
    const filingLink = wrapper.get('[data-test="public-security-filing-link"]')
    const filingIcon = filingLink.get('img')

    expect(filingLink.text()).toBe('冀公网安备13060602001918号')
    expect(filingLink.attributes('href')).toBe(
      'https://beian.mps.gov.cn/#/query/webSearch?code=13060602001918',
    )
    expect(filingLink.attributes('target')).toBe('_blank')
    expect(filingLink.attributes('rel')).toBe('noreferrer')
    expect(filingIcon.attributes('src')).toBe('/images/beian-police.png')
    expect(filingIcon.attributes('alt')).toBe('')
    expect(filingIcon.attributes('aria-hidden')).toBe('true')
  })
  it('keeps the public resource links in the footer', () => {
    const wrapper = mount(AppFooter)

    expect(wrapper.get('a[href="/api/rss.xml"]').text()).toBe('RSS')
    expect(wrapper.get('a[href="/api/sitemap.xml"]').text()).toBe('Sitemap')
  })
})