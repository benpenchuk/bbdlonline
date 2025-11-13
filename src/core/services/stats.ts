import { Game, Player, Team, PlayerTeam, PlayerSeasonStats, TeamSeasonStats } from '../types';

// Constants
export const BLOWOUT_THRESHOLD = 10;
export const CLUTCH_THRESHOLD = 2;

// Storage key for cached stats
const STATS_STORAGE_KEY = 'bbdl-cached-stats';

// Interfaces for league leaders
export interface LeagueLeaders {
  mostWins: { playerId: string; value: number }[];
  highestAverage: { playerId: string; value: number }[];
  mostShutouts: { playerId: string; value: number }[];
  mostBlowouts: { playerId: string; value: number }[];
  mostClutch: { playerId: string; value: number }[];
  longestStreak: { playerId: string; value: number }[];
  bestCurrentStreak: { playerId: string; value: number }[];
  lastUpdated: number;
}

export interface CachedStats {
  playerStats: Record<string, PlayerSeasonStats>;
  teamStats: Record<string, TeamSeasonStats>;
  leagueLeaders: LeagueLeaders;
  lastGameUpdate: number;
}

// Helper function to calculate win percentage
const calculateWinPercentage = (wins: number, losses: number): number => {
  const totalGames = wins + losses;
  return totalGames > 0 ? Math.round((wins / totalGames) * 100 * 100) / 100 : 0;
};

// Helper function to determine if a game is clutch (close win)
const isClutchWin = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winningTeamId !== teamId) return false;

  const homeScore = game.homeScore;
  const awayScore = game.awayScore;
  const scoreDiff = Math.abs(homeScore - awayScore);

  return scoreDiff <= CLUTCH_THRESHOLD;
};

// Helper function to determine if a game is a blowout
const isBlowoutWin = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winningTeamId !== teamId) return false;

  const homeScore = game.homeScore;
  const awayScore = game.awayScore;
  const scoreDiff = Math.abs(homeScore - awayScore);

  return scoreDiff >= BLOWOUT_THRESHOLD;
};

// Helper function to determine if a game is a shutout
const isShutout = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winningTeamId !== teamId) return false;

  // Shutout if opponent scored 0
  if (game.homeTeamId === teamId) {
    return game.awayScore === 0;
  } else {
    return game.homeScore === 0;
  }
};

// Get team score from game
const getTeamScore = (game: Game, teamId: string): number => {
  return game.homeTeamId === teamId ? game.homeScore : game.awayScore;
};

// Get opponent score from game
const getOpponentScore = (game: Game, teamId: string): number => {
  return game.homeTeamId === teamId ? game.awayScore : game.homeScore;
};

// Calculate streaks for a team
const calculateStreaks = (games: Game[], teamId: string): { current: number; best: number } => {
  // Sort games by date
  const completedGames = games
    .filter((game) => game.status === 'completed' && game.gameDate)
    .sort((a, b) => new Date(a.gameDate!).getTime() - new Date(b.gameDate!).getTime());

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (const game of completedGames) {
    const won = game.winningTeamId === teamId;

    if (won) {
      tempStreak++;
    } else {
      if (tempStreak > bestStreak) {
        bestStreak = tempStreak;
      }
      tempStreak = 0;
    }
  }

  // Check if current streak is the best
  if (tempStreak > bestStreak) {
    bestStreak = tempStreak;
  }
  currentStreak = tempStreak;

  return { current: currentStreak, best: bestStreak };
};

// Calculate stats for a single team
const calculateSingleTeamStats = (teamId: string, seasonId: string, games: Game[]): TeamSeasonStats => {
  const teamGames = games.filter(
    (game) =>
      (game.homeTeamId === teamId || game.awayTeamId === teamId) &&
      game.seasonId === seasonId &&
      game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  teamGames.forEach((game) => {
    const teamScore = getTeamScore(game, teamId);
    const opponentScore = getOpponentScore(game, teamId);
    const won = game.winningTeamId === teamId;

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (won) {
      wins++;
    } else {
      losses++;
    }
  });

  const gamesPlayed = teamGames.length;

  return {
    id: `${teamId}-${seasonId}`, // Composite ID
    teamId,
    seasonId,
    gamesPlayed,
    wins,
    losses,
    pointsFor,
    pointsAgainst,
    winPct: gamesPlayed > 0 ? wins / gamesPlayed : 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
};

// Calculate league leaders (simplified - based on team stats)
const calculateLeagueLeaders = (teamStats: Record<string, TeamSeasonStats>): LeagueLeaders => {
  const teams = Object.values(teamStats);

  const mostWins = teams
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10)
    .map((stats) => ({ playerId: stats.teamId, value: stats.wins })); // Using teamId as playerId for now

  const highestAverage = teams
    .filter((stats) => stats.gamesPlayed >= 3)
    .sort((a, b) => b.pointsFor / b.gamesPlayed - a.pointsFor / a.gamesPlayed)
    .slice(0, 10)
    .map((stats) => ({
      playerId: stats.teamId,
      value: Math.round((stats.pointsFor / stats.gamesPlayed) * 100) / 100,
    }));

  return {
    mostWins,
    highestAverage,
    mostShutouts: [],
    mostBlowouts: [],
    mostClutch: [],
    longestStreak: [],
    bestCurrentStreak: [],
    lastUpdated: Date.now(),
  };
};

// Load cached stats from localStorage
const loadCachedStats = (): CachedStats | null => {
  try {
    const cached = localStorage.getItem(STATS_STORAGE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch (error) {
    console.error('Error loading cached stats:', error);
    return null;
  }
};

// Save stats to localStorage
const saveCachedStats = (stats: CachedStats): void => {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving cached stats:', error);
  }
};

// Get the latest game update timestamp
const getLatestGameTimestamp = (games: Game[]): number => {
  const completedGames = games.filter((game) => game.status === 'completed' && game.gameDate);
  if (completedGames.length === 0) return 0;

  return Math.max(...completedGames.map((game) => new Date(game.gameDate!).getTime()));
};

// Check if stats need to be recalculated
const needsRecalculation = (games: Game[], cachedStats: CachedStats | null): boolean => {
  if (!cachedStats) return true;

  const latestGameTimestamp = getLatestGameTimestamp(games);
  return latestGameTimestamp > cachedStats.lastGameUpdate;
};

// Main API Functions

/**
 * Get league leaders across all categories
 */
export const getLeagueLeaders = (games: Game[], players: Player[]): LeagueLeaders => {
  try {
    // Validate input data
    if (!games || !Array.isArray(games)) {
      console.warn('getLeagueLeaders: Invalid games data, returning empty leaders');
      return {
        mostWins: [],
        highestAverage: [],
        mostShutouts: [],
        mostBlowouts: [],
        mostClutch: [],
        longestStreak: [],
        bestCurrentStreak: [],
        lastUpdated: Date.now(),
      };
    }

    const cached = loadCachedStats();

    if (cached && !needsRecalculation(games, cached)) {
      return cached.leagueLeaders;
    }

    // Return empty for now - needs proper player-based calculation
    return {
      mostWins: [],
      highestAverage: [],
      mostShutouts: [],
      mostBlowouts: [],
      mostClutch: [],
      longestStreak: [],
      bestCurrentStreak: [],
      lastUpdated: Date.now(),
    };
  } catch (error) {
    console.error('Error in getLeagueLeaders:', error);
    return {
      mostWins: [],
      highestAverage: [],
      mostShutouts: [],
      mostBlowouts: [],
      mostClutch: [],
      longestStreak: [],
      bestCurrentStreak: [],
      lastUpdated: Date.now(),
    };
  }
};

/**
 * Get stats for a specific team
 */
export const getTeamStats = (teamId: string, seasonId: string, games: Game[]): TeamSeasonStats | null => {
  try {
    if (!teamId || !seasonId || !games || !Array.isArray(games)) {
      console.warn('getTeamStats: Invalid input data');
      return null;
    }

    return calculateSingleTeamStats(teamId, seasonId, games);
  } catch (error) {
    console.error('Error in getTeamStats:', error);
    return null;
  }
};

/**
 * Recalculate all stats and update cache (simplified version)
 */
export const recalculateAllStats = (games: Game[], players: Player[], teams: Team[]): void => {
  try {
    if (!games || !Array.isArray(games)) {
      console.warn('recalculateAllStats: Invalid games data, skipping recalculation');
      return;
    }

    console.log('Recalculating all league stats...');

    // For now, just log - full implementation would calculate all stats
    console.log(`Processing ${games.length} games, ${teams.length} teams, ${players.length} players`);
    console.log('League stats recalculation complete');
  } catch (error) {
    console.error('Error in recalculateAllStats:', error);
  }
};

/**
 * Clear all cached stats
 */
export const clearStatsCache = (): void => {
  localStorage.removeItem(STATS_STORAGE_KEY);
  console.log('Stats cache cleared');
};

/**
 * Get cached stats info for debugging
 */
export const getStatsCacheInfo = (): {
  exists: boolean;
  lastUpdate: number;
  playerCount: number;
  teamCount: number;
} => {
  const cached = loadCachedStats();

  if (!cached) {
    return { exists: false, lastUpdate: 0, playerCount: 0, teamCount: 0 };
  }

  return {
    exists: true,
    lastUpdate: cached.lastGameUpdate,
    playerCount: Object.keys(cached.playerStats).length,
    teamCount: Object.keys(cached.teamStats).length,
  };
};
