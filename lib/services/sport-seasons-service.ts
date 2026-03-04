/**
 * Sport Seasons Service
 * Fetches dynamic season data from the database with caching and fallback
 */

import { createClient } from '@supabase/supabase-js'

export interface SportSeasonData {
  sport_id: string;
  sport_name: string;
  display_name: string;
  is_active: boolean;
  has_outrights: boolean;
  game_count: number;
  last_updated_at: string;
}

// In-memory cache for sport seasons
let cachedSeasons: Map<string, SportSeasonData> | null = null;
let cacheTimestamp: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Get all sport seasons from database with caching
 */
export async function getSportSeasons(): Promise<Map<string, SportSeasonData>> {
  // Check cache first
  if (cachedSeasons && Date.now() - cacheTimestamp < CACHE_TTL) {
    return cachedSeasons;
  }

  try {
    // Use service role for server-side queries
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn('[SportSeasons] Missing Supabase credentials');
      return new Map();
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data, error } = await supabase
      .from('sport_seasons')
      .select('*')
      .order('sport_id');

    if (error) {
      console.error('[SportSeasons] Error fetching seasons:', error);
      return cachedSeasons || new Map();
    }

    // Build the cache map
    const seasons = new Map<string, SportSeasonData>();
    for (const row of data || []) {
      seasons.set(row.sport_id, row as SportSeasonData);
    }

    // Update cache
    cachedSeasons = seasons;
    cacheTimestamp = Date.now();

    return seasons;
  } catch (error) {
    console.error('[SportSeasons] Error:', error);
    return cachedSeasons || new Map();
  }
}

/**
 * Get season data for a specific sport
 */
export async function getSportSeasonData(sportId: string): Promise<SportSeasonData | null> {
  const seasons = await getSportSeasons();
  return seasons.get(sportId) || null;
}

/**
 * Check if a sport is currently active (has games) based on database
 * Returns null if no data available (fallback to hardcoded logic)
 */
export async function isDynamicSportActive(sportId: string): Promise<boolean | null> {
  const seasonData = await getSportSeasonData(sportId);

  if (!seasonData) {
    return null; // No data - caller should use fallback
  }

  // Check if data is stale (more than 14 days old)
  const lastUpdated = new Date(seasonData.last_updated_at);
  const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

  if (daysSinceUpdate > 14) {
    console.warn(`[SportSeasons] Stale data for ${sportId} (${daysSinceUpdate.toFixed(1)} days old)`);
    return null; // Stale data - caller should use fallback
  }

  return seasonData.is_active;
}

/**
 * Get all active sport IDs from database
 */
export async function getActiveSportIds(): Promise<Set<string>> {
  const seasons = await getSportSeasons();
  const activeIds = new Set<string>();

  for (const [sportId, data] of seasons) {
    if (data.is_active) {
      activeIds.add(sportId);
    }
  }

  return activeIds;
}

/**
 * Clear the cache (useful after manual updates)
 */
export function clearSportSeasonsCache(): void {
  cachedSeasons = null;
  cacheTimestamp = 0;
}

/**
 * Get cache status for debugging
 */
export function getCacheStatus(): { cached: boolean; age: number; size: number } {
  return {
    cached: !!cachedSeasons,
    age: cachedSeasons ? Math.floor((Date.now() - cacheTimestamp) / 1000) : 0,
    size: cachedSeasons?.size || 0
  };
}
