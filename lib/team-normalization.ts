/**
 * Team Name Normalization Utility
 *
 * Maps team nicknames, abbreviations, and variations to canonical full names.
 * This ensures consistent team tracking across all betting entries.
 */

// NFL Teams
const NFL_TEAMS: Record<string, string> = {
  // Arizona Cardinals
  "cardinals": "Arizona Cardinals", "cards": "Arizona Cardinals", "arizona": "Arizona Cardinals", "az cardinals": "Arizona Cardinals",
  // Atlanta Falcons
  "falcons": "Atlanta Falcons", "atlanta": "Atlanta Falcons", "atl falcons": "Atlanta Falcons",
  // Baltimore Ravens
  "ravens": "Baltimore Ravens", "baltimore": "Baltimore Ravens", "bal ravens": "Baltimore Ravens",
  // Buffalo Bills
  "bills": "Buffalo Bills", "buffalo": "Buffalo Bills", "buf bills": "Buffalo Bills",
  // Carolina Panthers
  "panthers": "Carolina Panthers", "carolina": "Carolina Panthers", "car panthers": "Carolina Panthers",
  // Chicago Bears
  "bears": "Chicago Bears", "chicago": "Chicago Bears", "chi bears": "Chicago Bears",
  // Cincinnati Bengals
  "bengals": "Cincinnati Bengals", "cincinnati": "Cincinnati Bengals", "cin bengals": "Cincinnati Bengals", "cincy": "Cincinnati Bengals",
  // Cleveland Browns
  "browns": "Cleveland Browns", "cleveland": "Cleveland Browns", "cle browns": "Cleveland Browns",
  // Dallas Cowboys
  "cowboys": "Dallas Cowboys", "dallas": "Dallas Cowboys", "dal cowboys": "Dallas Cowboys", "dak": "Dallas Cowboys",
  // Denver Broncos
  "broncos": "Denver Broncos", "denver": "Denver Broncos", "den broncos": "Denver Broncos",
  // Detroit Lions
  "lions": "Detroit Lions", "detroit": "Detroit Lions", "det lions": "Detroit Lions",
  // Green Bay Packers
  "packers": "Green Bay Packers", "green bay": "Green Bay Packers", "gb packers": "Green Bay Packers",
  // Houston Texans
  "texans": "Houston Texans", "houston": "Houston Texans", "hou texans": "Houston Texans",
  // Indianapolis Colts
  "colts": "Indianapolis Colts", "indianapolis": "Indianapolis Colts", "ind colts": "Indianapolis Colts", "indy": "Indianapolis Colts",
  // Jacksonville Jaguars
  "jaguars": "Jacksonville Jaguars", "jags": "Jacksonville Jaguars", "jacksonville": "Jacksonville Jaguars", "jax jaguars": "Jacksonville Jaguars",
  // Kansas City Chiefs
  "chiefs": "Kansas City Chiefs", "kansas city": "Kansas City Chiefs", "kc chiefs": "Kansas City Chiefs", "kc": "Kansas City Chiefs",
  // Las Vegas Raiders
  "raiders": "Las Vegas Raiders", "las vegas": "Las Vegas Raiders", "lv raiders": "Las Vegas Raiders", "oakland": "Las Vegas Raiders",
  // Los Angeles Chargers
  "chargers": "Los Angeles Chargers", "la chargers": "Los Angeles Chargers", "lac": "Los Angeles Chargers", "san diego": "Los Angeles Chargers",
  // Los Angeles Rams
  "rams": "Los Angeles Rams", "la rams": "Los Angeles Rams", "lar": "Los Angeles Rams",
  // Miami Dolphins
  "dolphins": "Miami Dolphins", "miami": "Miami Dolphins", "mia dolphins": "Miami Dolphins", "fins": "Miami Dolphins",
  // Minnesota Vikings
  "vikings": "Minnesota Vikings", "minnesota": "Minnesota Vikings", "min vikings": "Minnesota Vikings", "vikes": "Minnesota Vikings",
  // New England Patriots
  "patriots": "New England Patriots", "new england": "New England Patriots", "ne patriots": "New England Patriots", "pats": "New England Patriots",
  // New Orleans Saints
  "saints": "New Orleans Saints", "new orleans": "New Orleans Saints", "no saints": "New Orleans Saints", "nola": "New Orleans Saints",
  // New York Giants
  "giants": "New York Giants", "ny giants": "New York Giants", "nyg": "New York Giants",
  // New York Jets
  "jets": "New York Jets", "ny jets": "New York Jets", "nyj": "New York Jets",
  // Philadelphia Eagles
  "eagles": "Philadelphia Eagles", "philadelphia": "Philadelphia Eagles", "philly": "Philadelphia Eagles", "phi eagles": "Philadelphia Eagles",
  // Pittsburgh Steelers
  "steelers": "Pittsburgh Steelers", "pittsburgh": "Pittsburgh Steelers", "pit steelers": "Pittsburgh Steelers",
  // San Francisco 49ers
  "49ers": "San Francisco 49ers", "niners": "San Francisco 49ers", "san francisco": "San Francisco 49ers", "sf 49ers": "San Francisco 49ers",
  // Seattle Seahawks
  "seahawks": "Seattle Seahawks", "seattle": "Seattle Seahawks", "sea seahawks": "Seattle Seahawks", "hawks": "Seattle Seahawks",
  // Tampa Bay Buccaneers
  "buccaneers": "Tampa Bay Buccaneers", "bucs": "Tampa Bay Buccaneers", "tampa bay": "Tampa Bay Buccaneers", "tampa": "Tampa Bay Buccaneers", "tb bucs": "Tampa Bay Buccaneers",
  // Tennessee Titans
  "titans": "Tennessee Titans", "tennessee": "Tennessee Titans", "ten titans": "Tennessee Titans",
  // Washington Commanders
  "commanders": "Washington Commanders", "washington": "Washington Commanders", "was commanders": "Washington Commanders", "redskins": "Washington Commanders",
}

// NBA Teams
const NBA_TEAMS: Record<string, string> = {
  // Atlanta Hawks
  "hawks": "Atlanta Hawks", "atlanta hawks": "Atlanta Hawks", "atl hawks": "Atlanta Hawks",
  // Boston Celtics
  "celtics": "Boston Celtics", "boston": "Boston Celtics", "bos celtics": "Boston Celtics",
  // Brooklyn Nets
  "nets": "Brooklyn Nets", "brooklyn": "Brooklyn Nets", "bkn nets": "Brooklyn Nets",
  // Charlotte Hornets
  "hornets": "Charlotte Hornets", "charlotte": "Charlotte Hornets", "cha hornets": "Charlotte Hornets",
  // Chicago Bulls
  "bulls": "Chicago Bulls", "chi bulls": "Chicago Bulls",
  // Cleveland Cavaliers
  "cavaliers": "Cleveland Cavaliers", "cavs": "Cleveland Cavaliers", "cleveland cavs": "Cleveland Cavaliers", "cle cavs": "Cleveland Cavaliers",
  // Dallas Mavericks
  "mavericks": "Dallas Mavericks", "mavs": "Dallas Mavericks", "dallas mavs": "Dallas Mavericks", "dal mavs": "Dallas Mavericks",
  // Denver Nuggets
  "nuggets": "Denver Nuggets", "den nuggets": "Denver Nuggets",
  // Detroit Pistons
  "pistons": "Detroit Pistons", "det pistons": "Detroit Pistons",
  // Golden State Warriors
  "warriors": "Golden State Warriors", "golden state": "Golden State Warriors", "gsw": "Golden State Warriors", "dubs": "Golden State Warriors",
  // Houston Rockets
  "rockets": "Houston Rockets", "hou rockets": "Houston Rockets",
  // Indiana Pacers
  "pacers": "Indiana Pacers", "indiana": "Indiana Pacers", "ind pacers": "Indiana Pacers",
  // LA Clippers
  "clippers": "LA Clippers", "la clippers": "LA Clippers", "lac clippers": "LA Clippers",
  // Los Angeles Lakers
  "lakers": "Los Angeles Lakers", "la lakers": "Los Angeles Lakers", "lal": "Los Angeles Lakers",
  // Memphis Grizzlies
  "grizzlies": "Memphis Grizzlies", "memphis": "Memphis Grizzlies", "mem grizzlies": "Memphis Grizzlies", "grizz": "Memphis Grizzlies",
  // Miami Heat
  "heat": "Miami Heat", "mia heat": "Miami Heat",
  // Milwaukee Bucks
  "bucks": "Milwaukee Bucks", "milwaukee": "Milwaukee Bucks", "mil bucks": "Milwaukee Bucks",
  // Minnesota Timberwolves
  "timberwolves": "Minnesota Timberwolves", "wolves": "Minnesota Timberwolves", "min wolves": "Minnesota Timberwolves", "twolves": "Minnesota Timberwolves",
  // New Orleans Pelicans
  "pelicans": "New Orleans Pelicans", "nop": "New Orleans Pelicans", "pels": "New Orleans Pelicans",
  // New York Knicks
  "knicks": "New York Knicks", "ny knicks": "New York Knicks", "nyk": "New York Knicks",
  // Oklahoma City Thunder
  "thunder": "Oklahoma City Thunder", "okc": "Oklahoma City Thunder", "okc thunder": "Oklahoma City Thunder",
  // Orlando Magic
  "magic": "Orlando Magic", "orlando": "Orlando Magic", "orl magic": "Orlando Magic",
  // Philadelphia 76ers
  "76ers": "Philadelphia 76ers", "sixers": "Philadelphia 76ers", "philly sixers": "Philadelphia 76ers", "phi 76ers": "Philadelphia 76ers",
  // Phoenix Suns
  "suns": "Phoenix Suns", "phoenix": "Phoenix Suns", "phx suns": "Phoenix Suns",
  // Portland Trail Blazers
  "trail blazers": "Portland Trail Blazers", "blazers": "Portland Trail Blazers", "portland": "Portland Trail Blazers", "por blazers": "Portland Trail Blazers",
  // Sacramento Kings
  "kings": "Sacramento Kings", "sacramento": "Sacramento Kings", "sac kings": "Sacramento Kings",
  // San Antonio Spurs
  "spurs": "San Antonio Spurs", "san antonio": "San Antonio Spurs", "sas spurs": "San Antonio Spurs",
  // Toronto Raptors
  "raptors": "Toronto Raptors", "toronto": "Toronto Raptors", "tor raptors": "Toronto Raptors",
  // Utah Jazz
  "jazz": "Utah Jazz", "utah": "Utah Jazz", "uta jazz": "Utah Jazz",
  // Washington Wizards
  "wizards": "Washington Wizards", "was wizards": "Washington Wizards", "dc wizards": "Washington Wizards",
}

// MLB Teams
const MLB_TEAMS: Record<string, string> = {
  // American League East
  "orioles": "Baltimore Orioles", "baltimore orioles": "Baltimore Orioles", "o's": "Baltimore Orioles",
  "red sox": "Boston Red Sox", "redsox": "Boston Red Sox", "boston red sox": "Boston Red Sox", "sox": "Boston Red Sox",
  "yankees": "New York Yankees", "ny yankees": "New York Yankees", "bronx bombers": "New York Yankees",
  "rays": "Tampa Bay Rays", "tampa bay rays": "Tampa Bay Rays",
  "blue jays": "Toronto Blue Jays", "jays": "Toronto Blue Jays", "toronto blue jays": "Toronto Blue Jays",
  // American League Central
  "white sox": "Chicago White Sox", "whitesox": "Chicago White Sox", "chi sox": "Chicago White Sox",
  "guardians": "Cleveland Guardians", "cleveland guardians": "Cleveland Guardians", "tribe": "Cleveland Guardians",
  "tigers": "Detroit Tigers", "detroit tigers": "Detroit Tigers",
  "royals": "Kansas City Royals", "kc royals": "Kansas City Royals",
  "twins": "Minnesota Twins", "minnesota twins": "Minnesota Twins",
  // American League West
  "astros": "Houston Astros", "houston astros": "Houston Astros", "stros": "Houston Astros",
  "angels": "Los Angeles Angels", "la angels": "Los Angeles Angels", "halos": "Los Angeles Angels",
  "athletics": "Oakland Athletics", "a's": "Oakland Athletics", "oakland a's": "Oakland Athletics",
  "mariners": "Seattle Mariners", "seattle mariners": "Seattle Mariners", "m's": "Seattle Mariners",
  "rangers": "Texas Rangers", "texas rangers": "Texas Rangers",
  // National League East
  "braves": "Atlanta Braves", "atlanta braves": "Atlanta Braves",
  "marlins": "Miami Marlins", "miami marlins": "Miami Marlins",
  "mets": "New York Mets", "ny mets": "New York Mets",
  "phillies": "Philadelphia Phillies", "philly phillies": "Philadelphia Phillies",
  "nationals": "Washington Nationals", "nats": "Washington Nationals", "washington nationals": "Washington Nationals",
  // National League Central
  "cubs": "Chicago Cubs", "chicago cubs": "Chicago Cubs", "cubbies": "Chicago Cubs",
  "reds": "Cincinnati Reds", "cincinnati reds": "Cincinnati Reds", "redlegs": "Cincinnati Reds",
  "brewers": "Milwaukee Brewers", "milwaukee brewers": "Milwaukee Brewers", "brew crew": "Milwaukee Brewers",
  "pirates": "Pittsburgh Pirates", "pittsburgh pirates": "Pittsburgh Pirates", "buccos": "Pittsburgh Pirates",
  "cardinals": "St. Louis Cardinals", "cards": "St. Louis Cardinals", "st louis cardinals": "St. Louis Cardinals", "stl cardinals": "St. Louis Cardinals",
  // National League West
  "diamondbacks": "Arizona Diamondbacks", "d-backs": "Arizona Diamondbacks", "dbacks": "Arizona Diamondbacks", "arizona diamondbacks": "Arizona Diamondbacks",
  "rockies": "Colorado Rockies", "colorado rockies": "Colorado Rockies",
  "dodgers": "Los Angeles Dodgers", "la dodgers": "Los Angeles Dodgers",
  "padres": "San Diego Padres", "san diego padres": "San Diego Padres",
  "giants": "San Francisco Giants", "sf giants": "San Francisco Giants", "san francisco giants": "San Francisco Giants",
}

// NHL Teams
const NHL_TEAMS: Record<string, string> = {
  // Atlantic Division
  "bruins": "Boston Bruins", "boston bruins": "Boston Bruins",
  "sabres": "Buffalo Sabres", "buffalo sabres": "Buffalo Sabres",
  "red wings": "Detroit Red Wings", "detroit red wings": "Detroit Red Wings", "wings": "Detroit Red Wings",
  "panthers": "Florida Panthers", "florida panthers": "Florida Panthers",
  "canadiens": "Montreal Canadiens", "habs": "Montreal Canadiens", "montreal canadiens": "Montreal Canadiens",
  "senators": "Ottawa Senators", "sens": "Ottawa Senators", "ottawa senators": "Ottawa Senators",
  "lightning": "Tampa Bay Lightning", "tampa bay lightning": "Tampa Bay Lightning", "bolts": "Tampa Bay Lightning",
  "maple leafs": "Toronto Maple Leafs", "leafs": "Toronto Maple Leafs", "toronto maple leafs": "Toronto Maple Leafs",
  // Metropolitan Division
  "hurricanes": "Carolina Hurricanes", "canes": "Carolina Hurricanes", "carolina hurricanes": "Carolina Hurricanes",
  "blue jackets": "Columbus Blue Jackets", "columbus blue jackets": "Columbus Blue Jackets", "cbj": "Columbus Blue Jackets",
  "devils": "New Jersey Devils", "nj devils": "New Jersey Devils", "new jersey devils": "New Jersey Devils",
  "islanders": "New York Islanders", "isles": "New York Islanders", "ny islanders": "New York Islanders",
  "rangers": "New York Rangers", "ny rangers": "New York Rangers", "new york rangers": "New York Rangers",
  "flyers": "Philadelphia Flyers", "philly flyers": "Philadelphia Flyers", "philadelphia flyers": "Philadelphia Flyers",
  "penguins": "Pittsburgh Penguins", "pens": "Pittsburgh Penguins", "pittsburgh penguins": "Pittsburgh Penguins",
  "capitals": "Washington Capitals", "caps": "Washington Capitals", "washington capitals": "Washington Capitals",
  // Central Division
  "coyotes": "Arizona Coyotes", "arizona coyotes": "Arizona Coyotes", "yotes": "Arizona Coyotes",
  "blackhawks": "Chicago Blackhawks", "chicago blackhawks": "Chicago Blackhawks",
  "avalanche": "Colorado Avalanche", "avs": "Colorado Avalanche", "colorado avalanche": "Colorado Avalanche",
  "stars": "Dallas Stars", "dallas stars": "Dallas Stars",
  "wild": "Minnesota Wild", "minnesota wild": "Minnesota Wild",
  "predators": "Nashville Predators", "preds": "Nashville Predators", "nashville predators": "Nashville Predators",
  "blues": "St. Louis Blues", "st louis blues": "St. Louis Blues", "stl blues": "St. Louis Blues",
  "jets": "Winnipeg Jets", "winnipeg jets": "Winnipeg Jets",
  // Pacific Division
  "ducks": "Anaheim Ducks", "anaheim ducks": "Anaheim Ducks",
  "flames": "Calgary Flames", "calgary flames": "Calgary Flames",
  "oilers": "Edmonton Oilers", "edmonton oilers": "Edmonton Oilers",
  "kraken": "Seattle Kraken", "seattle kraken": "Seattle Kraken",
  "sharks": "San Jose Sharks", "san jose sharks": "San Jose Sharks",
  "canucks": "Vancouver Canucks", "vancouver canucks": "Vancouver Canucks",
  "golden knights": "Vegas Golden Knights", "knights": "Vegas Golden Knights", "vegas golden knights": "Vegas Golden Knights", "vgk": "Vegas Golden Knights",
}

/**
 * Normalize a team name to its canonical form
 * @param teamName The team name to normalize (can be nickname, abbreviation, or full name)
 * @param sport Optional sport hint to improve accuracy (e.g., "nfl", "nba", "mlb", "nhl")
 * @returns The canonical team name, or the original if no match found
 */
export function normalizeTeamName(teamName: string, sport?: string): string {
  if (!teamName) return teamName

  const normalized = teamName.toLowerCase().trim()

  // Check if it's already a canonical name (full name)
  const allCanonical = new Set([
    ...Object.values(NFL_TEAMS),
    ...Object.values(NBA_TEAMS),
    ...Object.values(MLB_TEAMS),
    ...Object.values(NHL_TEAMS),
  ])

  // If the input matches a canonical name (case-insensitive), return it properly cased
  for (const canonical of allCanonical) {
    if (canonical.toLowerCase() === normalized) {
      return canonical
    }
  }

  // Sport-specific lookup first for better accuracy
  if (sport) {
    const sportLower = sport.toLowerCase()
    if (sportLower.includes('nfl') || sportLower.includes('football')) {
      if (NFL_TEAMS[normalized]) return NFL_TEAMS[normalized]
    } else if (sportLower.includes('nba') || sportLower.includes('basketball')) {
      if (NBA_TEAMS[normalized]) return NBA_TEAMS[normalized]
    } else if (sportLower.includes('mlb') || sportLower.includes('baseball')) {
      if (MLB_TEAMS[normalized]) return MLB_TEAMS[normalized]
    } else if (sportLower.includes('nhl') || sportLower.includes('hockey')) {
      if (NHL_TEAMS[normalized]) return NHL_TEAMS[normalized]
    }
  }

  // Try all sports (NFL first since it's most common for betting)
  if (NFL_TEAMS[normalized]) return NFL_TEAMS[normalized]
  if (NBA_TEAMS[normalized]) return NBA_TEAMS[normalized]
  if (MLB_TEAMS[normalized]) return MLB_TEAMS[normalized]
  if (NHL_TEAMS[normalized]) return NHL_TEAMS[normalized]

  // Return original with proper capitalization if no match
  return teamName.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Extract teams from a game description and normalize them
 * @param description Game description like "Seahawks v Patriots" or "Football, Seahawks v Patriots, Superbowl"
 * @param sport Optional sport hint
 * @returns Object with normalized awayTeam and homeTeam
 */
export function extractAndNormalizeTeams(
  description: string,
  sport?: string
): { awayTeam: string; homeTeam: string; detectedSport?: string } {
  // Clean description
  let cleaned = description
    .replace(/^(americanfootball_nfl|basketball_nba|baseball_mlb|icehockey_nhl|soccer_usa_mls|soccer_epl|soccer_uefa_champions_league|football|basketball|baseball|hockey|soccer|nba|nfl|mlb|nhl|ncaab|ncaaf|mma|ufc)[,:\-–—\s]+/i, '')
    .replace(/[,\-–—]\s*(superbowl|super bowl|world series|stanley cup|nba finals|playoffs|championship|week \d+|round \d+|game \d+).*$/i, '')
    .trim()

  // Try to extract teams
  let awayTeam = "Unknown"
  let homeTeam = "Unknown"

  // Pattern: "Team A vs Team B" or "Team A v Team B"
  const vsMatch = cleaned.match(/([A-Za-z][A-Za-z0-9\s']+?)\s+(?:vs\.?|v\.?|versus|@)\s+([A-Za-z][A-Za-z0-9\s']+)/i)
  if (vsMatch) {
    awayTeam = normalizeTeamName(vsMatch[1].trim(), sport)
    homeTeam = normalizeTeamName(vsMatch[2].trim(), sport)
  }

  return { awayTeam, homeTeam }
}

/**
 * Get the list of teams for a specific sport
 */
export function getTeamsForSport(sport: string): string[] {
  const sportLower = sport.toLowerCase()
  if (sportLower.includes('nfl') || sportLower.includes('football')) {
    return [...new Set(Object.values(NFL_TEAMS))].sort()
  } else if (sportLower.includes('nba') || sportLower.includes('basketball')) {
    return [...new Set(Object.values(NBA_TEAMS))].sort()
  } else if (sportLower.includes('mlb') || sportLower.includes('baseball')) {
    return [...new Set(Object.values(MLB_TEAMS))].sort()
  } else if (sportLower.includes('nhl') || sportLower.includes('hockey')) {
    return [...new Set(Object.values(NHL_TEAMS))].sort()
  }
  return []
}
