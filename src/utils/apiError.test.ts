import { describe, expect, it } from 'vitest'

import {
  FriendlyApiError,
  fromApiEnvelope,
  getFriendlyErrorMessage,
  toFriendlyApiError
} from './apiError'

describe('friendly API errors', () => {
  it.each([
    [400, 'validation', '提交内容有误，请检查后重试'],
    [401, 'auth', '登录状态已失效，请重新登录'],
    [403, 'permission', '暂无权限执行此操作'],
    [404, 'not-found', '请求的内容不存在或已被移除'],
    [408, 'timeout', '请求超时，请稍后重试'],
    [409, 'conflict', '当前数据已发生变化，请刷新后重试'],
    [422, 'validation', '提交内容未通过校验，请检查后重试'],
    [429, 'rate-limit', '操作过于频繁，请稍后再试'],
    [500, 'server', '服务暂时不可用，请稍后再试'],
    [503, 'server', '服务暂时不可用，请稍后再试']
  ] as const)('maps HTTP %s to a safe message', (status, kind, message) => {
    expect(toFriendlyApiError({ response: { status, data: {} } })).toMatchObject({
      name: 'FriendlyApiError',
      status,
      kind,
      message
    })
  })

  it('distinguishes timeout failures from other network failures', () => {
    expect(toFriendlyApiError({ code: 'ECONNABORTED', message: 'timeout of 10000ms exceeded' })).toMatchObject({
      kind: 'timeout',
      message: '请求超时，请稍后重试'
    })
    expect(toFriendlyApiError({ code: 'ETIMEDOUT' })).toMatchObject({
      kind: 'timeout',
      message: '请求超时，请稍后重试'
    })
    expect(toFriendlyApiError({ isAxiosError: true, message: 'Network Error' })).toMatchObject({
      kind: 'network',
      message: '网络连接失败，请检查网络后重试'
    })
    expect(toFriendlyApiError({ response: undefined })).toMatchObject({
      kind: 'network',
      message: '网络连接失败，请检查网络后重试'
    })
  })

  it.each(['验证码错误或已过期', '邮箱或密码错误', '验证码暂时无法发送，请稍后再试'])(
    'preserves the trusted business message: %s',
    (message) => {
      expect(toFriendlyApiError({ response: { status: 400, data: { code: 400, message } } }).message).toBe(message)
    }
  )

  it.each([
    'SQLITE_CONSTRAINT: UNIQUE failed: users.email',
    'SMTP authentication failed for smtp.example.com',
    'provider returned invalid api key',
    'AxiosError: Request failed with status code 500',
    'internal error at /srv/blog/internal/handler.go:42',
    '看起来像中文但不在白名单'
  ])('does not expose untrusted server text: %s', (message) => {
    expect(toFriendlyApiError({ response: { status: 500, data: { code: 500, message } } }).message).toBe(
      '服务暂时不可用，请稍后再试'
    )
  })

  it('extracts a bounded retryAfter only from the rate-limit envelope data', () => {
    expect(
      toFriendlyApiError({
        response: { status: 429, data: { code: 429, message: 'too many requests', data: { retryAfter: 37 } } }
      })
    ).toMatchObject({ code: 429, retryAfter: 37 })

    expect(
      toFriendlyApiError({
        response: { status: 429, data: { code: 429, data: { retryAfter: -1 } } }
      }).retryAfter
    ).toBeUndefined()
    expect(
      toFriendlyApiError({
        response: { status: 429, data: { code: 429, retryAfter: 20, data: { retryAfter: 999999999 } } }
      }).retryAfter
    ).toBeUndefined()
  })

  it('creates envelope errors and keeps the business code', () => {
    expect(fromApiEnvelope({ code: 422, message: 'invalid', data: null })).toMatchObject({
      kind: 'validation',
      status: 422,
      code: 422,
      message: '提交内容未通过校验，请检查后重试'
    })
    expect(fromApiEnvelope({ code: 1001, message: 'internal business detail', data: null })).toMatchObject({
      kind: 'unknown',
      code: 1001,
      message: '操作失败，请稍后重试'
    })
  })

  it('keeps existing friendly errors unchanged and has a working Error prototype', () => {
    const original = new FriendlyApiError('自定义安全提示', 'conflict', 409, 409)

    expect(original).toBeInstanceOf(Error)
    expect(original).toBeInstanceOf(FriendlyApiError)
    expect(toFriendlyApiError(original)).toBe(original)
  })

  it('uses safe fallbacks for arbitrary errors and unknown values', () => {
    expect(getFriendlyErrorMessage(new Error('password=secret at /srv/app.ts'), '加载失败')).toBe('加载失败')
    expect(getFriendlyErrorMessage({ message: 'SMTP connection refused' }, '保存失败')).toBe('保存失败')
    expect(getFriendlyErrorMessage(undefined)).toBe('操作失败，请稍后重试')
    expect(getFriendlyErrorMessage(new FriendlyApiError('验证码错误或已过期', 'validation', 400, 400))).toBe(
      '验证码错误或已过期'
    )
  })
})
