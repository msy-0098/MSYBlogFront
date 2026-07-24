export type FriendlyErrorKind =
  | 'validation'
  | 'auth'
  | 'permission'
  | 'not-found'
  | 'conflict'
  | 'rate-limit'
  | 'network'
  | 'timeout'
  | 'server'
  | 'unknown'

export interface ApiErrorEnvelope {
  code: number
  message?: unknown
  data?: unknown
}

export class FriendlyApiError extends Error {
  constructor(
    message: string,
    readonly kind: FriendlyErrorKind,
    readonly status?: number,
    readonly code?: number,
    readonly retryAfter?: number
  ) {
    super(message)
    this.name = 'FriendlyApiError'
    Object.setPrototypeOf(this, new.target.prototype)
  }
}

const TRUSTED_BUSINESS_MESSAGES = new Set([
  '验证码错误或已过期',
  '邮箱或密码错误',
  '验证码暂时无法发送，请稍后再试'
])

const MAX_RETRY_AFTER_SECONDS = 24 * 60 * 60

const STATUS_ERRORS: Record<number, { kind: FriendlyErrorKind; message: string }> = {
  400: { kind: 'validation', message: '提交内容有误，请检查后重试' },
  401: { kind: 'auth', message: '登录状态已失效，请重新登录' },
  403: { kind: 'permission', message: '暂无权限执行此操作' },
  404: { kind: 'not-found', message: '请求的内容不存在或已被移除' },
  408: { kind: 'timeout', message: '请求超时，请稍后重试' },
  409: { kind: 'conflict', message: '当前数据已发生变化，请刷新后重试' },
  422: { kind: 'validation', message: '提交内容未通过校验，请检查后重试' },
  429: { kind: 'rate-limit', message: '操作过于频繁，请稍后再试' }
}

export function toFriendlyApiError(reason: unknown): FriendlyApiError {
  if (reason instanceof FriendlyApiError) {
    return reason
  }

  const error = asRecord(reason)
  const response = asRecord(error?.response)
  const envelope = asRecord(response?.data)
  const code = toFiniteInteger(envelope?.code)
  const responseStatus = toFiniteInteger(response?.status)
  const status = isErrorStatus(responseStatus) ? responseStatus : isErrorStatus(code) ? code : undefined

  if (status !== undefined) {
    const mapping = status >= 500
      ? { kind: 'server' as const, message: '服务暂时不可用，请稍后再试' }
      : STATUS_ERRORS[status]
    const trustedMessage = readTrustedMessage(envelope?.message)
    const kind = mapping?.kind ?? 'unknown'
    const message = trustedMessage ?? mapping?.message ?? '操作失败，请稍后重试'
    const retryAfter = kind === 'rate-limit' ? readRetryAfter(envelope?.data) : undefined

    return new FriendlyApiError(message, kind, status, code, retryAfter)
  }

  if (isTimeoutError(error)) {
    return new FriendlyApiError('请求超时，请稍后重试', 'timeout')
  }

  if (isNetworkError(reason, error)) {
    return new FriendlyApiError('网络连接失败，请检查网络后重试', 'network')
  }

  return new FriendlyApiError('操作失败，请稍后重试', 'unknown', undefined, code)
}

export function fromApiEnvelope(envelope: ApiErrorEnvelope, status?: number): FriendlyApiError {
  const effectiveStatus = isErrorStatus(status) ? status : isErrorStatus(envelope.code) ? envelope.code : undefined

  return toFriendlyApiError({
    response: {
      status: effectiveStatus,
      data: envelope
    }
  })
}

export function getFriendlyErrorMessage(reason: unknown, fallback = '操作失败，请稍后重试'): string {
  if (reason instanceof FriendlyApiError) {
    return reason.message || fallback
  }

  const friendly = toFriendlyApiError(reason)
  return friendly.kind === 'unknown' ? fallback : friendly.message
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : undefined
}

function toFiniteInteger(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) && Number.isInteger(value) ? value : undefined
}

function isErrorStatus(value: number | undefined): value is number {
  return value !== undefined && value >= 400 && value <= 599
}

function readTrustedMessage(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const message = value.trim()
  return TRUSTED_BUSINESS_MESSAGES.has(message) ? message : undefined
}

function readRetryAfter(value: unknown): number | undefined {
  const retryAfter = asRecord(value)?.retryAfter

  if (
    typeof retryAfter !== 'number' ||
    !Number.isFinite(retryAfter) ||
    retryAfter < 0 ||
    retryAfter > MAX_RETRY_AFTER_SECONDS
  ) {
    return undefined
  }

  return Math.ceil(retryAfter)
}

function isTimeoutError(error: Record<string, unknown> | undefined): boolean {
  if (!error) {
    return false
  }

  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return true
  }

  return error.isAxiosError === true && typeof error.message === 'string' && /timeout/i.test(error.message)
}

function isNetworkError(reason: unknown, error: Record<string, unknown> | undefined): boolean {
  if (typeof DOMException !== 'undefined' && reason instanceof DOMException && reason.name === 'NetworkError') {
    return true
  }

  if (reason instanceof TypeError && /failed to fetch|networkerror|load failed/i.test(reason.message)) {
    return true
  }

  if (!error || (error.response !== undefined && error.response !== null)) {
    return false
  }

  if (error.code === 'ERR_CANCELED' || error.name === 'CanceledError' || error.__CANCEL__ === true) {
    return false
  }

  return (
    error.code === 'ERR_NETWORK' ||
    error.request !== undefined ||
    error.message === 'Network Error'
  )
}
