export const API_CONFIGS = {
  nfl: {
    espn: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
      sport: 'football/nfl'
    },
    official: null,
    rateLimit: 100
  },
  nba: {
    espn: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba',
      sport: 'basketball/nba'
    },
    official: {
      baseUrl: 'https://stats.nba.com/stats',
      endpoints: {
        teamStats: '/leaguedashteamstats',
        playerStats: '/playergeneralstats'
      }
    },
    rateLimit: 50
  },
  mlb: {
    espn: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb',
      sport: 'baseball/mlb'
    },
    official: {
      baseUrl: 'https://statsapi.web.mlb.com/api/v1',
      endpoints: {
        teams: '/teams',
        teamStats: '/teams/{teamId}',
        players: '/teams/{teamId}/roster'
      }
    },
    rateLimit: 100
  },
  nhl: {
    espn: {
      baseUrl: 'https://site.api.espn.com/apis/site/v2/sports/hockey/nhl',
      sport: 'hockey/nhl'
    },
    official: {
      baseUrl: 'https://statsapi.web.nhl.com/api/v1',
      endpoints: {
        teams: '/teams',
        teamStats: '/teams/{teamId}?expand=team.stats',
        players: '/teams/{teamId}/roster'
      }
    },
    rateLimit: 100
  }
};
