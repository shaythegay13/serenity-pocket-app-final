export type GeminiRole = "user" | "model"

export interface GeminiMessage {
  role: GeminiRole
  parts: Array<{ text: string }>
}

export async function geminiGenerateText(args: {
  system?: string
  messages: Array<{ role: "user" | "assistant"; content: string }>
  temperature?: number
  maxOutputTokens?: number
  model?: string
  responseMimeType?: string
  responseSchema?: any
}): Promise<string> {
  const apiKey = (process.env.GOOGLE_GEMINI_API_KEY || '').trim()
  if (!apiKey) {
    throw new Error('GOOGLE_GEMINI_API_KEY is not set')
  }

  const rawModel = (
    args.model || 
    process.env.GEMINI_MODEL_ID || 
    process.env.GOOGLE_GEMINI_MODEL || 
    'gemini-2.5-pro'
  ).trim()
  const model = rawModel.startsWith('models/') ? rawModel.slice('models/'.length) : rawModel

  const contents: GeminiMessage[] = []

  if (args.system && args.system.trim()) {
    // We now use system_instruction at the top level for newer Gemini models
    // But we keep it in the contents for backward compatibility if needed, 
    // although newer APIs prefer the separate field.
  }

  for (const m of args.messages) {
    contents.push({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    })
  }

  const body = JSON.stringify({
    contents,
    system_instruction: args.system && args.system.trim() ? {
      parts: [{ text: args.system.trim() }]
    } : undefined,
    safety_settings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
    generation_config: {
      temperature: args.temperature ?? 0.1,
      max_output_tokens: args.maxOutputTokens ?? 8192,
      response_mime_type: args.responseMimeType,
      response_schema: args.responseSchema,
      thinking_config: {
        include_thoughts: false,
        thinking_budget: 256, // Reduced for faster response (was 1024)
      },
    },
  })

  // Debug log to confirm exactly what we are sending to Gemini
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Gemini Request] model=${model} endpoint=v1beta`)
    console.log(`[Gemini Request Body]`, body)
  }

  const tryFetch = async (version: 'v1' | 'v1beta' = 'v1beta') => {
    // Add a small delay to avoid rate limits and instability
    await new Promise(resolve => setTimeout(resolve, 500))

    const res = await fetch(
      `https://generativelanguage.googleapis.com/${version}/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      },
    )
    const text = await res.text()
    return { res, text }
  }

  // Always use v1beta for JSON mode and newer models as requested.
  let { res, text } = await tryFetch('v1beta')

  if (!res.ok) {
    throw new Error(`Gemini API error (${res.status}): ${text}`)
  }

  let json: any
  try {
    json = JSON.parse(text)
  } catch (e) {
    throw new Error(
      `Gemini API returned non-JSON (${e instanceof Error ? e.message : String(e)}): ${text}`
    )
  }

  // Log usage metadata to monitor thinking tokens
  if (process.env.NODE_ENV === 'development' && json?.usageMetadata) {
    console.log(`[Gemini Usage]`, json.usageMetadata)
  }

  const out =
    json?.candidates?.[0]?.content?.parts
      ?.map((p: any) => (typeof p?.text === 'string' ? p.text : ''))
      .join('') || ''

  if (!out) {
    const candidate = json?.candidates?.[0]
    const promptFeedback = json?.promptFeedback
    
    if (promptFeedback?.blockReason) {
      console.warn(`⚠️ Gemini prompt blocked. Reason: ${promptFeedback.blockReason}`, promptFeedback.safetyRatings)
      throw new Error(`Gemini prompt blocked: ${promptFeedback.blockReason}`)
    }

    if (candidate?.finishReason && candidate.finishReason !== 'STOP') {
      const reason = candidate.finishReason
      console.warn(`⚠️ Gemini response empty. Finish reason: ${reason}`, candidate.safetyRatings)
      if (reason === 'MAX_TOKENS') {
        throw new Error(`Gemini reached token limit (MAX_TOKENS). The reasoning or JSON was too long for the current budget.`)
      }
      throw new Error(`Gemini response blocked or empty: ${reason}`)
    }

    if (!json?.candidates || json.candidates.length === 0) {
      console.warn(`⚠️ Gemini returned no candidates. Full response: ${text}`)
      throw new Error('Gemini returned no candidates')
    }
  }

  return out
}
