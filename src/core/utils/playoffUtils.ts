import { Playoff, Team } from '../types';

// Playoff utilities have been temporarily disabled pending schema migration
// Playoffs will be reimplemented with the new database structure

export const calculateRounds = (teams: number): number => {
  return Math.ceil(Math.log2(teams));
};

export const isPlayoffComplete = (bracket: any): boolean => {
  return false;
};

export const getPlayoffWinner = (bracket: any): string | null => {
  return null;
};

export const getBracketStructure = (bracket: any): any[] => {
  return [];
};

export const advanceWinner = (bracket: any, matchId: string, winnerId: string, score1: number, score2: number): any => {
  return bracket;
};

export const getRoundName = (round: number, totalRounds: number): string => {
  return `Round ${round}`;
};

export const validatePlayoffSetup = (teams: Team[]): { valid: boolean; message: string } => {
  return { valid: false, message: 'Playoffs temporarily disabled' };
};

export const createPlayoff = (
  name: string,
  teams: Team[],
  type: string = 'single-elimination'
): Omit<Playoff, 'id'> => {
  throw new Error('Playoffs temporarily disabled');
};
