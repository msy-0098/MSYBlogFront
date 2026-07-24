import { handleAdminUnauthorized } from '../api/admin'
import { fromApiEnvelope, toFriendlyApiError } from '../utils/apiError'

export type AdminAIStreamEventName = 'meta' | 'delta' | 'done' | 'error'

export interface AdminAIStreamEvent {
  event: AdminAIStreamEventName
  data: Record<string, unknown>
}

export interface AdminAIStreamHandlers {
  onMeta?: (data: Record<string, unknown>) => void
  onDelta?: (data: Record<string, unknown>) => void
  onDone?: (data: Record<string, unknown>) => void
  onError?: (error: Error) => void
  onAbort?: () => void
}

export interface AdminAIStreamClientOptions {
  fetchImpl?: typeof fetch
  getToken?: () => string | null | undefined
}

export interface AdminAIStreamClient {
  stream: (conversationId: number, content: string, handlers?: AdminAIStreamHandlers) => Promise<{ status: 'completed' | 'aborted' | 'failed' }>
  abort: () => void
}

const supportedEvents = new Set<AdminAIStreamEventName>(['meta', 'delta', 'done', 'error'])

export function createSSEParser() {
  let buffer = ''

  return {
    push(chunk: string): AdminAIStreamEvent[] {
      buffer += chunk
      const frames = buffer.split(/\r?\n\r?\n/)
      buffer = frames.pop() ?? ''
      return frames.flatMap(parseSSEFrame)
    },
    finish(): AdminAIStreamEvent[] {
      const frame = buffer
      buffer = ''
      return frame.trim() ? parseSSEFrame(frame) : []
    }
  }
}

export function createAdminAIStreamClient(options: AdminAIStreamClientOptions = {}): AdminAIStreamClient {
  const fetchImpl = options.fetchImpl ?? fetch
  const getToken = options.getToken ?? readAdminToken
  let activeController: AbortController | null = null

  return {
    async stream(conversationId, content, handlers = {}) {
      const controller = new AbortController()
      activeController?.abort()
      activeController = controller
      let errorNotified = false

      const notifyError = (error: Error) => {
        if (errorNotified) return
        errorNotified = true
        handlers.onError?.(error)
      }

      try {
        const token = getToken()
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          'Content-Type': 'application/json'
        }
        if (token) headers.Authorization = `Bearer ${token}`

        const response = await fetchImpl(`/api/admin/ai/conversations/${conversationId}/messages/stream`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ content }),
          signal: controller.signal
        })

        if (response.status === 401) handleAdminUnauthorized()
        if (!response.ok) {
          throw await toResponseError(response)
        }
        if (!response.headers.get('content-type')?.toLowerCase().includes('text/event-stream')) {
          throw new Error('AI 服务没有返回流式响应')
        }
        if (!response.body) {
          throw new Error('AI 服务没有返回可读取的响应内容')
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        const parser = createSSEParser()

        const handleEvents = (events: AdminAIStreamEvent[]): 'completed' | 'failed' | null => {
          for (const item of events) {
            if (item.event === 'meta') handlers.onMeta?.(item.data)
            if (item.event === 'delta') handlers.onDelta?.(item.data)
            if (item.event === 'done') {
              handlers.onDone?.(item.data)
              return 'completed'
            }
            if (item.event === 'error') {
              notifyError(toEventError(item.data))
              return 'failed'
            }
          }
          return null
        }

        const settleProtocolTerminal = (status: 'completed' | 'failed') => {
          void reader.cancel().catch(() => undefined)
          return { status }
        }

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const terminal = handleEvents(parser.push(decoder.decode(value, { stream: true })))
          if (terminal) return settleProtocolTerminal(terminal)
        }
        const decodedTerminal = handleEvents(parser.push(decoder.decode()))
        if (decodedTerminal) return settleProtocolTerminal(decodedTerminal)
        const bufferedTerminal = handleEvents(parser.finish())
        if (bufferedTerminal) return settleProtocolTerminal(bufferedTerminal)

        const error = new Error('AI 响应在完成前中断')
        notifyError(error)
        return { status: 'failed' as const }
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) {
          handlers.onAbort?.()
          return { status: 'aborted' as const }
        }

        notifyError(toFriendlyApiError(error))
        return { status: 'failed' as const }
      } finally {
        if (activeController === controller) activeController = null
      }
    },
    abort() {
      activeController?.abort()
    }
  }
}

export function useAiStream(options: AdminAIStreamClientOptions = {}): AdminAIStreamClient {
  return createAdminAIStreamClient(options)
}

function parseSSEFrame(frame: string): AdminAIStreamEvent[] {
  let event = 'message'
  const dataLines: string[] = []

  for (const line of frame.replace(/^\uFEFF/, '').split(/\r?\n/)) {
    if (!line || line.startsWith(':')) continue
    const separator = line.indexOf(':')
    const field = separator === -1 ? line : line.slice(0, separator)
    const value = (separator === -1 ? '' : line.slice(separator + 1)).replace(/^ /, '')
    if (field === 'event') event = value
    if (field === 'data') dataLines.push(value)
  }

  if (!supportedEvents.has(event as AdminAIStreamEventName) || dataLines.length === 0) return []

  try {
    const data = JSON.parse(dataLines.join('\n')) as Record<string, unknown>
    return [{ event: event as AdminAIStreamEventName, data }]
  } catch {
    return []
  }
}

function readAdminToken(): string | null {
  return typeof localStorage === 'undefined' ? null : localStorage.getItem('admin_token')
}

async function toResponseError(response: Response) {
  const payload = await response.clone().json().catch(() => null)
  return fromApiEnvelope(toApiErrorEnvelope(payload, response.status), response.status)
}

function toEventError(data: Record<string, unknown>) {
  return fromApiEnvelope(toApiErrorEnvelope(data, 500))
}

function toApiErrorEnvelope(payload: unknown, fallbackCode: number) {
  return isRecord(payload)
    ? { code: typeof payload.code === 'number' ? payload.code : fallbackCode, message: payload.message, data: payload.data }
    : { code: fallbackCode }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAbortError(error: unknown): boolean {
  return (
    (typeof DOMException !== 'undefined' && error instanceof DOMException && error.name === 'AbortError') ||
    (typeof error === 'object' && error !== null && (error as { name?: unknown }).name === 'AbortError')
  )
}
