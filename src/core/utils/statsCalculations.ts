import { Game, ComputedSeasonStats, HeadToHeadComparison } from '../types';

// Note: These calculations now work with the new schema structure
// Players are linked to teams via player_teams, not directly
// Games use homeTeamId/awayTeamId instead of team1Id/team2Id

// Helper: Get team's score from a game
const getTeamScore = (game: Game, teamId: string): number => {
  if (game.homeTeamId === teamId) return game.homeScore;
  if (game.awayTeamId === teamId) return game.awayScore;
  return 0;
};

// Helper: Get opponent's score from a game
const getOpponentScore = (game: Game, teamId: string): number => {
  if (game.homeTeamId === teamId) return game.awayScore;
  if (game.awayTeamId === teamId) return game.homeScore;
  return 0;
};

// Helper: Check if team won
const didTeamWin = (game: Game, teamId: string): boolean => {
  return game.winningTeamId === teamId;
};

// Head-to-head comparison
export const calculateHeadToHead = (team1Id: string, team2Id: string, games: Game[]): HeadToHeadComparison => {
  const h2hGames = games.filter(
    (game) =>
      ((game.homeTeamId === team1Id && game.awayTeamId === team2Id) ||
        (game.homeTeamId === team2Id && game.awayTeamId === team1Id)) &&
      game.status === 'completed'
  );

  let team1Wins = 0;
  let team2Wins = 0;
  let totalScoreDiff = 0;
  let lastGame: Game | undefined;

  h2hGames.forEach((game) => {
    if (game.winningTeamId === team1Id) team1Wins++;
    if (game.winningTeamId === team2Id) team2Wins++;

    const team1Score = getTeamScore(game, team1Id);
    const team2Score = getTeamScore(game, team2Id);
    totalScoreDiff += Math.abs(team1Score - team2Score);

    if (!lastGame || new Date(game.gameDate!) > new Date(lastGame.gameDate!)) {
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
    lastGame,
  };
};

// Season overview statistics
export const calculateSeasonStats = (games: Game[]): ComputedSeasonStats => {
  const completedGames = games.filter((game) => game.status === 'completed');

  let totalScore = 0;
  let highestScore = 0;
  let shutouts = 0;
  let blowouts = 0;
  let clutchGames = 0;

  completedGames.forEach((game) => {
    const homeScore = game.homeScore;
    const awayScore = game.awayScore;

    totalScore += homeScore + awayScore;

    if (homeScore > highestScore) highestScore = homeScore;
    if (awayScore > highestScore) highestScore = awayScore;

    if (homeScore === 0 || awayScore === 0) shutouts++;

    const scoreDiff = Math.abs(homeScore - awayScore);
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
    clutchGames,
  };
};

// Utility functions for sorting and filtering
export const sortGames = (games: Game[], sortBy: 'newest' | 'oldest' | 'upcoming'): Game[] => {
  const sorted = [...games];

  switch (sortBy) {
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.gameDate || a.createdAt;
        const dateB = b.gameDate || b.createdAt;
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      });
    case 'oldest':
      return sorted.sort((a, b) => {
        const dateA = a.gameDate || a.createdAt;
        const dateB = b.gameDate || b.createdAt;
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
    case 'upcoming':
      return sorted.sort((a, b) => {
        // Upcoming games first, then by scheduled date
        if (a.status === 'scheduled' && b.status !== 'scheduled') return -1;
        if (b.status === 'scheduled' && a.status !== 'scheduled') return 1;
        if (!a.gameDate || !b.gameDate) return 0;
        return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
      });
    default:
      return sorted;
  }
};

export const filterGames = (
  games: Game[],
  filters: {
    status?: string[];
    teamId?: string;
    seasonId?: string;
    dateRange?: { start: Date; end: Date };
  }
): Game[] => {
  return games.filter((game) => {
    if (filters.status && !filters.status.includes(game.status)) return false;

    if (filters.teamId && game.homeTeamId !== filters.teamId && game.awayTeamId !== filters.teamId) return false;

    if (filters.seasonId && game.seasonId !== filters.seasonId) return false;

    if (filters.dateRange && game.gameDate) {
      const gameDate = new Date(game.gameDate);
      if (gameDate < filters.dateRange.start || gameDate > filters.dateRange.end) return false;
    }

    return true;
  });
};

// Calculate team stats for a given team across all games
export const calculateTeamStatsForGames = (
  teamId: string,
  games: Game[]
): {
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: number;
} => {
  const teamGames = games.filter(
    (game) => (game.homeTeamId === teamId || game.awayTeamId === teamId) && game.status === 'completed'
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  teamGames.forEach((game) => {
    const teamScore = getTeamScore(game, teamId);
    const opponentScore = getOpponentScore(game, teamId);

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (didTeamWin(game, teamId)) {
      wins++;
    } else {
      losses++;
    }
  });

  const gamesPlayed = teamGames.length;
  const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;

  return {
    gamesPlayed,
    wins,
    losses,
    pointsFor,
    pointsAgainst,
    winPct,
  };
};
