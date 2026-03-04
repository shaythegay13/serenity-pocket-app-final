/**
 * Sports Availability API
 * Returns which sports currently have upcoming games and are in season.
 * Used to show green/yellow/red indicators in the sport selector.
 *
 * Indicator logic:
 * - GREEN = In season + has upcoming games (within next 30 days)
 * - YELLOW = In season but no upcoming games found
 * - RED = Off season
 *
 * Data source: sport_seasons table (updated weekly via cron job)
 */

import { NextResponse } from 'next/server';
import { SUPPORTED_SPORTS, isSportInSeason } from '@/lib/sports-config';
import { getSportSeasons } from '@/lib/services/sport-seasons-service';

// Cache the availability data for 5 minutes
let cachedAvailability: {
  sportsWithData: string[];
  sportsInSeason: string[];
  timestamp: number;
} | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    // Check cache first
    if (cachedAvailability && Date.now() - cachedAvailability.timestamp < CACHE_TTL) {
      return NextResponse.json({
        success: true,
        sportsWithData: cachedAvailability.sportsWithData,
        sportsInSeason: cachedAvailability.sportsInSeason,
        cached: true,
        cacheAge: Math.floor((Date.now() - cachedAvailability.timestamp) / 1000)
      });
    }

    // Get dynamic season data from database (populated by weekly cron job)
    const dynamicSeasons = await getSportSeasons();
    console.log(`[Sports Availability] Loaded ${dynamicSeasons.size} sports from database`);

    // Build lists based on database data:
    // - sportsWithData = sports with upcoming games (game_count > 0) -> GREEN dot
    // - sportsInSeason = sports that are in season (is_active = true) -> used for YELLOW dot
    // - Neither = off season -> RED dot
    const sportsInSeason: string[] = [];
    const sportsWithData: string[] = [];

    for (const sportId of Object.keys(SUPPORTED_SPORTS)) {
      const dynamicData = dynamicSeasons.get(sportId);

      // Check if we have fresh dynamic data (less than 14 days old)
      let isInSeason = false;
      let hasUpcomingGames = false;

      if (dynamicData) {
        const lastUpdated = new Date(dynamicData.last_updated_at);
        const daysSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSinceUpdate < 14) {
          // Use dynamic data from cron job
          isInSeason = dynamicData.is_active;
          // Green dot only if there are actual upcoming games (verified by cron job)
          hasUpcomingGames = (dynamicData.game_count || 0) > 0;
        } else {
          // Stale data - fall back to hardcoded season check
          console.warn(`[Sports Availability] Stale data for ${sportId} (${daysSinceUpdate.toFixed(1)} days old)`);
          isInSeason = isSportInSeason(sportId);
        }
      } else {
        // No dynamic data - fall back to hardcoded season check
        isInSeason = isSportInSeason(sportId);
      }

      if (isInSeason) {
        sportsInSeason.push(sportId);
      }
      if (hasUpcomingGames) {
        sportsWithData.push(sportId);
      }
    }

    // Update cache
    cachedAvailability = {
      sportsWithData,
      sportsInSeason,
      timestamp: Date.now()
    };

    console.log(`[Sports Availability] ${sportsWithData.length} sports with upcoming games, ${sportsInSeason.length} in season`);

    return NextResponse.json({
      success: true,
      sportsWithData,
      sportsInSeason,
      totalWithGames: sportsWithData.length,
      totalInSeason: sportsInSeason.length,
      dynamicDataCount: dynamicSeasons.size,
      cached: false
    });

  } catch (error) {
    console.error('[Sports Availability] Error:', error);
    return NextResponse.json({
      success: true,
      sportsWithData: cachedAvailability?.sportsWithData || [],
      sportsInSeason: cachedAvailability?.sportsInSeason || [],
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
