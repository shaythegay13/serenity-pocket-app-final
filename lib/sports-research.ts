/**
 * Enhanced Sports Research Service
 * Combines TheSportsDB data with Gemini AI analysis for deep sports insights
 */

import { invokeAI } from './ai-service';
import {
  searchTeams,
  getTeamInfo,
  getTeamRecentForm,
  getHeadToHead,
  getTeamRoster,
  getPlayerInfo,
  getLeagueInfo,
  getEventResults,
  type TeamInfo,
  type PlayerInfo,
  type RecentForm,
  type LeagueInfo
} from './thesportsdb';
import { isCricketLeague, CRICKET_FORMAT_CONFIG } from './cricket-apis';
import { getCricketMatchContext } from './cricket-fetcher';

/**
 * Map our sport keys to TheSportsDB sport names
 * TheSportsDB uses specific sport names that we need to match against
 */
const SPORT_KEY_TO_SPORTSDB_SPORT: Record<string, string> = {
  // Basketball
  basketball_nba: 'Basketball',
  basketball_ncaab: 'Basketball',
  basketball_euroleague: 'Basketball',
  basketball_nbl: 'Basketball',
  // American Football
  americanfootball_nfl: 'American Football',
  americanfootball_ncaaf: 'American Football',
  // Baseball
  baseball_mlb: 'Baseball',
  baseball_ncaa: 'Baseball',
  // Ice Hockey
  icehockey_nhl: 'Ice Hockey',
  icehockey_sweden_hockey_league: 'Ice Hockey',
  // Soccer
  soccer_epl: 'Soccer',
  soccer_spain_la_liga: 'Soccer',
  soccer_germany_bundesliga: 'Soccer',
  soccer_italy_serie_a: 'Soccer',
  soccer_france_ligue_one: 'Soccer',
  soccer_usa_mls: 'Soccer',
  soccer_uefa_champs_league: 'Soccer',
  soccer_uefa_europa_league: 'Soccer',
  // Tennis
  tennis_atp_french_open: 'Tennis',
  tennis_wta_french_open: 'Tennis',
  // Golf
  golf_pga_championship: 'Golf',
  golf_masters_tournament: 'Golf',
  // MMA/Boxing
  mma_mixed_martial_arts: 'Fighting',
  boxing_boxing: 'Fighting',
  // Cricket
  cricket_ipl: 'Cricket',
  cricket_test_match: 'Cricket',
  cricket_one_day: 'Cricket',
  cricket_t20_blast: 'Cricket',
};

/**
 * Filter search results to match the correct sport
 */
function filterTeamsBySport(teams: TeamInfo[], sportKey: string): TeamInfo[] {
  const expectedSport = SPORT_KEY_TO_SPORTSDB_SPORT[sportKey];

  if (!expectedSport) {
    // If we don't have a mapping, return all results
    return teams;
  }

  // Filter teams by sport
  const filtered = teams.filter(team =>
    team.strSport?.toLowerCase() === expectedSport.toLowerCase()
  );

  if (filtered.length > 0) {
    return filtered;
  }

  // If no exact sport match, log warning and return empty
  // This prevents Arsenal showing up for NBA games
  console.warn(`⚠️ No teams found matching sport "${expectedSport}" for key "${sportKey}"`);
  return [];
}

export interface SportsResearchInput {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  league?: string;
  eventId?: string;
}

export interface TeamAnalysis {
  teamInfo: TeamInfo | null;
  recentForm: RecentForm | null;
  keyPlayers: PlayerInfo[];
  strengths: string[];
  weaknesses: string[];
  currentForm: 'excellent' | 'good' | 'average' | 'poor';
  motivationLevel: 'high' | 'medium' | 'low';
}

export interface HeadToHeadAnalysis {
  totalMatches: number;
  homeTeamWins: number;
  awayTeamWins: number;
  draws: number;
  recentTrend: 'home_dominant' | 'away_dominant' | 'balanced' | 'unknown';
  keyInsights: string[];
}

export interface MatchContext {
  league: string;
  season: string;
  importance: 'high' | 'medium' | 'low';
  venue: string;
  weather?: string;
  travelFactor: 'neutral' | 'home_advantage' | 'away_disadvantage';
}

export interface SportsResearchOutput {
  homeTeam: TeamAnalysis;
  awayTeam: TeamAnalysis;
  headToHead: HeadToHeadAnalysis | null;
  matchContext: MatchContext;
  keyFactors: string[];
  prediction: {
    winner: 'home' | 'away' | 'draw';
    confidence: number;
    reasoning: string;
    riskFactors: string[];
  };
  researchTimestamp: string;
  dataSource: 'thesportsdb' | 'fallback';
}

/**
 * Enhanced sports research using TheSportsDB + Gemini AI
 * Optimized for speed with parallel execution and timeouts
 */
export async function conductSportsResearch(input: SportsResearchInput): Promise<SportsResearchOutput> {
  console.log(`🔍 Starting sports research for ${input.homeTeam} vs ${input.awayTeam}`);

  try {
    // Step 1: Get team information (parallel)
    const [homeTeamSearchRaw, awayTeamSearchRaw] = await Promise.all([
      searchTeams(input.homeTeam),
      searchTeams(input.awayTeam)
    ]);

    // Filter results by sport to prevent cross-sport mismatches (e.g., Arsenal showing up for NBA)
    const sportKey = input.sport || input.league || '';
    const homeTeamSearch = filterTeamsBySport(homeTeamSearchRaw, sportKey);
    const awayTeamSearch = filterTeamsBySport(awayTeamSearchRaw, sportKey);

    // DEEP LOGGING for debugging "Arsenal" hallucination
    console.log(`[SportsResearch] Search Results for ${input.homeTeam} (${sportKey}):`, {
      rawCount: homeTeamSearchRaw.length,
      filteredCount: homeTeamSearch.length,
      topRaw: homeTeamSearchRaw.slice(0, 2).map(t => `${t.strTeam} (${t.strSport})`),
      topFiltered: homeTeamSearch.slice(0, 1).map(t => `${t.strTeam} (${t.strSport})`)
    });
    console.log(`[SportsResearch] Search Results for ${input.awayTeam} (${sportKey}):`, {
      rawCount: awayTeamSearchRaw.length,
      filteredCount: awayTeamSearch.length,
      topRaw: awayTeamSearchRaw.slice(0, 2).map(t => `${t.strTeam} (${t.strSport})`),
      topFiltered: awayTeamSearch.slice(0, 1).map(t => `${t.strTeam} (${t.strSport})`)
    });

    const homeTeam = homeTeamSearch.length > 0 ? homeTeamSearch[0] : null;
    const awayTeam = awayTeamSearch.length > 0 ? awayTeamSearch[0] : null;

    if (!homeTeam || !awayTeam) {
      console.warn(`⚠️ Teams not found in TheSportsDB for sport "${sportKey}", using fallback. Home found: ${!!homeTeam}, Away found: ${!!awayTeam}`);
      return generateFallbackResearch(input);
    }

    // Step 2: Get team info FIRST to populate cache (used by getTeamRecentForm internally)
    // This sequential call saves duplicate API requests
    const [homeTeamInfo, awayTeamInfo] = await Promise.all([
      withTimeout(getTeamInfo(homeTeam.idTeam), 3000).catch(() => null),
      withTimeout(getTeamInfo(awayTeam.idTeam), 3000).catch(() => null),
    ]);

    // Step 3: Get form and H2H data (parallel with timeout)
    const researchPromises = await Promise.allSettled([
      withTimeout(getTeamRecentForm(homeTeam.idTeam), 3000),
      withTimeout(getTeamRecentForm(awayTeam.idTeam), 3000),
      withTimeout(getHeadToHead(homeTeam.idTeam, awayTeam.idTeam), 3000),
    ]);

    // Extract results safely
    const homeRecentForm = researchPromises[0].status === 'fulfilled' ? researchPromises[0].value : null;
    const awayRecentForm = researchPromises[1].status === 'fulfilled' ? researchPromises[1].value : null;
    const headToHead = researchPromises[2].status === 'fulfilled' ? researchPromises[2].value : null;

    // Metadata placeholders (skipped for performance API reduction)
    const homeKeyPlayers: PlayerInfo[] = [];
    const awayKeyPlayers: PlayerInfo[] = [];
    const leagueInfo: LeagueInfo | null = null;

    // DEFENSIVE: Verify that the fetched info matches the expected team (prevention of poisoned ID returns)
    if (homeTeamInfo && homeTeamInfo.strTeam === 'Arsenal' && !input.homeTeam.toLowerCase().includes('arsenal')) {
      console.warn(`[SportsResearch] 🚨 Poisoned homeTeamInfo detected for ${input.homeTeam}, using search result name instead`);
      homeTeamInfo.strTeam = homeTeam.strTeam; // Override with the correct name from search
    }
    if (awayTeamInfo && awayTeamInfo.strTeam === 'Arsenal' && !input.awayTeam.toLowerCase().includes('arsenal')) {
      console.warn(`[SportsResearch] 🚨 Poisoned awayTeamInfo detected for ${input.awayTeam}, using search result name instead`);
      awayTeamInfo.strTeam = awayTeam.strTeam; // Override with the correct name from search
    }

    // Step 4: Use Gemini AI for deep analysis (with timeout)
    let aiAnalysis;
    try {
      aiAnalysis = await withTimeout(analyzeWithGemini({
        homeTeam: homeTeamInfo,
        awayTeam: awayTeamInfo,
        homeRecentForm,
        awayRecentForm,
        headToHead,
        homeKeyPlayers: [],
        awayKeyPlayers: [],
        leagueInfo: null,
        sport: input.sport,
        league: input.league
      }), 10000); // Increased to 10 second timeout for AI analysis
    } catch (e) {
      console.warn('AI analysis timeout, using fallback');
      aiAnalysis = generateFallbackAIAnalysis({
        homeTeam: homeTeamInfo,
        awayTeam: awayTeamInfo,
        homeRecentForm,
        awayRecentForm,
        headToHead,
        homeKeyPlayers: [],
        awayKeyPlayers: [],
        leagueInfo: null,
        sport: input.sport,
        league: input.league
      });
    }

    // Step 5: Compile final research output
    const researchOutput: SportsResearchOutput = {
      homeTeam: {
        teamInfo: homeTeamInfo,
        recentForm: homeRecentForm,
        keyPlayers: homeKeyPlayers,
        strengths: aiAnalysis.homeTeam.strengths,
        weaknesses: aiAnalysis.homeTeam.weaknesses,
        currentForm: aiAnalysis.homeTeam.currentForm,
        motivationLevel: aiAnalysis.homeTeam.motivationLevel
      },
      awayTeam: {
        teamInfo: awayTeamInfo,
        recentForm: awayRecentForm,
        keyPlayers: awayKeyPlayers,
        strengths: aiAnalysis.awayTeam.strengths,
        weaknesses: aiAnalysis.awayTeam.weaknesses,
        currentForm: aiAnalysis.awayTeam.currentForm,
        motivationLevel: aiAnalysis.awayTeam.motivationLevel
      },
      headToHead: headToHead ? {
        totalMatches: headToHead.matches,
        homeTeamWins: headToHead.team1Wins,
        awayTeamWins: headToHead.team2Wins,
        draws: headToHead.draws,
        recentTrend: determineTrend(headToHead),
        keyInsights: aiAnalysis.headToHead.insights
      } : null,
      matchContext: {
        league: input.league || 'Unknown',
        season: '2024-2025',
        importance: aiAnalysis.matchContext.importance,
        venue: homeTeamInfo?.strStadium || 'Unknown',
        weather: aiAnalysis.matchContext.weather,
        travelFactor: 'home_advantage'
      },
      keyFactors: aiAnalysis.keyFactors,
      prediction: aiAnalysis.prediction,
      researchTimestamp: new Date().toISOString(),
      dataSource: 'thesportsdb'
    };

    console.log(`✅ Sports research completed for ${input.homeTeam} vs ${input.awayTeam}`);
    return researchOutput;

  } catch (error) {
    console.error('❌ Error in sports research:', error);
    return generateFallbackResearch(input);
  }
}

/**
 * Timeout helper for performance optimization
 */
async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  const timeoutPromise = new Promise<T>((_, reject) => {
    setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Use Gemini AI to analyze sports data
 */
async function analyzeWithGemini(data: any): Promise<any> {
  try {
    const system = `You are an expert sports analyst with deep knowledge of team dynamics, player performance, and statistical analysis. 
    Provide objective, data-driven insights about sports matchups.
    
    Analyze the provided sports data and return structured insights in JSON format.
    Focus on:
    1. Team strengths and weaknesses
    2. Current form and momentum
    3. Key player impact
    4. Head-to-head dynamics
    5. Match context and importance
    6. Predictive analysis with confidence levels
    
    Be thorough but concise. Use sports terminology appropriately.`;

    // Build cricket-specific context if applicable
    const sportKey = data.sport || ''
    const isCricket = isCricketLeague(sportKey)
    const cricketFormat = isCricket ? CRICKET_FORMAT_CONFIG[sportKey] : null
    const cricketContext = isCricket && cricketFormat
      ? `\n    CRICKET FORMAT: ${cricketFormat.format} (${cricketFormat.oversPerInnings} overs per innings, ${cricketFormat.inningsCount} innings)
    TYPICAL TOTAL RUNS: ${cricketFormat.totalRunsRange.min}-${cricketFormat.totalRunsRange.max} (avg: ${cricketFormat.totalRunsRange.avg})
    MATCH DURATION: ${cricketFormat.typicalDuration}
    CRICKET-SPECIFIC FACTORS: Toss advantage, pitch conditions (batting-friendly vs bowling-friendly), dew factor (night games), powerplay aggression, death-over bowling quality, spin vs pace conditions.`
      : ''

    const userPrompt = `Analyze this sports matchup and provide detailed insights:
    
    HOME TEAM: ${data.homeTeam?.strTeam || 'Unknown'}
    - Recent Form: ${JSON.stringify(data.homeRecentForm)}
    - Key Players: ${data.homeKeyPlayers?.map((p: PlayerInfo) => `${p.strPlayer} (${p.strPosition})`).join(', ') || 'None'}
    
    AWAY TEAM: ${data.awayTeam?.strTeam || 'Unknown'}
    - Recent Form: ${JSON.stringify(data.awayRecentForm)}
    - Key Players: ${data.awayKeyPlayers?.map((p: PlayerInfo) => `${p.strPlayer} (${p.strPosition})`).join(', ') || 'None'}
    
    HEAD-TO-HEAD: ${JSON.stringify(data.headToHead)}
    
    LEAGUE: ${data.leagueInfo?.strLeague || 'Unknown'} (${data.sport})${cricketContext}
    
    Return a JSON analysis with this structure:
    {
      "homeTeam": {
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "currentForm": "excellent|good|average|poor",
        "motivationLevel": "high|medium|low"
      },
      "awayTeam": {
        "strengths": ["strength1", "strength2"],
        "weaknesses": ["weakness1", "weakness2"],
        "currentForm": "excellent|good|average|poor",
        "motivationLevel": "high|medium|low"
      },
      "headToHead": {
        "insights": ["insight1", "insight2"]
      },
      "matchContext": {
        "importance": "high|medium|low",
        "weather": "good|poor|extreme"
      },
      "keyFactors": ["factor1", "factor2", "factor3"],
      "prediction": {
        "winner": "home|away|draw",
        "confidence": 0.75,
        "reasoning": "Brief explanation of prediction",
        "riskFactors": ["risk1", "risk2"]
      }
    }`;

    const response = await invokeAI({
      system,
      messages: [{ role: 'user', content: userPrompt }],
      max_tokens: 1000, // Reduced from 2000 for speed
      temperature: 0.3
    });

    // Parse JSON response
    let jsonText = response.trim();
    if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    }

    try {
      return JSON.parse(jsonText);
    } catch (parseError) {
      const match = jsonText.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
      throw parseError;
    }
  } catch (error) {
    console.error('❌ Gemini analysis error:', error);
    return generateFallbackAIAnalysis(data);
  }
}

/**
 * Determine head-to-head trend
 */
function determineTrend(h2h: any): 'home_dominant' | 'away_dominant' | 'balanced' | 'unknown' {
  if (!h2h || h2h.matches < 3) return 'unknown';

  const homeWinRate = h2h.team1Wins / h2h.matches;
  const awayWinRate = h2h.team2Wins / h2h.matches;

  if (homeWinRate > 0.6) return 'home_dominant';
  if (awayWinRate > 0.6) return 'away_dominant';
  return 'balanced';
}

/**
 * Generate fallback research when API fails
 */
function generateFallbackResearch(input: SportsResearchInput): SportsResearchOutput {
  console.log('🔄 Using fallback sports research');

  return {
    homeTeam: {
      teamInfo: null,
      recentForm: null,
      keyPlayers: [],
      strengths: [],
      weaknesses: [],
      currentForm: 'average',
      motivationLevel: 'medium'
    },
    awayTeam: {
      teamInfo: null,
      recentForm: null,
      keyPlayers: [],
      strengths: [],
      weaknesses: [],
      currentForm: 'average',
      motivationLevel: 'medium'
    },
    headToHead: null,
    matchContext: {
      league: input.league || 'Unknown',
      season: '2024-2025',
      importance: 'medium',
      venue: 'Unknown',
      travelFactor: 'neutral'
    },
    keyFactors: ['Limited data available for these teams'],
    prediction: {
      winner: 'draw',
      confidence: 0,
      reasoning: 'Insufficient sports data available for a reliable prediction.',
      riskFactors: ['Missing team data', 'Missing recent form']
    },
    researchTimestamp: new Date().toISOString(),
    dataSource: 'fallback'
  };
}

/**
 * Generate fallback AI analysis
 */
function generateFallbackAIAnalysis(data: any): any {
  return {
    homeTeam: {
      strengths: [],
      weaknesses: [],
      currentForm: 'average',
      motivationLevel: 'medium'
    },
    awayTeam: {
      strengths: [],
      weaknesses: [],
      currentForm: 'average',
      motivationLevel: 'medium'
    },
    headToHead: {
      insights: ['Insufficient head-to-head data available']
    },
    matchContext: {
      importance: 'medium',
      weather: 'good'
    },
    keyFactors: ['Insufficient data available for AI analysis'],
    prediction: {
      winner: 'draw',
      confidence: 0,
      reasoning: 'Data processing timeout or missing source data. Analysis cannot be securely performed.',
      riskFactors: ['Data availability issue']
    }
  };
}

/**
 * Quick team lookup for basic info
 */
export async function quickTeamLookup(teamName: string): Promise<TeamInfo | null> {
  try {
    const teams = await searchTeams(teamName);
    return teams.length > 0 ? teams[0] : null;
  } catch (error) {
    console.error('Quick team lookup error:', error);
    return null;
  }
}

/**
 * Get team form summary
 */
export async function getTeamFormSummary(teamName: string): Promise<string> {
  try {
    const teams = await searchTeams(teamName);
    if (teams.length === 0) return 'Team not found';

    const form = await getTeamRecentForm(teams[0].idTeam);
    if (!form) return 'No recent form data available';

    return `${form.team}: Last 5: ${form.last5.join('-')} | Win Rate: ${form.winRate.toFixed(1)}% | GF: ${form.goalsFor} | GA: ${form.goalsAgainst}`;
  } catch (error) {
    console.error('Team form summary error:', error);
    return 'Error retrieving form data';
  }
}
