import type { GameData } from "@/components/sports-dashboard/shared/GameCard"

const STORAGE_KEY = "serenity_saved_games"

export interface SavedGame extends GameData {
  savedAt: string
  sportsbook?: "fanduel" | "draftkings" | "both"
}

/**
 * Service for managing saved games for later betting
 */
export class SavedGamesService {
  /**
   * Get all saved games
   */
  static getSavedGames(): SavedGame[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      return JSON.parse(data)
    } catch (error) {
      console.error("Error loading saved games:", error)
      return []
    }
  }

  /**
   * Save a game for later
   */
  static saveGame(game: GameData, sportsbook?: "fanduel" | "draftkings" | "both"): void {
    try {
      const savedGames = this.getSavedGames()

      // Check if already saved
      const existingIndex = savedGames.findIndex(g => g.id === game.id)

      const savedGame: SavedGame = {
        ...game,
        savedAt: new Date().toISOString(),
        sportsbook
      }

      if (existingIndex >= 0) {
        // Update existing
        savedGames[existingIndex] = savedGame
      } else {
        // Add new
        savedGames.push(savedGame)
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(savedGames))
    } catch (error) {
      console.error("Error saving game:", error)
      throw error
    }
  }

  /**
   * Remove a saved game
   */
  static removeSavedGame(gameId: string): void {
    try {
      const savedGames = this.getSavedGames()
      const filtered = savedGames.filter(g => g.id !== gameId)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error removing saved game:", error)
      throw error
    }
  }

  /**
   * Check if a game is saved
   */
  static isGameSaved(gameId: string): boolean {
    try {
      const savedGames = this.getSavedGames()
      return savedGames.some(g => g.id === gameId)
    } catch (error) {
      console.error("Error checking if game is saved:", error)
      return false
    }
  }

  /**
   * Clear all saved games
   */
  static clearAllSavedGames(): void {
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.error("Error clearing saved games:", error)
      throw error
    }
  }

  /**
   * Get saved games for a specific sport
   */
  static getSavedGamesBySport(sport: string): SavedGame[] {
    try {
      const savedGames = this.getSavedGames()
      return savedGames.filter(g => g.sport === sport)
    } catch (error) {
      console.error("Error getting saved games by sport:", error)
      return []
    }
  }

  /**
   * Clean up old saved games (remove completed/postponed games older than 24 hours)
   */
  static cleanupOldGames(): void {
    try {
      const savedGames = this.getSavedGames()
      const now = new Date()
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const filtered = savedGames.filter(game => {
        // Keep upcoming and live games
        if (game.status === "UPCOMING" || game.status === "LIVE") return true

        // Remove completed/postponed games older than 24 hours
        const savedDate = new Date(game.savedAt)
        return savedDate > oneDayAgo
      })

      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
    } catch (error) {
      console.error("Error cleaning up old games:", error)
    }
  }
}
