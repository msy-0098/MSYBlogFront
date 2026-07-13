import { describe, expect, it, vi } from 'vitest'

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
  it('surfaces a server error event as a failed stream', async () => {
    const onError = vi.fn()
    const client = createAdminAIStreamClient({
      fetchImpl: vi.fn().mockResolvedValue(
        new Response('event: error\ndata: {"message":"模型暂不可用"}\n\n', { headers: { 'Content-Type': 'text/event-stream' } })
      )
    })

    await expect(client.stream(7, '测试错误', { onError })).resolves.toEqual({ status: 'failed' })
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: '模型暂不可用' }))
  })
})