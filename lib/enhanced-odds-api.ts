/**
 * Enhanced Odds API - Mock Implementation
 * 
 * Sports dashboard features have been disabled.
 * This file now returns mock data for compatibility.
 */

type SportLeague = 'NFL' | 'NBA' | 'MLB' | 'NHL';
type AdvantageOpportunity = any; // Placeholder

/**
 * Strategy for fetching odds data
 */
export type OddsStrategy = 'rapidapi' | 'theodds' | 'both' | 'auto';

/**
 * Combined odds response
 */
export interface EnhancedOddsResponse {
  success: boolean;
  data: any[];
  source: 'rapidapi' | 'theodds' | 'combined' | 'sportsdb' | 'mock';
  advantageOpportunities?: AdvantageOpportunity[];
  timestamp: Date;
  error?: string;
}

/**
 * Mock odds data for compatibility
 */
function getMockOddsData(sport?: string): any[] {
  return [];
}

/**
 * Fetch enhanced odds data with multiple sources
 */
export async function fetchEnhancedLiveOdds(
  sport?: string,
  strategy: OddsStrategy = 'auto'
): Promise<EnhancedOddsResponse> {
  console.log(`📊 Enhanced Odds API: Sports features disabled, returning mock data for ${sport || 'all sports'}`);
  
  return {
    success: true,
    data: getMockOddsData(sport),
    source: 'mock',
    timestamp: new Date(),
  };
}

/**
 * Check if RapidAPI is configured
 */
export function isRapidAPIConfigured(): boolean {
  return false; // Sports features disabled
}

/**
 * Fetch advantage opportunities
 */
export async function fetchSportsbookAdvantages(): Promise<AdvantageOpportunity[]> {
  return []; // Sports features disabled
}

/**
 * Transform odds for display
 */
export function transformOddsForDisplay(data: any[]): any[] {
  return data; // Return as-is since sports features are disabled
}

/**
 * Fetch player props
 */
export async function fetchPlayerProps(sport?: string): Promise<any[]> {
  return []; // Sports features disabled
}

/**
 * Mock odds data type
 */
export type OddsData = any;
