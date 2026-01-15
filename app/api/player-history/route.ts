import { NextRequest, NextResponse } from 'next/server';
import { fetchPlayerStats } from '@/lib/sports-data-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const playerId = searchParams.get('playerId');
    const gamesBack = parseInt(searchParams.get('gamesBack') || '20');

    if (!sport || !playerId) {
      return NextResponse.json(
        { error: 'Missing required parameters: sport and playerId' },
        { status: 400 }
      );
    }

    // Fetch current player stats using existing sports data service
    const playerStats = await fetchPlayerStats(sport, playerId);
    
    // Generate mock historical data based on current stats for demonstration
    // In production, this would fetch actual game-by-game data
    const historicalData = generateHistoricalFromCurrentStats(playerStats, gamesBack);

    return NextResponse.json({
      success: true,
      data: historicalData,
      message: 'Historical data generated from current player stats'
    });

  } catch (error) {
    console.error('Error fetching player history:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch player data',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * Generate historical data based on current player stats
 * This creates realistic variations around the player's current performance
 */
function generateHistoricalFromCurrentStats(currentStats: any, gamesBack: number): Record<string, number[]> {
  const historicalData: Record<string, number[]> = {};

  // Generate variations for each stat based on current values
  Object.keys(currentStats).forEach(stat => {
    const currentValue = currentStats[stat];
    if (typeof currentValue === 'number' && currentValue > 0) {
      historicalData[stat] = Array.from({ length: gamesBack }, (_, index) => {
        // Create realistic variations (±20% of current value)
        const variation = 0.8 + (Math.random() * 0.4); // 80% to 120% of current value
        const noise = (Math.random() - 0.5) * 0.1; // ±5% additional noise
        const multiplier = variation + noise;
        
        let value = currentValue * multiplier;
        
        // Ensure reasonable bounds for different stat types
        if (stat.includes('Pct') || stat.includes('pct') || stat.includes('avg')) {
          // Percentages and averages stay in reasonable ranges
          value = Math.max(0, Math.min(1, value));
        } else if (stat.includes('TD') || stat.includes('HR') || stat.includes('goals') || stat.includes('sacks')) {
          // Small integer stats
          value = Math.max(0, Math.floor(value));
        } else {
          // Large numeric stats
          value = Math.max(0, value);
        }
        
        return value;
      });
    }
  });

  return historicalData;
}
