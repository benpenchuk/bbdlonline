/**
 * Stats Recalculation Service
 * 
 * This service recalculates and stores all statistics in the database:
 * - player_game_stats: Individual game performance
 * - player_season_stats: Aggregated player stats per season
 * - team_season_stats: Aggregated team stats per season
 */

import { Game, Player, PlayerTeam, Season, PlayerGameStats, PlayerSeasonStats, TeamSeasonStats } from '../types';
import {
  playerGameStatsApi,
  playerSeasonStatsApi,
  teamSeasonStatsApi,
} from './api';
import { getWinnerId } from '../utils/gameHelpers';

/**
 * Recalculate all stats for a completed game
 */
export async function recalculateGameStats(
  game: Game,
  players: Player[],
  playerTeams: PlayerTeam[]
): Promise<void> {
  if (game.status !== 'completed') {
    return; // Only calculate stats for completed games
  }

  const winnerId = getWinnerId(game);
  if (!winnerId) return; // No winner means no stats

  // Get all players who participated in this game (from both teams)
  const homeTeamRoster = playerTeams.filter(pt => pt.teamId === game.homeTeamId && pt.status === 'active');
  const awayTeamRoster = playerTeams.filter(pt => pt.teamId === game.awayTeamId && pt.status === 'active');
  const allParticipants = [...homeTeamRoster, ...awayTeamRoster];

  // For each participant, create/update player_game_stats
  for (const playerTeam of allParticipants) {
    const player = players.find(p => p.id === playerTeam.playerId);
    if (!player) continue;

    const isHomeTeam = playerTeam.teamId === game.homeTeamId;
    const teamScore = isHomeTeam ? game.homeScore : game.awayScore;
    const isWinner = playerTeam.teamId === winnerId;

    // For now, we'll use simplified stats based on game scores
    // In a real app, you'd have more detailed stat tracking
    const stats: Omit<PlayerGameStats, 'id' | 'createdAt' | 'updatedAt'> = {
      gameId: game.id,
      playerId: player.id,
      teamId: playerTeam.teamId,
      seasonId: game.seasonId,
      pointsScored: teamScore, // Simplified: player gets team's score
      cupsHit: Math.floor(teamScore * 0.7), // Estimated
      sinks: Math.floor(teamScore * 0.5), // Estimated
      bounces: Math.floor(teamScore * 0.2), // Estimated
      tableHits: Math.floor(teamScore * 2), // Estimated
      throwsMissed: Math.floor(teamScore * 1.5), // Estimated
      isWinner,
      mvp: false, // MVP would be determined separately
    };

    // Check if stats already exist for this game/player
    const existingStats = await playerGameStatsApi.getByGame(game.id);
    const existing = existingStats.data?.find(s => s.playerId === player.id);

    if (existing) {
      await playerGameStatsApi.update(existing.id, stats);
    } else {
      await playerGameStatsApi.create(stats);
    }
  }
}

/**
 * Recalculate player season stats for a specific player and season
 */
export async function recalculatePlayerSeasonStats(
  playerId: string,
  seasonId: string,
  games: Game[],
  playerTeams: PlayerTeam[]
): Promise<void> {
  const seasonGames = games.filter(g => g.seasonId === seasonId && g.status === 'completed');
  const playerTeam = playerTeams.find(pt => pt.playerId === playerId && pt.seasonId === seasonId && pt.status === 'active');
  
  if (!playerTeam) return;

  // Get all game stats for this player in this season
  const gameStatsPromises = seasonGames.map(g => playerGameStatsApi.getByGame(g.id));
  const gameStatsResults = await Promise.all(gameStatsPromises);
  const playerGameStats = gameStatsResults
    .flatMap(r => r.data || [])
    .filter(s => s.playerId === playerId && s.seasonId === seasonId);

  // Aggregate stats
  const gamesPlayed = playerGameStats.length;
  const gamesWon = playerGameStats.filter(s => s.isWinner).length;
  const pointsScoredTotal = playerGameStats.reduce((sum, s) => sum + s.pointsScored, 0);
  const pointsPerGame = gamesPlayed > 0 ? pointsScoredTotal / gamesPlayed : 0;
  const cupsHitTotal = playerGameStats.reduce((sum, s) => sum + s.cupsHit, 0);
  const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;
  const mvpAwards = playerGameStats.filter(s => s.mvp).length;
  const tableHitsTotal = playerGameStats.reduce((sum, s) => sum + s.tableHits, 0);
  const throwsMissedTotal = playerGameStats.reduce((sum, s) => sum + s.throwsMissed, 0);
  const totalThrows = tableHitsTotal + throwsMissedTotal;
  const tableHitPct = totalThrows > 0 ? (tableHitsTotal / totalThrows) * 100 : 0;

  const seasonStats: Omit<PlayerSeasonStats, 'id' | 'createdAt' | 'updatedAt'> = {
    playerId,
    teamId: playerTeam.teamId,
    seasonId,
    gamesPlayed,
    gamesWon,
    pointsScoredTotal,
    pointsPerGame: parseFloat(pointsPerGame.toFixed(2)),
    cupsHitTotal,
    winRate: parseFloat((winRate * 100).toFixed(2)),
    mvpAwards,
    tableHitsTotal,
    throwsMissedTotal,
    tableHitPct: parseFloat(tableHitPct.toFixed(3)),
  };

  await playerSeasonStatsApi.upsert(seasonStats);
}

/**
 * Recalculate team season stats for a specific team and season
 */
export async function recalculateTeamSeasonStats(
  teamId: string,
  seasonId: string,
  games: Game[]
): Promise<void> {
  const seasonGames = games.filter(
    g => g.seasonId === seasonId && 
    g.status === 'completed' && 
    (g.homeTeamId === teamId || g.awayTeamId === teamId)
  );

  let wins = 0;
  let losses = 0;
  let pointsFor = 0;
  let pointsAgainst = 0;

  for (const game of seasonGames) {
    const isHomeTeam = game.homeTeamId === teamId;
    const teamScore = isHomeTeam ? game.homeScore : game.awayScore;
    const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;
    const winnerId = getWinnerId(game);

    pointsFor += teamScore;
    pointsAgainst += opponentScore;

    if (winnerId === teamId) {
      wins++;
    } else if (winnerId) {
      losses++;
    }
  }

  const gamesPlayed = wins + losses;
  const winPct = gamesPlayed > 0 ? wins / gamesPlayed : 0;

  const teamStats: Omit<TeamSeasonStats, 'id' | 'createdAt' | 'updatedAt'> = {
    teamId,
    seasonId,
    gamesPlayed,
    wins,
    losses,
    pointsFor,
    pointsAgainst,
    winPct: parseFloat((winPct * 1000).toFixed(3)),
  };

  await teamSeasonStatsApi.upsert(teamStats);
}

/**
 * Recalculate all stats for all seasons
 */
export async function recalculateAllStats(
  games: Game[],
  players: Player[],
  playerTeams: PlayerTeam[],
  seasons: Season[]
): Promise<void> {
  console.log('Starting stats recalculation...');

  // First, recalculate all game stats
  const completedGames = games.filter(g => g.status === 'completed');
  for (const game of completedGames) {
    await recalculateGameStats(game, players, playerTeams);
  }

  // Then, recalculate all season stats
  for (const season of seasons) {
    // Recalculate player season stats
    const seasonPlayers = playerTeams.filter(pt => pt.seasonId === season.id && pt.status === 'active');
    for (const playerTeam of seasonPlayers) {
      await recalculatePlayerSeasonStats(playerTeam.playerId, season.id, games, playerTeams);
    }

    // Recalculate team season stats
    const seasonTeams = new Set<string>();
    games.forEach(g => {
      if (g.seasonId === season.id) {
        seasonTeams.add(g.homeTeamId);
        seasonTeams.add(g.awayTeamId);
      }
    });

    for (const teamId of Array.from(seasonTeams)) {
      await recalculateTeamSeasonStats(teamId, season.id, games);
    }
  }

  console.log('Stats recalculation complete!');
}

