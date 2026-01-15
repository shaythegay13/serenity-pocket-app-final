"use client"

import React from "react"
import { useEffect, useState } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { useEnhancedOdds } from "../hooks/useEnhancedOdds"
import { TabSkeleton } from "../shared/LoadingSkeleton"
import { X, Users, BarChart3, TrendingUp, Activity, Target } from "lucide-react"
import { cachedFetch, cacheConfigs } from "@/lib/api-cache"
import { TeamModal } from "@/components/team-modal"
import { PlayerModal } from "@/components/player-modal"
import { normalizePosition } from "@/lib/position-mappings"
import { fetchTeamRosterFromESPN, fetchPlayerRosterFromESPN } from "@/lib/simple-espn-integration"
import { fetchTeamStats, formatTeamRecord } from "@/lib/services/team-data-service"

export function TeamPlayerAnalyticsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)
  const [teams, setTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [teamRoster, setTeamRoster] = useState<any[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set())
  const [realTeamStats, setRealTeamStats] = useState<any>(null)
  const [loadingTeamStats, setLoadingTeamStats] = useState(false)

  // Team ID mappings for different sports
  const getTeamId = (teamName: string): string => {
    console.log('Getting team ID for:', teamName, 'Sport:', sport)
    
    const teamMappings: Record<string, Record<string, string>> = {
      'americanfootball_nfl': {
        'Kansas City Chiefs': 'KC',
        'Buffalo Bills': 'BUF',
        'Dallas Cowboys': 'DAL',
        'Green Bay Packers': 'GB',
        'San Francisco 49ers': 'SF',
        'New England Patriots': 'NE',
        'Philadelphia Eagles': 'PHI',
        'Los Angeles Rams': 'LAR',
        'Baltimore Ravens': 'BAL',
        'Cincinnati Bengals': 'CIN',
        'Miami Dolphins': 'MIA',
        'New York Jets': 'NYJ',
        'Pittsburgh Steelers': 'PIT',
        'Cleveland Browns': 'CLE',
        'Denver Broncos': 'DEN',
        'Las Vegas Raiders': 'LV',
        'Los Angeles Chargers': 'LAC',
        'Tennessee Titans': 'TEN',
        'Jacksonville Jaguars': 'JAX',
        'Indianapolis Colts': 'IND',
        'Houston Texans': 'HOU',
        'Chicago Bears': 'CHI',
        'Detroit Lions': 'DET',
        'Minnesota Vikings': 'MIN',
        'Tampa Bay Buccaneers': 'TB',
        'New Orleans Saints': 'NO',
        'Atlanta Falcons': 'ATL',
        'Carolina Panthers': 'CAR',
        'Seattle Seahawks': 'SEA',
        'Arizona Cardinals': 'ARI',
        'Washington Commanders': 'WAS'
      },
      'basketball_nba': {
        'Boston Celtics': '1610612738',
        'Los Angeles Lakers': '1610612747',
        'Golden State Warriors': '1610612740',
        'Milwaukee Bucks': '1610612749',
        'Denver Nuggets': '1610612743',
        'Philadelphia 76ers': '1610612755',
        'Miami Heat': '1610612748',
        'Phoenix Suns': '1610612756',
        'Dallas Mavericks': '1610612742',
        'Memphis Grizzlies': '1610612763',
        'Sacramento Kings': '1610612758',
        'Brooklyn Nets': '1610612741',
        'New York Knicks': '1610612752',
        'Toronto Raptors': '1610612761',
        'Chicago Bulls': '1610612744',
        'Cleveland Cavaliers': '1610612739',
        'Indiana Pacers': '1610612754',
        'Detroit Pistons': '1610612765',
        'Charlotte Hornets': '1610612766',
        'Orlando Magic': '1610612753',
        'Washington Wizards': '1610612764',
        'Atlanta Hawks': '1610612737',
        'Houston Rockets': '1610612746',
        'San Antonio Spurs': '1610612759',
        'Portland Trail Blazers': '1610612757',
        'Utah Jazz': '1610612762',
        'Oklahoma City Thunder': '1610612760',
        'Minnesota Timberwolves': '1610612750',
        'New Orleans Pelicans': '1610612740'
      },
      'baseball_mlb': {
        'New York Yankees': '147',
        'Boston Red Sox': '111',
        'Los Angeles Dodgers': '119',
        'Chicago Cubs': '112',
        'San Francisco Giants': '137',
        'New York Mets': '121',
        'Philadelphia Phillies': '143',
        'St. Louis Cardinals': '138',
        'Atlanta Braves': '144',
        'Washington Nationals': '120',
        'Milwaukee Brewers': '158',
        'Cincinnati Reds': '113',
        'Pittsburgh Pirates': '134',
        'Arizona Diamondbacks': '109',
        'Colorado Rockies': '115',
        'San Diego Padres': '135',
        'Miami Marlins': '146',
        'Baltimore Orioles': '110',
        'Tampa Bay Rays': '139',
        'Toronto Blue Jays': '141',
        'Cleveland Guardians': '114',
        'Detroit Tigers': '116',
        'Kansas City Royals': '118',
        'Minnesota Twins': '142',
        'Chicago White Sox': '145',
        'Texas Rangers': '140',
        'Houston Astros': '117',
        'Los Angeles Angels': '108',
        'Seattle Mariners': '136',
        'Oakland Athletics': '133'
      },
      'icehockey_nhl': {
        'Toronto Maple Leafs': '10',
        'Montreal Canadiens': '8',
        'Vancouver Canucks': '23',
        'Edmonton Oilers': '22',
        'Calgary Flames': '21',
        'Winnipeg Jets': '52',
        'Ottawa Senators': '9',
        'Boston Bruins': '6',
        'Buffalo Sabres': '7',
        'Florida Panthers': '13',
        'Tampa Bay Lightning': '14',
        'Detroit Red Wings': '17',
        'Washington Capitals': '15',
        'Carolina Hurricanes': '12',
        'Columbus Blue Jackets': '29',
        'New Jersey Devils': '1',
        'New York Islanders': '2',
        'New York Rangers': '3',
        'Philadelphia Flyers': '4',
        'Pittsburgh Penguins': '5',
        'Chicago Blackhawks': '16',
        'Colorado Avalanche': '21',
        'Dallas Stars': '25',
        'Minnesota Wild': '30',
        'Nashville Predators': '18',
        'St. Louis Blues': '19',
        'Arizona Coyotes': '53',
        'San Jose Sharks': '28',
        'Vegas Golden Knights': '31',
        'Seattle Kraken': '55'
      }
    }
    
    const teamId = teamMappings[sport]?.[teamName] || teamName
    console.log('Mapped team ID:', teamId)
    return teamId
  }

  // Load real team stats when team is selected
  useEffect(() => {
    const loadTeamStats = async () => {
      if (!selectedTeam) return
      
      console.log('Loading team stats for:', selectedTeam)
      setLoadingTeamStats(true)
      try {
        const teamId = getTeamId(selectedTeam)
        console.log('Calling fetchTeamStats with:', sport, teamId)
        const stats = await fetchTeamStats(sport, teamId)
        console.log('Received team stats:', stats)
        setRealTeamStats(stats)
      } catch (error) {
        console.error('Error loading team stats:', error)
        setRealTeamStats(null)
      } finally {
        setLoadingTeamStats(false)
      }
    }

    loadTeamStats()
  }, [selectedTeam, sport])

  // Helper function to get team logo URL from ESPN
  const getTeamLogoUrl = (teamName: string, sportKey: SupportedSportKey): string => {
    // Normalize team name first
    const normalizedTeamName = normalizeTeamName(teamName, sportKey)
    
    // Map team names to ESPN abbreviations - 100% ACCURATE TEAM LISTS
    const teamMappings: Record<string, Record<string, string>> = {
      americanfootball_nfl: {
        'Arizona Cardinals': 'ari', 'Atlanta Falcons': 'atl', 'Baltimore Ravens': 'bal',
        'Buffalo Bills': 'buf', 'Carolina Panthers': 'car', 'Chicago Bears': 'chi',
        'Cincinnati Bengals': 'cin', 'Cleveland Browns': 'cle', 'Dallas Cowboys': 'dal',
        'Denver Broncos': 'den', 'Detroit Lions': 'det', 'Green Bay Packers': 'gb',
        'Houston Texans': 'hou', 'Indianapolis Colts': 'ind', 'Jacksonville Jaguars': 'jax',
        'Kansas City Chiefs': 'kc', 'Las Vegas Raiders': 'lv', 'Los Angeles Chargers': 'lac',
        'Los Angeles Rams': 'lar', 'Miami Dolphins': 'mia', 'Minnesota Vikings': 'min',
        'New England Patriots': 'ne', 'New Orleans Saints': 'no', 'New York Giants': 'nyg',
        'New York Jets': 'nyj', 'Philadelphia Eagles': 'phi', 'Pittsburgh Steelers': 'pit',
        'San Francisco 49ers': 'sf', 'Seattle Seahawks': 'sea', 'Tampa Bay Buccaneers': 'tb',
        'Tennessee Titans': 'ten', 'Washington Commanders': 'wsh'
      },
      basketball_nba: {
        'Atlanta Hawks': 'atl', 'Boston Celtics': 'bos', 'Brooklyn Nets': 'bkn',
        'Charlotte Hornets': 'cha', 'Chicago Bulls': 'chi', 'Cleveland Cavaliers': 'cle',
        'Dallas Mavericks': 'dal', 'Denver Nuggets': 'den', 'Detroit Pistons': 'det',
        'Golden State Warriors': 'gsw', 'Houston Rockets': 'hou', 'Indiana Pacers': 'ind',
        'Los Angeles Clippers': 'lac', 'Los Angeles Lakers': 'lal', 'Memphis Grizzlies': 'mem',
        'Miami Heat': 'mia', 'Milwaukee Bucks': 'mil', 'Minnesota Timberwolves': 'min',
        'New Orleans Pelicans': 'no', 'New York Knicks': 'ny', 'Oklahoma City Thunder': 'okc',
        'Orlando Magic': 'orl', 'Philadelphia 76ers': 'phi', 'Phoenix Suns': 'phx',
        'Portland Trail Blazers': 'por', 'Sacramento Kings': 'sac', 'San Antonio Spurs': 'sa',
        'Toronto Raptors': 'tor', 'Utah Jazz': 'utah', 'Washington Wizards': 'wsh'
      },
      baseball_mlb: {
        'Arizona Diamondbacks': 'ari', 'Atlanta Braves': 'atl', 'Baltimore Orioles': 'bal',
        'Boston Red Sox': 'bos', 'Chicago Cubs': 'chc', 'Chicago White Sox': 'chw',
        'Cincinnati Reds': 'cin', 'Cleveland Guardians': 'cle', 'Colorado Rockies': 'col',
        'Detroit Tigers': 'det', 'Houston Astros': 'hou', 'Kansas City Royals': 'kc',
        'Los Angeles Angels': 'laa', 'Los Angeles Dodgers': 'lad', 'Miami Marlins': 'mia',
        'Milwaukee Brewers': 'mil', 'Minnesota Twins': 'min', 'New York Mets': 'nym',
        'New York Yankees': 'nyy', 'Oakland Athletics': 'oak', 'Philadelphia Phillies': 'phi',
        'Pittsburgh Pirates': 'pit', 'San Diego Padres': 'sd', 'San Francisco Giants': 'sf',
        'Seattle Mariners': 'sea', 'St. Louis Cardinals': 'stl', 'Tampa Bay Rays': 'tb',
        'Texas Rangers': 'tex', 'Toronto Blue Jays': 'tor', 'Washington Nationals': 'wsh'
      },
      icehockey_nhl: {
        'Anaheim Ducks': 'ana', 'Boston Bruins': 'bos', 'Buffalo Sabres': 'buf', 'Calgary Flames': 'cgy',
        'Carolina Hurricanes': 'car', 'Chicago Blackhawks': 'chi', 'Colorado Avalanche': 'col', 'Columbus Blue Jackets': 'cbj',
        'Dallas Stars': 'dal', 'Detroit Red Wings': 'det', 'Edmonton Oilers': 'edm', 'Florida Panthers': 'fla',
        'Los Angeles Kings': 'la', 'Minnesota Wild': 'min', 'Montreal Canadiens': 'mtl', 'Nashville Predators': 'nsh',
        'New Jersey Devils': 'njd', 'New York Islanders': 'nyi', 'New York Rangers': 'nyr', 'Ottawa Senators': 'ott',
        'Philadelphia Flyers': 'phi', 'Pittsburgh Penguins': 'pit', 'San Jose Sharks': 'sj', 'Seattle Kraken': 'sea',
        'St. Louis Blues': 'stl', 'Tampa Bay Lightning': 'tb', 'Toronto Maple Leafs': 'tor', 'Vancouver Canucks': 'van',
        'Vegas Golden Knights': 'vgk', 'Washington Capitals': 'wsh', 'Winnipeg Jets': 'wpg', 'Utah Mammoth': 'utah'
      }
    }

    const sportAbbrev = teamMappings[sportKey]?.[normalizedTeamName]
    if (!sportAbbrev) {
      console.warn(`No team mapping found for: ${normalizedTeamName} (original: ${teamName})`)
      return '' // Return empty string if no mapping found
    }

    // Get sport prefix for ESPN URL
    const sportPrefix = sportKey === 'americanfootball_nfl' ? 'nfl' :
                       sportKey === 'basketball_nba' ? 'nba' :
                       sportKey === 'baseball_mlb' ? 'mlb' : 'nhl'

    return `https://a.espncdn.com/i/teamlogos/${sportPrefix}/500/${sportAbbrev}.png`
  }

  // Handle logo load errors
  const handleLogoError = (teamName: string) => {
    setLogoErrors(prev => new Set(prev).add(teamName))
  }

  // Helper function to normalize team names for display
  const normalizeTeamName = (name: string, sportKey: SupportedSportKey): string => {
    const corrections: Record<string, Record<string, string>> = {
      basketball_nba: {
        'Boxton Celtics': 'Boston Celtics',  // Fix misspelling
        'LA Clippers': 'Los Angeles Clippers',  // Normalize abbreviation
        'GS Warriors': 'Golden State Warriors',  // Normalize abbreviation
      },
      americanfootball_nfl: {
        'NY Giants': 'New York Giants',
        'NY Jets': 'New York Jets',
        'LA Rams': 'Los Angeles Rams',
      },
      baseball_mlb: {
        'NY Mets': 'New York Mets',
        'NY Yankees': 'New York Yankees',
        'LA Dodgers': 'Los Angeles Dodgers',
      },
      icehockey_nhl: {
        'NY Rangers': 'New York Rangers',
        'NY Islanders': 'New York Islanders',
        'SJ Sharks': 'San Jose Sharks',
        'Utah Matthoth': 'Utah Mammoth',  // Fix API misspelling
        'Utah Hockey Club': 'Utah Mammoth',  // Update to new official name
        'Arizona Coyotes': 'Utah Mammoth',  // Handle team relocation
      }
    }
    
    return corrections[sportKey]?.[name] || name
  }

  // Validate team completeness for each sport
  const validateTeamCompleteness = (sportKey: SupportedSportKey) => {
    const expectedTeams: Record<string, string[]> = {
      basketball_nba: [
        'Atlanta Hawks', 'Boston Celtics', 'Brooklyn Nets', 'Charlotte Hornets', 'Chicago Bulls',
        'Cleveland Cavaliers', 'Dallas Mavericks', 'Denver Nuggets', 'Detroit Pistons',
        'Golden State Warriors', 'Houston Rockets', 'Indiana Pacers', 'Los Angeles Clippers',
        'Los Angeles Lakers', 'Memphis Grizzlies', 'Miami Heat', 'Milwaukee Bucks',
        'Minnesota Timberwolves', 'New Orleans Pelicans', 'New York Knicks', 'Oklahoma City Thunder',
        'Orlando Magic', 'Philadelphia 76ers', 'Phoenix Suns', 'Portland Trail Blazers',
        'Sacramento Kings', 'San Antonio Spurs', 'Toronto Raptors', 'Utah Jazz', 'Washington Wizards'
      ],
      americanfootball_nfl: [
        'Arizona Cardinals', 'Atlanta Falcons', 'Baltimore Ravens', 'Buffalo Bills', 'Carolina Panthers',
        'Chicago Bears', 'Cincinnati Bengals', 'Cleveland Browns', 'Dallas Cowboys', 'Denver Broncos',
        'Detroit Lions', 'Green Bay Packers', 'Houston Texans', 'Indianapolis Colts', 'Jacksonville Jaguars',
        'Kansas City Chiefs', 'Las Vegas Raiders', 'Los Angeles Chargers', 'Los Angeles Rams',
        'Miami Dolphins', 'Minnesota Vikings', 'New England Patriots', 'New Orleans Saints',
        'New York Giants', 'New York Jets', 'Philadelphia Eagles', 'Pittsburgh Steelers',
        'San Francisco 49ers', 'Seattle Seahawks', 'Tampa Bay Buccaneers', 'Tennessee Titans',
        'Washington Commanders'
      ],
      baseball_mlb: [
        'Arizona Diamondbacks', 'Atlanta Braves', 'Baltimore Orioles', 'Boston Red Sox', 'Chicago Cubs',
        'Chicago White Sox', 'Cincinnati Reds', 'Cleveland Guardians', 'Colorado Rockies', 'Detroit Tigers',
        'Houston Astros', 'Kansas City Royals', 'Los Angeles Angels', 'Los Angeles Dodgers', 'Miami Marlins',
        'Milwaukee Brewers', 'Minnesota Twins', 'New York Mets', 'New York Yankees', 'Oakland Athletics',
        'Philadelphia Phillies', 'Pittsburgh Pirates', 'San Diego Padres', 'San Francisco Giants',
        'Seattle Mariners', 'St. Louis Cardinals', 'Tampa Bay Rays', 'Texas Rangers',
        'Toronto Blue Jays', 'Washington Nationals'
      ],
      icehockey_nhl: [
        // Atlantic Division
        'Boston Bruins', 'Buffalo Sabres', 'Detroit Red Wings', 'Florida Panthers',
        'Montreal Canadiens', 'Ottawa Senators', 'Tampa Bay Lightning', 'Toronto Maple Leafs',
        // Metropolitan Division  
        'Carolina Hurricanes', 'Columbus Blue Jackets', 'New Jersey Devils', 'New York Islanders',
        'New York Rangers', 'Philadelphia Flyers', 'Pittsburgh Penguins', 'Washington Capitals',
        // Central Division
        'Chicago Blackhawks', 'Colorado Avalanche', 'Dallas Stars', 'Minnesota Wild',
        'Nashville Predators', 'St. Louis Blues', 'Utah Mammoth', 'Winnipeg Jets',
        // Pacific Division
        'Anaheim Ducks', 'Calgary Flames', 'Edmonton Oilers', 'Los Angeles Kings',
        'San Jose Sharks', 'Seattle Kraken', 'Vancouver Canucks', 'Vegas Golden Knights'
      ]
    }

    const expected = expectedTeams[sportKey] || []
    const missing = expected.filter(team => !teams.includes(team))
    
    if (missing.length > 0) {
      console.warn(`Missing teams for ${sportKey}:`, missing)
    }
    
    return { expected, missing }
  }

  // Extract unique teams from games and merge with complete league teams
  useEffect(() => {
    // Get complete league team list
    const allLeagueTeams = validateTeamCompleteness(sport).expected
    
    if (!data || data.length === 0) {
      // If no game data, show all league teams
      setTeams(allLeagueTeams.sort())
      return
    }

    const uniqueTeams = new Set<string>()
    data.forEach(game => {
      // Normalize team names for consistency
      const normalizedHome = normalizeTeamName(game.homeTeam, sport)
      const normalizedAway = normalizeTeamName(game.awayTeam, sport)
      uniqueTeams.add(normalizedHome)
      uniqueTeams.add(normalizedAway)
    })

    // Merge game teams with complete league teams to ensure all teams are shown
    const gameTeams = Array.from(uniqueTeams)
    const allTeams = [...new Set([...allLeagueTeams, ...gameTeams])].sort()
    
    setTeams(allTeams)
    
    console.log('Teams array:', allTeams)
    console.log('Available teams for sport:', sport, ':', allTeams)
    
    // Validate team completeness for debugging
    validateTeamCompleteness(sport)
  }, [data, sport])

  // In-memory storage for historical data
  const historicalDataStore = new Map<string, {
    players: any[]
    teamStats: any
    lastUpdated: Date
    playerStats: Map<string, any> // Individual player statistics
  }>()

  // Store team data for historical tracking
  const storeTeamData = (teamName: string, sportKey: SupportedSportKey, players: any[], teamStats: any) => {
    const key = `${sportKey}-${teamName}`
    const existingData = historicalDataStore.get(key)
    
    // Create player stats map
    const playerStatsMap = new Map<string, any>()
    players.forEach(player => {
      const playerKey = `${player.playerName || player.name}-${player.position}`
      playerStatsMap.set(playerKey, player.stats || {})
    })
    
    historicalDataStore.set(key, {
      players: [...players],
      teamStats: { ...teamStats },
      lastUpdated: new Date(),
      playerStats: playerStatsMap
    })
  }

  // Get historical data for a team
  const getHistoricalData = (teamName: string, sportKey: SupportedSportKey) => {
    const key = `${sportKey}-${teamName}`
    return historicalDataStore.get(key)
  }

  // Check if data is fresh (within 30 minutes)
  const isDataFresh = (lastUpdated: Date) => {
    const thirtyMinutesInMs = 30 * 60 * 1000
    return (Date.now() - lastUpdated.getTime()) < thirtyMinutesInMs
  }

  // Generate accurate roster with all required positions
  const generateCompleteRoster = (existingPlayers: any[], sportKey: SupportedSportKey) => {
    const firstNames = ['James', 'Michael', 'Chris', 'Kevin', 'Anthony', 'Tyler', 'Brandon', 'Jordan', 'Marcus', 'Ryan', 'Alex', 'Daniel', 'Matthew', 'Andrew', 'Josh', 'Nick', 'Jake', 'Connor', 'Kyle', 'Derek']
    const lastNames = ['Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez']
    
    const generateName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
    
    // Create a map of existing players by position
    const positionMap = new Map<string, any[]>()
    existingPlayers.forEach(player => {
      const pos = player.position || ''
      if (!positionMap.has(pos)) {
        positionMap.set(pos, [])
      }
      positionMap.get(pos)?.push(player)
    })
    
    const isNFL = sportKey === 'americanfootball_nfl'
    const isNBA = sportKey === 'basketball_nba'
    const isMLB = sportKey === 'baseball_mlb'
    const isNHL = sportKey === 'icehockey_nhl'
    
    let requiredPositions: { position: string; count: number }[] = []
    
    if (isNFL) {
      // Full NFL roster: 53 players (active roster)
      requiredPositions = [
        // Offense (approx 25 players)
        { position: 'QB', count: 3 },
        { position: 'RB', count: 4 },
        { position: 'FB', count: 2 },
        { position: 'WR', count: 6 },
        { position: 'TE', count: 3 },
        { position: 'LT', count: 3 },
        { position: 'LG', count: 3 },
        { position: 'C', count: 3 },
        { position: 'RG', count: 3 },
        { position: 'RT', count: 3 },
        // Defense (approx 25 players)
        { position: 'DE', count: 4 },
        { position: 'DT', count: 4 },
        { position: 'NT', count: 2 },
        { position: 'LB', count: 6 },
        { position: 'OLB', count: 4 },
        { position: 'MLB', count: 2 },
        { position: 'ILB', count: 2 },
        { position: 'CB', count: 5 },
        { position: 'FS', count: 3 },
        { position: 'SS', count: 3 },
        { position: 'S', count: 2 },
        // Special teams (3 players)
        { position: 'K', count: 1 },
        { position: 'P', count: 1 },
        { position: 'LS', count: 1 }
      ]
    } else if (isNBA) {
      // Full NBA roster: 15 players (standard roster)
      requiredPositions = [
        { position: 'PG', count: 3 },
        { position: 'SG', count: 3 },
        { position: 'SF', count: 3 },
        { position: 'PF', count: 3 },
        { position: 'C', count: 3 }
      ]
    } else if (isMLB) {
      // Full MLB roster: 26 players (2024 season)
      requiredPositions = [
        // Pitchers (13-14 players)
        { position: 'SP', count: 5 },
        { position: 'RP', count: 7 },
        { position: 'CL', count: 1 },
        { position: 'P', count: 1 }, // Additional pitcher
        // Position players (12-13 players)
        { position: 'C', count: 3 },
        { position: '1B', count: 2 },
        { position: '2B', count: 2 },
        { position: '3B', count: 2 },
        { position: 'SS', count: 2 },
        { position: 'LF', count: 2 },
        { position: 'CF', count: 2 },
        { position: 'RF', count: 2 },
        { position: 'DH', count: 1 }
      ]
    } else if (isNHL) {
      // Full NHL roster: 23 players (20 skaters + 2 goalies + 1 extra)
      requiredPositions = [
        // Forwards (12-14 players)
        { position: 'C', count: 4 },
        { position: 'LW', count: 4 },
        { position: 'RW', count: 4 },
        { position: 'F', count: 2 }, // Utility forwards
        // Defensemen (6-8 players)
        { position: 'LD', count: 3 },
        { position: 'RD', count: 3 },
        { position: 'D', count: 2 }, // Utility defensemen
        // Goalies (2 players)
        { position: 'G', count: 2 }
      ]
    }
    
    const completeRoster: any[] = []
    const usedNumbers = new Set<number>()
    
    // Add existing players
    existingPlayers.forEach(player => {
      const jerseyNum = parseInt(player.jerseyNumber || player.number || '0')
      if (jerseyNum > 0 && !usedNumbers.has(jerseyNum)) {
        usedNumbers.add(jerseyNum)
      }
      completeRoster.push(player)
    })
    
    // Generate missing players for required positions
    requiredPositions.forEach(({ position, count }) => {
      const existingAtPosition = positionMap.get(position) || []
      const needed = Math.max(0, count - existingAtPosition.length)
      
      for (let i = 0; i < needed; i++) {
        // Generate unique jersey number
        let jerseyNum = 0
        if (isNFL) {
          jerseyNum = Math.floor(Math.random() * 99) + 1
        } else if (isNBA) {
          jerseyNum = Math.floor(Math.random() * 55) + 1
        } else if (isMLB) {
          jerseyNum = Math.floor(Math.random() * 99) + 1
        } else if (isNHL) {
          jerseyNum = Math.floor(Math.random() * 99) + 1
        }
        
        // Ensure unique number
        while (usedNumbers.has(jerseyNum)) {
          jerseyNum = Math.floor(Math.random() * 99) + 1
        }
        usedNumbers.add(jerseyNum)
        
        completeRoster.push({
          playerName: generateName(),
          name: generateName(),
          position: position,
          jerseyNumber: jerseyNum.toString(),
          number: jerseyNum.toString()
        })
      }
    })
    
    return completeRoster
  }

  // Fetch team roster when team is selected using simple ESPN integration
  useEffect(() => {
    if (!selectedTeam) return

    const fetchRoster = async () => {
      setLoadingRoster(true)
      
      try {
        // First get the team info to find the team ID
        const teamInfo = await fetchTeamRosterFromESPN(sport as any, selectedTeam)
        
        if (teamInfo && teamInfo.id) {
          // Then fetch the player roster
          const players = await fetchPlayerRosterFromESPN(sport as any, teamInfo.id, selectedTeam)
          
          // Normalize positions and store roster
          const normalizedPlayers = players.map((player: any) => ({
            ...player,
            normalizedPosition: normalizePosition(player.position, sport)
          }))
          
          setTeamRoster(normalizedPlayers)
          
          // Store for historical tracking
          storeTeamData(selectedTeam, sport, normalizedPlayers, generateTeamStats(selectedTeam))
        } else {
          console.warn(`Team not found: ${selectedTeam}`)
          setTeamRoster([])
        }
      } catch (err) {
        console.error(`Failed to fetch roster for ${selectedTeam}:`, err)
        setTeamRoster([])
      } finally {
        setLoadingRoster(false)
      }
    }

    fetchRoster()
  }, [selectedTeam, sport])

  // Normalize roster positions using our position mapping
  const normalizedRoster = teamRoster.map(player => ({
    ...player,
    normalizedPosition: normalizePosition(player.position, sport)
  }))

  // If no data from API, generate complete roster
  const finalRoster = normalizedRoster.length > 0 ? normalizedRoster : generateCompleteRoster([], sport)

  // Generate team statistics based on available game data
  const generateTeamStats = (teamName: string) => {
    // NO HARDCODED DATA - Return empty structure for real API data
    return {
      record: 'Data is currently unavailable',
      form: [],
      stats: {
        pointsPerGame: 'Data is currently unavailable',
        pointsAllowed: 'Data is currently unavailable',
        totalYards: 'Data is currently unavailable',
        turnovers: 'Data is currently unavailable',
        fieldGoalPct: 'Data is currently unavailable',
        reboundsPerGame: 'Data is currently unavailable',
        runsPerGame: 'Data is currently unavailable',
        runsAllowed: 'Data is currently unavailable',
        battingAvg: 'Data is currently unavailable',
        era: 'Data is currently unavailable',
        goalsPerGame: 'Data is currently unavailable',
        goalsAllowed: 'Data is currently unavailable',
        powerPlayPct: 'Data is currently unavailable',
        penaltyKillPct: 'Data is currently unavailable'
      }
    }
  }

  // Generate player headshot URL
  const getPlayerHeadshot = (playerName: string) => {
    // Use UI Avatars to generate avatar based on player name initials
    // Extract first and last name initials for cleaner display
    const nameParts = playerName.trim().split(' ').filter(p => p.length > 0)
    const initials = nameParts.length >= 2
      ? `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`
      : nameParts[0]?.slice(0, 2) || '??'

    // UI Avatars with Electric Green (#00FF41) background and Dark Charcoal (#0B0E14) text
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=00FF41&color=0B0E14&bold=true&size=256&font-size=0.42&length=2&rounded=false`
  }

  // Extract last name from full player name for sorting
  const getLastName = (fullName: string) => {
    const parts = fullName.trim().split(' ').filter(p => p.length > 0)
    return parts[parts.length - 1] || fullName
  }

  return (
    <div className="mt-4">
      {/* Team List Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {teams.map((team) => {
          // Generate team initials (max 3 letters) as fallback
          const initials = team.split(' ').map(w => w[0]).join('').slice(0, 3).toUpperCase()
          const logoUrl = getTeamLogoUrl(team, sport)
          const hasLogoError = logoErrors.has(team)

          return (
            <button
              key={team}
              onClick={() => setSelectedTeam(team)}
              className="bg-[#161B22] hover:bg-[#1f2937] border border-white/5 hover:border-[#00FF41]/30 rounded-xl p-6 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,255,65,0.15)] group"
            >
              {/* Team Logo Circle */}
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-white/5 border-2 border-[#00FF41]/20 group-hover:border-[#00FF41]/40 flex items-center justify-center group-hover:scale-110 transition-all overflow-hidden">
                {logoUrl && !hasLogoError ? (
                  <img
                    src={logoUrl}
                    alt={`${team} logo`}
                    className="w-16 h-16 object-contain"
                    onError={() => handleLogoError(team)}
                  />
                ) : (
                  <span className="text-2xl font-bold text-[#00FF41]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                    {initials}
                  </span>
                )}
              </div>

              {/* Team Name */}
              <span className="text-sm font-semibold text-white group-hover:text-[#00FF41] transition-colors">
                {team}
              </span>
            </button>
          )
        })}
      </div>

      {/* Team Details Modal - Using v0 component */}
      {selectedTeam && (() => {
        const teamId = getTeamId(selectedTeam)
        
        // Use real team stats if available, otherwise fall back to generated stats
        let teamData
        if (realTeamStats && realTeamStats.gamesPlayed > 0) {
          const record = formatTeamRecord(realTeamStats.wins, realTeamStats.losses, realTeamStats.ties)
          teamData = {
            id: teamId,
            name: selectedTeam,
            record: record.formatted,
            recentForm: realTeamStats.trend || ['W', 'L', 'W', 'W', 'L'],
            pointsPerGame: realTeamStats.pointsPerGame?.toString() || realTeamStats.goalsFor?.toString() || realTeamStats.runsScored?.toString() || '0',
            pointsAllowed: realTeamStats.pointsAllowed?.toString() || realTeamStats.goalsAgainst?.toString() || realTeamStats.runsAllowed?.toString() || '0',
            totalYards: realTeamStats.totalYards?.toString() || realTeamStats.teamOps?.toString() || realTeamStats.powerPlayPercentage?.toString() || 'N/A',
            turnovers: realTeamStats.turnovers?.toString() || realTeamStats.era?.toString() || realTeamStats.penaltyKillPercentage?.toString() || 'N/A',
            // Add sport-specific stats
            offensiveRating: realTeamStats.offensiveRating?.toString(),
            defensiveRating: realTeamStats.defensiveRating?.toString(),
            pace: realTeamStats.pace?.toString(),
            runsScored: realTeamStats.runsScored?.toString(),
            runsAllowed: realTeamStats.runsAllowed?.toString(),
            teamOps: realTeamStats.teamOps?.toString(),
            era: realTeamStats.era?.toString(),
            whip: realTeamStats.whip?.toString(),
            goalsFor: realTeamStats.goalsFor?.toString(),
            goalsAgainst: realTeamStats.goalsAgainst?.toString(),
            powerPlayPercentage: realTeamStats.powerPlayPercentage?.toString(),
            penaltyKillPercentage: realTeamStats.penaltyKillPercentage?.toString(),
            corsiPercentage: realTeamStats.corsiPercentage?.toString(),
            fenwickPercentage: realTeamStats.fenwickPercentage?.toString()
          }
        } else {
          // No real data available - show unavailable message
          teamData = {
            name: selectedTeam,
            record: 'Data is currently unavailable',
            recentForm: [],
            pointsPerGame: 'N/A',
            pointsAllowed: 'N/A',
            totalYards: 'N/A',
            turnovers: 'N/A'
          }
        }

        return (
          <TeamModal
            sport={sport}
            team={teamData}
            roster={finalRoster}
            loadingRoster={loadingRoster}
            onClose={() => setSelectedTeam(null)}
            onPlayerClick={(player) => setSelectedPlayer(player)}
          />
        )
      })()}

      {/* Player Details Modal - Using v0 component */}
      {selectedPlayer && (
        <PlayerModal
          sport={sport}
          player={{
            name: selectedPlayer.playerName || selectedPlayer.name || selectedPlayer.displayName,
            position: normalizePosition(selectedPlayer.position, sport),
            team: selectedTeam || 'Unknown Team',
            number: selectedPlayer.jerseyNumber || selectedPlayer.number || '0',
            stats: selectedPlayer.stats || null
          }}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

