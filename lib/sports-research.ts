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
    const [homeTeamSearch, awayTeamSearch] = await Promise.all([
      searchTeams(input.homeTeam),
      searchTeams(input.awayTeam)
    ]);

    const homeTeam = homeTeamSearch.length > 0 ? homeTeamSearch[0] : null;
    const awayTeam = awayTeamSearch.length > 0 ? awayTeamSearch[0] : null;

    if (!homeTeam || !awayTeam) {
      console.warn('⚠️ Teams not found in TheSportsDB, using fallback');
      return generateFallbackResearch(input);
    }

    // Step 2: Get team info FIRST to populate cache (used by getTeamRecentForm internally)
    // This sequential call saves duplicate API requests
    const [homeTeamInfo, awayTeamInfo] = await Promise.all([
      withTimeout(getTeamInfo(homeTeam.idTeam), 3000).catch(() => null),
      withTimeout(getTeamInfo(awayTeam.idTeam), 3000).catch(() => null),
    ]);

    // Step 3: Get form and H2H data (parallel with timeout)
    // OPTIMIZED: Skip roster and league info calls to reduce API usage
    // - Roster: Only used for Gemini narrative, not calculations
    // - League info: Just metadata, not needed for analysis
    // - RecentForm and H2H share the same getRecentEvents cache (both use limit=20)
    const researchPromises = await Promise.allSettled([
      withTimeout(getTeamRecentForm(homeTeam.idTeam), 3000),
      withTimeout(getTeamRecentForm(awayTeam.idTeam), 3000),
      withTimeout(getHeadToHead(homeTeam.idTeam, awayTeam.idTeam), 3000),
    ]);

    // Extract results safely
    const homeRecentForm = researchPromises[0].status === 'fulfilled' ? researchPromises[0].value : null;
    const awayRecentForm = researchPromises[1].status === 'fulfilled' ? researchPromises[1].value : null;
    const headToHead = researchPromises[2].status === 'fulfilled' ? researchPromises[2].value : null;

    // Skip roster calls - only used for Gemini narrative, adds 2 API calls per game
    const homeKeyPlayers: PlayerInfo[] = [];
    const awayKeyPlayers: PlayerInfo[] = [];

    // Skip league info call - just metadata
    const leagueInfo: LeagueInfo | null = null;

    // Step 4: Use Gemini AI for deep analysis (with timeout)
    let aiAnalysis;
    try {
      aiAnalysis = await withTimeout(analyzeWithGemini({
        homeTeam: homeTeamInfo,
        awayTeam: awayTeamInfo,
        homeRecentForm,
        awayRecentForm,
        headToHead,
        homeKeyPlayers,
        awayKeyPlayers,
        leagueInfo,
        sport: input.sport,
        league: input.league
      }), 5000); // 5 second timeout for AI analysis
    } catch (e) {
      console.warn('AI analysis timeout, using fallback');
      aiAnalysis = generateFallbackAIAnalysis({
        homeTeam: homeTeamInfo,
        awayTeam: awayTeamInfo,
        homeRecentForm,
        awayRecentForm,
        headToHead,
        homeKeyPlayers,
        awayKeyPlayers,
        leagueInfo,
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

    const userPrompt = `Analyze this sports matchup and provide detailed insights:
    
    HOME TEAM: ${data.homeTeam?.strTeam || 'Unknown'}
    - Recent Form: ${JSON.stringify(data.homeRecentForm)}
    - Key Players: ${data.homeKeyPlayers?.map((p: PlayerInfo) => `${p.strPlayer} (${p.strPosition})`).join(', ') || 'None'}
    
    AWAY TEAM: ${data.awayTeam?.strTeam || 'Unknown'}
    - Recent Form: ${JSON.stringify(data.awayRecentForm)}
    - Key Players: ${data.awayKeyPlayers?.map((p: PlayerInfo) => `${p.strPlayer} (${p.strPosition})`).join(', ') || 'None'}
    
    HEAD-TO-HEAD: ${JSON.stringify(data.headToHead)}
    
    LEAGUE: ${data.leagueInfo?.strLeague || 'Unknown'} (${data.sport})
    
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
