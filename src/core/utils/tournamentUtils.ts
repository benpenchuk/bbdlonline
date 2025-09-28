import { Tournament, TournamentMatch, Team } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Calculate number of rounds needed for a tournament
export const calculateRounds = (teamCount: number): number => {
  return Math.ceil(Math.log2(teamCount));
};

// Calculate next power of 2 (for bracket size)
export const nextPowerOfTwo = (n: number): number => {
  return Math.pow(2, Math.ceil(Math.log2(n)));
};

// Generate single elimination bracket
export const generateSingleEliminationBracket = (
  tournamentId: string,
  teams: Team[]
): TournamentMatch[] => {
  const bracketSize = nextPowerOfTwo(teams.length);
  const totalRounds = Math.log2(bracketSize);
  const matches: TournamentMatch[] = [];
  
  // Seed teams (simple seeding for now - just use order)
  const seededTeams = [...teams];
  
  // Add BYEs if needed
  const teamsWithByes = [...seededTeams];
  while (teamsWithByes.length < bracketSize) {
    teamsWithByes.push(null as any); // BYE placeholder
  }
  
  // Generate first round matches
  const firstRoundMatches = bracketSize / 2;
  for (let i = 0; i < firstRoundMatches; i++) {
    const team1 = teamsWithByes[i * 2];
    const team2 = teamsWithByes[i * 2 + 1];
    
    const match: TournamentMatch = {
      id: uuidv4(),
      tournamentId,
      round: 1,
      position: i + 1,
      team1Id: team1?.id,
      team2Id: team2?.id,
      status: 'pending'
    };
    
    // Handle BYEs - if one team is null, the other advances automatically
    if (!team1 && team2) {
      match.winnerId = team2.id;
      match.status = 'completed';
    } else if (team1 && !team2) {
      match.winnerId = team1.id;
      match.status = 'completed';
    }
    
    matches.push(match);
  }
  
  // Generate subsequent rounds
  for (let round = 2; round <= totalRounds; round++) {
    const matchesInRound = Math.pow(2, totalRounds - round);
    for (let position = 1; position <= matchesInRound; position++) {
      const match: TournamentMatch = {
        id: uuidv4(),
        tournamentId,
        round,
        position,
        status: 'pending'
      };
      matches.push(match);
    }
  }
  
  // Link matches for advancement
  linkMatches(matches);
  
  return matches;
};

// Link matches so winners advance to next round
const linkMatches = (matches: TournamentMatch[]): void => {
  const matchesByRound = groupMatchesByRound(matches);
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  
  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRound = rounds[i];
    const nextRound = rounds[i + 1];
    const currentMatches = matchesByRound[currentRound];
    const nextMatches = matchesByRound[nextRound];
    
    currentMatches.forEach((match, index) => {
      const nextMatchIndex = Math.floor(index / 2);
      if (nextMatches[nextMatchIndex]) {
        match.nextMatchId = nextMatches[nextMatchIndex].id;
      }
    });
  }
};

// Group matches by round
export const groupMatchesByRound = (matches: TournamentMatch[]): Record<number, TournamentMatch[]> => {
  return matches.reduce((acc, match) => {
    if (!acc[match.round]) {
      acc[match.round] = [];
    }
    acc[match.round].push(match);
    return acc;
  }, {} as Record<number, TournamentMatch[]>);
};

// Advance winner to next match
export const advanceWinner = (
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string,
  team1Score?: number,
  team2Score?: number
): TournamentMatch[] => {
  const updatedMatches = [...matches];
  const matchIndex = updatedMatches.findIndex(m => m.id === matchId);
  
  if (matchIndex === -1) return matches;
  
  const match = updatedMatches[matchIndex];
  match.winnerId = winnerId;
  match.status = 'completed';
  if (team1Score !== undefined) match.team1Score = team1Score;
  if (team2Score !== undefined) match.team2Score = team2Score;
  
  // Find next match and advance winner
  if (match.nextMatchId) {
    const nextMatchIndex = updatedMatches.findIndex(m => m.id === match.nextMatchId);
    if (nextMatchIndex !== -1) {
      const nextMatch = updatedMatches[nextMatchIndex];
      
      // Determine if winner goes to team1 or team2 slot
      const currentRoundMatches = updatedMatches.filter(m => m.round === match.round);
      const matchPositionInRound = currentRoundMatches.findIndex(m => m.id === matchId);
      
      if (matchPositionInRound % 2 === 0) {
        // Even position (0, 2, 4...) goes to team1 slot
        nextMatch.team1Id = winnerId;
      } else {
        // Odd position (1, 3, 5...) goes to team2 slot
        nextMatch.team2Id = winnerId;
      }
    }
  }
  
  return updatedMatches;
};

// Check if tournament is complete
export const isTournamentComplete = (matches: TournamentMatch[]): boolean => {
  const finalRound = Math.max(...matches.map(m => m.round));
  const finalMatch = matches.find(m => m.round === finalRound);
  return finalMatch?.status === 'completed';
};

// Get tournament winner
export const getTournamentWinner = (matches: TournamentMatch[]): string | undefined => {
  const finalRound = Math.max(...matches.map(m => m.round));
  const finalMatch = matches.find(m => m.round === finalRound);
  return finalMatch?.winnerId;
};

// Get bracket display structure for UI
export interface BracketRound {
  round: number;
  matches: TournamentMatch[];
}

export const getBracketStructure = (matches: TournamentMatch[]): BracketRound[] => {
  const matchesByRound = groupMatchesByRound(matches);
  const rounds = Object.keys(matchesByRound).map(Number).sort((a, b) => a - b);
  
  return rounds.map(round => ({
    round,
    matches: matchesByRound[round].sort((a, b) => a.position - b.position)
  }));
};

// Get round name for display
export const getRoundName = (round: number, totalRounds: number): string => {
  const roundsFromEnd = totalRounds - round + 1;
  
  switch (roundsFromEnd) {
    case 1:
      return 'Final';
    case 2:
      return 'Semifinals';
    case 3:
      return 'Quarterfinals';
    case 4:
      return 'Round of 16';
    case 5:
      return 'Round of 32';
    default:
      return `Round ${round}`;
  }
};

// Validate tournament setup
export const validateTournamentSetup = (teams: Team[]): { valid: boolean; error?: string } => {
  if (teams.length < 2) {
    return { valid: false, error: 'At least 2 teams are required' };
  }
  
  if (teams.length > 16) {
    return { valid: false, error: 'Maximum 16 teams allowed' };
  }
  
  // Check for duplicate teams
  const teamIds = teams.map(t => t.id);
  const uniqueTeamIds = new Set(teamIds);
  if (teamIds.length !== uniqueTeamIds.size) {
    return { valid: false, error: 'Duplicate teams are not allowed' };
  }
  
  return { valid: true };
};

// Generate tournament bracket with proper seeding
export const createTournament = (
  name: string,
  teams: Team[],
  type: Tournament['type'] = 'single-elimination'
): Omit<Tournament, 'id'> => {
  const validation = validateTournamentSetup(teams);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  
  const tournamentId = `tournament-${Date.now()}`;
  let bracket: TournamentMatch[] = [];
  
  switch (type) {
    case 'single-elimination':
      bracket = generateSingleEliminationBracket(tournamentId, teams);
      break;
    case 'double-elimination':
      // TODO: Implement double elimination
      throw new Error('Double elimination not yet implemented');
    case 'round-robin':
      // TODO: Implement round robin
      throw new Error('Round robin not yet implemented');
  }
  
  return {
    name,
    type,
    status: 'setup',
    teams: teams.map(t => t.id),
    bracket,
    createdDate: new Date()
  };
};
