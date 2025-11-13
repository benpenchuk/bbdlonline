import { Team, Player, Game, Playoff } from '../types';

// Mock data has been moved to the database
// This file is kept for backward compatibility but returns empty arrays
// Use the database seeding script instead

export const mockTeams: Team[] = [];
export const mockPlayers: Player[] = [];
export const mockGames: Game[] = [];
export const mockPlayoffs: Playoff[] = [];

// Legacy function signatures
export const generateMockGames = (): Game[] => [];
export const generateSamplePlayoff = (): Playoff | null => null;
