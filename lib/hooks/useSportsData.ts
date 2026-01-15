// React hook for sports data management

import { useState, useEffect } from 'react'
import { Team, Player, fetchSportData, fetchTeamRoster, fetchPlayerStats } from '@/lib/sports-data-service'

export interface SportsDataState {
  teams: Team[]
  players: Player[]
  currentTeamRoster: Player[]
  selectedPlayer: Player | null
  loading: boolean
  error: string | null
  lastUpdated: Date | null
}

export function useSportsData(sport: string) {
  const [state, setState] = useState<SportsDataState>({
    teams: [],
    players: [],
    currentTeamRoster: [],
    selectedPlayer: null,
    loading: false,
    error: null,
    lastUpdated: null
  })

  // Fetch sport data
  const fetchSportsData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await fetchSportData(sport)
      setState(prev => ({
        ...prev,
        teams: data.teams,
        players: data.players,
        loading: false,
        lastUpdated: data.lastUpdated
      }))
    } catch (error) {
      console.error('Error fetching sports data:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch sports data'
      }))
    }
  }

  // Fetch team roster
  const fetchRoster = async (teamId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const roster = await fetchTeamRoster(sport, teamId)
      setState(prev => ({
        ...prev,
        currentTeamRoster: roster,
        loading: false
      }))
    } catch (error) {
      console.error('Error fetching roster:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch roster'
      }))
    }
  }

  // Fetch player statistics
  const fetchPlayerData = async (playerId: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const stats = await fetchPlayerStats(sport, playerId)
      const updatedPlayer = { ...state.selectedPlayer, stats } as Player
      
      setState(prev => ({
        ...prev,
        selectedPlayer: updatedPlayer,
        loading: false
      }))
    } catch (error) {
      console.error('Error fetching player stats:', error)
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch player stats'
      }))
    }
  }

  // Select a player
  const selectPlayer = (player: Player) => {
    setState(prev => ({ ...prev, selectedPlayer: player }))
    if (player.id) {
      fetchPlayerData(player.id)
    }
  }

  // Clear selected player
  const clearSelectedPlayer = () => {
    setState(prev => ({ ...prev, selectedPlayer: null }))
  }

  // Auto-fetch data on sport change
  useEffect(() => {
    if (sport) {
      fetchSportsData()
    }
  }, [sport])

  return {
    ...state,
    fetchSportsData,
    fetchRoster,
    selectPlayer,
    clearSelectedPlayer,
    refetch: fetchSportsData
  }
}
