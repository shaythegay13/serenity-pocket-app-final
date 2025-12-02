import { isPerplexityAvailable, invokePerplexity } from "../perplexity"
import { isEnhancedAIAvailable, invokeClaude } from "../aws-bedrock"
import type {
  CurrentGameContext,
  GameIdentifier,
  HistoricalFeatureVector,
} from "../types/ai-models"

// Simple in-memory cache (can be replaced with Redis or another store later)
const currentContextCache = new Map<string, CurrentGameContext>()
const historicalFeaturesCache = new Map<string, HistoricalFeatureVector>()

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface Cached<T> {
  value: T
  expiresAt: number
}

const currentContextWrapped = new Map<string, Cached<CurrentGameContext>>()
const historicalWrapped = new Map<string, Cached<HistoricalFeatureVector>>()

let perplexityCooldownUntil = 0
let claudeResearchCooldownUntil = 0

function isPerplexityOnCooldown() {
  return Date.now() < perplexityCooldownUntil
}

function isClaudeResearchOnCooldown() {
  return Date.now() < claudeResearchCooldownUntil
}

function makeKey(parts: Record<string, unknown>): string {
  return JSON.stringify(parts)
}

export async function getCurrentGameContext(params: GameIdentifier): Promise<CurrentGameContext | null> {
  const canUsePerplexity = isPerplexityAvailable() && !isPerplexityOnCooldown()
  const canUseClaude = isEnhancedAIAvailable() && !isClaudeResearchOnCooldown()
  if (!canUsePerplexity && !canUseClaude) return null

  const key = makeKey({ type: "current", ...params })
  const cached = currentContextWrapped.get(key)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const system =
    "You are a sports betting research assistant. You must return strictly JSON, no commentary."

  const userPrompt = `Return concise, factual context for this game in STRICT JSON.

League: ${params.league}
Team A: ${params.teamA}
Team B: ${params.teamB}
Date (if provided): ${params.date ?? "unknown"}

Include:
- currentOdds { moneylineHome, moneylineAway, spread, spreadHomeOdds, spreadAwayOdds, totalPoints, totalOverOdds, totalUnderOdds }
- impliedProbabilities { home, away }
- keyInjuries: string[]
- weather: string
- teamForm { homeRecent: string[], awayRecent: string[] }
- pace: string
- homeAwaySplits: string
- narrativeContext: string

Respond ONLY with JSON in this TypeScript shape:
${JSON.stringify({
    league: "string",
    homeTeam: "string",
    awayTeam: "string",
    startTime: "string",
    currentOdds: {
      moneylineHome: 0,
      moneylineAway: 0,
      spread: 0,
      spreadHomeOdds: 0,
      spreadAwayOdds: 0,
      totalPoints: 0,
      totalOverOdds: 0,
      totalUnderOdds: 0,
    },
    impliedProbabilities: { home: 0, away: 0 },
    keyInjuries: ["string"],
    weather: "string",
    teamForm: { homeRecent: ["string"], awayRecent: ["string"] },
    pace: "string",
    homeAwaySplits: "string",
    narrativeContext: "string",
  })}
`

  let raw: string
  try {
    if (canUsePerplexity) {
      try {
        raw = await invokePerplexity({
          system,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.2,
        })
      } catch (perplexityError) {
        console.warn(
          "[PerplexitySportsResearcher] Perplexity current context failed, attempting Claude fallback",
          perplexityError,
        )
        const message =
          perplexityError instanceof Error
            ? perplexityError.message
            : String(perplexityError)
        if (message.includes("request_rate_limit") || message.includes("429")) {
          perplexityCooldownUntil = Date.now() + 5 * 60_000
        }
        if (canUseClaude) {
          try {
            raw = await invokeClaude({
              system,
              messages: [
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
              max_tokens: 800,
              temperature: 0.2,
            })
          } catch (claudeError) {
            const msg =
              claudeError instanceof Error ? claudeError.message : String(claudeError)
            if (msg.startsWith("CLAUDE_THROTTLED")) {
              claudeResearchCooldownUntil = Date.now() + 5 * 60_000
            }
            throw claudeError
          }
        } else {
          throw perplexityError
        }
      }
    } else if (canUseClaude) {
      try {
        raw = await invokeClaude({
          system,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.2,
        })
      } catch (claudeError) {
        const msg = claudeError instanceof Error ? claudeError.message : String(claudeError)
        if (msg.startsWith("CLAUDE_THROTTLED")) {
          claudeResearchCooldownUntil = Date.now() + 5 * 60_000
        }
        throw claudeError
      }
    } else {
      return null
    }
  } catch (e) {
    console.warn("[PerplexitySportsResearcher] current context fetch failed", e)
    return null
  }

  let jsonText = raw.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
  }

  try {
    const parsed = JSON.parse(jsonText) as CurrentGameContext

    const wrapped: Cached<CurrentGameContext> = {
      value: parsed,
      expiresAt: now + CACHE_TTL_MS,
    }
    currentContextWrapped.set(key, wrapped)

    return parsed
  } catch (e) {
    console.warn(
      "[PerplexitySportsResearcher] Failed to parse current game context JSON, skipping research context",
      e,
    )
    return null
  }
}

export async function getHistoricalGameFeatures(params: {
  league: string
  teamA: string
  teamB: string
  lookbackGames: number
}): Promise<HistoricalFeatureVector | null> {
  const canUsePerplexity = isPerplexityAvailable()
  const canUseClaude = isEnhancedAIAvailable()
  if (!canUsePerplexity && !canUseClaude) return null

  const key = makeKey({ type: "historical", ...params })
  const cached = historicalWrapped.get(key)
  const now = Date.now()
  if (cached && cached.expiresAt > now) {
    return cached.value
  }

  const system =
    "You are a sports data engineer preparing tabular features for a SageMaker model. Return strictly JSON only."

  const userPrompt = `Prepare a compact numerical feature vector for a sports betting prediction model.

League: ${params.league}
Team A: ${params.teamA}
Team B: ${params.teamB}
Lookback games: ${params.lookbackGames}

Include aggregate statistics for each team over the lookback window (offense, defense, efficiency) and matchup / line history if available.

In addition to numericFeatures and categoricalFeatures, include a derivedStats object with high-level metrics that can be mapped directly to model features, such as:
- homeOffenseRating, awayOffenseRating
- homeDefenseRating, awayDefenseRating
- homePpg, awayPpg
- homeFgPct, awayFgPct

Respond ONLY with JSON in this TypeScript shape:
${JSON.stringify({
    league: "string",
    teamA: "string",
    teamB: "string",
    lookbackGames: 10,
    numericFeatures: [0, 0, 0],
    categoricalFeatures: ["string"],
    derivedStats: {
      homeOffenseRating: 0,
      awayOffenseRating: 0,
      homeDefenseRating: 0,
      awayDefenseRating: 0,
      homePpg: 0,
      awayPpg: 0,
      homeFgPct: 0,
      awayFgPct: 0,
    },
  })}
`

  let raw: string
  try {
    if (canUsePerplexity) {
      try {
        raw = await invokePerplexity({
          system,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        })
      } catch (perplexityError) {
        console.warn(
          "[PerplexitySportsResearcher] Perplexity historical features failed, attempting Claude fallback",
          perplexityError,
        )
        const message =
          perplexityError instanceof Error
            ? perplexityError.message
            : String(perplexityError)
        if (message.includes("request_rate_limit") || message.includes("429")) {
          perplexityCooldownUntil = Date.now() + 5 * 60_000
        }
        if (canUseClaude) {
          try {
            raw = await invokeClaude({
              system,
              messages: [
                {
                  role: "user",
                  content: userPrompt,
                },
              ],
              max_tokens: 800,
              temperature: 0.3,
            })
          } catch (claudeError) {
            const msg =
              claudeError instanceof Error ? claudeError.message : String(claudeError)
            if (msg.startsWith("CLAUDE_THROTTLED")) {
              claudeResearchCooldownUntil = Date.now() + 5 * 60_000
            }
            throw claudeError
          }
        } else {
          throw perplexityError
        }
      }
    } else if (canUseClaude) {
      try {
        raw = await invokeClaude({
          system,
          messages: [
            {
              role: "user",
              content: userPrompt,
            },
          ],
          max_tokens: 800,
          temperature: 0.3,
        })
      } catch (claudeError) {
        const msg = claudeError instanceof Error ? claudeError.message : String(claudeError)
        if (msg.startsWith("CLAUDE_THROTTLED")) {
          claudeResearchCooldownUntil = Date.now() + 5 * 60_000
        }
        throw claudeError
      }
    } else {
      return null
    }
  } catch (e) {
    console.warn("[PerplexitySportsResearcher] historical features fetch failed", e)
    return null
  }

  let jsonText = raw.trim()
  if (jsonText.startsWith("```")) {
    jsonText = jsonText.replace(/```json\s*/gi, "").replace(/```/g, "").trim()
  }

  try {
    const parsed = JSON.parse(jsonText) as HistoricalFeatureVector

    const wrapped: Cached<HistoricalFeatureVector> = {
      value: parsed,
      expiresAt: now + CACHE_TTL_MS,
    }
    historicalWrapped.set(key, wrapped)

    return parsed
  } catch (e) {
    console.warn(
      "[PerplexitySportsResearcher] Failed to parse historical features JSON, skipping derived stats for this matchup",
      e,
    )
    return null
  }
}
