import { Game } from '../types';

/**
 * Helper functions for working with the new Game structure
 * Games now use homeTeamId/awayTeamId instead of team1Id/team2Id
 */

// Get game tags (blowout, clutch, shutout) - these are now computed, not stored
export const getGameTags = (game: Game): {
  isBlowout: boolean;
  isClutch: boolean;
  isShutout: boolean;
} => {
  if (game.status !== 'completed') {
    return { isBlowout: false, isClutch: false, isShutout: false };
  }

  const scoreDiff = Math.abs(game.homeScore - game.awayScore);

  return {
    isBlowout: scoreDiff >= 7,
    isClutch: scoreDiff <= 2,
    isShutout: game.homeScore === 0 || game.awayScore === 0,
  };
};

// Get winner ID - computed from scores, not stored
export const getWinnerId = (game: Game): string | null => {
  if (game.status !== 'completed') return null;
  
  if (game.winningTeamId) return game.winningTeamId;
  
  if (game.homeScore > game.awayScore) return game.homeTeamId;
  if (game.awayScore > game.homeScore) return game.awayTeamId;
  
  return null; // Tie
};

// Check if team won the game
export const didTeamWinGame = (game: Game, teamId: string): boolean => {
  return getWinnerId(game) === teamId;
};

// Get team's score in a game
export const getTeamScoreInGame = (game: Game, teamId: string): number => {
  if (game.homeTeamId === teamId) return game.homeScore;
  if (game.awayTeamId === teamId) return game.awayScore;
  return 0;
};

// Get opponent's score in a game
export const getOpponentScoreInGame = (game: Game, teamId: string): number => {
  if (game.homeTeamId === teamId) return game.awayScore;
  if (game.awayTeamId === teamId) return game.homeScore;
  return 0;
};

// Get opponent's team ID
export const getOpponentTeamId = (game: Game, teamId: string): string | null => {
  if (game.homeTeamId === teamId) return game.awayTeamId;
  if (game.awayTeamId === teamId) return game.homeTeamId;
  return null;
};

// Check if team is in the game
export const isTeamInGame = (game: Game, teamId: string): boolean => {
  return game.homeTeamId === teamId || game.awayTeamId === teamId;
};

// Sort games by date (most recent first)
export const sortGamesByDate = (games: Game[], ascending: boolean = false): Game[] => {
  return [...games].sort((a, b) => {
    const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
    const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
    return ascending ? dateA - dateB : dateB - dateA;
  });
};

