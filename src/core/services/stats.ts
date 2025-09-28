import { Game, Player, Team } from '../types';

// Constants
export const BLOWOUT_THRESHOLD = 10; // Can be changed easily
export const CLUTCH_THRESHOLD = 2;
export const OVERTIME_THRESHOLD = 2; // For clutch wins in OT

// Storage key for cached stats
const STATS_STORAGE_KEY = 'bbdl-cached-stats';

// Interfaces for stored stats
export interface StoredPlayerStats {
  playerId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  averagePointsPerGame: number;
  shutouts: number;
  blowoutWins: number;
  clutchWins: number;
  currentStreak: number;
  bestStreak: number;
  lastUpdated: number;
}

export interface StoredTeamStats {
  teamId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  averagePointsPerGame: number;
  shutouts: number;
  blowoutWins: number;
  clutchWins: number;
  currentStreak: number;
  bestStreak: number;
  lastUpdated: number;
}

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
  playerStats: Record<string, StoredPlayerStats>;
  teamStats: Record<string, StoredTeamStats>;
  leagueLeaders: LeagueLeaders;
  lastGameUpdate: number;
}

// Helper function to calculate win percentage
const calculateWinPercentage = (wins: number, losses: number): number => {
  const totalGames = wins + losses;
  return totalGames > 0 ? Math.round((wins / totalGames) * 100 * 100) / 100 : 0;
};

// Helper function to determine if a game is clutch (close win or OT)
const isClutchWin = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winnerId !== teamId) return false;
  
  const team1Score = game.team1Score || 0;
  const team2Score = game.team2Score || 0;
  const scoreDiff = Math.abs(team1Score - team2Score);
  
  // Clutch if won by 2 or less, or if it's marked as overtime (assuming OT games are clutch)
  return scoreDiff <= CLUTCH_THRESHOLD;
};

// Helper function to determine if a game is a blowout
const isBlowoutWin = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winnerId !== teamId) return false;
  
  const team1Score = game.team1Score || 0;
  const team2Score = game.team2Score || 0;
  const scoreDiff = Math.abs(team1Score - team2Score);
  
  return scoreDiff >= BLOWOUT_THRESHOLD;
};

// Helper function to determine if a game is a shutout
const isShutout = (game: Game, teamId: string): boolean => {
  if (game.status !== 'completed' || game.winnerId !== teamId) return false;
  
  const team1Score = game.team1Score || 0;
  const team2Score = game.team2Score || 0;
  
  // Shutout if opponent scored 0
  if (game.team1Id === teamId) {
    return team2Score === 0;
  } else {
    return team1Score === 0;
  }
};

// Calculate streaks for a team/player
const calculateStreaks = (games: Game[], teamId: string): { current: number; best: number } => {
  // Sort games by completion date
  const completedGames = games
    .filter(game => game.status === 'completed' && game.completedDate)
    .sort((a, b) => new Date(a.completedDate!).getTime() - new Date(b.completedDate!).getTime());

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 0;

  for (const game of completedGames) {
    const won = game.winnerId === teamId;
    
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

// Calculate stats for a single player
const calculateSinglePlayerStats = (playerId: string, games: Game[], players: Player[]): StoredPlayerStats => {
  const player = players.find(p => p.id === playerId);
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found`);
  }

  const playerGames = games.filter(game => 
    (game.team1Id === player.teamId || game.team2Id === player.teamId) && 
    game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let shutouts = 0;
  let blowoutWins = 0;
  let clutchWins = 0;

  playerGames.forEach(game => {
    const isTeam1 = game.team1Id === player.teamId;
    const teamScore = isTeam1 ? (game.team1Score || 0) : (game.team2Score || 0);
    const opponentScore = isTeam1 ? (game.team2Score || 0) : (game.team1Score || 0);
    const won = game.winnerId === player.teamId;

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (won) {
      wins++;
      if (isShutout(game, player.teamId)) shutouts++;
      if (isBlowoutWin(game, player.teamId)) blowoutWins++;
      if (isClutchWin(game, player.teamId)) clutchWins++;
    } else {
      losses++;
    }
  });

  const streaks = calculateStreaks(playerGames, player.teamId);
  const gamesPlayed = playerGames.length;

  return {
    playerId,
    gamesPlayed,
    wins,
    losses,
    winPercentage: calculateWinPercentage(wins, losses),
    pointsFor,
    pointsAgainst,
    pointDifferential: pointsFor - pointsAgainst,
    averagePointsPerGame: gamesPlayed > 0 ? Math.round((pointsFor / gamesPlayed) * 100) / 100 : 0,
    shutouts,
    blowoutWins,
    clutchWins,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    lastUpdated: Date.now()
  };
};

// Calculate stats for a single team
const calculateSingleTeamStats = (teamId: string, games: Game[]): StoredTeamStats => {
  const teamGames = games.filter(game => 
    (game.team1Id === teamId || game.team2Id === teamId) && 
    game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;
  let shutouts = 0;
  let blowoutWins = 0;
  let clutchWins = 0;

  teamGames.forEach(game => {
    const isTeam1 = game.team1Id === teamId;
    const teamScore = isTeam1 ? (game.team1Score || 0) : (game.team2Score || 0);
    const opponentScore = isTeam1 ? (game.team2Score || 0) : (game.team1Score || 0);
    const won = game.winnerId === teamId;

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (won) {
      wins++;
      if (isShutout(game, teamId)) shutouts++;
      if (isBlowoutWin(game, teamId)) blowoutWins++;
      if (isClutchWin(game, teamId)) clutchWins++;
    } else {
      losses++;
    }
  });

  const streaks = calculateStreaks(teamGames, teamId);
  const gamesPlayed = teamGames.length;

  return {
    teamId,
    gamesPlayed,
    wins,
    losses,
    winPercentage: calculateWinPercentage(wins, losses),
    pointsFor,
    pointsAgainst,
    pointDifferential: pointsFor - pointsAgainst,
    averagePointsPerGame: gamesPlayed > 0 ? Math.round((pointsFor / gamesPlayed) * 100) / 100 : 0,
    shutouts,
    blowoutWins,
    clutchWins,
    currentStreak: streaks.current,
    bestStreak: streaks.best,
    lastUpdated: Date.now()
  };
};

// Calculate league leaders
const calculateLeagueLeaders = (playerStats: Record<string, StoredPlayerStats>): LeagueLeaders => {
  const players = Object.values(playerStats);
  
  // Helper function for sorting and taking top N players
  // const sortAndTake = (sortFn: (a: StoredPlayerStats, b: StoredPlayerStats) => number, limit = 10) => {
  //   return players
  //     .sort(sortFn)
  //     .slice(0, limit)
  //     .map((stats, index) => ({
  //       playerId: stats.playerId,
  //       value: 0 // Will be set by the specific category
  //     }));
  // };

  const mostWins = players
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.wins }));

  const highestAverage = players
    .filter(stats => stats.gamesPlayed >= 3) // Minimum games for average
    .sort((a, b) => b.averagePointsPerGame - a.averagePointsPerGame)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.averagePointsPerGame }));

  const mostShutouts = players
    .sort((a, b) => b.shutouts - a.shutouts)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.shutouts }));

  const mostBlowouts = players
    .sort((a, b) => b.blowoutWins - a.blowoutWins)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.blowoutWins }));

  const mostClutch = players
    .sort((a, b) => b.clutchWins - a.clutchWins)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.clutchWins }));

  const longestStreak = players
    .sort((a, b) => b.bestStreak - a.bestStreak)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.bestStreak }));

  const bestCurrentStreak = players
    .sort((a, b) => b.currentStreak - a.currentStreak)
    .slice(0, 10)
    .map(stats => ({ playerId: stats.playerId, value: stats.currentStreak }));

  return {
    mostWins,
    highestAverage,
    mostShutouts,
    mostBlowouts,
    mostClutch,
    longestStreak,
    bestCurrentStreak,
    lastUpdated: Date.now()
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
  const completedGames = games.filter(game => game.status === 'completed' && game.completedDate);
  if (completedGames.length === 0) return 0;
  
  return Math.max(...completedGames.map(game => new Date(game.completedDate!).getTime()));
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
        lastUpdated: Date.now()
      };
    }
    
    if (!players || !Array.isArray(players)) {
      console.warn('getLeagueLeaders: Invalid players data, returning empty leaders');
      return {
        mostWins: [],
        highestAverage: [],
        mostShutouts: [],
        mostBlowouts: [],
        mostClutch: [],
        longestStreak: [],
        bestCurrentStreak: [],
        lastUpdated: Date.now()
      };
    }

    const cached = loadCachedStats();
    
    if (cached && !needsRecalculation(games, cached)) {
      return cached.leagueLeaders;
    }
    
    // Recalculate if needed
    recalculateAllStats(games, players, []);
    const newCached = loadCachedStats();
    return newCached?.leagueLeaders || {
      mostWins: [],
      highestAverage: [],
      mostShutouts: [],
      mostBlowouts: [],
      mostClutch: [],
      longestStreak: [],
      bestCurrentStreak: [],
      lastUpdated: Date.now()
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
      lastUpdated: Date.now()
    };
  }
};

/**
 * Get stats for a specific team
 */
export const getTeamStats = (teamId: string, games: Game[]): StoredTeamStats | null => {
  try {
    // Validate input data
    if (!teamId || !games || !Array.isArray(games)) {
      console.warn('getTeamStats: Invalid input data');
      return null;
    }

    const cached = loadCachedStats();
    
    if (cached && !needsRecalculation(games, cached) && cached.teamStats[teamId]) {
      return cached.teamStats[teamId];
    }
    
    // Calculate fresh stats for this team
    return calculateSingleTeamStats(teamId, games);
  } catch (error) {
    console.error('Error in getTeamStats:', error);
    return null;
  }
};

/**
 * Get stats for a specific player
 */
export const getPlayerStats = (playerId: string, games: Game[], players: Player[]): StoredPlayerStats | null => {
  try {
    // Validate input data
    if (!playerId || !games || !Array.isArray(games) || !players || !Array.isArray(players)) {
      console.warn('getPlayerStats: Invalid input data');
      return null;
    }

    const cached = loadCachedStats();
    
    if (cached && !needsRecalculation(games, cached) && cached.playerStats[playerId]) {
      return cached.playerStats[playerId];
    }
    
    // Calculate fresh stats for this player
    return calculateSinglePlayerStats(playerId, games, players);
  } catch (error) {
    console.error('Error in getPlayerStats:', error);
    return null;
  }
};

/**
 * Recalculate all stats and update cache
 */
export const recalculateAllStats = (games: Game[], players: Player[], teams: Team[]): void => {
  try {
    // Validate input data
    if (!games || !Array.isArray(games)) {
      console.warn('recalculateAllStats: Invalid games data, skipping recalculation');
      return;
    }
    
    if (!players || !Array.isArray(players)) {
      console.warn('recalculateAllStats: Invalid players data, skipping recalculation');
      return;
    }
    
    if (!teams || !Array.isArray(teams)) {
      console.warn('recalculateAllStats: Invalid teams data, skipping recalculation');
      return;
    }

    console.log('Recalculating all league stats...');
    
    const playerStats: Record<string, StoredPlayerStats> = {};
    const teamStats: Record<string, StoredTeamStats> = {};
    
    // Calculate stats for all players
    players.forEach(player => {
      try {
        playerStats[player.id] = calculateSinglePlayerStats(player.id, games, players);
      } catch (error) {
        console.error(`Error calculating stats for player ${player.id}:`, error);
      }
    });
    
    // Calculate stats for all teams
    teams.forEach(team => {
      try {
        teamStats[team.id] = calculateSingleTeamStats(team.id, games);
      } catch (error) {
        console.error(`Error calculating stats for team ${team.id}:`, error);
      }
    });
    
    // Calculate league leaders
    const leagueLeaders = calculateLeagueLeaders(playerStats);
    
    // Save to cache
    const cachedStats: CachedStats = {
      playerStats,
      teamStats,
      leagueLeaders,
      lastGameUpdate: getLatestGameTimestamp(games)
    };
    
    saveCachedStats(cachedStats);
    console.log('League stats recalculation complete');
  } catch (error) {
    console.error('Error in recalculateAllStats:', error);
  }
};

/**
 * Clear all cached stats (useful for debugging or data reset)
 */
export const clearStatsCache = (): void => {
  localStorage.removeItem(STATS_STORAGE_KEY);
  console.log('Stats cache cleared');
};

/**
 * Get cached stats info for debugging
 */
export const getStatsCacheInfo = (): { exists: boolean; lastUpdate: number; playerCount: number; teamCount: number } => {
  const cached = loadCachedStats();
  
  if (!cached) {
    return { exists: false, lastUpdate: 0, playerCount: 0, teamCount: 0 };
  }
  
  return {
    exists: true,
    lastUpdate: cached.lastGameUpdate,
    playerCount: Object.keys(cached.playerStats).length,
    teamCount: Object.keys(cached.teamStats).length
  };
};
