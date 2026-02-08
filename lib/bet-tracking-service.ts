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
   * @param description Game description
   * @param odds Bet odds
   * @param stake Bet stake amount
   * @param analysis AI analysis object
   * @param emotionalState User's emotional state
   * @param emotionalIntensity Emotional intensity (1-10)
   * @param isLiveBet Whether this is a live bet
   * @param overrideTeams Optional pre-parsed and normalized team names
   * @param overrideSelection Optional user-selected team side (home/away)
   */
  static async saveBetAnalyzerBet(
    description: string,
    odds: number,
    stake: number,
    analysis: any,
    emotionalState?: string,
    emotionalIntensity?: number,
    isLiveBet?: boolean,
    overrideTeams?: { awayTeam: string; homeTeam: string },
    overrideSelection?: "home" | "away"
  ): Promise<ComprehensiveBet> {
    const betId = typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

    // Extract sport and teams from description
    const parsed = this.parseBetDescription(description)

    // Use override values if provided, otherwise use parsed values
    const finalHomeTeam = overrideTeams?.homeTeam || parsed.homeTeam || "Unknown"
    const finalAwayTeam = overrideTeams?.awayTeam || parsed.awayTeam || "Unknown"
    const finalSelection = overrideSelection || parsed.selection || "away"

    const comprehensiveBet: ComprehensiveBet = {
      id: betId,
      timestamp: new Date(),

      // Core bet details
      sport: parsed.sport || "americanfootball_nfl",
      homeTeam: finalHomeTeam,
      awayTeam: finalAwayTeam,
      gameDate: new Date(), // For bet analyzer, we don't have game date info
      betType: parsed.betType,
      selection: finalSelection,
      line: parsed.line,
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
   * Supports formats:
   * - "Team A vs Team B", "Team A v Team B", "Team A @ Team B"
   * - "Football, Seahawks v Patriots, Superbowl"
   * - "NBA: Lakers vs Warriors"
   * - "Chiefs -3.5 vs Eagles"
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

    // First, detect sport from the description (do this first so we can use it for team lookup)
    const lowerDesc = description.toLowerCase()

    // Extended sport detection with more team names
    const sportPatterns: { pattern: RegExp; sport: SupportedSportKey }[] = [
      // NBA
      { pattern: /\b(nba|basketball|lakers|celtics|warriors|bulls|heat|knicks|nets|76ers|sixers|bucks|suns|mavericks|mavs|clippers|rockets|spurs|nuggets|timberwolves|wolves|grizzlies|pelicans|thunder|blazers|trail blazers|jazz|kings|magic|hawks|hornets|pistons|pacers|cavaliers|cavs|raptors|wizards)\b/i, sport: "basketball_nba" },
      // NFL
      { pattern: /\b(nfl|football|superbowl|super bowl|chiefs|eagles|cowboys|patriots|pats|49ers|niners|bills|bengals|ravens|dolphins|jets|browns|steelers|titans|colts|jaguars|jags|texans|broncos|raiders|chargers|seahawks|hawks|cardinals|cards|rams|saints|buccaneers|bucs|falcons|panthers|bears|lions|packers|vikings|commanders|giants)\b/i, sport: "americanfootball_nfl" },
      // MLB
      { pattern: /\b(mlb|baseball|yankees|dodgers|red sox|redsox|cubs|mets|braves|astros|phillies|padres|guardians|mariners|twins|rays|orioles|blue jays|angels|rangers|white sox|whitesox|brewers|diamondbacks|d-backs|rockies|giants|athletics|a's|royals|tigers|reds|pirates|nationals|marlins)\b/i, sport: "baseball_mlb" },
      // NHL
      { pattern: /\b(nhl|hockey|bruins|rangers|penguins|maple leafs|leafs|canadiens|habs|blackhawks|red wings|flyers|capitals|caps|lightning|avalanche|avs|oilers|flames|canucks|kraken|golden knights|knights|blues|predators|preds|wild|jets|hurricanes|canes|stars|ducks|sharks|coyotes|devils|islanders|senators|sens|sabres|panthers|blue jackets)\b/i, sport: "icehockey_nhl" },
      // NCAA Basketball
      { pattern: /\b(ncaab|ncaa basketball|college basketball|march madness|duke|kentucky|kansas|unc|north carolina|gonzaga|villanova|michigan state|ucla)\b/i, sport: "basketball_ncaab" as SupportedSportKey },
      // NCAA Football
      { pattern: /\b(ncaaf|ncaa football|college football|cfb|alabama|ohio state|georgia|clemson|michigan|lsu|oklahoma|texas|usc|oregon|notre dame)\b/i, sport: "americanfootball_ncaaf" as SupportedSportKey },
      // UFC/MMA
      { pattern: /\b(ufc|mma|mixed martial arts|bellator|pfl)\b/i, sport: "mma_ufc" as SupportedSportKey },
      // Soccer
      { pattern: /\b(soccer|premier league|epl|la liga|bundesliga|serie a|ligue 1|mls|champions league|ucl|manchester|liverpool|chelsea|arsenal|tottenham|barcelona|real madrid|bayern|psg|inter|juventus|milan)\b/i, sport: "soccer_epl" as SupportedSportKey },
    ]

    for (const { pattern, sport } of sportPatterns) {
      if (pattern.test(lowerDesc)) {
        result.sport = sport
        break
      }
    }

    // Clean the description by removing sport prefixes and event suffixes
    // This helps with team extraction
    let cleanedDesc = description
      // Remove sport prefixes like "Football, ", "NBA: ", "NFL - "
      .replace(/^(football|basketball|baseball|hockey|soccer|nba|nfl|mlb|nhl|ncaab|ncaaf|mma|ufc)[,:\-–—\s]+/i, '')
      // Remove event suffixes like ", Superbowl", " - NBA Finals"
      .replace(/[,\-–—]\s*(superbowl|super bowl|world series|stanley cup|nba finals|playoffs|championship|week \d+|round \d+|game \d+).*$/i, '')
      .trim()

    // Team extraction patterns (applied to cleaned description)
    // Order matters: try most specific patterns first

    // Pattern 1: "Team A @ Team B" (away @ home)
    let teamMatch = cleanedDesc.match(/([A-Za-z0-9\s']+?)\s*@\s*([A-Za-z0-9\s']+?)(?:\s*[,\-–—]|$)/i)
    if (teamMatch) {
      result.awayTeam = this.cleanTeamName(teamMatch[1])
      result.homeTeam = this.cleanTeamName(teamMatch[2])
    }

    // Pattern 2: "Team A vs Team B" or "Team A v Team B" or "Team A versus Team B"
    if (!result.homeTeam) {
      teamMatch = cleanedDesc.match(/([A-Za-z0-9\s']+?)\s+(?:vs\.?|v\.?|versus)\s+([A-Za-z0-9\s']+?)(?:\s*[,\-–—]|$)/i)
      if (teamMatch) {
        result.awayTeam = this.cleanTeamName(teamMatch[1])
        result.homeTeam = this.cleanTeamName(teamMatch[2])
      }
    }

    // Pattern 3: Look for team separator anywhere in the string (more lenient)
    if (!result.homeTeam) {
      // Try to find "vs" or "v" surrounded by word boundaries
      teamMatch = cleanedDesc.match(/\b([A-Za-z][A-Za-z0-9\s']*?)\s+(?:vs\.?|v\.?)\s+([A-Za-z][A-Za-z0-9\s']*?)\b/i)
      if (teamMatch) {
        result.awayTeam = this.cleanTeamName(teamMatch[1])
        result.homeTeam = this.cleanTeamName(teamMatch[2])
      }
    }

    // Pattern 4: "Team A - Team B" format (make sure it's not a spread like "Team -3.5")
    if (!result.homeTeam) {
      teamMatch = cleanedDesc.match(/([A-Za-z][A-Za-z0-9\s']+?)\s*[-–—]\s*([A-Za-z][A-Za-z0-9\s']+?)(?:\s*[,]|$)/i)
      if (teamMatch && !teamMatch[2].match(/^\d/)) {
        result.awayTeam = this.cleanTeamName(teamMatch[1])
        result.homeTeam = this.cleanTeamName(teamMatch[2])
      }
    }

    // Try to extract over/under
    const ouMatch = description.match(/\b(Over|Under)\s*(\d+(?:\.\d+)?)/i)
    if (ouMatch) {
      result.betType = "total"
      result.selection = ouMatch[1].toLowerCase() as "over" | "under"
      result.line = parseFloat(ouMatch[2])
    }

    // Try to extract spread (e.g., "Chiefs -3.5" or "Eagles +7")
    const spreadMatch = description.match(/\b([A-Za-z][A-Za-z0-9\s']*?)\s*([+-]\d+(?:\.\d+)?)\b/i)
    if (spreadMatch && result.betType === "moneyline") {
      result.betType = "spread"
      result.line = parseFloat(spreadMatch[2])

      // Determine selection based on which team has the spread
      const teamWithSpread = this.cleanTeamName(spreadMatch[1]).toLowerCase()
      if (result.awayTeam && teamWithSpread.includes(result.awayTeam.toLowerCase().split(' ').pop() || '')) {
        result.selection = "away"
      } else if (result.homeTeam && teamWithSpread.includes(result.homeTeam.toLowerCase().split(' ').pop() || '')) {
        result.selection = "home"
      }
    }

    return result
  }

  /**
   * Clean team name by removing extra whitespace and common prefixes
   */
  private static cleanTeamName(name: string): string {
    return name
      .trim()
      // Remove leading "the"
      .replace(/^the\s+/i, '')
      // Remove trailing bet type indicators
      .replace(/\s*(moneyline|ml|spread|total|over|under)$/i, '')
      // Collapse multiple spaces
      .replace(/\s+/g, ' ')
      .trim()
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
