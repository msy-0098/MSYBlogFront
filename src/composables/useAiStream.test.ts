import { describe, expect, it, vi } from 'vitest'

import { ADMIN_UNAUTHORIZED_EVENT } from '../api/admin'
import { FriendlyApiError } from '../utils/apiError'
import { createAdminAIStreamClient, createSSEParser } from './useAiStream'

const encoder = new TextEncoder()

describe('admin AI SSE stream', () => {
  it('joins split frames and keeps valid events after malformed data', () => {
    const parser = createSSEParser()

    expect(parser.push('event: delta\ndata: {"content":"你')).toEqual([])
    expect(parser.push('好"}\n\nevent: invalid\ndata: {oops}\n\nevent: done\ndata: {"messageId":8}\n\n')).toEqual([
      { event: 'delta', data: { content: '你好' } },
      { event: 'done', data: { messageId: 8 } }
    ])
  })

  it('decodes POST SSE deltas and completes the response', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(
      new Response(
        new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('event: meta\ndata: {"messageId":8}\n\nevent: delta\ndata: {"content":"第一'))
            controller.enqueue(encoder.encode('段"}\n\nevent: done\ndata: {"messageId":8}\n\n'))
            controller.close()
          }
        }),
        { headers: { 'Content-Type': 'text/event-stream; charset=utf-8' } }
      )
    )
    const onMeta = vi.fn()
    const onDelta = vi.fn()
    const onDone = vi.fn()
    const client = createAdminAIStreamClient({ fetchImpl, getToken: () => 'admin-token' })

    await expect(client.stream(7, '请分析', { onMeta, onDelta, onDone })).resolves.toEqual({ status: 'completed' })

    expect(fetchImpl).toHaveBeenCalledWith(
      '/api/admin/ai/conversations/7/messages/stream',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer admin-token', 'Content-Type': 'application/json' }),
        body: JSON.stringify({ content: '请分析' })
      })
    )
    expect(onMeta).toHaveBeenCalledWith({ messageId: 8 })
    expect(onDelta).toHaveBeenCalledWith({ content: '第一段' })
    expect(onDone).toHaveBeenCalledWith({ messageId: 8 })
  })

  it('aborts the active request without reporting an unknown error', async () => {
    const fetchImpl = vi.fn((_input: RequestInfo | URL, init?: RequestInit) =>
      new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')))
      })
    )
    const onAbort = vi.fn()
    const onError = vi.fn()
    const client = createAdminAIStreamClient({ fetchImpl, getToken: () => null })

    const pending = client.stream(7, '请停止', { onAbort, onError })
    client.abort()

    await expect(pending).resolves.toEqual({ status: 'aborted' })
    expect(onAbort).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
  it('treats a fetch AbortError as an aborted stream without an error callback', async () => {
    const onAbort = vi.fn()
    const onError = vi.fn()
    const abortError = new Error('request aborted')
    abortError.name = 'AbortError'
    const client = createAdminAIStreamClient({ fetchImpl: vi.fn().mockRejectedValue(abortError) })

    await expect(client.stream(7, '中止错误', { onAbort, onError })).resolves.toEqual({ status: 'aborted' })
    expect(onAbort).toHaveBeenCalledOnce()
    expect(onError).not.toHaveBeenCalled()
  })
  it('maps untrusted SSE provider details to a safe friendly error', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response('event: error\ndata: {"code":500,"message":"provider failure: BLOG_AI_API_KEY=secret"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
      )
    })

    await expect(client.stream(7, '测试错误', { onError })).resolves.toEqual({ status: 'failed' })
    const error = onError.mock.calls[0][0]
    expect(error).toBeInstanceOf(FriendlyApiError)
    expect(error).toMatchObject({ message: '服务暂时不可用，请稍后再试', kind: 'server', status: 500 })
    expect(error.message).not.toContain('provider failure')
    expect(error.message).not.toContain('BLOG_AI_API_KEY')
  })

  it('preserves an allowlisted SSE business message', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response('event: error\ndata: {"code":400,"message":"验证码错误或已过期"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
      )
    })

    await expect(client.stream(7, '可信业务错误', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: '验证码错误或已过期',
      kind: 'validation',
      status: 400,
      code: 400
    }))
  })

  it('preserves retryAfter from an SSE rate-limit envelope without leaking provider details', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response('event: error\ndata: {"code":429,"message":"provider quota exceeded","data":{"retryAfter":12}}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
      )
    })

    await expect(client.stream(7, '流式限流', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: '操作过于频繁，请稍后再试',
      kind: 'rate-limit',
      retryAfter: 12
    }))
    expect(onError.mock.calls[0][0].message).not.toContain('provider quota exceeded')
  })

  it('notifies a throwing onError callback at most once for an SSE failure', async () => {
    const onError = vi.fn(() => {
      throw new Error('consumer callback failure')
    })
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response('event: error\ndata: {"code":500,"message":"provider failure"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
      )
    })

    await expect(client.stream(7, '回调错误', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledOnce()
  })
  it('uses the shared admin unauthorized path when fetch receives 401', async () => {
    localStorage.setItem('admin_token', 'expired-token')
    localStorage.setItem('admin_user', '{"id":1}')
    const listener = vi.fn()
    const onError = vi.fn()
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, listener)

    try {
      const client = createAdminAIStreamClient({ fetchImpl: vi.fn().mockResolvedValue(new Response(null, { status: 401 })) })

      await expect(client.stream(7, '需要重新登录', { onError })).resolves.toEqual({ status: 'failed' })

      expect(localStorage.getItem('admin_token')).toBeNull()
      expect(localStorage.getItem('admin_user')).toBeNull()
      expect(listener).toHaveBeenCalledOnce()
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: '登录状态已失效，请重新登录' }))
    } finally {
      window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, listener)
    }
  })

  it('maps a provider rate-limit response to a safe retryable error', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ code: 429, message: 'provider quota exceeded', data: { retryAfter: 12 } }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' }
        })
      )
    })

    await expect(client.stream(7, '限流测试', { onError })).resolves.toEqual({ status: 'failed' })

    expect(onError).toHaveBeenCalledOnce()
    const error = onError.mock.calls[0][0]
    expect(error).toBeInstanceOf(FriendlyApiError)
    expect(error).toMatchObject({ message: '操作过于频繁，请稍后再试', kind: 'rate-limit', retryAfter: 12 })
    expect(error.message).not.toContain('provider quota exceeded')
    expect(error.message).not.toContain('429')
  })

  it('maps a non-JSON 5xx response to the shared safe server error', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({ fetchImpl: vi.fn().mockResolvedValue(new Response('<html>upstream failure</html>', { status: 503 })) })

    await expect(client.stream(7, '服务状态', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: '服务暂时不可用，请稍后再试',
      kind: 'server',
      status: 503
    }))
  })

  it('maps rejected fetch requests to a shared network error', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({ fetchImpl: vi.fn().mockRejectedValue(new TypeError('Failed to fetch')) })

    await expect(client.stream(7, '网络错误', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({
      message: '网络连接失败，请检查网络后重试',
      kind: 'network'
    }))
  })

  it('reports a response that closes without done as an interrupted stream', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(new Response('event: delta\ndata: {"content":"只到一半"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } }))
    })

    await expect(client.stream(7, '中断测试', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: 'AI 响应在完成前中断' }))
  })

  it('preserves UTF-8 characters split across raw stream bytes', async () => {
    const payload = encoder.encode('event: delta\ndata: {"content":"你好"}\n\nevent: done\ndata: {"messageId":8}\n\n')
    const firstChineseByte = payload.indexOf(0xe4)
    const onDelta = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response(
          new ReadableStream({
            start(controller) {
              controller.enqueue(payload.slice(0, firstChineseByte + 1))
              controller.enqueue(payload.slice(firstChineseByte + 1, firstChineseByte + 2))
              controller.enqueue(payload.slice(firstChineseByte + 2))
              controller.close()
            }
          }),
          { headers: { 'Content-Type': 'text/event-stream' } }
        )
      )
    })

    await expect(client.stream(7, '字节分包', { onDelta })).resolves.toEqual({ status: 'completed' })
    expect(onDelta).toHaveBeenCalledWith({ content: '你好' })
  })
  it('treats done as terminal without waiting for an open stream to close', async () => {
    const { body, controller, cancel, release } = createOpenStream('event: done\ndata: {"messageId":8}\n\n')
    const onDone = vi.fn()
    const onDelta = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }))
    })
    const result = client.stream(7, '终态测试', { onDone, onDelta })

    try {
      await expect(settlesImmediately(result)).resolves.toEqual({ status: 'completed' })
      expect(onDone).toHaveBeenCalledWith({ messageId: 8 })
      expect(cancel).toHaveBeenCalledOnce()
      expect(() => controller.enqueue(encoder.encode('event: delta\ndata: {"content":"不应回调"}\n\n'))).toThrow()
      expect(onDelta).not.toHaveBeenCalled()
    } finally {
      release()
    }
  })

  it('treats error as terminal without waiting for an open stream to close', async () => {
    const { body, controller, cancel, release } = createOpenStream('event: error\ndata: {"code":500,"message":"模型异常"}\n\n')
    const onError = vi.fn()
    const onDelta = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }))
    })
    const result = client.stream(7, '终态错误', { onError, onDelta })

    try {
      await expect(settlesImmediately(result)).resolves.toEqual({ status: 'failed' })
      expect(onError).toHaveBeenCalledWith(expect.objectContaining({
        message: '服务暂时不可用，请稍后再试',
        kind: 'server'
      }))
      expect(cancel).toHaveBeenCalledOnce()
      expect(() => controller.enqueue(encoder.encode('event: delta\ndata: {"content":"不应回调"}\n\n'))).toThrow()
      expect(onDelta).not.toHaveBeenCalled()
    } finally {
      release()
    }
  })
  it('cancels an open error stream when onError throws', async () => {
    const { body, cancel, release } = createOpenStream('event: error\ndata: {"code":500,"message":"provider failure"}\n\n')
    const onError = vi.fn(() => {
      throw new Error('consumer callback failure')
    })
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(new Response(body, { headers: { 'Content-Type': 'text/event-stream' } }))
    })
    const result = client.stream(7, '开放流回调错误', { onError })

    try {
      await expect(settlesImmediately(result)).resolves.toEqual({ status: 'failed' })
      expect(onError).toHaveBeenCalledOnce()
      expect(cancel).toHaveBeenCalledOnce()
    } finally {
      release()
    }
  })
})
function createOpenStream(frame: string) {
  let releasePull: () => void = () => undefined
  const keepOpen = new Promise<void>((resolve) => {
    releasePull = resolve
  })
  const cancel = vi.fn(() => keepOpen)
  let controller!: ReadableStreamDefaultController<Uint8Array>
  const body = new ReadableStream<Uint8Array>({
    start(nextController) {
      controller = nextController
      controller.enqueue(encoder.encode(frame))
    },
    pull() {
      return keepOpen
    },
    cancel
  })

  return { body, controller, cancel, release: releasePull }
}

async function settlesImmediately<T>(promise: Promise<T>): Promise<T | 'pending'> {
  return Promise.race([promise, new Promise<'pending'>((resolve) => setTimeout(() => resolve('pending'), 20))])
}
