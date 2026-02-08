import { ComprehensiveBet } from "@/lib/types/bet-tracking"
import { storageHybrid as storage } from "@/lib/storage-hybrid"
import { calculateBetReturn, calculateProfitLoss } from "@/lib/bet-tracking-calculations"
import { analyticsEvents, ANALYTICS_EVENTS } from "@/lib/events"
import type { SupportedSportKey, GameBetMarketType } from "@/lib/types"

export class BetTrackingService {
  /**
   * Save a comprehensive bet from TiltLab analysis
   */
  static async saveTiltLabBet(
    betScenario: any,
    analysis: any,
    usedEnhancedAI: boolean,
    enhancedInsights?: string[]
  ): Promise<ComprehensiveBet> {
    const betId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    // Map bet type to standardized format
    const betTypeMap: Record<string, GameBetMarketType> = {
      "Moneyline": "moneyline",
      "Spread": "spread",
      "Over/Under": "total",
      "Parlay": "parlay"
    }

    // Parse game date from scenario, falling back to current date
    const gameDate = betScenario.gameDate
      ? new Date(betScenario.gameDate)
      : betScenario.startTime
        ? new Date(betScenario.startTime)
        : new Date()

    const comprehensiveBet: ComprehensiveBet = {
      id: betId,
      timestamp: new Date(),

      // Core bet details
      sport: betScenario.sport,
      homeTeam: betScenario.homeTeam || betScenario.favoriteTeam,
      awayTeam: betScenario.awayTeam || betScenario.underdogTeam,
      gameDate,
      betType: betTypeMap[betScenario.betType] || "moneyline",
      selection: betScenario.selection || "away",
      line: betScenario.line,
      odds: betScenario.odds || -110, // Default if not provided
      stake: betScenario.betAmount,

      // Emotions timeline (include all three phases)
      emotions: {
        before: {
          emotion: betScenario.currentEmotion || "neutral",
          intensity: betScenario.currentEmotionIntensity || 5,
          timestamp: new Date(),
          triggers: betScenario.emotionalTriggers
        },
        during: {
          emotion: "",
          intensity: 5,
          timestamp: new Date()
        },
        after: {
          emotion: "",
          intensity: 5,
          timestamp: new Date()
        }
      },

      // Psychological factors
      biasesIdentified: betScenario.biasesIdentified || [],
      confidenceLevel: betScenario.confidenceLevel || 5,
      reasoning: betScenario.reasoning || betScenario.notes,
      isLiveBet: betScenario.isLiveBet || false,
      isChasingLoss: betScenario.isChasingLoss || false,
      isFavoriteTeam: betScenario.isFavoriteTeam || false,

      // AI analysis
      aiRecommendation: analysis.recommendation?.reason || analysis.recommendation?.recommendation,
      expectedValue: analysis.recommendation?.expectedValue,
      probabilityEstimate: analysis.recommendation?.probabilityEstimate || analysis.recommendation?.confidenceScore,
      riskLevel: analysis.recommendation?.riskLevel?.toLowerCase(),

      // Metadata
      source: "tiltlab",
      sportsbook: betScenario.sportsbook || "DraftKings",
      outcome: "pending"
    }

    // Save to storage
    await this.saveComprehensiveBet(comprehensiveBet)

    // Emit event to refresh analytics data across the app
    analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

    return comprehensiveBet
  }

  /**
   * Save a comprehensive bet from Bet Analyzer
   */
  static async saveBetAnalyzerBet(
    description: string,
    odds: number,
    stake: number,
    analysis: any,
    emotionalState?: string,
    emotionalIntensity?: number,
    isLiveBet?: boolean
  ): Promise<ComprehensiveBet> {
    const betId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    // Extract sport and teams from description
    const { sport, homeTeam, awayTeam, betType, selection, line } = this.parseBetDescription(description)

    const comprehensiveBet: ComprehensiveBet = {
      id: betId,
      timestamp: new Date(),

      // Core bet details
      sport: sport || "americanfootball_nfl",
      homeTeam: homeTeam || "Unknown",
      awayTeam: awayTeam || "Unknown",
      gameDate: new Date(), // For bet analyzer, we don't have game date info
      betType,
      selection: selection || "away",
      line,
      odds,
      stake,

      // Emotions timeline (include all three phases)
      emotions: {
        before: {
          emotion: emotionalState || "neutral",
          intensity: emotionalIntensity || 5,
          timestamp: new Date()
        },
        during: {
          emotion: "",
          intensity: 5,
          timestamp: new Date()
        },
        after: {
          emotion: "",
          intensity: 5,
          timestamp: new Date()
        }
      },

      // Psychological factors
      biasesIdentified: analysis.biasWarnings || [],
      confidenceLevel: Math.round((analysis.confidenceScore || 0) * 10), // Convert 0-1 to 1-10
      reasoning: analysis.recommendation,
      isLiveBet: isLiveBet || false,
      isChasingLoss: false,
      isFavoriteTeam: false,

      // AI analysis
      aiRecommendation: analysis.recommendation,
      expectedValue: analysis.expectedValue,
      probabilityEstimate: analysis.probability,
      riskLevel: analysis.riskLevel?.toLowerCase(),

      // Metadata
      source: "bet-analyzer",
      outcome: "pending",

      // Store original description as fallback for display
      description
    }

    await this.saveComprehensiveBet(comprehensiveBet)

    // Emit event to refresh analytics data across the app
    analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

    return comprehensiveBet
  }

  /**
   * Update bet outcome and calculate P/L
   */
  static async updateBetOutcome(
    betId: string,
    outcome: "win" | "loss" | "push" | "pending",
    postBetEmotion?: string,
    postBetIntensity?: number,
    reflection?: string
  ): Promise<ComprehensiveBet | null> {
    const bets = await this.getAllBets()
    const betIndex = bets.findIndex(bet => bet.id === betId)

    if (betIndex === -1) return null

    const bet = bets[betIndex]

    // Calculate return and P/L
    const actualReturn = calculateBetReturn(bet.odds, bet.stake, outcome)
    const profitLoss = calculateProfitLoss(bet.odds, bet.stake, outcome)

    // Update bet with outcome
    const updatedBet: ComprehensiveBet = {
      ...bet,
      outcome,
      actualReturn,
      profitLoss,
      emotions: {
        ...bet.emotions,
        after: {
          emotion: postBetEmotion || bet.emotions.before.emotion,
          intensity: postBetIntensity || bet.emotions.before.intensity,
          timestamp: new Date(),
          reflection
        }
      },
      completedAt: new Date()
    }

    // Save updated bet
    bets[betIndex] = updatedBet
    await this.saveAllBets(bets)

    return updatedBet
  }

  /**
   * Update emotion state for a specific phase (before/during/after)
   */
  static async updateBetEmotion(
    betId: string,
    phase: "before" | "during" | "after",
    emotion: string,
    intensity: number,
    context?: string
  ): Promise<ComprehensiveBet | null> {
    const bets = await this.getAllBets()
    const betIndex = bets.findIndex(bet => bet.id === betId)

    if (betIndex === -1) return null

    const bet = bets[betIndex]

    // Create updated emotions object
    const updatedEmotions = { ...bet.emotions }

    if (phase === "before") {
      updatedEmotions.before = {
        ...updatedEmotions.before,
        emotion,
        intensity,
        timestamp: new Date(),
        triggers: context ? [context] : updatedEmotions.before.triggers
      }
    } else if (phase === "during") {
      updatedEmotions.during = {
        emotion,
        intensity,
        timestamp: new Date()
      }
    } else if (phase === "after") {
      updatedEmotions.after = {
        emotion,
        intensity,
        timestamp: new Date(),
        reflection: context
      }
    }

    // Update bet
    const updatedBet: ComprehensiveBet = {
      ...bet,
      emotions: updatedEmotions
    }

    // Save updated bet
    bets[betIndex] = updatedBet
    await this.saveAllBets(bets)

    analyticsEvents.emit(ANALYTICS_EVENTS.BETTING_DATA_SAVED)

    return updatedBet
  }

  /**
   * Get all comprehensive bets
   */
  static async getAllBets(): Promise<ComprehensiveBet[]> {
    try {
      const bets = await storage.getComprehensiveBets()
      return bets.map((bet: ComprehensiveBet) => ({
        ...bet,
        timestamp: new Date(bet.timestamp),
        gameDate: bet.gameDate ? new Date(bet.gameDate) : new Date(),
        emotions: {
          before: {
            ...bet.emotions.before,
            timestamp: new Date(bet.emotions.before.timestamp)
          },
          ...(bet.emotions.during && {
            during: {
              ...bet.emotions.during,
              timestamp: new Date(bet.emotions.during.timestamp)
            }
          }),
          ...(bet.emotions.after && {
            after: {
              ...bet.emotions.after,
              timestamp: new Date(bet.emotions.after.timestamp)
            }
          })
        },
        ...(bet.completedAt && { completedAt: new Date(bet.completedAt) })
      }))
    } catch (error) {
      console.error('Failed to load comprehensive bets:', error)
      return []
    }
  }

  /**
   * Save a comprehensive bet
   */
  private static async saveComprehensiveBet(bet: ComprehensiveBet): Promise<void> {
    try {
      // @ts-ignore - Method added dynamically to storageHybrid
      await storage.addComprehensiveBet(bet)
    } catch (error) {
      console.error('Failed to save comprehensive bet:', error)
      throw error
    }
  }

  /**
   * Save all bets (for updates)
   */
  private static async saveAllBets(bets: ComprehensiveBet[]): Promise<void> {
    try {
      // @ts-ignore - Method added dynamically to storageHybrid
      await storage.saveComprehensiveBets(bets)
    } catch (error) {
      console.error('Failed to save comprehensive bets:', error)
      throw error
    }
  }

  /**
   * Parse bet description to extract structured data
   * Supports formats: "Team A vs Team B", "Team A v Team B", "Team A @ Team B", "Team A - Team B"
   */
  private static parseBetDescription(description: string): {
    sport?: SupportedSportKey
    homeTeam?: string
    awayTeam?: string
    betType: GameBetMarketType
    selection?: "home" | "away" | "over" | "under"
    line?: number
    rawDescription?: string
  } {
    // Default values
    const result: any = {
      betType: "moneyline" as GameBetMarketType,
      rawDescription: description // Store original description as fallback
    }

    // Try multiple team name formats in order of specificity
    // Format: "Team A @ Team B" (away @ home)
    let teamMatch = description.match(/^([A-Za-z0-9\s]+?)\s*@\s*([A-Za-z0-9\s]+?)(?:\s*[-–—]|$)/i)
    if (teamMatch) {
      result.awayTeam = teamMatch[1].trim()
      result.homeTeam = teamMatch[2].trim()
    }

    // Format: "Team A vs Team B" or "Team A v Team B"
    if (!result.homeTeam) {
      teamMatch = description.match(/^([A-Za-z0-9\s]+?)\s+(?:vs\.?|v\.?)\s+([A-Za-z0-9\s]+?)(?:\s*[-–—]|$)/i)
      if (teamMatch) {
        // In "vs" format, first team is typically away, second is home
        result.awayTeam = teamMatch[1].trim()
        result.homeTeam = teamMatch[2].trim()
      }
    }

    // Format: "Team A - Team B" (with dash separator, not to be confused with spread)
    if (!result.homeTeam) {
      // Only match if the dash is followed by another word (not a number for spread)
      teamMatch = description.match(/^([A-Za-z0-9\s]+?)\s*[-–—]\s*([A-Za-z][A-Za-z0-9\s]+?)(?:\s*[-–—]|$)/i)
      if (teamMatch) {
        result.awayTeam = teamMatch[1].trim()
        result.homeTeam = teamMatch[2].trim()
      }
    }

    // Try to extract over/under
    const ouMatch = description.match(/\b(Over|Under)\s*(\d+(?:\.\d+)?)/i)
    if (ouMatch) {
      result.betType = "total"
      result.selection = ouMatch[1].toLowerCase() as "over" | "under"
      result.line = parseFloat(ouMatch[2])
    }

    // Try to extract spread (only if we have teams identified)
    if (result.homeTeam || result.awayTeam) {
      const spreadMatch = description.match(/([A-Za-z0-9\s]+?)\s*([+-]\d+(?:\.\d+)?)\s*(?:$|,|\()/i)
      if (spreadMatch && result.betType === "moneyline") {
        result.betType = "spread"
        result.line = parseFloat(spreadMatch[2])

        // Determine selection based on which team is mentioned
        const teamInSpread = spreadMatch[1].trim().toLowerCase()
        if (result.awayTeam && teamInSpread.includes(result.awayTeam.toLowerCase())) {
          result.selection = "away"
        } else if (result.homeTeam && teamInSpread.includes(result.homeTeam.toLowerCase())) {
          result.selection = "home"
        }
      }
    }

    // Try to detect sport from common keywords
    const lowerDesc = description.toLowerCase()
    if (lowerDesc.includes("nba") || lowerDesc.includes("basketball") || lowerDesc.includes("lakers") ||
        lowerDesc.includes("celtics") || lowerDesc.includes("warriors") || lowerDesc.includes("bulls")) {
      result.sport = "basketball_nba"
    } else if (lowerDesc.includes("nfl") || lowerDesc.includes("football") || lowerDesc.includes("chiefs") ||
               lowerDesc.includes("eagles") || lowerDesc.includes("cowboys") || lowerDesc.includes("patriots")) {
      result.sport = "americanfootball_nfl"
    } else if (lowerDesc.includes("mlb") || lowerDesc.includes("baseball") || lowerDesc.includes("yankees") ||
               lowerDesc.includes("dodgers") || lowerDesc.includes("red sox") || lowerDesc.includes("cubs")) {
      result.sport = "baseball_mlb"
    } else if (lowerDesc.includes("nhl") || lowerDesc.includes("hockey") || lowerDesc.includes("bruins") ||
               lowerDesc.includes("rangers") || lowerDesc.includes("penguins") || lowerDesc.includes("maple leafs")) {
      result.sport = "icehockey_nhl"
    }

    return result
  }

  /**
   * Get pending bets that need outcomes
   */
  static async getPendingBets(): Promise<ComprehensiveBet[]> {
    const allBets = await this.getAllBets()
    return allBets.filter(bet => bet.outcome === "pending")
  }

  /**
   * Get completed bets for analytics
   */
  static async getCompletedBets(): Promise<ComprehensiveBet[]> {
    const allBets = await this.getAllBets()
    return allBets.filter(bet => bet.outcome && bet.outcome !== "pending")
  }
}
