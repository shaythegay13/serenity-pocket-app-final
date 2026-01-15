import { useSportsStore } from '@/lib/stores/sports-store';
import type { Game, TeamStats, PlayerStats } from '@/lib/types/sports';

export async function fetchSportsData(sport: string) {
  try {
    // TODO: Replace with actual API endpoint
    const response = await fetch(`/api/sports/${sport}`);
    
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    
    const data = await response.json();
    return {
      games: data.games as Game[],
      teamStats: data.teamStats as TeamStats[],
      playerStats: data.playerStats as PlayerStats[],
      lineMovements: data.lineMovements,
      bettingTrends: data.bettingTrends,
      weatherData: data.weatherData
    };
  } catch (error) {
    console.error('Error fetching sports data:', error);
    throw error;
  }
}

export function useSportsDataLoader() {
  const activeSport = useSportsStore((state) => state.activeSport);
  const setLoading = useSportsStore((state) => state.setLoading);
  const setOddsData = useSportsStore((state) => state.setOddsData);
  
  const loadData = async () => {
    try {
      setLoading(activeSport, true);
      const data = await fetchSportsData(activeSport);
      setOddsData(activeSport, data.games || []);
    } catch (error) {
      throw error;
    } finally {
      setLoading(activeSport, false);
    }
  };
  
  return { loadData };
}
