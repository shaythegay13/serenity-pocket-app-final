import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameLineRecord, SupportedSportKey } from "@/lib/types"

/**
 * Sports Store State Interface
 * 
 * Global state management for Sports Dashboard.
 * Uses Zustand for lightweight, performant state management.
 */
export interface SportsStoreState {
  /** Currently active sport tab */
  activeSport: SupportedSportKey

  /** Odds data per sport (keyed by sport) */
  oddsData: Record<SupportedSportKey, GameLineRecord[]>

  /** Loading states per sport (keyed by sport) */
  gamesLoading: Record<SupportedSportKey, boolean>

  /** Last fetch timestamp per sport (keyed by sport) */
  lastFetched: Record<SupportedSportKey, number | null>

  /** Selected player detail (for player detail modal) */
  selectedPlayer: any | null

  /** Actions */
  setActiveSport: (sport: SupportedSportKey) => void
  setOddsData: (sport: SupportedSportKey, data: GameLineRecord[]) => void
  setLoading: (sport: SupportedSportKey, loading: boolean) => void
  setLastFetched: (sport: SupportedSportKey, timestamp: number) => void
  openPlayerDetail: (player: any) => void
  closePlayerDetail: () => void
  reset: () => void
}

/**
 * Initial state configuration
 */
const initialState = {
  activeSport: "americanfootball_nfl" as SupportedSportKey,
  oddsData: {
    americanfootball_nfl: [],
    basketball_nba: [],
    baseball_mlb: [],
    icehockey_nhl: []
  } as Record<SupportedSportKey, GameLineRecord[]>,
  gamesLoading: {
    americanfootball_nfl: false,
    basketball_nba: false,
    baseball_mlb: false,
    icehockey_nhl: false
  } as Record<SupportedSportKey, boolean>,
  lastFetched: {
    americanfootball_nfl: null,
    basketball_nba: null,
    baseball_mlb: null,
    icehockey_nhl: null
  } as Record<SupportedSportKey, number | null>,
  selectedPlayer: null
}

/**
 * Sports Store
 * 
 * Zustand store for managing sports dashboard state.
 * Persisted to localStorage for tab state preservation.
 * 
 * Features:
 * - Per-sport data isolation
 * - Selective re-renders (components only subscribe to slices they need)
 * - Persisted active sport selection
 * - Simple, boilerplate-free API
 * 
 * @example
 * // In a component
 * const activeSport = useSportsStore(state => state.activeSport)
 * const setActiveSport = useSportsStore(state => state.setActiveSport)
 * 
 * // Change sport
 * setActiveSport('basketball_nba')
 */
export const useSportsStore = create<SportsStoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setActiveSport: (sport: SupportedSportKey) =>
        set({ activeSport: sport }),

      setOddsData: (sport: SupportedSportKey, data: GameLineRecord[]) =>
        set((state) => ({
          oddsData: {
            ...state.oddsData,
            [sport]: data
          }
        })),

      setLoading: (sport: SupportedSportKey, loading: boolean) =>
        set((state) => ({
          gamesLoading: {
            ...state.gamesLoading,
            [sport]: loading
          }
        })),

      setLastFetched: (sport: SupportedSportKey, timestamp: number) =>
        set((state) => ({
          lastFetched: {
            ...state.lastFetched,
            [sport]: timestamp
          }
        })),

      openPlayerDetail: (player: any) =>
        set({ selectedPlayer: player }),

      closePlayerDetail: () =>
        set({ selectedPlayer: null }),

      reset: () => set(initialState)
    }),
    {
      name: "sports-dashboard-storage",
      // Only persist activeSport to localStorage (not full odds data)
      partialize: (state) => ({
        activeSport: state.activeSport
      })
    }
  )
)
