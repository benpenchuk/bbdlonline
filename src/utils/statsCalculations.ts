import { Game, Player, Team, LeaderboardEntry, TeamStats, HeadToHeadComparison, SeasonStats } from '../types';

// Player statistics calculations
export const calculatePlayerStats = (player: Player, games: Game[]): Player['stats'] => {
  const playerGames = games.filter(game => 
    (game.team1Id === player.teamId || game.team2Id === player.teamId) && 
    game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let totalPoints = 0;
  let shutouts = 0;
  let blowoutWins = 0;
  let clutchWins = 0;
  let currentWinStreak = 0;
  let longestWinStreak = 0;
  let tempWinStreak = 0;

  // Sort games by completion date for streak calculation
  const sortedGames = playerGames
    .filter(game => game.completedDate)
    .sort((a, b) => new Date(a.completedDate!).getTime() - new Date(b.completedDate!).getTime());

  sortedGames.forEach(game => {
    const isTeam1 = game.team1Id === player.teamId;
    const playerScore = isTeam1 ? game.team1Score! : game.team2Score!;
    const opponentScore = isTeam1 ? game.team2Score! : game.team1Score!;
    const won = game.winnerId === player.teamId;

    totalPoints += playerScore;

    if (won) {
      wins++;
      tempWinStreak++;
      
      if (opponentScore === 0) shutouts++;
      
      const scoreDiff = playerScore - opponentScore;
      if (scoreDiff >= 7) blowoutWins++;
      if (scoreDiff <= 2) clutchWins++;
    } else {
      losses++;
      if (tempWinStreak > longestWinStreak) {
        longestWinStreak = tempWinStreak;
      }
      tempWinStreak = 0;
    }
  });

  // Check if current streak is the longest
  if (tempWinStreak > longestWinStreak) {
    longestWinStreak = tempWinStreak;
  }
  currentWinStreak = tempWinStreak;

  return {
    wins,
    losses,
    gamesPlayed: playerGames.length,
    totalPoints,
    averagePoints: playerGames.length > 0 ? Math.round((totalPoints / playerGames.length) * 100) / 100 : 0,
    shutouts,
    blowoutWins,
    clutchWins,
    longestWinStreak,
    currentWinStreak
  };
};

// Team statistics calculations
export const calculateTeamStats = (team: Team, games: Game[], allTeams: Team[]): TeamStats => {
  const teamGames = games.filter(game => 
    (game.team1Id === team.id || game.team2Id === team.id) && 
    game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let totalPoints = 0;
  let shutouts = 0;
  let blowoutWins = 0;
  let clutchWins = 0;
  let currentWinStreak = 0;
  let longestWinStreak = 0;
  let tempWinStreak = 0;
  const vsTeamRecords: Record<string, { wins: number; losses: number }> = {};

  // Initialize vs records for all teams
  allTeams.forEach(t => {
    if (t.id !== team.id) {
      vsTeamRecords[t.id] = { wins: 0, losses: 0 };
    }
  });

  // Sort games by completion date for streak calculation
  const sortedGames = teamGames
    .filter(game => game.completedDate)
    .sort((a, b) => new Date(a.completedDate!).getTime() - new Date(b.completedDate!).getTime());

  sortedGames.forEach(game => {
    const isTeam1 = game.team1Id === team.id;
    const teamScore = isTeam1 ? game.team1Score! : game.team2Score!;
    const opponentScore = isTeam1 ? game.team2Score! : game.team1Score!;
    const opponentId = isTeam1 ? game.team2Id : game.team1Id;
    const won = game.winnerId === team.id;

    totalPoints += teamScore;

    if (won) {
      wins++;
      tempWinStreak++;
      vsTeamRecords[opponentId].wins++;
      
      if (opponentScore === 0) shutouts++;
      
      const scoreDiff = teamScore - opponentScore;
      if (scoreDiff >= 7) blowoutWins++;
      if (scoreDiff <= 2) clutchWins++;
    } else {
      losses++;
      vsTeamRecords[opponentId].losses++;
      if (tempWinStreak > longestWinStreak) {
        longestWinStreak = tempWinStreak;
      }
      tempWinStreak = 0;
    }
  });

  // Check if current streak is the longest
  if (tempWinStreak > longestWinStreak) {
    longestWinStreak = tempWinStreak;
  }
  currentWinStreak = tempWinStreak;

  return {
    teamId: team.id,
    record: { wins, losses },
    averagePoints: teamGames.length > 0 ? Math.round((totalPoints / teamGames.length) * 100) / 100 : 0,
    totalPoints,
    shutouts,
    blowoutWins,
    clutchWins,
    longestWinStreak,
    currentWinStreak,
    vsTeamRecords
  };
};

// Leaderboard calculations
export const generateLeaderboard = (
  players: Player[],
  games: Game[],
  category: 'wins' | 'average' | 'shutouts' | 'blowouts' | 'clutch' | 'streak'
): LeaderboardEntry[] => {
  const playersWithStats = players.map(player => ({
    ...player,
    stats: calculatePlayerStats(player, games)
  }));

  let sortedPlayers;
  switch (category) {
    case 'wins':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.wins - a.stats.wins);
      break;
    case 'average':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.averagePoints - a.stats.averagePoints);
      break;
    case 'shutouts':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.shutouts - a.stats.shutouts);
      break;
    case 'blowouts':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.blowoutWins - a.stats.blowoutWins);
      break;
    case 'clutch':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.clutchWins - a.stats.clutchWins);
      break;
    case 'streak':
      sortedPlayers = playersWithStats.sort((a, b) => b.stats.longestWinStreak - a.stats.longestWinStreak);
      break;
    default:
      sortedPlayers = playersWithStats;
  }

  return sortedPlayers.map((player, index) => {
    let value;
    switch (category) {
      case 'wins':
        value = player.stats.wins;
        break;
      case 'average':
        value = player.stats.averagePoints;
        break;
      case 'shutouts':
        value = player.stats.shutouts;
        break;
      case 'blowouts':
        value = player.stats.blowoutWins;
        break;
      case 'clutch':
        value = player.stats.clutchWins;
        break;
      case 'streak':
        value = player.stats.longestWinStreak;
        break;
      default:
        value = 0;
    }

    return {
      playerId: player.id,
      value,
      rank: index + 1
    };
  });
};

// Head-to-head comparison
export const calculateHeadToHead = (team1Id: string, team2Id: string, games: Game[]): HeadToHeadComparison => {
  const h2hGames = games.filter(game => 
    ((game.team1Id === team1Id && game.team2Id === team2Id) ||
     (game.team1Id === team2Id && game.team2Id === team1Id)) &&
    game.status === 'completed'
  );

  let team1Wins = 0;
  let team2Wins = 0;
  let totalScoreDiff = 0;
  let lastGame: Game | undefined;

  h2hGames.forEach(game => {
    if (game.winnerId === team1Id) team1Wins++;
    if (game.winnerId === team2Id) team2Wins++;

    const team1Score = game.team1Id === team1Id ? game.team1Score! : game.team2Score!;
    const team2Score = game.team1Id === team1Id ? game.team2Score! : game.team1Score!;
    totalScoreDiff += Math.abs(team1Score - team2Score);

    if (!lastGame || new Date(game.completedDate!) > new Date(lastGame.completedDate!)) {
      lastGame = game;
    }
  });

  return {
    team1Id,
    team2Id,
    team1Wins,
    team2Wins,
    totalGames: h2hGames.length,
    averageScoreDifference: h2hGames.length > 0 ? Math.round((totalScoreDiff / h2hGames.length) * 100) / 100 : 0,
    lastGame
  };
};

// Season overview statistics
export const calculateSeasonStats = (games: Game[]): SeasonStats => {
  const completedGames = games.filter(game => game.status === 'completed');
  
  let totalScore = 0;
  let highestScore = 0;
  let shutouts = 0;
  let blowouts = 0;
  let clutchGames = 0;

  completedGames.forEach(game => {
    const team1Score = game.team1Score!;
    const team2Score = game.team2Score!;
    
    totalScore += team1Score + team2Score;
    
    if (team1Score > highestScore) highestScore = team1Score;
    if (team2Score > highestScore) highestScore = team2Score;
    
    if (team1Score === 0 || team2Score === 0) shutouts++;
    
    const scoreDiff = Math.abs(team1Score - team2Score);
    if (scoreDiff >= 7) blowouts++;
    if (scoreDiff <= 2) clutchGames++;
  });

  return {
    totalGames: games.length,
    completedGames: completedGames.length,
    totalPoints: totalScore,
    averageScore: completedGames.length > 0 ? Math.round((totalScore / (completedGames.length * 2)) * 100) / 100 : 0,
    highestScore,
    shutouts,
    blowouts,
    clutchGames
  };
};

// Utility functions for sorting and filtering
export const sortGames = (games: Game[], sortBy: 'newest' | 'oldest' | 'upcoming'): Game[] => {
  const sorted = [...games];
  
  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.completedDate || a.scheduledDate;
        const dateB = b.completedDate || b.scheduledDate;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = a.completedDate || a.scheduledDate;
        const dateB = b.completedDate || b.scheduledDate;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    case 'upcoming':
      return sorted.sort((a, b) => {
        // Upcoming games first, then by scheduled date
        if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
        if (b.status === 'scheduled' && a.status !== 'scheduled') return 1;
        return new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime();
      });
    default:
      return sorted;
  }
};

export const filterGames = (games: Game[], filters: {
  status?: string[];
  teamId?: string;
  dateRange?: { start: Date; end: Date };
}): Game[] => {
  return games.filter(game => {
    if (filters.status && !filters.status.includes(game.status)) return false;
    
    if (filters.teamId && game.team1Id !== filters.teamId && game.team2Id !== filters.teamId) return false;
    
    if (filters.dateRange) {
      const gameDate = new Date(game.scheduledDate);
      if (gameDate < filters.dateRange.start || gameDate > filters.dateRange.end) return false;
    }
    
    return true;
  });
};
