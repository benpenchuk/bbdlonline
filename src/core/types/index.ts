// =====================================================
// ENUMS
// =====================================================
export type PlayerStatus = 'active' | 'inactive' | 'alumni';
export type TeamStatus = 'active' | 'inactive' | 'retired';
export type SeasonStatus = 'upcoming' | 'active' | 'completed' | 'archived';
export type RosterRole = 'starter_1' | 'starter_2' | 'sub';
export type RosterStatus = 'active' | 'inactive' | 'ir';
export type GameStatus = 'scheduled' | 'in_progress' | 'completed' | 'canceled';

// =====================================================
// CORE IDENTITY TYPES
// =====================================================

export interface Player {
  id: string; // UUID
  slug: string;
  status: PlayerStatus;
  firstName: string;
  lastName: string;
  nickname?: string;
  avatarUrl?: string;
  hometownCity?: string;
  hometownState?: string;
  dominantHand?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string; // UUID
  slug: string;
  status: TeamStatus;
  name: string;
  abbreviation: string; // 2-4 characters
  logoUrl?: string;
  homeCity?: string;
  homeState?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Season {
  id: string; // UUID
  slug: string;
  status: SeasonStatus;
  name: string; // e.g., "Fall 2025"
  year: number;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ROSTER MEMBERSHIP
// =====================================================

export interface PlayerTeam {
  id: string; // UUID
  playerId: string;
  teamId: string;
  seasonId: string;
  role: RosterRole;
  status: RosterStatus;
  isCaptain: boolean;
  joinedAt?: Date;
  leftAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// GAMES & MATCH RESULTS
// =====================================================

export interface Game {
  id: string; // UUID
  seasonId: string;
  homeTeamId: string;
  awayTeamId: string;
  gameDate?: Date;
  location?: string;
  status: GameStatus;
  homeScore: number;
  awayScore: number;
  winningTeamId?: string;
  week?: number; // 1-6 for regular season, null for playoffs
  playoffMatchId?: string; // NEW: UUID of playoff match if this is a playoff game
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// INDIVIDUAL PERFORMANCE
// =====================================================

export interface PlayerGameStats {
  id: string; // UUID
  gameId: string;
  playerId: string;
  teamId: string;
  seasonId: string;
  pointsScored: number;
  cupsHit: number;
  sinks: number;
  bounces: number;
  tableHits: number;
  throwsMissed: number;
  isWinner: boolean;
  mvp: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PRECOMPUTED AGGREGATES
// =====================================================

export interface PlayerSeasonStats {
  id: string; // UUID
  playerId: string;
  teamId: string;
  seasonId: string;
  gamesPlayed: number;
  gamesWon: number;
  pointsScoredTotal: number;
  pointsPerGame: number;
  cupsHitTotal: number;
  winRate: number;
  mvpAwards: number;
  tableHitsTotal: number;
  throwsMissedTotal: number;
  tableHitPct: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamSeasonStats {
  id: string; // UUID
  teamId: string;
  seasonId: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  winPct: number;
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// PLAYOFFS
// =====================================================

export interface Playoff {
  id: string; // UUID
  seasonId: string;
  name: string;
  bracketType: 'single_elimination' | 'double_elimination';
  status: 'planned' | 'in_progress' | 'completed' | 'canceled';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlayoffMatch {
  id: string;
  playoffId: string;
  roundNumber: number; // 1 = first round, 2 = quarterfinals, etc.
  matchNumber: number; // Position within round (0-indexed)
  team1Id?: string; // null = BYE
  team2Id?: string; // null = BYE
  winnerId?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'bye';
  seriesFormat: 'single' | 'best_of_3' | 'best_of_5';
  pointTarget: number;
  nextMatchId?: string; // Where winner advances
  createdAt: Date;
  updatedAt: Date;
}

// =====================================================
// ANNOUNCEMENTS & PHOTOS
// =====================================================

export interface Announcement {
  id: string; // UUID
  seasonId: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Photo {
  id: string; // UUID
  seasonId: string;
  gameId?: string;
  imageUrl: string;
  caption?: string;
  isFeatured: boolean;
  uploadedBy?: string;
  uploadedAt: Date;
}

// =====================================================
// COMPUTED/DERIVED TYPES FOR UI
// =====================================================

export interface LeaderboardEntry {
  playerId: string;
  value: number;
  rank: number;
  gamesPlayed?: number;
  wins?: number;
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

export interface ComputedSeasonStats {
  totalGames: number;
  completedGames: number;
  totalPoints: number;
  averageScore: number;
  highestScore: number;
  shutouts: number;
  blowouts: number;
  clutchGames: number;
}

// =====================================================
// FILTER AND SORTING TYPES
// =====================================================

export type GameFilter = {
  status?: GameStatus[];
  teamId?: string;
  seasonId?: string;
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
