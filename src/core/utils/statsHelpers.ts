import { Game, Player, Team, PlayerTeam, PlayerGameStats } from '../types';

// =====================================================
// TYPES FOR COMPUTED STATS
// =====================================================

export interface ComputedPlayerStats {
  playerId: string;
  playerName: string;
  playerSlug: string;
  avatarUrl?: string;
  teamIds: string[];
  teamNames: string[];
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  totalCups: number;
  cupsPerGame: number;
  totalThrows: number;
  accuracy: number;
  currentStreak: { type: 'W' | 'L' | null; length: number };
  heat: number; // avg cups per game over last 5 games
}

export interface ComputedTeamStats {
  teamId: string;
  teamName: string;
  teamSlug: string;
  logoUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  cupsFor: number;
  cupsAgainst: number;
  cupDifferential: number;
  currentStreak: { type: 'W' | 'L' | null; length: number };
}

export interface SeasonLeaders {
  topScorer: { player: Player; cups: number } | null;
  mostAccurate: { player: Player; accuracy: number; minGames: number } | null;
  topTeam: { team: Team; winPct: number; record: string } | null;
}

export interface PlayerGameLog {
  gameId: string;
  date: Date | null;
  opponentTeamId: string;
  opponentName: string;
  partnerId: string | null;
  partnerName: string | null;
  result: 'W' | 'L';
  score: string;
  cupsHit: number;
  throws: number;
  accuracy: number;
}

export interface PartnerChemistry {
  partnerId: string;
  partnerName: string;
  partnerSlug: string;
  avatarUrl?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPct: number;
  totalCups: number;
  avgCupsPerGame: number;
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

/**
 * Get all games for a specific season
 */
export const getSeasonGames = (games: Game[], seasonId: string): Game[] => {
  return games.filter(game => game.seasonId === seasonId && game.status === 'completed');
};

/**
 * Get player's team(s) for a season
 */
export const getPlayerTeamsForSeason = (
  playerId: string,
  seasonId: string,
  playerTeams: PlayerTeam[]
): string[] => {
  return playerTeams
    .filter(pt => pt.playerId === playerId && pt.seasonId === seasonId && pt.status === 'active')
    .map(pt => pt.teamId);
};

/**
 * Calculate streak for a player or team
 */
const calculateStreak = (
  results: { date: Date | null; won: boolean }[]
): { type: 'W' | 'L' | null; length: number } => {
  if (results.length === 0) return { type: null, length: 0 };

  // Sort by date descending (most recent first)
  const sorted = [...results].sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });

  const firstResult = sorted[0].won;
  let streak = 0;

  for (const result of sorted) {
    if (result.won === firstResult) {
      streak++;
    } else {
      break;
    }
  }

  return { type: firstResult ? 'W' : 'L', length: streak };
};

/**
 * Get full player name
 */
export const getFullName = (player: Player): string => {
  return `${player.firstName} ${player.lastName}`;
};

// =====================================================
// PLAYER STATS COMPUTATION
// =====================================================

/**
 * Compute comprehensive stats for a single player in a season
 */
export const computePlayerSeasonStats = (
  playerId: string,
  seasonId: string,
  games: Game[],
  playerGameStats: PlayerGameStats[],
  playerTeams: PlayerTeam[],
  players: Player[],
  teams: Team[]
): ComputedPlayerStats | null => {
  const player = players.find(p => p.id === playerId);
  if (!player) return null;

  const seasonGames = getSeasonGames(games, seasonId);
  const playerTeamIds = getPlayerTeamsForSeason(playerId, seasonId, playerTeams);
  
  // Get player's game stats for this season
  const playerStats = playerGameStats.filter(
    pgs => pgs.playerId === playerId && pgs.seasonId === seasonId
  );

  if (playerStats.length === 0 && playerTeamIds.length === 0) {
    // Player has no data for this season
    const teamNames = playerTeamIds.map(tid => teams.find(t => t.id === tid)?.name || 'Unknown');
    return {
      playerId,
      playerName: getFullName(player),
      playerSlug: player.slug,
      avatarUrl: player.avatarUrl,
      teamIds: playerTeamIds,
      teamNames,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      winPct: 0,
      totalCups: 0,
      cupsPerGame: 0,
      totalThrows: 0,
      accuracy: 0,
      currentStreak: { type: null, length: 0 },
      heat: 0,
    };
  }

  // Calculate stats from playerGameStats
  let totalCups = 0;
  let totalThrowsMade = 0;
  let totalThrowsMissed = 0;
  let wins = 0;
  let losses = 0;
  const gameResults: { date: Date | null; won: boolean }[] = [];

  playerStats.forEach(pgs => {
    const game = seasonGames.find(g => g.id === pgs.gameId);
    totalCups += pgs.cupsHit || 0;
    // Note: In the schema, tableHits seems to map to throws_made in DB
    // Using the available fields
    totalThrowsMade += (pgs as any).throwsMade || (pgs as any).tableHits || 0;
    totalThrowsMissed += pgs.throwsMissed || 0;
    
    if (pgs.isWinner) {
      wins++;
    } else {
      losses++;
    }

    if (game) {
      gameResults.push({
        date: game.gameDate || null,
        won: pgs.isWinner,
      });
    }
  });

  // If no playerGameStats, try to derive from team games
  if (playerStats.length === 0 && playerTeamIds.length > 0) {
    seasonGames.forEach(game => {
      const isOnTeam = playerTeamIds.includes(game.homeTeamId) || playerTeamIds.includes(game.awayTeamId);
      if (isOnTeam) {
        const playerTeamId = playerTeamIds.find(tid => tid === game.homeTeamId || tid === game.awayTeamId);
        const won = game.winningTeamId === playerTeamId;
        if (won) wins++;
        else losses++;
        gameResults.push({ date: game.gameDate || null, won });
      }
    });
  }

  const gamesPlayed = playerStats.length > 0 ? playerStats.length : wins + losses;
  const totalThrows = totalThrowsMade + totalThrowsMissed;
  
  // Calculate heat (last 5 games average cups)
  const recentStats = [...playerStats]
    .sort((a, b) => {
      const gameA = seasonGames.find(g => g.id === a.gameId);
      const gameB = seasonGames.find(g => g.id === b.gameId);
      const dateA = gameA?.gameDate ? new Date(gameA.gameDate).getTime() : 0;
      const dateB = gameB?.gameDate ? new Date(gameB.gameDate).getTime() : 0;
      return dateB - dateA;
    })
    .slice(0, 5);
  
  const heat = recentStats.length > 0
    ? recentStats.reduce((sum, pgs) => sum + (pgs.cupsHit || 0), 0) / recentStats.length
    : 0;

  const teamNames = playerTeamIds.map(tid => teams.find(t => t.id === tid)?.name || 'Unknown');

  return {
    playerId,
    playerName: getFullName(player),
    playerSlug: player.slug,
    avatarUrl: player.avatarUrl,
    teamIds: playerTeamIds,
    teamNames,
    gamesPlayed,
    wins,
    losses,
    winPct: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
    totalCups,
    cupsPerGame: gamesPlayed > 0 ? totalCups / gamesPlayed : 0,
    totalThrows,
    accuracy: totalThrows > 0 ? (totalThrowsMade / totalThrows) * 100 : 0,
    currentStreak: calculateStreak(gameResults),
    heat,
  };
};

/**
 * Compute stats for all players in a season
 */
export const computeAllPlayerStats = (
  seasonId: string,
  games: Game[],
  playerGameStats: PlayerGameStats[],
  playerTeams: PlayerTeam[],
  players: Player[],
  teams: Team[]
): ComputedPlayerStats[] => {
  // Get all players who have playerTeams entries for this season OR have game stats
  const playerIdsWithTeams = new Set(
    playerTeams
      .filter(pt => pt.seasonId === seasonId)
      .map(pt => pt.playerId)
  );
  
  const playerIdsWithStats = new Set(
    playerGameStats
      .filter(pgs => pgs.seasonId === seasonId)
      .map(pgs => pgs.playerId)
  );

  const allPlayerIds = new Set([...Array.from(playerIdsWithTeams), ...Array.from(playerIdsWithStats)]);

  const stats: ComputedPlayerStats[] = [];
  
  allPlayerIds.forEach(playerId => {
    const playerStats = computePlayerSeasonStats(
      playerId,
      seasonId,
      games,
      playerGameStats,
      playerTeams,
      players,
      teams
    );
    if (playerStats && playerStats.gamesPlayed > 0) {
      stats.push(playerStats);
    }
  });

  return stats;
};

// =====================================================
// TEAM STATS COMPUTATION
// =====================================================

/**
 * Compute comprehensive stats for a single team in a season
 */
export const computeTeamSeasonStats = (
  teamId: string,
  seasonId: string,
  games: Game[],
  teams: Team[]
): ComputedTeamStats | null => {
  const team = teams.find(t => t.id === teamId);
  if (!team) return null;

  const seasonGames = getSeasonGames(games, seasonId);
  const teamGames = seasonGames.filter(
    game => game.homeTeamId === teamId || game.awayTeamId === teamId
  );

  let wins = 0;
  let losses = 0;
  let cupsFor = 0;
  let cupsAgainst = 0;
  const gameResults: { date: Date | null; won: boolean }[] = [];

  teamGames.forEach(game => {
    const isHome = game.homeTeamId === teamId;
    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    const won = game.winningTeamId === teamId;

    cupsFor += teamScore;
    cupsAgainst += opponentScore;
    
    if (won) {
      wins++;
    } else {
      losses++;
    }

    gameResults.push({
      date: game.gameDate || null,
      won,
    });
  });

  const gamesPlayed = teamGames.length;

  return {
    teamId,
    teamName: team.name,
    teamSlug: team.slug,
    logoUrl: team.logoUrl,
    gamesPlayed,
    wins,
    losses,
    winPct: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
    cupsFor,
    cupsAgainst,
    cupDifferential: cupsFor - cupsAgainst,
    currentStreak: calculateStreak(gameResults),
  };
};

/**
 * Compute stats for all teams in a season
 */
export const computeAllTeamStats = (
  seasonId: string,
  games: Game[],
  teams: Team[]
): ComputedTeamStats[] => {
  const stats: ComputedTeamStats[] = [];

  teams.forEach(team => {
    const teamStats = computeTeamSeasonStats(team.id, seasonId, games, teams);
    if (teamStats && teamStats.gamesPlayed > 0) {
      stats.push(teamStats);
    }
  });

  return stats;
};

// =====================================================
// SEASON LEADERS
// =====================================================

/**
 * Get season leaders for hero cards
 */
export const getSeasonLeaders = (
  seasonId: string,
  games: Game[],
  playerGameStats: PlayerGameStats[],
  playerTeams: PlayerTeam[],
  players: Player[],
  teams: Team[]
): SeasonLeaders => {
  const allPlayerStats = computeAllPlayerStats(
    seasonId,
    games,
    playerGameStats,
    playerTeams,
    players,
    teams
  );

  const allTeamStats = computeAllTeamStats(seasonId, games, teams);

  // Top Scorer - most total cups
  let topScorer: SeasonLeaders['topScorer'] = null;
  const sortedByCoups = [...allPlayerStats].sort((a, b) => b.totalCups - a.totalCups);
  if (sortedByCoups.length > 0 && sortedByCoups[0].totalCups > 0) {
    const topPlayer = players.find(p => p.id === sortedByCoups[0].playerId);
    if (topPlayer) {
      topScorer = { player: topPlayer, cups: sortedByCoups[0].totalCups };
    }
  }

  // Most Accurate - highest accuracy with minimum 3 games
  let mostAccurate: SeasonLeaders['mostAccurate'] = null;
  const MIN_GAMES_FOR_ACCURACY = 3;
  const eligibleForAccuracy = allPlayerStats.filter(
    ps => ps.gamesPlayed >= MIN_GAMES_FOR_ACCURACY && ps.totalThrows > 0
  );
  const sortedByAccuracy = [...eligibleForAccuracy].sort((a, b) => b.accuracy - a.accuracy);
  if (sortedByAccuracy.length > 0) {
    const topAccuratePlayer = players.find(p => p.id === sortedByAccuracy[0].playerId);
    if (topAccuratePlayer) {
      mostAccurate = {
        player: topAccuratePlayer,
        accuracy: sortedByAccuracy[0].accuracy,
        minGames: MIN_GAMES_FOR_ACCURACY,
      };
    }
  }

  // Top Team - best win percentage
  let topTeam: SeasonLeaders['topTeam'] = null;
  const sortedByWinPct = [...allTeamStats].sort((a, b) => b.winPct - a.winPct);
  if (sortedByWinPct.length > 0 && sortedByWinPct[0].gamesPlayed > 0) {
    const bestTeam = teams.find(t => t.id === sortedByWinPct[0].teamId);
    if (bestTeam) {
      topTeam = {
        team: bestTeam,
        winPct: sortedByWinPct[0].winPct,
        record: `${sortedByWinPct[0].wins}-${sortedByWinPct[0].losses}`,
      };
    }
  }

  return { topScorer, mostAccurate, topTeam };
};

// =====================================================
// PLAYER DETAIL PAGE HELPERS
// =====================================================

/**
 * Get game log for a player in a season
 */
export const getPlayerGameLog = (
  playerId: string,
  seasonId: string,
  games: Game[],
  playerGameStats: PlayerGameStats[],
  playerTeams: PlayerTeam[],
  players: Player[],
  teams: Team[]
): PlayerGameLog[] => {
  const seasonGames = getSeasonGames(games, seasonId);
  const playerStats = playerGameStats.filter(
    pgs => pgs.playerId === playerId && pgs.seasonId === seasonId
  );

  const gameLog: PlayerGameLog[] = [];

  playerStats.forEach(pgs => {
    const game = seasonGames.find(g => g.id === pgs.gameId);
    if (!game) return;

    const playerTeamId = pgs.teamId;
    const isHome = game.homeTeamId === playerTeamId;
    const opponentTeamId = isHome ? game.awayTeamId : game.homeTeamId;
    const opponentTeam = teams.find(t => t.id === opponentTeamId);
    
    // Find partner - other player on same team in same game
    const partnerStats = playerStats.length > 0 
      ? playerGameStats.find(
          ps => ps.gameId === game.id && 
                ps.teamId === playerTeamId && 
                ps.playerId !== playerId
        )
      : null;
    
    // Alternative: find partner from playerTeams
    let partner: Player | null = null;
    if (partnerStats) {
      partner = players.find(p => p.id === partnerStats.playerId) || null;
    } else {
      // Try to find from playerTeams
      const teammates = playerTeams.filter(
        pt => pt.teamId === playerTeamId && 
              pt.seasonId === seasonId && 
              pt.playerId !== playerId &&
              pt.status === 'active'
      );
      if (teammates.length > 0) {
        partner = players.find(p => p.id === teammates[0].playerId) || null;
      }
    }

    const teamScore = isHome ? game.homeScore : game.awayScore;
    const opponentScore = isHome ? game.awayScore : game.homeScore;
    const throwsMade = (pgs as any).throwsMade || (pgs as any).tableHits || 0;
    const totalThrows = throwsMade + (pgs.throwsMissed || 0);

    gameLog.push({
      gameId: game.id,
      date: game.gameDate || null,
      opponentTeamId,
      opponentName: opponentTeam?.name || 'Unknown',
      partnerId: partner?.id || null,
      partnerName: partner ? getFullName(partner) : null,
      result: pgs.isWinner ? 'W' : 'L',
      score: `${teamScore}-${opponentScore}`,
      cupsHit: pgs.cupsHit || 0,
      throws: totalThrows,
      accuracy: totalThrows > 0 ? (throwsMade / totalThrows) * 100 : 0,
    });
  });

  // Sort by date descending
  return gameLog.sort((a, b) => {
    const dateA = a.date ? new Date(a.date).getTime() : 0;
    const dateB = b.date ? new Date(b.date).getTime() : 0;
    return dateB - dateA;
  });
};

/**
 * Compute partner chemistry stats for a player
 */
export const computePartnerChemistry = (
  playerId: string,
  seasonId: string,
  games: Game[],
  playerGameStats: PlayerGameStats[],
  playerTeams: PlayerTeam[],
  players: Player[]
): PartnerChemistry[] => {
  const seasonGames = getSeasonGames(games, seasonId);
  const playerStats = playerGameStats.filter(
    pgs => pgs.playerId === playerId && pgs.seasonId === seasonId
  );

  // Group by partner
  const partnerMap = new Map<string, {
    gamesPlayed: number;
    wins: number;
    losses: number;
    totalCups: number;
  }>();

  playerStats.forEach(pgs => {
    const game = seasonGames.find(g => g.id === pgs.gameId);
    if (!game) return;

    // Find partner in same game and team
    const partnerStat = playerGameStats.find(
      ps => ps.gameId === game.id && 
            ps.teamId === pgs.teamId && 
            ps.playerId !== playerId
    );

    if (partnerStat) {
      const partnerId = partnerStat.playerId;
      const existing = partnerMap.get(partnerId) || {
        gamesPlayed: 0,
        wins: 0,
        losses: 0,
        totalCups: 0,
      };

      existing.gamesPlayed++;
      if (pgs.isWinner) existing.wins++;
      else existing.losses++;
      existing.totalCups += (pgs.cupsHit || 0) + (partnerStat.cupsHit || 0);

      partnerMap.set(partnerId, existing);
    }
  });

  // Convert to array
  const chemistry: PartnerChemistry[] = [];
  partnerMap.forEach((stats, partnerId) => {
    const partner = players.find(p => p.id === partnerId);
    if (partner) {
      chemistry.push({
        partnerId,
        partnerName: getFullName(partner),
        partnerSlug: partner.slug,
        avatarUrl: partner.avatarUrl,
        gamesPlayed: stats.gamesPlayed,
        wins: stats.wins,
        losses: stats.losses,
        winPct: stats.gamesPlayed > 0 ? (stats.wins / stats.gamesPlayed) * 100 : 0,
        totalCups: stats.totalCups,
        avgCupsPerGame: stats.gamesPlayed > 0 ? stats.totalCups / stats.gamesPlayed : 0,
      });
    }
  });

  // Sort by games played descending
  return chemistry.sort((a, b) => b.gamesPlayed - a.gamesPlayed);
};

// =====================================================
// SEARCH AND FILTER HELPERS
// =====================================================

/**
 * Filter player stats by search query
 */
export const filterPlayerStats = (
  stats: ComputedPlayerStats[],
  searchQuery: string
): ComputedPlayerStats[] => {
  if (!searchQuery.trim()) return stats;
  
  const query = searchQuery.toLowerCase();
  return stats.filter(
    ps => ps.playerName.toLowerCase().includes(query) ||
          ps.teamNames.some(tn => tn.toLowerCase().includes(query))
  );
};

/**
 * Filter team stats by search query
 */
export const filterTeamStats = (
  stats: ComputedTeamStats[],
  searchQuery: string
): ComputedTeamStats[] => {
  if (!searchQuery.trim()) return stats;
  
  const query = searchQuery.toLowerCase();
  return stats.filter(ts => ts.teamName.toLowerCase().includes(query));
};

/**
 * Sort stats by column
 */
export type SortDirection = 'asc' | 'desc';

export const sortPlayerStats = (
  stats: ComputedPlayerStats[],
  sortKey: keyof ComputedPlayerStats,
  direction: SortDirection
): ComputedPlayerStats[] => {
  return [...stats].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    // Handle streak specially
    if (sortKey === 'currentStreak') {
      aVal = (a.currentStreak.type === 'W' ? 1 : -1) * a.currentStreak.length;
      bVal = (b.currentStreak.type === 'W' ? 1 : -1) * b.currentStreak.length;
    }

    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
};

export const sortTeamStats = (
  stats: ComputedTeamStats[],
  sortKey: keyof ComputedTeamStats,
  direction: SortDirection
): ComputedTeamStats[] => {
  return [...stats].sort((a, b) => {
    let aVal = a[sortKey];
    let bVal = b[sortKey];

    // Handle streak specially
    if (sortKey === 'currentStreak') {
      aVal = (a.currentStreak.type === 'W' ? 1 : -1) * a.currentStreak.length;
      bVal = (b.currentStreak.type === 'W' ? 1 : -1) * b.currentStreak.length;
    }

    // Handle string comparison
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    // Handle number comparison
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return direction === 'asc' ? aVal - bVal : bVal - aVal;
    }

    return 0;
  });
};

