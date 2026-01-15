// Position mapping and abbreviation utilities for all supported sports

export interface PositionMapping {
  [key: string]: string;
}

// Football (NFL) position mappings
export const FOOTBALL_POSITIONS: PositionMapping = {
  // Offensive positions
  'Quarterback': 'QB',
  'Running Back': 'RB',
  'Fullback': 'FB',
  'Halfback': 'HB',
  'Wide Receiver': 'WR',
  'Tight End': 'TE',
  'Center': 'C',
  'Left Guard': 'LG',
  'Right Guard': 'RG',
  'Left Tackle': 'LT',
  'Right Tackle': 'RT',
  'Offensive Tackle': 'OT',
  'Offensive Guard': 'OG',
  
  // Defensive positions
  'Cornerback': 'CB',
  'Defensive End': 'DE',
  'Defensive Tackle': 'DT',
  'Linebacker': 'LB',
  'Middle Linebacker': 'MLB',
  'Inside Linebacker': 'ILB',
  'Outside Linebacker': 'OLB',
  'Nose Tackle': 'NT',
  'Safety': 'S',
  'Free Safety': 'FS',
  'Strong Safety': 'SS',
  
  // Special teams
  'Kicker': 'K',
  'Punter': 'P',
  'Long Snapper': 'LS',
  'Kick Returner': 'KR',
  'Punt Returner': 'PR',
  
  // Common abbreviations (already in correct form)
  'QB': 'QB',
  'RB': 'RB',
  'FB': 'FB',
  'HB': 'HB',
  'WR': 'WR',
  'TE': 'TE',
  'C': 'C',
  'LG': 'LG',
  'RG': 'RG',
  'LT': 'LT',
  'RT': 'RT',
  'OT': 'OT',
  'OG': 'OG',
  'CB': 'CB',
  'DE': 'DE',
  'DT': 'DT',
  'LB': 'LB',
  'MLB': 'MLB',
  'ILB': 'ILB',
  'OLB': 'OLB',
  'NT': 'NT',
  'S': 'S',
  'FS': 'FS',
  'SS': 'SS',
  'K': 'K',
  'P': 'P',
  'LS': 'LS',
  'KR': 'KR',
  'PR': 'PR'
};

// Basketball (NBA) position mappings
export const BASKETBALL_POSITIONS: PositionMapping = {
  'Point Guard': 'PG',
  'Shooting Guard': 'SG',
  'Small Forward': 'SF',
  'Power Forward': 'PF',
  'Center': 'C',
  
  // Common abbreviations
  'PG': 'PG',
  'SG': 'SG',
  'SF': 'SF',
  'PF': 'PF',
  'C': 'C',
  
  // Less common but valid
  'Guard': 'G',
  'Forward': 'F',
  'G': 'G',
  'F': 'F'
};

// Baseball (MLB) position mappings
export const BASEBALL_POSITIONS: PositionMapping = {
  // Field positions
  'Pitcher': 'P',
  'Catcher': 'C',
  'First Baseman': '1B',
  'Second Baseman': '2B',
  'Third Baseman': '3B',
  'Shortstop': 'SS',
  'Left Fielder': 'LF',
  'Center Fielder': 'CF',
  'Right Fielder': 'RF',
  
  // Pitching roles
  'Starting Pitcher': 'SP',
  'Relief Pitcher': 'RP',
  'Closer': 'CL',
  'Designated Hitter': 'DH',
  
  // Common abbreviations
  'P': 'P',
  'C': 'C',
  '1B': '1B',
  '2B': '2B',
  '3B': '3B',
  'SS': 'SS',
  'LF': 'LF',
  'CF': 'CF',
  'RF': 'RF',
  'SP': 'SP',
  'RP': 'RP',
  'CL': 'CL',
  'DH': 'DH',
  
  // Less common
  'Infielder': 'IF',
  'Outfielder': 'OF',
  'IF': 'IF',
  'OF': 'OF'
};

// Hockey (NHL) position mappings
export const HOCKEY_POSITIONS: PositionMapping = {
  // Skater positions
  'Center': 'C',
  'Left Wing': 'LW',
  'Right Wing': 'RW',
  'Left Defenseman': 'LD',
  'Right Defenseman': 'RD',
  'Defenseman': 'D',
  'Goalie': 'G',
  'Goaltender': 'G',
  
  // Common abbreviations
  'C': 'C',
  'LW': 'LW',
  'RW': 'RW',
  'LD': 'LD',
  'RD': 'RD',
  'D': 'D',
  'G': 'G',
  
  // Alternative terms
  'Forward': 'F',
  'Defense': 'D',
  'F': 'F'
};

// Sport-specific position mappings
export const SPORT_POSITIONS = {
  'americanfootball_nfl': FOOTBALL_POSITIONS,
  'basketball_nba': BASKETBALL_POSITIONS,
  'baseball_mlb': BASEBALL_POSITIONS,
  'icehockey_nhl': HOCKEY_POSITIONS,
  
  // Alternative sport keys
  'nfl': FOOTBALL_POSITIONS,
  'nba': BASKETBALL_POSITIONS,
  'mlb': BASEBALL_POSITIONS,
  'nhl': HOCKEY_POSITIONS
} as const;

/**
 * Normalize player position to standard abbreviation
 * @param position - Raw position string from API
 * @param sport - Sport key
 * @returns Standardized position abbreviation
 */
export function normalizePosition(position: string | null | undefined, sport: string): string {
  if (!position) return '';
  
  const cleanPosition = position.trim().toUpperCase();
  
  // Get the appropriate position mapping for the sport
  const positionMap = SPORT_POSITIONS[sport as keyof typeof SPORT_POSITIONS];
  if (!positionMap) {
    console.warn(`No position mapping found for sport: ${sport}`);
    return cleanPosition;
  }
  
  // Try exact match first (case-insensitive)
  const exactMatch = positionMap[cleanPosition];
  if (exactMatch) return exactMatch;
  
  // Try to find partial match (for cases like "Left Guard" when looking for "LG")
  const upperPosition = position.toUpperCase();
  for (const [fullPosition, abbreviation] of Object.entries(positionMap)) {
    if (fullPosition.toUpperCase() === upperPosition) {
      return abbreviation;
    }
  }
  
  // Try to find by checking if the cleaned position contains any known position
  for (const [fullPosition, abbreviation] of Object.entries(positionMap)) {
    if (upperPosition.includes(fullPosition.toUpperCase()) || 
        fullPosition.toUpperCase().includes(upperPosition)) {
      return abbreviation;
    }
  }
  
  // If no match found, return the original cleaned position
  console.warn(`No position match found for "${position}" in sport "${sport}"`);
  return cleanPosition;
}

/**
 * Get all valid positions for a sport
 * @param sport - Sport key
 * @returns Array of valid position abbreviations
 */
export function getValidPositions(sport: string): string[] {
  const positionMap = SPORT_POSITIONS[sport as keyof typeof SPORT_POSITIONS];
  if (!positionMap) return [];
  
  return Object.values(positionMap);
}

/**
 * Check if a position is valid for a sport
 * @param position - Position abbreviation to check
 * @param sport - Sport key
 * @returns True if position is valid
 */
export function isValidPosition(position: string, sport: string): boolean {
  const validPositions = getValidPositions(sport);
  return validPositions.includes(position.toUpperCase());
}
