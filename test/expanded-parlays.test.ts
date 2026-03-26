import { calculateSGPOdds } from '../lib/parlay-utils'
import { ParlayLeg } from '../lib/types/ai-models'

describe('Expanded Parlay Correlation Logic', () => {
  it('should apply extra tax for MLB Pitcher Ks ↔ Moneyline correlation', () => {
    const legs: any[] = [ // Using any to avoid strict type issues with mock data
      {
        pickId: 'mlb_p1_ks',
        gameId: 'mlb_game_1',
        teams: 'Yankees vs Red Sox',
        betType: 'pitcher_strikeouts',
        odds: -110,
        aiWinProbability: 0.55
      },
      {
        pickId: 'mlb_ml_yankees',
        gameId: 'mlb_game_1',
        teams: 'Yankees vs Red Sox',
        betType: 'moneyline',
        odds: -150,
        aiWinProbability: 0.60
      }
    ]

    const result = calculateSGPOdds(legs as any)
    expect(result.correlationWarnings.some(w => w.message.includes('Pitcher Ks ↔ Win'))).toBe(true)
    expect(result.effectiveTax).toBeGreaterThan(0.25) // Base tax 0.25 + extra 0.10
  })

  it('should apply extra tax for NHL Goals ↔ Game Total correlation', () => {
    const legs: any[] = [
      {
        pickId: 'nhl_p1_goals',
        gameId: 'nhl_game_1',
        teams: 'Bruins vs Rangers',
        betType: 'player_goals',
        odds: +150,
        aiWinProbability: 0.40
      },
      {
        pickId: 'nhl_total_over',
        gameId: 'nhl_game_1',
        teams: 'Bruins vs Rangers',
        betType: 'total',
        odds: -110,
        aiWinProbability: 0.52
      }
    ]

    const result = calculateSGPOdds(legs as any)
    expect(result.correlationWarnings.some(w => w.message.includes('NHL Goals ↔ Game Total'))).toBe(true)
  })

  it('should apply high tax for Tennis Games ↔ Sets correlation', () => {
    const legs: any[] = [
      {
        pickId: 'tennis_p1_games',
        gameId: 'tennis_game_1',
        teams: 'Alcaraz vs Sinner',
        betType: 'player_games_won',
        odds: -110,
        aiWinProbability: 0.55
      },
      {
        pickId: 'tennis_p1_sets',
        gameId: 'tennis_game_1',
        teams: 'Alcaraz vs Sinner',
        betType: 'player_sets_won',
        odds: -200,
        aiWinProbability: 0.70
      }
    ]

    const result = calculateSGPOdds(legs as any)
    expect(result.correlationWarnings.some(w => w.message.includes('Tennis Games ↔ Sets'))).toBe(true)
    expect(result.effectiveTax).toBeGreaterThan(0.40) // Base tax 0.25 + extra 0.25
  })

  it('should detect teammate correlations in NHL (Goal ↔ Assist)', () => {
    const legs: any[] = [
      {
        pickId: 'nhl_p1_points',
        gameId: 'nhl_game_1',
        teams: 'Bruins vs Rangers',
        betType: 'prop',
        propStat: 'player_points_hockey',
        propCategory: 'skating',
        playerId: 'p1',
        playerName: 'Pastrnak',
        playerTeam: 'Bruins',
        odds: -110,
        aiWinProbability: 0.55
      },
      {
        pickId: 'nhl_p2_points',
        gameId: 'nhl_game_1',
        teams: 'Bruins vs Rangers',
        betType: 'prop',
        propStat: 'player_points_hockey',
        propCategory: 'skating',
        playerId: 'p2',
        playerName: 'Marchand',
        playerTeam: 'Bruins',
        odds: -110,
        aiWinProbability: 0.55
      }
    ]

    const result = calculateSGPOdds(legs as any)
    expect(result.correlationWarnings.some(w => w.message.includes('NHL Goal ↔ Assist'))).toBe(true)
  })
})
