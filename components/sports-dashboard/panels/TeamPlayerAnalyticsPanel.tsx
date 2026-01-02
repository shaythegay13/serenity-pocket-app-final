"use client"

import React, { useEffect, useState } from "react"
import type { SupportedSportKey } from "@/lib/types"
import { useEnhancedOdds } from "../hooks/useEnhancedOdds"
import { TabSkeleton } from "../shared/LoadingSkeleton"
import { X, Users, BarChart3, TrendingUp, Activity, Target } from "lucide-react"
import { PlayerModal } from "@/components/player-modal"
import { TeamModal } from "@/components/team-modal"

export function TeamPlayerAnalyticsPanel({ sport }: { sport: SupportedSportKey }) {
  const { data, loading, error } = useEnhancedOdds(sport)
  const [teams, setTeams] = useState<string[]>([])
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<any | null>(null)
  const [teamRoster, setTeamRoster] = useState<any[]>([])
  const [loadingRoster, setLoadingRoster] = useState(false)
  const [logoErrors, setLogoErrors] = useState<Set<string>>(new Set())

  // Helper function to get team logo URL from ESPN
  const getTeamLogoUrl = (teamName: string, sportKey: SupportedSportKey): string => {
    // Map team names to ESPN abbreviations
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
        'Golden State Warriors': 'gs', 'Houston Rockets': 'hou', 'Indiana Pacers': 'ind',
        'LA Clippers': 'lac', 'Los Angeles Lakers': 'lal', 'Memphis Grizzlies': 'mem',
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
        'Anaheim Ducks': 'ana', 'Arizona Coyotes': 'ari', 'Boston Bruins': 'bos',
        'Buffalo Sabres': 'buf', 'Calgary Flames': 'cgy', 'Carolina Hurricanes': 'car',
        'Chicago Blackhawks': 'chi', 'Colorado Avalanche': 'col', 'Columbus Blue Jackets': 'cbj',
        'Dallas Stars': 'dal', 'Detroit Red Wings': 'det', 'Edmonton Oilers': 'edm',
        'Florida Panthers': 'fla', 'Los Angeles Kings': 'la', 'Minnesota Wild': 'min',
        'Montreal Canadiens': 'mtl', 'Nashville Predators': 'nsh', 'New Jersey Devils': 'njd',
        'New York Islanders': 'nyi', 'New York Rangers': 'nyr', 'Ottawa Senators': 'ott',
        'Philadelphia Flyers': 'phi', 'Pittsburgh Penguins': 'pit', 'San Jose Sharks': 'sj',
        'Seattle Kraken': 'sea', 'St. Louis Blues': 'stl', 'Tampa Bay Lightning': 'tb',
        'Toronto Maple Leafs': 'tor', 'Vancouver Canucks': 'van', 'Vegas Golden Knights': 'vgk',
        'Washington Capitals': 'wsh', 'Winnipeg Jets': 'wpg', 'Utah Hockey Club': 'utah'
      }
    }

    const sportAbbrev = teamMappings[sportKey]?.[teamName]
    if (!sportAbbrev) {
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

  // Extract unique teams from games
  useEffect(() => {
    if (!data || data.length === 0) return

    const uniqueTeams = new Set<string>()
    data.forEach(game => {
      uniqueTeams.add(game.homeTeam)
      uniqueTeams.add(game.awayTeam)
    })

    setTeams(Array.from(uniqueTeams).sort())
  }, [data])

  // Generate simulated roster data
  const generateRoster = (teamName: string, sportKey: SupportedSportKey) => {
    const firstNames = ['James', 'Michael', 'Chris', 'Kevin', 'Anthony', 'Tyler', 'Brandon', 'Jordan', 'Marcus', 'Ryan', 'Alex', 'Daniel', 'Matthew', 'Andrew', 'Josh', 'Nick', 'Jake', 'Connor', 'Kyle', 'Derek']
    const lastNames = ['Johnson', 'Williams', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez']

    const generateName = () => `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`

    const isNFL = sportKey === 'americanfootball_nfl'
    const isNBA = sportKey === 'basketball_nba'
    const isMLB = sportKey === 'baseball_mlb'
    const isNHL = sportKey === 'icehockey_nhl'

    let positions: string[] = []
    let rosterSize = 53

    if (isNFL) {
      positions = ['QB', 'RB', 'RB', 'WR', 'WR', 'WR', 'TE', 'TE', 'OL', 'OL', 'OL', 'OL', 'OL', 'DL', 'DL', 'DL', 'DL', 'LB', 'LB', 'LB', 'CB', 'CB', 'CB', 'S', 'S', 'K', 'P']
      rosterSize = 53
    } else if (isNBA) {
      positions = ['PG', 'PG', 'SG', 'SG', 'SF', 'SF', 'PF', 'PF', 'C', 'C', 'G', 'F', 'F', 'C']
      rosterSize = 15
    } else if (isMLB) {
      positions = ['SP', 'SP', 'SP', 'SP', 'SP', 'RP', 'RP', 'RP', 'RP', 'C', 'C', '1B', '2B', '3B', 'SS', 'OF', 'OF', 'OF', 'DH']
      rosterSize = 26
    } else if (isNHL) {
      positions = ['C', 'C', 'C', 'LW', 'LW', 'RW', 'RW', 'D', 'D', 'D', 'D', 'D', 'D', 'G', 'G']
      rosterSize = 23
    }

    const roster = []
    const usedNumbers = new Set<number>()

    for (let i = 0; i < rosterSize; i++) {
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

      roster.push({
        playerName: generateName(),
        name: generateName(),
        position: positions[i % positions.length],
        jerseyNumber: jerseyNum.toString(),
        number: jerseyNum.toString()
      })
    }

    return roster
  }

  // Fetch team roster when team is selected
  useEffect(() => {
    if (!selectedTeam) return

    const fetchRoster = async () => {
      setLoadingRoster(true)
      try {
        const response = await fetch(
          `/api/player-analytics?sport=${sport}&teamName=${encodeURIComponent(selectedTeam)}`
        )
        if (response.ok) {
          const result = await response.json()
          if (result.success && result.data && result.data.players && result.data.players.length > 0) {
            setTeamRoster(result.data.players)
          } else {
            // API returned but no players - generate simulated roster
            setTeamRoster(generateRoster(selectedTeam, sport))
          }
        } else {
          // API failed - generate simulated roster
          setTeamRoster(generateRoster(selectedTeam, sport))
        }
      } catch (err) {
        console.error(`Failed to fetch roster for ${selectedTeam}:`, err)
        // API error - generate simulated roster
        setTeamRoster(generateRoster(selectedTeam, sport))
      } finally {
        setLoadingRoster(false)
      }
    }

    fetchRoster()
  }, [selectedTeam, sport])

  if (loading && !data) return <TabSkeleton cardCount={3} />
  if (error) {
    return (
      <div className="p-6 text-sm text-red-300 bg-red-900/20 border border-red-500/40 rounded-xl">
        <p className="font-semibold mb-1">Data Unavailable</p>
        <p className="opacity-80">Sorry, we are having difficulty accessing the data right now. Please come back later and try again.</p>
      </div>
    )
  }
  if (!data || data.length === 0) {
    return (
      <div className="p-6 text-sm text-gray-300 bg-black/10 border border-white/10 rounded-xl">
        <p>No games available for {sport.toUpperCase()} at this time.</p>
      </div>
    )
  }

  // Generate team statistics based on available game data
  const generateTeamStats = (teamName: string) => {
    // Find all games involving this team
    const teamGames = data.filter(
      game => game.homeTeam === teamName || game.awayTeam === teamName
    )

    // Generate realistic stats
    const wins = 8 + Math.floor(Math.random() * 5)
    const losses = 13 - wins
    const generateForm = () => {
      const winChance = wins > losses ? 0.65 : 0.4
      return Array.from({ length: 5 }, () => Math.random() < winChance ? 'W' : 'L')
    }

    const isNFL = sport === 'americanfootball_nfl'
    const isNBA = sport === 'basketball_nba'
    const isMLB = sport === 'baseball_mlb'
    const isNHL = sport === 'icehockey_nhl'

    return {
      record: `${wins}-${losses}`,
      form: generateForm(),
      stats: isNFL ? {
        pointsPerGame: (20 + Math.random() * 10).toFixed(1),
        pointsAllowed: (18 + Math.random() * 10).toFixed(1),
        totalYards: Math.round(320 + Math.random() * 80),
        turnovers: Math.round(8 + Math.random() * 8),
      } : isNBA ? {
        pointsPerGame: (105 + Math.random() * 15).toFixed(1),
        pointsAllowed: (103 + Math.random() * 15).toFixed(1),
        fieldGoalPct: (43 + Math.random() * 10).toFixed(1),
        reboundsPerGame: (42 + Math.random() * 8).toFixed(1),
      } : isMLB ? {
        runsPerGame: (4 + Math.random() * 2).toFixed(1),
        runsAllowed: (4 + Math.random() * 2).toFixed(1),
        battingAvg: `.${Math.floor(240 + Math.random() * 40)}`,
        era: (3.5 + Math.random() * 1.5).toFixed(2),
      } : {
        goalsPerGame: (2.5 + Math.random() * 1.5).toFixed(1),
        goalsAllowed: (2.5 + Math.random() * 1.5).toFixed(1),
        powerPlayPct: (15 + Math.random() * 10).toFixed(1),
        penaltyKillPct: (75 + Math.random() * 10).toFixed(1),
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

  // Generate comprehensive player stats for betting analysis
  const generatePlayerBettingStats = (player: any) => {
    const isNFL = sport === 'americanfootball_nfl'
    const isNBA = sport === 'basketball_nba'
    const isMLB = sport === 'baseball_mlb'
    const isNHL = sport === 'icehockey_nhl'

    if (isNFL) {
      if (player.position === 'QB') {
        return {
          seasonAvg: {
            passingYards: (240 + Math.random() * 60).toFixed(0),
            touchdowns: (1.8 + Math.random() * 0.8).toFixed(1),
            completionPct: (64 + Math.random() * 6).toFixed(1),
            interceptions: (0.6 + Math.random() * 0.6).toFixed(1),
            qbRating: (85 + Math.random() * 25).toFixed(1),
            yardsPerAttempt: (6.5 + Math.random() * 2).toFixed(1),
          },
          splits: {
            home: { yards: (255 + Math.random() * 50).toFixed(0), tds: (2.1 + Math.random() * 0.6).toFixed(1) },
            away: { yards: (235 + Math.random() * 50).toFixed(0), tds: (1.6 + Math.random() * 0.6).toFixed(1) },
            vsTop10Def: { yards: (220 + Math.random() * 40).toFixed(0), tds: (1.4 + Math.random() * 0.5).toFixed(1) },
            vsBottom10Def: { yards: (275 + Math.random() * 45).toFixed(0), tds: (2.3 + Math.random() * 0.7).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            yards: (200 + Math.random() * 140).toFixed(0),
            tds: Math.floor(Math.random() * 5),
            ints: Math.floor(Math.random() * 3),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over250Yards: `${(48 + Math.random() * 28).toFixed(0)}%`,
            over275Yards: `${(35 + Math.random() * 25).toFixed(0)}%`,
            over300Yards: `${(22 + Math.random() * 18).toFixed(0)}%`,
            over1_5TDs: `${(65 + Math.random() * 22).toFixed(0)}%`,
            over2_5TDs: `${(40 + Math.random() * 25).toFixed(0)}%`,
            anytimeTD: `${(18 + Math.random() * 15).toFixed(0)}%`,
            over0_5Ints: `${(55 + Math.random() * 25).toFixed(0)}%`,
          },
          trends: {
            passingYardsTrend: Math.random() > 0.5 ? '+' : '-',
            tdTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (player.position === 'RB') {
        return {
          seasonAvg: {
            rushingYards: (75 + Math.random() * 45).toFixed(0),
            touchdowns: (0.7 + Math.random() * 0.5).toFixed(1),
            carries: (16 + Math.random() * 7).toFixed(0),
            yardsPerCarry: (4.0 + Math.random() * 1.5).toFixed(1),
            receptions: (2.5 + Math.random() * 2).toFixed(1),
            receivingYards: (18 + Math.random() * 15).toFixed(0),
          },
          splits: {
            home: { yards: (82 + Math.random() * 40).toFixed(0), tds: (0.8 + Math.random() * 0.4).toFixed(1) },
            away: { yards: (68 + Math.random() * 40).toFixed(0), tds: (0.6 + Math.random() * 0.4).toFixed(1) },
            vsTop10Def: { yards: (58 + Math.random() * 30).toFixed(0), tds: (0.5 + Math.random() * 0.3).toFixed(1) },
            vsBottom10Def: { yards: (92 + Math.random() * 45).toFixed(0), tds: (1.0 + Math.random() * 0.5).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            yards: (50 + Math.random() * 110).toFixed(0),
            tds: Math.floor(Math.random() * 4),
            carries: Math.floor(12 + Math.random() * 15),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over50Yards: `${(60 + Math.random() * 25).toFixed(0)}%`,
            over75Yards: `${(45 + Math.random() * 30).toFixed(0)}%`,
            over100Yards: `${(28 + Math.random() * 22).toFixed(0)}%`,
            anytimeTD: `${(45 + Math.random() * 28).toFixed(0)}%`,
            firstTD: `${(15 + Math.random() * 12).toFixed(0)}%`,
          },
          trends: {
            rushingYardsTrend: Math.random() > 0.5 ? '+' : '-',
            tdTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (player.position === 'WR' || player.position === 'TE') {
        return {
          seasonAvg: {
            receptions: (4.5 + Math.random() * 2.5).toFixed(1),
            receivingYards: (58 + Math.random() * 38).toFixed(0),
            touchdowns: (0.5 + Math.random() * 0.5).toFixed(1),
            targets: (6.5 + Math.random() * 3).toFixed(1),
            yardsPerReception: (11 + Math.random() * 4).toFixed(1),
            catchPct: (62 + Math.random() * 12).toFixed(1),
          },
          splits: {
            home: { rec: (4.8 + Math.random() * 2).toFixed(1), yards: (65 + Math.random() * 35).toFixed(0) },
            away: { rec: (4.2 + Math.random() * 2).toFixed(1), yards: (51 + Math.random() * 35).toFixed(0) },
            vsTop10Def: { rec: (3.8 + Math.random() * 1.5).toFixed(1), yards: (48 + Math.random() * 25).toFixed(0) },
            vsBottom10Def: { rec: (5.5 + Math.random() * 2).toFixed(1), yards: (72 + Math.random() * 38).toFixed(0) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            rec: Math.floor(2 + Math.random() * 8),
            yards: (30 + Math.random() * 100).toFixed(0),
            tds: Math.floor(Math.random() * 3),
            targets: Math.floor(4 + Math.random() * 8),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over3_5Receptions: `${(58 + Math.random() * 27).toFixed(0)}%`,
            over4_5Receptions: `${(45 + Math.random() * 28).toFixed(0)}%`,
            over50Yards: `${(52 + Math.random() * 30).toFixed(0)}%`,
            over75Yards: `${(35 + Math.random() * 25).toFixed(0)}%`,
            anytimeTD: `${(35 + Math.random() * 25).toFixed(0)}%`,
            firstTD: `${(12 + Math.random() * 10).toFixed(0)}%`,
          },
          trends: {
            receptionsTrend: Math.random() > 0.5 ? '+' : '-',
            yardsTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (['DL', 'DE', 'DT'].includes(player.position)) {
        // Defensive Line
        return {
          seasonAvg: {
            tackles: (3.2 + Math.random() * 2.5).toFixed(1),
            sacks: (0.6 + Math.random() * 0.8).toFixed(1),
            tacklesForLoss: (0.8 + Math.random() * 0.9).toFixed(1),
            qbHits: (1.2 + Math.random() * 1.5).toFixed(1),
            pressures: (2.5 + Math.random() * 2).toFixed(1),
            forcedFumbles: (0.1 + Math.random() * 0.15).toFixed(2),
          },
          splits: {
            home: { tackles: (3.5 + Math.random() * 2).toFixed(1), sacks: (0.7 + Math.random() * 0.6).toFixed(1) },
            away: { tackles: (2.9 + Math.random() * 2).toFixed(1), sacks: (0.5 + Math.random() * 0.6).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            tackles: Math.floor(1 + Math.random() * 7),
            sacks: (Math.random() * 2).toFixed(1),
            tfl: Math.floor(Math.random() * 3),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over3_5Tackles: `${(55 + Math.random() * 25).toFixed(0)}%`,
            over0_5Sacks: `${(42 + Math.random() * 28).toFixed(0)}%`,
            over1_5TacklesForLoss: `${(38 + Math.random() * 22).toFixed(0)}%`,
          },
          trends: {
            tacklesTrend: Math.random() > 0.5 ? '+' : '-',
            sacksTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (['LB', 'MLB', 'OLB'].includes(player.position)) {
        // Linebackers
        return {
          seasonAvg: {
            tackles: (6.5 + Math.random() * 4).toFixed(1),
            assists: (3.2 + Math.random() * 2.5).toFixed(1),
            sacks: (0.3 + Math.random() * 0.5).toFixed(1),
            tacklesForLoss: (0.6 + Math.random() * 0.7).toFixed(1),
            passDeflections: (0.5 + Math.random() * 0.6).toFixed(1),
            interceptions: (0.1 + Math.random() * 0.2).toFixed(2),
          },
          splits: {
            home: { tackles: (7.2 + Math.random() * 3).toFixed(1), assists: (3.5 + Math.random() * 2).toFixed(1) },
            away: { tackles: (5.8 + Math.random() * 3).toFixed(1), assists: (2.9 + Math.random() * 2).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            tackles: Math.floor(3 + Math.random() * 10),
            assists: Math.floor(1 + Math.random() * 6),
            sacks: (Math.random() * 1.5).toFixed(1),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over6_5Tackles: `${(58 + Math.random() * 27).toFixed(0)}%`,
            over8_5Tackles: `${(42 + Math.random() * 25).toFixed(0)}%`,
            over0_5Sacks: `${(28 + Math.random() * 22).toFixed(0)}%`,
          },
          trends: {
            tacklesTrend: Math.random() > 0.5 ? '+' : '-',
            sacksTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (['DB', 'CB', 'S', 'FS', 'SS'].includes(player.position)) {
        // Defensive Backs
        return {
          seasonAvg: {
            tackles: (4.2 + Math.random() * 3).toFixed(1),
            passDeflections: (0.8 + Math.random() * 0.9).toFixed(1),
            interceptions: (0.2 + Math.random() * 0.3).toFixed(2),
            targetsAllowed: (4.5 + Math.random() * 2.5).toFixed(1),
            completionsAllowed: (2.8 + Math.random() * 1.8).toFixed(1),
            yardsAllowed: (38 + Math.random() * 25).toFixed(0),
          },
          splits: {
            home: { tackles: (4.5 + Math.random() * 2.5).toFixed(1), ints: (0.25 + Math.random() * 0.2).toFixed(2) },
            away: { tackles: (3.9 + Math.random() * 2.5).toFixed(1), ints: (0.15 + Math.random() * 0.2).toFixed(2) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            tackles: Math.floor(2 + Math.random() * 8),
            passDeflections: Math.floor(Math.random() * 3),
            ints: Math.floor(Math.random() * 2),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over3_5Tackles: `${(52 + Math.random() * 28).toFixed(0)}%`,
            over0_5Interceptions: `${(18 + Math.random() * 15).toFixed(0)}%`,
            over1_5PassDeflections: `${(35 + Math.random() * 25).toFixed(0)}%`,
          },
          trends: {
            tacklesTrend: Math.random() > 0.5 ? '+' : '-',
            intsTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (player.position === 'K') {
        // Kicker
        return {
          seasonAvg: {
            fieldGoalPct: (78 + Math.random() * 17).toFixed(1),
            fieldGoalsMade: (1.6 + Math.random() * 0.8).toFixed(1),
            fieldGoalsAttempted: (2.1 + Math.random() * 0.9).toFixed(1),
            extraPointPct: (94 + Math.random() * 5).toFixed(1),
            longFieldGoal: Math.floor(48 + Math.random() * 17),
            pointsScored: (7.5 + Math.random() * 3.5).toFixed(1),
          },
          splits: {
            home: { fgPct: (81 + Math.random() * 14).toFixed(1), long: Math.floor(50 + Math.random() * 15) },
            away: { fgPct: (75 + Math.random() * 14).toFixed(1), long: Math.floor(46 + Math.random() * 15) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            fgMade: Math.floor(Math.random() * 4),
            fgAttempted: Math.floor(1 + Math.random() * 4),
            xpMade: Math.floor(1 + Math.random() * 5),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over1_5FieldGoals: `${(62 + Math.random() * 25).toFixed(0)}%`,
            over7_5Points: `${(58 + Math.random() * 27).toFixed(0)}%`,
            over50YardFG: `${(8 + Math.random() * 12).toFixed(0)}%`,
          },
          trends: {
            fgPctTrend: Math.random() > 0.5 ? '+' : '-',
            pointsTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (player.position === 'P') {
        // Punter
        return {
          seasonAvg: {
            puntsPerGame: (3.8 + Math.random() * 1.5).toFixed(1),
            avgYards: (44 + Math.random() * 6).toFixed(1),
            inside20: (1.2 + Math.random() * 0.8).toFixed(1),
            touchbacks: (0.3 + Math.random() * 0.4).toFixed(1),
            longPunt: Math.floor(58 + Math.random() * 17),
            netAverage: (40 + Math.random() * 5).toFixed(1),
          },
          splits: {
            home: { avgYards: (45 + Math.random() * 5).toFixed(1), inside20: (1.3 + Math.random() * 0.7).toFixed(1) },
            away: { avgYards: (43 + Math.random() * 5).toFixed(1), inside20: (1.1 + Math.random() * 0.7).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            punts: Math.floor(2 + Math.random() * 6),
            avgYards: (40 + Math.random() * 12).toFixed(1),
            inside20: Math.floor(Math.random() * 3),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over45_5Yards: `${(48 + Math.random() * 28).toFixed(0)}%`,
            over1_5Inside20: `${(52 + Math.random() * 25).toFixed(0)}%`,
          },
          trends: {
            avgYardsTrend: Math.random() > 0.5 ? '+' : '-',
            inside20Trend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else if (['OL', 'OT', 'OG', 'C', 'T', 'G'].includes(player.position)) {
        // Offensive Line
        return {
          seasonAvg: {
            pancakes: (2.5 + Math.random() * 2).toFixed(1),
            sacksAllowed: (0.3 + Math.random() * 0.4).toFixed(1),
            qbPressuresAllowed: (1.2 + Math.random() * 1.5).toFixed(1),
            penaltiesPerGame: (0.4 + Math.random() * 0.5).toFixed(1),
            runBlockGrade: (65 + Math.random() * 25).toFixed(1),
            passBlockGrade: (68 + Math.random() * 22).toFixed(1),
          },
          splits: {
            home: { pancakes: (2.8 + Math.random() * 1.8).toFixed(1), sacksAllowed: (0.25 + Math.random() * 0.3).toFixed(2) },
            away: { pancakes: (2.2 + Math.random() * 1.8).toFixed(1), sacksAllowed: (0.35 + Math.random() * 0.3).toFixed(2) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            pancakes: Math.floor(1 + Math.random() * 5),
            sacksAllowed: Math.floor(Math.random() * 2),
            penalties: Math.floor(Math.random() * 2),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over2_5Pancakes: `${(55 + Math.random() * 25).toFixed(0)}%`,
            zeroSacksAllowed: `${(68 + Math.random() * 22).toFixed(0)}%`,
          },
          trends: {
            pancakesTrend: Math.random() > 0.5 ? '+' : '-',
            blockingGradeTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      } else {
        // Generic fallback for any other position
        return {
          seasonAvg: {
            tackles: (4.5 + Math.random() * 3.5).toFixed(1),
            assists: (2.5 + Math.random() * 2).toFixed(1),
            playsPerGame: (35 + Math.random() * 25).toFixed(0)
          },
          splits: {
            home: { tackles: (5 + Math.random() * 3).toFixed(1) },
            away: { tackles: (4 + Math.random() * 3).toFixed(1) }
          },
          last10Games: Array.from({ length: 10 }, () => ({
            tackles: Math.floor(2 + Math.random() * 8),
            plays: Math.floor(25 + Math.random() * 35),
            result: Math.random() > 0.45 ? 'W' : 'L'
          })),
          propHitRates: {
            over4_5Tackles: `${(48 + Math.random() * 28).toFixed(0)}%`,
          },
          trends: {
            tacklesTrend: Math.random() > 0.5 ? '+' : '-',
            streak: Math.floor(1 + Math.random() * 4) + (Math.random() > 0.5 ? 'W' : 'L'),
          }
        }
      }
    } else if (isNBA) {
      return {
        seasonAvg: {
          points: (16 + Math.random() * 14).toFixed(1),
          rebounds: (4.5 + Math.random() * 5.5).toFixed(1),
          assists: (3.2 + Math.random() * 4.8).toFixed(1),
          steals: (0.8 + Math.random() * 0.9).toFixed(1),
          blocks: (0.4 + Math.random() * 1.1).toFixed(1),
          fieldGoalPct: (42 + Math.random() * 13).toFixed(1),
          threePtPct: (33 + Math.random() * 12).toFixed(1),
          freeThrowPct: (75 + Math.random() * 15).toFixed(1),
          minutesPerGame: (26 + Math.random() * 12).toFixed(1),
        },
        splits: {
          home: { pts: (17 + Math.random() * 12).toFixed(1), reb: (5 + Math.random() * 5).toFixed(1), ast: (3.5 + Math.random() * 4).toFixed(1) },
          away: { pts: (15 + Math.random() * 12).toFixed(1), reb: (4 + Math.random() * 5).toFixed(1), ast: (2.9 + Math.random() * 4).toFixed(1) },
          vsTop10Def: { pts: (14 + Math.random() * 10).toFixed(1), efficiency: (42 + Math.random() * 8).toFixed(1) },
          vsBottom10Def: { pts: (19 + Math.random() * 13).toFixed(1), efficiency: (52 + Math.random() * 10).toFixed(1) },
        },
        last10Games: Array.from({ length: 10 }, () => ({
          pts: (10 + Math.random() * 28).toFixed(0),
          reb: Math.floor(2 + Math.random() * 12),
          ast: Math.floor(1 + Math.random() * 10),
          fgPct: (38 + Math.random() * 22).toFixed(1),
          result: Math.random() > 0.45 ? 'W' : 'L'
        })),
        propHitRates: {
          over15Points: `${(55 + Math.random() * 30).toFixed(0)}%`,
          over20Points: `${(42 + Math.random() * 32).toFixed(0)}%`,
          over25Points: `${(28 + Math.random() * 25).toFixed(0)}%`,
          over5Rebounds: `${(58 + Math.random() * 28).toFixed(0)}%`,
          over7Rebounds: `${(40 + Math.random() * 30).toFixed(0)}%`,
          over5Assists: `${(48 + Math.random() * 32).toFixed(0)}%`,
          doubleDouble: `${(25 + Math.random() * 30).toFixed(0)}%`,
          tripleDouble: `${(5 + Math.random() * 10).toFixed(0)}%`,
        },
        trends: {
          pointsTrend: Math.random() > 0.5 ? '+' : '-',
          reboundsTrend: Math.random() > 0.5 ? '+' : '-',
          assistsTrend: Math.random() > 0.5 ? '+' : '-',
          streak: Math.floor(1 + Math.random() * 5) + (Math.random() > 0.5 ? 'W' : 'L'),
        }
      }
    } else if (isMLB) {
      if (player.position === 'SP' || player.position === 'RP') {
        return {
          seasonAvg: {
            era: (3.2 + Math.random() * 2.3).toFixed(2),
            wins: Math.floor(6 + Math.random() * 9),
            strikeouts: (8.5 + Math.random() * 3.5).toFixed(1),
            whip: (1.10 + Math.random() * 0.40).toFixed(2),
            inningsPitched: (5.5 + Math.random() * 2).toFixed(1),
            strikeoutsPer9: (8.2 + Math.random() * 3.8).toFixed(1),
          },
          splits: {
            home: { era: (3.0 + Math.random() * 2).toFixed(2), strikeouts: (8.8 + Math.random() * 3).toFixed(1) },
            away: { era: (3.5 + Math.random() * 2.5).toFixed(2), strikeouts: (8.2 + Math.random() * 3).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            ip: (4.5 + Math.random() * 3).toFixed(1),
            strikeouts: Math.floor(3 + Math.random() * 10),
            earnedRuns: Math.floor(Math.random() * 5),
            result: Math.random() > 0.5 ? 'W' : 'L'
          })),
          propHitRates: {
            over4_5Strikeouts: `${(60 + Math.random() * 25).toFixed(0)}%`,
            over6_5Strikeouts: `${(42 + Math.random() * 28).toFixed(0)}%`,
            under3_5EarnedRuns: `${(55 + Math.random() * 25).toFixed(0)}%`,
          },
          trends: { eraTrend: Math.random() > 0.5 ? '+' : '-', strikeoutTrend: Math.random() > 0.5 ? '+' : '-' }
        }
      } else {
        return {
          seasonAvg: {
            battingAvg: `.${Math.floor(245 + Math.random() * 60)}`,
            homeRuns: (0.6 + Math.random() * 0.8).toFixed(1),
            rbi: (2.2 + Math.random() * 1.8).toFixed(1),
            hits: (1.0 + Math.random() * 0.5).toFixed(1),
            ops: (0.720 + Math.random() * 0.180).toFixed(3),
            sluggingPct: (0.410 + Math.random() * 0.150).toFixed(3),
          },
          splits: {
            home: { avg: `.${Math.floor(255 + Math.random() * 55)}`, ops: (0.750 + Math.random() * 0.150).toFixed(3) },
            away: { avg: `.${Math.floor(235 + Math.random() * 55)}`, ops: (0.690 + Math.random() * 0.150).toFixed(3) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            hits: Math.floor(Math.random() * 4),
            hrs: Math.floor(Math.random() * 2),
            rbi: Math.floor(Math.random() * 4),
            result: Math.random() > 0.5 ? 'W' : 'L'
          })),
          propHitRates: {
            over0_5Hits: `${(70 + Math.random() * 20).toFixed(0)}%`,
            over1_5Hits: `${(35 + Math.random() * 25).toFixed(0)}%`,
            over0_5RBI: `${(45 + Math.random() * 25).toFixed(0)}%`,
            toHitHomeRun: `${(15 + Math.random() * 15).toFixed(0)}%`,
          },
          trends: { battingAvgTrend: Math.random() > 0.5 ? '+' : '-' }
        }
      }
    } else if (isNHL) {
      if (player.position === 'G') {
        return {
          seasonAvg: {
            savePct: (0.905 + Math.random() * 0.030).toFixed(3),
            gaa: (2.45 + Math.random() * 1.10).toFixed(2),
            wins: Math.floor(12 + Math.random() * 18),
            shutouts: Math.floor(Math.random() * 5),
            saves: (25 + Math.random() * 8).toFixed(1),
          },
          splits: {
            home: { savePct: (0.910 + Math.random() * 0.025).toFixed(3), gaa: (2.30 + Math.random() * 1).toFixed(2) },
            away: { savePct: (0.900 + Math.random() * 0.025).toFixed(3), gaa: (2.60 + Math.random() * 1).toFixed(2) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            saves: Math.floor(20 + Math.random() * 20),
            ga: Math.floor(Math.random() * 5),
            savePct: (0.880 + Math.random() * 0.060).toFixed(3),
            result: Math.random() > 0.5 ? 'W' : 'L'
          })),
          propHitRates: {
            over28_5Saves: `${(48 + Math.random() * 30).toFixed(0)}%`,
            under2_5GoalsAgainst: `${(52 + Math.random() * 28).toFixed(0)}%`,
          },
          trends: { savePctTrend: Math.random() > 0.5 ? '+' : '-' }
        }
      } else {
        return {
          seasonAvg: {
            goals: (0.5 + Math.random() * 0.6).toFixed(1),
            assists: (0.7 + Math.random() * 0.8).toFixed(1),
            points: (1.2 + Math.random() * 1.3).toFixed(1),
            plusMinus: (Math.random() > 0.5 ? '+' : '-') + Math.floor(Math.random() * 12),
            shots: (2.4 + Math.random() * 1.6).toFixed(1),
            hits: (1.8 + Math.random() * 1.7).toFixed(1),
          },
          splits: {
            home: { goals: (0.6 + Math.random() * 0.5).toFixed(1), assists: (0.8 + Math.random() * 0.7).toFixed(1) },
            away: { goals: (0.4 + Math.random() * 0.5).toFixed(1), assists: (0.6 + Math.random() * 0.7).toFixed(1) },
          },
          last10Games: Array.from({ length: 10 }, () => ({
            goals: Math.floor(Math.random() * 3),
            assists: Math.floor(Math.random() * 3),
            shots: Math.floor(2 + Math.random() * 6),
            result: Math.random() > 0.5 ? 'W' : 'L'
          })),
          propHitRates: {
            toScoreGoal: `${(35 + Math.random() * 30).toFixed(0)}%`,
            over0_5Points: `${(58 + Math.random() * 27).toFixed(0)}%`,
            over2_5Shots: `${(65 + Math.random() * 25).toFixed(0)}%`,
          },
          trends: { goalsTrend: Math.random() > 0.5 ? '+' : '-', pointsTrend: Math.random() > 0.5 ? '+' : '-' }
        }
      }
    }

    return {
      seasonAvg: {},
      splits: {},
      last10Games: [],
      propHitRates: {},
      trends: {}
    }
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
        const stats = generateTeamStats(selectedTeam)
        return (
          <TeamModal
            team={{
              name: selectedTeam,
              record: stats.record,
              recentForm: stats.form,
              pointsPerGame: stats.stats.pointsPerGame || stats.stats.runsPerGame || stats.stats.goalsPerGame || '0',
              pointsAllowed: stats.stats.pointsAllowed || stats.stats.runsAllowed || stats.stats.goalsAllowed || '0',
              totalYards: stats.stats.totalYards?.toString() || stats.stats.battingAvg || stats.stats.powerPlayPct || 'N/A',
              turnovers: stats.stats.turnovers?.toString() || stats.stats.era || stats.stats.penaltyKillPct || 'N/A'
            }}
            roster={teamRoster}
            loadingRoster={loadingRoster}
            onClose={() => setSelectedTeam(null)}
            onPlayerClick={(player) => setSelectedPlayer(player)}
          />
        )
      })()}

      {/* Player Details Modal - Using v0 component */}
      {selectedPlayer && (
        <PlayerModal
          player={{
            name: selectedPlayer.playerName || selectedPlayer.name || selectedPlayer.displayName,
            position: selectedPlayer.position || 'N/A',
            team: selectedTeam || 'Unknown Team',
            number: selectedPlayer.jerseyNumber || selectedPlayer.number || '0'
          }}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  )
}

