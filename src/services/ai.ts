// DeepSeek API 调用统一封装：所有 AI 请求必须经过本模块

import type { ApiConfig, ApiUsageLog, LowPriorityFeature, ModelParams, Role } from '../types'
import { createId, get, getAll, put, remove } from './storage'

export interface AiMessage {
  role: Role
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string }
  }>
  usage?: { total_tokens: number }
}

interface ChatCompletionChunk {
  choices: Array<{
    delta: { content?: string }
  }>
  usage?: { total_tokens: number }
}

export function getConfigForFeature(
  configs: ApiConfig[],
  assignment: Record<string, string>,
  feature: LowPriorityFeature,
): ApiConfig | null {
  const id = assignment[feature]
  if (id) {
    const found = configs.find((c) => c.id === id)
    if (found) return found
  }
  return configs.find((c) => c.isPrimary) ?? configs[0] ?? null
}

async function trackApiUsage(configId: string, tokens: number, success: boolean): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  const config = await get<ApiConfig>('apiConfigs', configId)
  if (!config) return

  const stats = config.usageStats
  const isNewDay = stats.statsDate !== today
  await put('apiConfigs', {
    ...config,
    usageStats: {
      todayRequests: isNewDay ? 1 : stats.todayRequests + 1,
      todayTokens: isNewDay ? tokens : stats.todayTokens + tokens,
      todayFailures: isNewDay ? (success ? 0 : 1) : stats.todayFailures + (success ? 0 : 1),
      recordLimit: stats.recordLimit,
      statsDate: today,
    },
  })

  const log: ApiUsageLog = { id: createId(), configId, timestamp: Date.now(), tokens, success }
  await put('apiUsageLogs', log)

  const limit = stats.recordLimit > 0 ? stats.recordLimit : 200
  const all = await getAll<ApiUsageLog>('apiUsageLogs')
  const own = all.filter((l) => l.configId === configId).sort((a, b) => b.timestamp - a.timestamp)
  if (own.length > limit) {
    await Promise.all(own.slice(limit).map((l) => remove('apiUsageLogs', l.id)))
  }
}

function buildRequestBody(
  config: ApiConfig,
  messages: AiMessage[],
  params: ModelParams,
  stream: boolean,
): string {
  // contextLimit 只截断对话历史，system prompt 必须始终保留
  const system = messages.filter((m) => m.role === 'system')
  const history = messages.filter((m) => m.role !== 'system')
  return JSON.stringify({
    model: config.model,
    messages: [...system, ...history.slice(-params.contextLimit)],
    temperature: params.temperature,
    top_p: params.topP,
    max_tokens: params.maxTokens,
    stream,
  })
}

async function postChat(config: ApiConfig, body: string): Promise<Response> {
  const url = `${config.url.replace(/\/$/, '')}/chat/completions`
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.key}`,
    },
    body,
  })
  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`API 请求失败（${response.status}）：${detail || response.statusText}`)
  }
  return response
}

export async function chatCompletion(
  config: ApiConfig,
  messages: AiMessage[],
  params: ModelParams,
): Promise<string> {
  let success = false
  let tokens = 0
  try {
    const response = await postChat(config, buildRequestBody(config, messages, params, false))
    const data = (await response.json()) as ChatCompletionResponse
    tokens = data.usage?.total_tokens ?? 0
    success = true
    return data.choices[0]?.message.content ?? ''
  } finally {
    void trackApiUsage(config.id, tokens, success)
  }
}

export async function chatCompletionStream(
  config: ApiConfig,
  messages: AiMessage[],
  params: ModelParams,
  onDelta: (text: string) => void,
): Promise<string> {
  let success = false
  let tokens = 0
  try {
    const response = await postChat(config, buildRequestBody(config, messages, params, true))
    if (!response.body) {
      throw new Error('当前环境不支持流式响应')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let full = ''

    for (;;) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })

      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const payload = trimmed.slice(5).trim()
        if (payload === '[DONE]') continue
        const chunk = JSON.parse(payload) as ChatCompletionChunk
        const delta = chunk.choices[0]?.delta.content
        if (delta) {
          full += delta
          onDelta(delta)
        }
        if (chunk.usage?.total_tokens) {
          tokens = chunk.usage.total_tokens
        }
      }
    }
    success = true
    if (tokens === 0) tokens = Math.ceil(full.length / 4)
    return full
  } finally {
    void trackApiUsage(config.id, tokens, success)
  }
}

export async function testConnection(config: ApiConfig): Promise<boolean> {
  const body = JSON.stringify({
    model: config.model,
    messages: [{ role: 'user', content: 'ping' }],
    max_tokens: 1,
  })
  await postChat(config, body)
  return true
}
