import fs from 'fs';
import path from 'path';

// Define the structure for historical odds data
export interface OddsSnapshot {
  timestamp: string;
  moneyline?: {
    home?: number;
    away?: number;
    bookmaker?: string;
  };
  spread?: {
    home: { line: number; odds: number };
    away: { line: number; odds: number };
    bookmaker?: string;
  };
  totals?: {
    over: { line: number; odds: number };
    under: { line: number; odds: number };
    bookmaker?: string;
  };
}

export interface GameOddsHistory {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  sport: string;
  commenceTime: string;
  snapshots: OddsSnapshot[];
}

// Store data in a data directory
const DATA_DIR = path.join(process.cwd(), 'data', 'odds-history');
const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

/**
 * Get the file path for a specific game's history
 */
const getGameHistoryPath = (gameId: string): string => {
  return path.join(DATA_DIR, `${gameId}.json`);
};

/**
 * Store a new odds snapshot for a game
 */
export const storeOddsSnapshot = (
  gameId: string,
  homeTeam: string,
  awayTeam: string,
  sport: string,
  commenceTime: string,
  snapshot: OddsSnapshot
): void => {
  try {
    ensureDataDir();
    const filePath = getGameHistoryPath(gameId);

    let history: GameOddsHistory;

    // Load existing history or create new
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf-8');
      history = JSON.parse(data);
    } else {
      history = {
        gameId,
        homeTeam,
        awayTeam,
        sport,
        commenceTime,
        snapshots: []
      };
    }

    // Add the new snapshot
    history.snapshots.push(snapshot);

    // Write back to file
    fs.writeFileSync(filePath, JSON.stringify(history, null, 2));

    console.log(`📊 Stored odds snapshot for ${gameId} (${history.snapshots.length} total)`);
  } catch (error) {
    console.error(`❌ Error storing odds snapshot for ${gameId}:`, error);
  }
};

/**
 * Get the full odds history for a game
 */
export const getGameOddsHistory = (gameId: string): GameOddsHistory | null => {
  try {
    const filePath = getGameHistoryPath(gameId);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    const data = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`❌ Error reading odds history for ${gameId}:`, error);
    return null;
  }
};

/**
 * Get odds history for multiple games
 */
export const getMultipleGamesHistory = (gameIds: string[]): Record<string, GameOddsHistory> => {
  const histories: Record<string, GameOddsHistory> = {};

  gameIds.forEach(gameId => {
    const history = getGameOddsHistory(gameId);
    if (history) {
      histories[gameId] = history;
    }
  });

  return histories;
};

/**
 * Get all game IDs that have history
 */
export const getAllGameIds = (): string[] => {
  try {
    ensureDataDir();
    const files = fs.readdirSync(DATA_DIR);
    return files
      .filter(f => f.endsWith('.json'))
      .map(f => f.replace('.json', ''));
  } catch (error) {
    console.error('❌ Error reading game IDs:', error);
    return [];
  }
};

/**
 * Clean up old game histories (games that have already started/finished)
 */
export const cleanupOldHistories = (cutoffDate: Date): number => {
  try {
    ensureDataDir();
    const gameIds = getAllGameIds();
    let cleaned = 0;

    gameIds.forEach(gameId => {
      const history = getGameOddsHistory(gameId);
      if (history && new Date(history.commenceTime) < cutoffDate) {
        const filePath = getGameHistoryPath(gameId);
        fs.unlinkSync(filePath);
        cleaned++;
        console.log(`🧹 Cleaned up old history for ${gameId}`);
      }
    });

    return cleaned;
  } catch (error) {
    console.error('❌ Error cleaning up histories:', error);
    return 0;
  }
};
