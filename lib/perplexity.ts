import type { ClaudeMessage } from './aws-bedrock'

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY
// Default to a known valid chat model; can be overridden via PERPLEXITY_MODEL
// If you have a preferred Perplexity model, set PERPLEXITY_MODEL in .env.local
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL
const PERPLEXITY_BASE_URL = process.env.PERPLEXITY_BASE_URL

export function isPerplexityAvailable(): boolean {
  return !!PERPLEXITY_API_KEY
}

export interface PerplexityRequest {
  system?: string
  messages: ClaudeMessage[]
  max_tokens?: number
  temperature?: number
  top_p?: number
}

export interface PerplexityChatCompletion {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: { role: 'assistant' | 'user' | 'system'; content: string }
    finish_reason: string
  }>
}

export async function invokePerplexity(request: PerplexityRequest): Promise<string> {
  if (!PERPLEXITY_API_KEY) {
    throw new Error('PERPLEXITY_API_KEY is not set')
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('🧠 Perplexity model:', PERPLEXITY_MODEL)
  }

  const body: any = {
    model: PERPLEXITY_MODEL,
    messages: request.system
      ? [
          { role: 'system', content: request.system },
          ...request.messages,
        ]
      : request.messages,
    max_tokens: request.max_tokens ?? 1024,
    temperature: request.temperature ?? 0.7,
    top_p: request.top_p ?? 0.9,
  }

  const res = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Perplexity API error: ${res.status} ${res.statusText} - ${text}`)
  }

  const json = (await res.json()) as PerplexityChatCompletion
  const message = json.choices?.[0]?.message?.content ?? ''
  return message
}
