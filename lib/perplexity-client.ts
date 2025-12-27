// Perplexity client for AI sports research
// Uses PERPLEXITY_API_KEY, PERPLEXITY_MODEL, PERPLEXITY_BASE_URL from environment

export interface PerplexityGameInsight {
  id: string
  sport: string
  homeTeam: string
  awayTeam: string
  commenceTime?: string
  narrative: string
  keyFactors: string[]
  riskWarnings: string[]
}

const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || ""
// Use llama-3.1-sonar-small-128k-online as fallback (valid Perplexity model)
const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || "llama-3.1-sonar-small-128k-online"
const PERPLEXITY_BASE_URL = (process.env.PERPLEXITY_BASE_URL || "https://api.perplexity.ai").replace(/\/$/, "")

interface PerplexityMessage {
  role: "system" | "user"
  content: string
}

interface PerplexityChatRequest {
  model: string
  messages: PerplexityMessage[]
  temperature?: number
  max_tokens?: number
}

interface PerplexityChatResponse {
  choices?: Array<{
    message?: { content?: string }
  }>
}

export async function fetchPerplexityGameInsights(
  sport: string,
  fixtures: { id: string; homeTeam: string; awayTeam: string; commenceTime?: Date }[],
): Promise<{ success: boolean; data: PerplexityGameInsight[]; error?: string }> {
  console.log('>>> ENTERED fetchPerplexityGameInsights', {
    sport,
    fixtureCount: fixtures.length,
    keyPresent: !!PERPLEXITY_API_KEY,
  });

  console.log('[Perplexity] KEY PRESENT?', !!PERPLEXITY_API_KEY);
  console.log(
    '[Perplexity] KEY PREFIX:',
    PERPLEXITY_API_KEY ? PERPLEXITY_API_KEY.slice(0, 12) : 'none',
  );
  console.log('[Perplexity] BASE URL:', PERPLEXITY_BASE_URL);
  console.log('[Perplexity] MODEL:', PERPLEXITY_MODEL);
  if (!PERPLEXITY_API_KEY) {
    return { success: false, data: [], error: "Perplexity API key not configured" }
  }

  const limitedFixtures = fixtures.slice(0, 5)

  const systemPrompt = [
    "You are a sports betting research assistant.",
    "You provide qualitative analysis only.",
    "Do NOT invent exact betting lines, prices, or bookmaker odds.",
    "Focus on matchup edges, recent form, style, and risks.",
    "Return JSON only, no prose outside of JSON.",
  ].join(" ")

  const userPayload = {
    sport,
    fixtures: limitedFixtures.map(f => ({
      id: f.id,
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      commenceTime: f.commenceTime ? f.commenceTime.toISOString() : undefined,
    })),
  }

  const userPrompt = [
    "Analyze the following upcoming or recent games.",
    "For each game, respond with strictly qualitative insights (no numeric prices).",
    "Schema:",
    "{",
    "  \"insights\": [",
    "    {",
    "      \"id\": string, // must match fixture.id",
    "      \"narrative\": string,",
    "      \"keyFactors\": string[],",
    "      \"riskWarnings\": string[]",
    "    }",
    "  ]",
    "}",
    "Input:",
    JSON.stringify(userPayload),
  ].join("\n")

  const body: PerplexityChatRequest = {
    model: PERPLEXITY_MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
    temperature: 0.5,
    max_tokens: 800,
  }

  try {
    console.log(`🔍 [Perplexity] Attempting request to: ${PERPLEXITY_BASE_URL}/chat/completions`)
    console.log(`🔍 [Perplexity] Model: ${body.model}`)
    console.log(`🔍 [Perplexity] Fixtures count: ${fixtures.length}`)

    const res = await fetch(`${PERPLEXITY_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
      },
      body: JSON.stringify(body),
    })
    console.log(`[Perplexity API] Fetch - Status: ${res.status} ${res.ok ? '✓ SUCCESS' : '✗ FAILED (Auth/Rate Limit Error?)'}`)

    if (!res.ok) {
      const text = await res.text()
      console.error("❌ Perplexity API error:", res.status)
      console.error("❌ Response preview:", text.substring(0, 500))

      // Check if it's a CloudFlare challenge
      if (text.includes('cloudflare') || text.includes('cf-chl')) {
        console.error("🚫 CloudFlare is blocking the request - API may be rate-limited or protected")
        return { success: false, data: [], error: `CloudFlare protection triggered (${res.status})` }
      }

      // Check if it's an auth error
      if (res.status === 401) {
        console.error("🔑 Authentication failed - check PERPLEXITY_API_KEY")
        return { success: false, data: [], error: `Authentication failed - invalid API key` }
      }

      return { success: false, data: [], error: `Perplexity API error: ${res.status}` }
    }

    const data = (await res.json()) as PerplexityChatResponse
    const content = data.choices?.[0]?.message?.content || ""

    let parsed: any
    try {
      parsed = JSON.parse(content)
    } catch (err) {
      console.error("❌ Failed to parse Perplexity JSON:", content)
      return { success: false, data: [], error: "Failed to parse Perplexity JSON" }
    }

    const insightsArr: any[] = Array.isArray(parsed?.insights) ? parsed.insights : []

    const result: PerplexityGameInsight[] = insightsArr.map(ins => ({
      id: String(ins.id ?? ""),
      sport,
      homeTeam: String(ins.homeTeam ?? ""),
      awayTeam: String(ins.awayTeam ?? ""),
      commenceTime: typeof ins.commenceTime === "string" ? ins.commenceTime : undefined,
      narrative: String(ins.narrative ?? ""),
      keyFactors: Array.isArray(ins.keyFactors) ? ins.keyFactors.map(String) : [],
      riskWarnings: Array.isArray(ins.riskWarnings) ? ins.riskWarnings.map(String) : [],
    }))

    return { success: true, data: result }
  } catch (error) {
    console.error("❌ Error calling Perplexity:", error)
    return {
      success: false,
      data: [],
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
