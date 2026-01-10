/**
 * Sportsbook API v2 Integration
 * Updated to work with the actual API response structure
 *
 * Example endpoint: https://sportsbook-api2.p.rapidapi.com/advantages
 */

const RAPIDAPI_HOST = 'sportsbook-api2.p.rapidapi.com';
const RAPIDAPI_KEY = process.env.NEXT_PUBLIC_RAPIDAPI_SPORTSBOOK_KEY || '';

/**
 * Sportsbook API Response Types (based on actual API)
 */
interface Participant {
  key: string;
  slug: string;
  name: string;
  shortName: string;
  sport: string;
}

interface Competition {
  key: string;
  slug: string;
  name: string;
  shortName: string;
  sport: string;
  category: string;
}

interface CompetitionInstance {
  key: string;
  name: string;
  competitionKey: string;
  startAt: string;
  endAt: string;
  competition: Competition;
}

interface EventSummary {
  forKey: string;
  text: string;
  type: string; // e.g., "PRE_EVENT_SUMMARY"
}

interface Event {
  key: string;
  name: string;
  type: string;
  startTime: string;
  homeParticipantKey: string;
  participants: Participant[];
  summaries: EventSummary[];
  competitionInstance: CompetitionInstance;
}

interface Outcome {
  key: string;
  modifier: number; // Line/spread value
  payout: number; // Odds (American format)
  type: string; // e.g., "MONEYLINE", "SPREAD", "TOTAL"
  live: boolean;
  readAt: string;
  lastFoundAt: string;
  source: string; // Sportsbook name
  marketKey: string;
  participantKey: string;
  participant: Participant;
}

interface MarketStatistic {
  key: string;
  type: string;
  subType: string;
  modifier: number;
  marketKey: string;
  value: number;
  participantKey: string;
  lastFoundAt: string;
}

interface Market {
  key: string;
  type: string; // e.g., "MONEYLINE", "SPREAD", "TOTAL"
  segment: string;
  lastFoundAt: string;
  participantKey: string;
  participant: Participant;
  event: Event;
}

interface Advantage {
  key: string;
  type: string; // e.g., "ARBITRAGE", "POSITIVE_EV"
  lastFoundAt: string;
  createdAt: string;
  market: Market;
  outcomes: Outcome[];
  marketStatistics: MarketStatistic[];
}

interface SportsbookAPIResponse {
  advantages: Advantage[];
}

/**
 * Transformed game data for our app
 */
export interface TransformedGame {
  id: string;
  sport: string;
  sportKey?: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  homeOdds?: {
    best?: {
      bookmaker: string;
      odds: number;
    };
    all?: Array<{
      bookmaker: string;
      odds: number;
    }>;
  };
  awayOdds?: {
    best?: {
      bookmaker: string;
      odds: number;
    };
    all?: Array<{
      bookmaker: string;
      odds: number;
    }>;
  };
  spread?: {
    home: {
      line: number;
      best?: {
        bookmaker: string;
        odds: number;
      };
    };
    away: {
      line: number;
      best?: {
        bookmaker: string;
        odds: number;
      };
    };
  };
  totals?: {
    over: {
      line: number;
      best?: {
        bookmaker: string;
        odds: number;
      };
    };
    under: {
      line: number;
      best?: {
        bookmaker: string;
        odds: number;
      };
    };
  };
  bookmakers?: string[];
}

/**
 * Check if RapidAPI Sportsbook is configured
 */
export function isConfigured(): boolean {
  return !!RAPIDAPI_KEY;
}

/**
 * Fetch advantages from Sportsbook API
 * This endpoint returns betting opportunities (arbitrage, +EV, etc.)
 */
export async function fetchAdvantages(sport?: string): Promise<{
  success: boolean;
  data?: TransformedGame[];
  error?: string;
  remainingRequests?: number;
}> {
  if (!RAPIDAPI_KEY) {
    console.warn('⚠️ RAPIDAPI_SPORTSBOOK_KEY not configured');
    return {
      success: false,
      error: 'API key not configured'
    };
  }

  try {
    // Use the correct v0 endpoint with type parameter
    let url = `https://${RAPIDAPI_HOST}/v0/advantages/?type=ARBITRAGE`;

    // Add sport filter if provided
    if (sport) {
      // Map our sport keys to Sportsbook API sport names
      const sportMap: Record<string, string> = {
        'americanfootball_nfl': 'AMERICAN_FOOTBALL',
        'basketball_nba': 'BASKETBALL',
        'baseball_mlb': 'BASEBALL',
        'icehockey_nhl': 'ICE_HOCKEY'
      };
      const apiSport = sportMap[sport] || sport.toUpperCase();
      url += `&sport=${apiSport}`;
    }

    console.log(`📡 Fetching from Sportsbook API: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'x-rapidapi-host': RAPIDAPI_HOST,
        'x-rapidapi-key': RAPIDAPI_KEY
      }
    });

    // Check rate limit headers
    const remainingRequests = response.headers.get('x-ratelimit-requests-remaining');
    console.log(`[Sportsbook API] Fetch - Status: ${response.status} ${response.ok ? '✓ SUCCESS' : '✗ FAILED (Auth/Rate Limit Error?)'}`);
    console.log(`⏳ Remaining API requests: ${remainingRequests || 'unknown'}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ Sportsbook API error (${response.status}):`, errorText);

      return {
        success: false,
        error: `API request failed: ${response.status} ${response.statusText}`,
        remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
      };
    }

    const data: SportsbookAPIResponse = await response.json();

    // Transform advantages into game data, filtering by requested sport
    const games = transformAdvantages(data.advantages, sport);

    console.log(`✅ Sportsbook API success - Retrieved ${games.length} games from ${data.advantages.length} advantages for sport: ${sport}`);

    return {
      success: true,
      data: games,
      remainingRequests: remainingRequests ? parseInt(remainingRequests) : undefined
    };
  } catch (error) {
    console.error('❌ Error fetching from Sportsbook API:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Transform advantages response into game data
 * Groups advantages by event and extracts team names, odds, etc.
 * @param advantages - Array of advantage objects from the API
 * @param requestedSport - The sport key that was requested (e.g., 'americanfootball_nfl')
 */
function transformAdvantages(advantages: Advantage[], requestedSport?: string): TransformedGame[] {
  // Map requested sport to league name for strict filtering
  const sportToLeague: Record<string, string> = {
    'americanfootball_nfl': 'NFL',
    'basketball_nba': 'NBA',
    'baseball_mlb': 'MLB',
    'icehockey_nhl': 'NHL'
  };

  const requestedLeague = requestedSport ? sportToLeague[requestedSport] : null;

  // Only keep advantages from the core US leagues we currently support in the dashboard
  const allowedLeagues = new Set(["NFL", "NBA", "MLB", "NHL"]);

  // Group advantages by event key, but first filter by league/competition
  const eventMap = new Map<string, {
    event: Event;
    outcomes: Outcome[];
  }>();

  for (const adv of advantages) {
    const event = adv.market.event;
    const comp = event.competitionInstance?.competition;

    const leagueId = (comp?.shortName || comp?.name || comp?.category || "").toUpperCase();

    // Detect which league this event belongs to
    const detectedLeague = leagueId.includes("NBA")
      ? "NBA"
      : leagueId.includes("NFL") || leagueId.includes("AMERICAN_FOOTBALL")
        ? "NFL"
        : leagueId.includes("MLB") || leagueId.includes("BASEBALL")
          ? "MLB"
          : leagueId.includes("NHL") || leagueId.includes("ICE_HOCKEY")
            ? "NHL"
            : null;

    // If we cannot clearly identify this as NFL/NBA/MLB/NHL, skip it
    if (!detectedLeague || !allowedLeagues.has(detectedLeague)) {
      continue;
    }

    // STRICT FILTER: If a specific sport was requested, only include games from that league
    if (requestedLeague && detectedLeague !== requestedLeague) {
      continue;
    }

    const eventKey = event.key;

    if (!eventMap.has(eventKey)) {
      eventMap.set(eventKey, {
        event,
        outcomes: []
      });
    }

    // Add all outcomes from this advantage
    eventMap.get(eventKey)!.outcomes.push(...adv.outcomes);
  }

  // Transform each event into a game
  const games: TransformedGame[] = [];

  for (const [eventKey, { event, outcomes }] of eventMap.entries()) {
    const comp = event.competitionInstance?.competition;
    const leagueId = (comp?.shortName || comp?.name || comp?.category || "").toUpperCase();

    // Detect league using the same logic as the filter above
    const detectedLeague = leagueId.includes("NBA")
      ? "NBA"
      : leagueId.includes("NFL") || leagueId.includes("AMERICAN_FOOTBALL")
        ? "NFL"
        : leagueId.includes("MLB") || leagueId.includes("BASEBALL")
          ? "MLB"
          : leagueId.includes("NHL") || leagueId.includes("ICE_HOCKEY")
            ? "NHL"
            : null;

    const sportKey = detectedLeague === "NBA"
      ? "basketball_nba"
      : detectedLeague === "NFL"
        ? "americanfootball_nfl"
        : detectedLeague === "MLB"
          ? "baseball_mlb"
          : detectedLeague === "NHL"
            ? "icehockey_nhl"
            : undefined;

    // Get home and away teams
    const homeParticipant = event.participants.find(p => p.key === event.homeParticipantKey);
    const awayParticipant = event.participants.find(p => p.key !== event.homeParticipantKey);

    if (!homeParticipant || !awayParticipant) {
      console.warn(`⚠️ Skipping event ${eventKey} - missing participants`);
      continue;
    }

    // Debug: Log all outcome types for this event
    const outcomeTypes = Array.from(new Set(outcomes.map(o => o.type)));
    console.log(`🔍 Event ${eventKey} has ${outcomes.length} outcomes with types:`, outcomeTypes);

    // Separate outcomes by type
    const moneylineOutcomes = outcomes.filter(o =>
      o.type === 'MONEYLINE' || o.type === 'MATCH_WINNER' || o.type === 'WIN'
    );
    const spreadOutcomes = outcomes.filter(o => o.type === 'SPREAD' || o.type === 'POINT_SPREAD');
    const totalOutcomes = outcomes.filter(o => o.type === 'TOTAL' || o.type === 'OVER_UNDER' || o.type === 'YES' || o.type === 'NO');

    console.log(`🎯 Found ${moneylineOutcomes.length} moneyline, ${spreadOutcomes.length} spread, ${totalOutcomes.length} total outcomes`);

    // Process moneyline outcomes
    const homeMoneyline = moneylineOutcomes.filter(o => o.participantKey === homeParticipant.key);
    const awayMoneyline = moneylineOutcomes.filter(o => o.participantKey === awayParticipant.key);

    const homeBest = homeMoneyline.length > 0
      ? homeMoneyline.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    const awayBest = awayMoneyline.length > 0
      ? awayMoneyline.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    // Process spread outcomes
    const homeSpread = spreadOutcomes.filter(o => o.participantKey === homeParticipant.key);
    const awaySpread = spreadOutcomes.filter(o => o.participantKey === awayParticipant.key);

    const homeSpreadBest = homeSpread.length > 0
      ? homeSpread.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    const awaySpreadBest = awaySpread.length > 0
      ? awaySpread.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    // Process total outcomes (OVER/UNDER or YES/NO)
    const overOutcomes = totalOutcomes.filter(o => o.type === 'YES' || o.type.includes('OVER'));
    const underOutcomes = totalOutcomes.filter(o => o.type === 'NO' || o.type.includes('UNDER'));

    const overBest = overOutcomes.length > 0
      ? overOutcomes.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    const underBest = underOutcomes.length > 0
      ? underOutcomes.reduce((best, current) => current.payout > best.payout ? current : best)
      : null;

    // Get unique bookmakers
    const bookmakers = Array.from(new Set(outcomes.map(o => o.source)));

    games.push({
      id: eventKey,
      sport: detectedLeague || event.competitionInstance.competition.sport,
      sportKey,
      homeTeam: homeParticipant.name,
      awayTeam: awayParticipant.name,
      commenceTime: event.startTime,
      homeOdds: homeBest ? {
        best: {
          bookmaker: homeBest.source,
          odds: homeBest.payout
        },
        all: homeMoneyline.map(o => ({
          bookmaker: o.source,
          odds: o.payout
        }))
      } : undefined,
      awayOdds: awayBest ? {
        best: {
          bookmaker: awayBest.source,
          odds: awayBest.payout
        },
        all: awayMoneyline.map(o => ({
          bookmaker: o.source,
          odds: o.payout
        }))
      } : undefined,
      spread: (homeSpreadBest || awaySpreadBest) ? {
        home: {
          line: homeSpreadBest?.modifier || 0,
          best: homeSpreadBest ? {
            bookmaker: homeSpreadBest.source,
            odds: homeSpreadBest.payout
          } : undefined
        },
        away: {
          line: awaySpreadBest?.modifier || 0,
          best: awaySpreadBest ? {
            bookmaker: awaySpreadBest.source,
            odds: awaySpreadBest.payout
          } : undefined
        }
      } : undefined,
      totals: (overBest || underBest) ? {
        over: {
          line: overBest?.modifier || 0,
          best: overBest ? {
            bookmaker: overBest.source,
            odds: overBest.payout
          } : undefined
        },
        under: {
          line: underBest?.modifier || 0,
          best: underBest ? {
            bookmaker: underBest.source,
            odds: underBest.payout
          } : undefined
        }
      } : undefined,
      bookmakers
    });
  }

  return games;
}
