import { Team, PlayoffMatch } from '../types';

// Calculate total rounds needed for a bracket
export const calculateRounds = (teamsCount: number): number => {
  if (teamsCount < 2) return 0;
  return Math.ceil(Math.log2(teamsCount));
};

// Get human-readable round name
export const getRoundName = (roundNumber: number, totalRounds: number): string => {
  const roundsFromEnd = totalRounds - roundNumber + 1;
  
  if (roundsFromEnd === 1) return 'Finals';
  if (roundsFromEnd === 2) return 'Semifinals';
  if (roundsFromEnd === 3) return 'Quarterfinals';
  if (roundNumber === 1) return 'First Round';
  
  return `Round ${roundNumber}`;
};

// Validate playoff setup
export const validatePlayoffSetup = (teams: Team[]): { valid: boolean; message: string } => {
  if (teams.length < 2) {
    return { valid: false, message: 'At least 2 teams are required for a playoff' };
  }
  
  if (teams.length > 32) {
    return { valid: false, message: 'Maximum 32 teams allowed in a playoff bracket' };
  }
  
  return { valid: true, message: 'Playoff setup is valid' };
};

// Calculate bracket size (next power of 2)
export const calculateBracketSize = (teamsCount: number): number => {
  if (teamsCount <= 0) return 0;
  if (teamsCount === 1) return 2;
  
  // Find next power of 2
  return Math.pow(2, Math.ceil(Math.log2(teamsCount)));
};

// Calculate number of byes needed
export const calculateByes = (teamsCount: number): number => {
  const bracketSize = calculateBracketSize(teamsCount);
  return bracketSize - teamsCount;
};

// Generate playoff matches for a single-elimination bracket
export const generateBracketMatches = (
  playoffId: string,
  teams: Team[],
  seriesFormat: 'single' | 'best_of_3' | 'best_of_5' = 'single',
  pointTarget: number = 11
): Omit<PlayoffMatch, 'id' | 'createdAt' | 'updatedAt'>[] => {
  
  const validation = validatePlayoffSetup(teams);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  const bracketSize = calculateBracketSize(teams.length);
  const totalRounds = calculateRounds(bracketSize);
  
  const matches: Omit<PlayoffMatch, 'id' | 'createdAt' | 'updatedAt'>[] = [];
  
  // Track match IDs for linking (we'll use temporary IDs like "match-1-0" format)
  const matchIds: { [key: string]: string } = {};
  
  // Generate all matches for all rounds
  for (let round = 1; round <= totalRounds; round++) {
    const matchesInRound = bracketSize / Math.pow(2, round);
    
    for (let matchNum = 0; matchNum < matchesInRound; matchNum++) {
      const matchKey = `${round}-${matchNum}`;
      matchIds[matchKey] = matchKey; // Temporary ID
      
      // Determine next match (where winner advances)
      let nextMatchId: string | undefined = undefined;
      if (round < totalRounds) {
        const nextRound = round + 1;
        const nextMatchNum = Math.floor(matchNum / 2);
        nextMatchId = `${nextRound}-${nextMatchNum}`;
      }
      
      // For first round, assign teams
      let team1Id: string | undefined = undefined;
      let team2Id: string | undefined = undefined;
      let status: 'pending' | 'bye' = 'pending';
      
      if (round === 1) {
        // Seed teams into first round
        const slot1 = matchNum * 2;
        const slot2 = matchNum * 2 + 1;
        
        // Top seeds get byes (they're in slots 0, 1, 2... up to byeCount)
        if (slot1 < teams.length) {
          team1Id = teams[slot1].id;
        }
        if (slot2 < teams.length) {
          team2Id = teams[slot2].id;
        }
        
        // If both teams missing, this match shouldn't exist in round 1
        // If one team missing, it's a bye
        if (!team1Id && !team2Id) {
          continue; // Skip this match entirely
        } else if (!team1Id || !team2Id) {
          status = 'bye';
        }
      }
      
      matches.push({
        playoffId,
        roundNumber: round,
        matchNumber: matchNum,
        team1Id,
        team2Id,
        status,
        seriesFormat,
        pointTarget,
        nextMatchId
      });
    }
  }
  
  return matches;
};

// Seed teams by record (best record gets #1 seed)
export const seedTeams = (
  teams: Team[],
  standings: { teamId: string; wins: number; losses: number; pointsFor: number; pointsAgainst: number }[]
): Team[] => {
  // Create a map for quick lookup
  const standingsMap = new Map(standings.map(s => [s.teamId, s]));
  
  // Sort teams by record
  const sortedTeams = [...teams].sort((a, b) => {
    const aStats = standingsMap.get(a.id);
    const bStats = standingsMap.get(b.id);
    
    // If no stats, sort to end
    if (!aStats && !bStats) return 0;
    if (!aStats) return 1;
    if (!bStats) return -1;
    
    // First: Win percentage
    const aWinPct = aStats.wins / (aStats.wins + aStats.losses) || 0;
    const bWinPct = bStats.wins / (bStats.wins + bStats.losses) || 0;
    if (aWinPct !== bWinPct) return bWinPct - aWinPct;
    
    // Tiebreaker: Points for
    if (aStats.pointsFor !== bStats.pointsFor) {
      return bStats.pointsFor - aStats.pointsFor;
    }
    
    // Final tiebreaker: Points against (lower is better)
    return aStats.pointsAgainst - bStats.pointsAgainst;
  });
  
  return sortedTeams;
};

// Check if playoff is complete
export const isPlayoffComplete = (matches: PlayoffMatch[]): boolean => {
  if (matches.length === 0) return false;
  
  // Find the finals (highest round number)
  const maxRound = Math.max(...matches.map(m => m.roundNumber));
  const finalsMatches = matches.filter(m => m.roundNumber === maxRound);
  
  // Playoff is complete if all finals matches are completed
  return finalsMatches.every(m => m.status === 'completed');
};

// Get playoff winner
export const getPlayoffWinner = (matches: PlayoffMatch[]): string | null => {
  if (!isPlayoffComplete(matches)) return null;
  
  // Find the finals (highest round number)
  const maxRound = Math.max(...matches.map(m => m.roundNumber));
  const finalsMatch = matches.find(m => m.roundNumber === maxRound && m.status === 'completed');
  
  return finalsMatch?.winnerId || null;
};
