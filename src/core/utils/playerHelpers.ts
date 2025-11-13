import { Player, Team, PlayerTeam } from '../types';

/**
 * Helper functions for working with the new player-team relationship structure
 * Players are now linked to teams via the player_teams junction table
 */

// Get the full name of a player
export const getPlayerFullName = (player: Player): string => {
  if (player.nickname) {
    return `${player.firstName} "${player.nickname}" ${player.lastName}`;
  }
  return `${player.firstName} ${player.lastName}`;
};

// Get player initials
export const getPlayerInitials = (player: Player): string => {
  return `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();
};

// Get a player's current team (for a given season)
export const getPlayerTeam = (
  player: Player,
  teams: Team[],
  playerTeams: PlayerTeam[],
  seasonId?: string
): Team | undefined => {
  // Find the player's active roster entry
  const rosterEntry = playerTeams.find(
    (pt) =>
      pt.playerId === player.id &&
      pt.status === 'active' &&
      (!seasonId || pt.seasonId === seasonId)
  );

  if (!rosterEntry) return undefined;

  return teams.find((t) => t.id === rosterEntry.teamId);
};

// Get all players for a team (for a given season)
export const getTeamPlayers = (
  teamId: string,
  players: Player[],
  playerTeams: PlayerTeam[],
  seasonId?: string
): Player[] => {
  const rosterEntries = playerTeams.filter(
    (pt) =>
      pt.teamId === teamId &&
      pt.status === 'active' &&
      (!seasonId || pt.seasonId === seasonId)
  );

  const playerIds = new Set(rosterEntries.map((pt) => pt.playerId));
  return players.filter((p) => playerIds.has(p.id));
};

// Get the player's team ID (for backward compatibility with old code)
export const getPlayerTeamId = (
  player: Player,
  playerTeams: PlayerTeam[],
  seasonId?: string
): string | undefined => {
  const rosterEntry = playerTeams.find(
    (pt) =>
      pt.playerId === player.id &&
      pt.status === 'active' &&
      (!seasonId || pt.seasonId === seasonId)
  );

  return rosterEntry?.teamId;
};

// Check if a player is on a specific team
export const isPlayerOnTeam = (
  playerId: string,
  teamId: string,
  playerTeams: PlayerTeam[],
  seasonId?: string
): boolean => {
  return playerTeams.some(
    (pt) =>
      pt.playerId === playerId &&
      pt.teamId === teamId &&
      pt.status === 'active' &&
      (!seasonId || pt.seasonId === seasonId)
  );
};

