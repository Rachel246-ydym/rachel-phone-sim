// DeepSeek API 调用统一封装：所有 AI 请求必须经过本模块

import type { ApiConfig, ModelParams, Role } from '../types'

export interface AiMessage {
  role: Role
  content: string
}

interface ChatCompletionResponse {
  choices: Array<{
    message: { content: string }
  }>
}

interface ChatCompletionChunk {
  choices: Array<{
    delta: { content?: string }
  }>
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

async function postChat(
  config: ApiConfig,
  body: string,
): Promise<Response> {
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
  const response = await postChat(config, buildRequestBody(config, messages, params, false))
  const data = (await response.json()) as ChatCompletionResponse
  return data.choices[0]?.message.content ?? ''
}

export async function chatCompletionStream(
  config: ApiConfig,
  messages: AiMessage[],
  params: ModelParams,
  onDelta: (text: string) => void,
): Promise<string> {
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
    }
  }
  return full
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
