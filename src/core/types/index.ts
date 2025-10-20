export interface Team {
  id: string;
  name: string;
  color: string;
  icon: string; // Icon identifier (e.g., 'trophy', 'flame', 'shield')
  wins: number;
  losses: number;
  totalPoints: number;
  gamesPlayed: number;
  players: string[]; // Player IDs
}

export type PlayerYear = 'freshman' | 'sophomore' | 'junior' | 'senior' | 'alumni';

export interface Player {
  id: string;
  name: string;
  teamId: string;
  bio: string;
  year?: PlayerYear;
  photoUrl?: string;
  stats: {
    wins: number;
    losses: number;
    gamesPlayed: number;
    totalPoints: number;
    averagePoints: number;
    shutouts: number;
    blowoutWins: number; // wins by 7+ points
    clutchWins: number; // wins by 1-2 points
    longestWinStreak: number;
    currentWinStreak: number;
  };
}

export type GameStatus = 'scheduled' | 'completed' | 'cancelled';

export interface Game {
  id: string;
  team1Id: string;
  team2Id: string;
  team1Score?: number;
  team2Score?: number;
  scheduledDate: Date;
  completedDate?: Date;
  status: GameStatus;
  winnerId?: string;
  isBlowout?: boolean; // 7+ point difference
  isClutch?: boolean; // 1-2 point difference
  isShutout?: boolean; // one team scored 0
}

export interface Tournament {
  id: string;
  name: string;
  type: 'single-elimination' | 'double-elimination' | 'round-robin';
  status: 'setup' | 'in-progress' | 'completed';
  teams: string[]; // Team IDs
  bracket: TournamentMatch[];
  winnerId?: string;
  createdDate: Date;
  completedDate?: Date;
}

export interface TournamentMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  team1Score?: number;
  team2Score?: number;
  winnerId?: string;
  status: 'pending' | 'completed';
  nextMatchId?: string; // For winner advancement
}

export interface LeaderboardEntry {
  playerId: string;
  value: number;
  rank: number;
}

export interface TeamStats {
  teamId: string;
  record: { wins: number; losses: number };
  averagePoints: number;
  totalPoints: number;
  shutouts: number;
  blowoutWins: number;
  clutchWins: number;
  longestWinStreak: number;
  currentWinStreak: number;
  vsTeamRecords: Record<string, { wins: number; losses: number }>;
}

export interface HeadToHeadComparison {
  team1Id: string;
  team2Id: string;
  team1Wins: number;
  team2Wins: number;
  totalGames: number;
  averageScoreDifference: number;
  lastGame?: Game;
}

export interface SeasonStats {
  totalGames: number;
  completedGames: number;
  totalPoints: number;
  averageScore: number;
  highestScore: number;
  shutouts: number;
  blowouts: number;
  clutchGames: number;
}

// Filter and sorting types
export type GameFilter = {
  status?: GameStatus[];
  teamId?: string;
  dateRange?: { start: Date; end: Date };
};

export type GameSort = 'newest' | 'oldest' | 'upcoming';
export type PlayerSort = 'wins' | 'games' | 'average' | 'name';
export type ViewMode = 'card' | 'table';

// API Response types for future backend integration
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
