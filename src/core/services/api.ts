import {
  Team,
  Player,
  Game,
  Season,
  PlayerTeam,
  PlayerGameStats,
  PlayerSeasonStats,
  TeamSeasonStats,
  Playoff,
  Announcement,
  Photo,
  ApiResponse,
} from '../types';
import { supabase, TABLES } from '../config/supabaseClient';

// =====================================================
// UTILITY FUNCTIONS FOR DATA TRANSFORMATION
// =====================================================

// Convert snake_case from DB to camelCase for TypeScript

const transformPlayerFromDB = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  slug: dbPlayer.slug,
  status: dbPlayer.status,
  firstName: dbPlayer.first_name,
  lastName: dbPlayer.last_name,
  nickname: dbPlayer.nickname,
  avatarUrl: dbPlayer.avatar_url,
  hometownCity: dbPlayer.hometown_city,
  hometownState: dbPlayer.hometown_state,
  dominantHand: dbPlayer.dominant_hand,
  createdAt: new Date(dbPlayer.created_at),
  updatedAt: new Date(dbPlayer.updated_at),
});

const transformTeamFromDB = (dbTeam: any): Team => ({
  id: dbTeam.id,
  slug: dbTeam.slug,
  status: dbTeam.status,
  name: dbTeam.name,
  abbreviation: dbTeam.abbreviation,
  logoUrl: dbTeam.logo_url,
  homeCity: dbTeam.home_city,
  homeState: dbTeam.home_state,
  createdAt: new Date(dbTeam.created_at),
  updatedAt: new Date(dbTeam.updated_at),
});

const transformSeasonFromDB = (dbSeason: any): Season => ({
  id: dbSeason.id,
  slug: dbSeason.slug,
  status: dbSeason.status,
  name: dbSeason.name,
  year: dbSeason.year,
  startDate: new Date(dbSeason.start_date),
  endDate: new Date(dbSeason.end_date),
  createdAt: new Date(dbSeason.created_at),
  updatedAt: new Date(dbSeason.updated_at),
});

const transformPlayerTeamFromDB = (dbPlayerTeam: any): PlayerTeam => ({
  id: dbPlayerTeam.id,
  playerId: dbPlayerTeam.player_id,
  teamId: dbPlayerTeam.team_id,
  seasonId: dbPlayerTeam.season_id,
  role: dbPlayerTeam.role,
  status: dbPlayerTeam.status,
  isCaptain: dbPlayerTeam.is_captain,
  joinedAt: dbPlayerTeam.joined_at ? new Date(dbPlayerTeam.joined_at) : undefined,
  leftAt: dbPlayerTeam.left_at ? new Date(dbPlayerTeam.left_at) : undefined,
  createdAt: new Date(dbPlayerTeam.created_at),
  updatedAt: new Date(dbPlayerTeam.updated_at),
});

const transformGameFromDB = (dbGame: any): Game => ({
  id: dbGame.id,
  seasonId: dbGame.season_id,
  homeTeamId: dbGame.home_team_id,
  awayTeamId: dbGame.away_team_id,
  gameDate: dbGame.game_date ? new Date(dbGame.game_date) : undefined,
  location: dbGame.location,
  status: dbGame.status,
  homeScore: dbGame.home_score || 0,
  awayScore: dbGame.away_score || 0,
  winningTeamId: dbGame.winning_team_id,
  week: dbGame.week || undefined,
  createdAt: new Date(dbGame.created_at),
  updatedAt: new Date(dbGame.updated_at),
});

const transformPlayerGameStatsFromDB = (dbStats: any): PlayerGameStats => ({
  id: dbStats.id,
  gameId: dbStats.game_id,
  playerId: dbStats.player_id,
  teamId: dbStats.team_id,
  seasonId: dbStats.season_id,
  pointsScored: dbStats.points_scored || 0,
  cupsHit: dbStats.cups_hit || 0,
  sinks: dbStats.sinks || 0,
  bounces: dbStats.bounces || 0,
  tableHits: dbStats.table_hits || 0,
  throwsMissed: dbStats.throws_missed || 0,
  isWinner: dbStats.is_winner || false,
  mvp: dbStats.mvp || false,
  createdAt: new Date(dbStats.created_at),
  updatedAt: new Date(dbStats.updated_at),
});

const transformPlayerSeasonStatsFromDB = (dbStats: any): PlayerSeasonStats => ({
  id: dbStats.id,
  playerId: dbStats.player_id,
  teamId: dbStats.team_id,
  seasonId: dbStats.season_id,
  gamesPlayed: dbStats.games_played || 0,
  gamesWon: dbStats.games_won || 0,
  pointsScoredTotal: dbStats.points_scored_total || 0,
  pointsPerGame: parseFloat(dbStats.points_per_game) || 0,
  cupsHitTotal: dbStats.cups_hit_total || 0,
  winRate: parseFloat(dbStats.win_rate) || 0,
  mvpAwards: dbStats.mvp_awards || 0,
  tableHitsTotal: dbStats.table_hits_total || 0,
  throwsMissedTotal: dbStats.throws_missed_total || 0,
  tableHitPct: parseFloat(dbStats.table_hit_pct) || 0,
  createdAt: new Date(dbStats.created_at),
  updatedAt: new Date(dbStats.updated_at),
});

const transformTeamSeasonStatsFromDB = (dbStats: any): TeamSeasonStats => ({
  id: dbStats.id,
  teamId: dbStats.team_id,
  seasonId: dbStats.season_id,
  gamesPlayed: dbStats.games_played || 0,
  wins: dbStats.wins || 0,
  losses: dbStats.losses || 0,
  pointsFor: dbStats.points_for || 0,
  pointsAgainst: dbStats.points_against || 0,
  winPct: parseFloat(dbStats.win_pct) || 0,
  createdAt: new Date(dbStats.created_at),
  updatedAt: new Date(dbStats.updated_at),
});

const transformPlayoffFromDB = (dbPlayoff: any): Playoff => ({
  id: dbPlayoff.id,
  seasonId: dbPlayoff.season_id,
  name: dbPlayoff.name,
  bracketType: dbPlayoff.bracket_type,
  status: dbPlayoff.status,
  createdAt: new Date(dbPlayoff.created_at),
  updatedAt: new Date(dbPlayoff.updated_at),
});

const transformAnnouncementFromDB = (dbAnnouncement: any): Announcement => ({
  id: dbAnnouncement.id,
  seasonId: dbAnnouncement.season_id,
  title: dbAnnouncement.title,
  content: dbAnnouncement.content,
  active: dbAnnouncement.active,
  createdAt: new Date(dbAnnouncement.created_at),
  updatedAt: new Date(dbAnnouncement.updated_at),
});

const transformPhotoFromDB = (dbPhoto: any): Photo => ({
  id: dbPhoto.id,
  seasonId: dbPhoto.season_id,
  gameId: dbPhoto.game_id,
  imageUrl: dbPhoto.image_url,
  caption: dbPhoto.caption,
  isFeatured: dbPhoto.is_featured,
  uploadedBy: dbPhoto.uploaded_by,
  uploadedAt: new Date(dbPhoto.uploaded_at),
});

// Convert camelCase to snake_case for DB inserts/updates

const transformPlayerToDB = (player: Partial<Player>) => ({
  id: player.id,
  slug: player.slug,
  status: player.status,
  first_name: player.firstName,
  last_name: player.lastName,
  nickname: player.nickname,
  avatar_url: player.avatarUrl,
  hometown_city: player.hometownCity,
  hometown_state: player.hometownState,
  dominant_hand: player.dominantHand,
});

const transformTeamToDB = (team: Partial<Team>) => ({
  id: team.id,
  slug: team.slug,
  status: team.status,
  name: team.name,
  abbreviation: team.abbreviation,
  logo_url: team.logoUrl,
  home_city: team.homeCity,
  home_state: team.homeState,
});

const transformSeasonToDB = (season: Partial<Season>) => ({
  id: season.id,
  slug: season.slug,
  status: season.status,
  name: season.name,
  year: season.year,
  start_date: season.startDate?.toISOString().split('T')[0],
  end_date: season.endDate?.toISOString().split('T')[0],
});

const transformPlayerTeamToDB = (playerTeam: Partial<PlayerTeam>) => ({
  id: playerTeam.id,
  player_id: playerTeam.playerId,
  team_id: playerTeam.teamId,
  season_id: playerTeam.seasonId,
  role: playerTeam.role,
  status: playerTeam.status,
  is_captain: playerTeam.isCaptain,
  joined_at: playerTeam.joinedAt?.toISOString(),
  left_at: playerTeam.leftAt?.toISOString(),
});

const transformGameToDB = (game: Partial<Game>) => ({
  id: game.id,
  season_id: game.seasonId,
  home_team_id: game.homeTeamId,
  away_team_id: game.awayTeamId,
  game_date: game.gameDate?.toISOString(),
  location: game.location,
  status: game.status,
  home_score: game.homeScore,
  away_score: game.awayScore,
  winning_team_id: game.winningTeamId,
  week: game.week,
});

const transformPlayerGameStatsToDB = (stats: Partial<PlayerGameStats>) => ({
  id: stats.id,
  game_id: stats.gameId,
  player_id: stats.playerId,
  team_id: stats.teamId,
  season_id: stats.seasonId,
  points_scored: stats.pointsScored,
  cups_hit: stats.cupsHit,
  sinks: stats.sinks,
  bounces: stats.bounces,
  table_hits: stats.tableHits,
  throws_missed: stats.throwsMissed,
  is_winner: stats.isWinner,
  mvp: stats.mvp,
});

const transformPlayoffToDB = (playoff: Partial<Playoff>) => ({
  id: playoff.id,
  season_id: playoff.seasonId,
  name: playoff.name,
  bracket_type: playoff.bracketType,
  status: playoff.status,
});

const transformAnnouncementToDB = (announcement: Partial<Announcement>) => ({
  id: announcement.id,
  season_id: announcement.seasonId,
  title: announcement.title,
  content: announcement.content,
  active: announcement.active,
});

const transformPhotoToDB = (photo: Partial<Photo>) => ({
  id: photo.id,
  season_id: photo.seasonId,
  game_id: photo.gameId,
  image_url: photo.imageUrl,
  caption: photo.caption,
  is_featured: photo.isFeatured,
  uploaded_by: photo.uploadedBy,
});

// =====================================================
// PLAYERS API
// =====================================================

export const playersApi = {
  async getAll(): Promise<ApiResponse<Player[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .order('first_name, last_name');

      if (error) throw error;

      const players = (data || []).map(transformPlayerFromDB);

      return {
        data: players,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching players:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Player | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformPlayerFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Player>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .insert([transformPlayerToDB(player)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating player:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .update(transformPlayerToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating player:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYERS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting player:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// TEAMS API
// =====================================================

export const teamsApi = {
  async getAll(): Promise<ApiResponse<Team[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .select('*')
        .order('name');

      if (error) throw error;

      const teams = (data || []).map(transformTeamFromDB);

      return {
        data: teams,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Team | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformTeamFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching team:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Team>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .insert([transformTeamToDB(team)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTeamFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Team>): Promise<ApiResponse<Team>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .update(transformTeamToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTeamFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.TEAMS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting team:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// SEASONS API
// =====================================================

export const seasonsApi = {
  async getAll(): Promise<ApiResponse<Season[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEASONS)
        .select('*')
        .order('year', { ascending: false });

      if (error) throw error;

      const seasons = (data || []).map(transformSeasonFromDB);

      return {
        data: seasons,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching seasons:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getActive(): Promise<ApiResponse<Season | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEASONS)
        .select('*')
        .eq('status', 'active')
        .single();

      if (error) throw error;

      return {
        data: data ? transformSeasonFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching active season:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Season | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEASONS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformSeasonFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching season:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(season: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Season>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEASONS)
        .insert([transformSeasonToDB(season)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformSeasonFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating season:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Season>): Promise<ApiResponse<Season>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.SEASONS)
        .update(transformSeasonToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformSeasonFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating season:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.SEASONS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting season:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// PLAYER_TEAMS API (Roster Management)
// =====================================================

export const playerTeamsApi = {
  async getAll(): Promise<ApiResponse<PlayerTeam[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .select('*');

      if (error) throw error;

      const playerTeams = (data || []).map(transformPlayerTeamFromDB);

      return {
        data: playerTeams,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player teams:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByTeam(teamId: string, seasonId: string): Promise<ApiResponse<PlayerTeam[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .select('*')
        .eq('team_id', teamId)
        .eq('season_id', seasonId);

      if (error) throw error;

      const playerTeams = (data || []).map(transformPlayerTeamFromDB);

      return {
        data: playerTeams,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching team roster:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByPlayer(playerId: string): Promise<ApiResponse<PlayerTeam[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .select('*')
        .eq('player_id', playerId);

      if (error) throw error;

      const playerTeams = (data || []).map(transformPlayerTeamFromDB);

      return {
        data: playerTeams,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player teams:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async create(playerTeam: Omit<PlayerTeam, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<PlayerTeam>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .insert([transformPlayerTeamToDB(playerTeam)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerTeamFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating player team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<PlayerTeam>): Promise<ApiResponse<PlayerTeam>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .update(transformPlayerTeamToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerTeamFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating player team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.PLAYER_TEAMS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting player team:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// GAMES API
// =====================================================

export const gamesApi = {
  async getAll(): Promise<ApiResponse<Game[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select('*')
        .order('game_date', { ascending: false });

      if (error) throw error;

      const games = (data || []).map(transformGameFromDB);

      return {
        data: games,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching games:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<Game[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select('*')
        .eq('season_id', seasonId)
        .order('game_date', { ascending: false });

      if (error) throw error;

      const games = (data || []).map(transformGameFromDB);

      return {
        data: games,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching season games:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Game | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformGameFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching game:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Game>> {
    try {
      // Auto-determine winner if scores are set
      const gameData = { ...game };
      if (game.homeScore !== undefined && game.awayScore !== undefined && game.homeScore !== game.awayScore) {
        gameData.winningTeamId = game.homeScore > game.awayScore ? game.homeTeamId : game.awayTeamId;
        if (game.status === 'scheduled') {
          gameData.status = 'completed';
        }
      }

      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .insert([transformGameToDB(gameData)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformGameFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating game:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Game>): Promise<ApiResponse<Game>> {
    try {
      // Auto-determine winner if scores are updated
      const updateData = { ...updates };
      if (
        updates.homeScore !== undefined &&
        updates.awayScore !== undefined &&
        updates.homeScore !== updates.awayScore
      ) {
        const { data: game } = await supabase.from(TABLES.GAMES).select('*').eq('id', id).single();

        if (game) {
          updateData.winningTeamId =
            updates.homeScore > updates.awayScore ? game.home_team_id : game.away_team_id;
          if (updates.status === 'scheduled' || !updates.status) {
            updateData.status = 'completed';
          }
        }
      }

      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .update(transformGameToDB(updateData))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformGameFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating game:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from(TABLES.GAMES).delete().eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting game:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// PLAYER GAME STATS API
// =====================================================

export const playerGameStatsApi = {
  async getAll(): Promise<ApiResponse<PlayerGameStats[]>> {
    try {
      const { data, error } = await supabase.from(TABLES.PLAYER_GAME_STATS).select('*');

      if (error) throw error;

      const stats = (data || []).map(transformPlayerGameStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player game stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByGame(gameId: string): Promise<ApiResponse<PlayerGameStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_GAME_STATS)
        .select('*')
        .eq('game_id', gameId);

      if (error) throw error;

      const stats = (data || []).map(transformPlayerGameStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching game stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByPlayer(playerId: string): Promise<ApiResponse<PlayerGameStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_GAME_STATS)
        .select('*')
        .eq('player_id', playerId);

      if (error) throw error;

      const stats = (data || []).map(transformPlayerGameStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async create(
    stats: Omit<PlayerGameStats, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<PlayerGameStats>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_GAME_STATS)
        .insert([transformPlayerGameStatsToDB(stats)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerGameStatsFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating player game stats:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<PlayerGameStats>): Promise<ApiResponse<PlayerGameStats>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_GAME_STATS)
        .update(transformPlayerGameStatsToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerGameStatsFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating player game stats:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from(TABLES.PLAYER_GAME_STATS).delete().eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting player game stats:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// PLAYER SEASON STATS API
// =====================================================

export const playerSeasonStatsApi = {
  async getAll(): Promise<ApiResponse<PlayerSeasonStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_SEASON_STATS)
        .select('*')
        .order('points_per_game', { ascending: false });

      if (error) throw error;

      const stats = (data || []).map(transformPlayerSeasonStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player season stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<PlayerSeasonStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_SEASON_STATS)
        .select('*')
        .eq('season_id', seasonId);

      if (error) throw error;

      const stats = (data || []).map(transformPlayerSeasonStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player season stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByPlayer(playerId: string, seasonId: string): Promise<ApiResponse<PlayerSeasonStats | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_SEASON_STATS)
        .select('*')
        .eq('player_id', playerId)
        .eq('season_id', seasonId)
        .single();

      if (error) throw error;

      return {
        data: data ? transformPlayerSeasonStatsFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching player season stats:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async upsert(
    stats: Omit<PlayerSeasonStats, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<PlayerSeasonStats>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYER_SEASON_STATS)
        .upsert(
          {
            player_id: stats.playerId,
            team_id: stats.teamId,
            season_id: stats.seasonId,
            games_played: stats.gamesPlayed,
            games_won: stats.gamesWon,
            points_scored_total: stats.pointsScoredTotal,
            points_per_game: stats.pointsPerGame,
            cups_hit_total: stats.cupsHitTotal,
            win_rate: stats.winRate,
            mvp_awards: stats.mvpAwards,
            table_hits_total: stats.tableHitsTotal,
            throws_missed_total: stats.throwsMissedTotal,
            table_hit_pct: stats.tableHitPct,
          },
          { onConflict: 'player_id,season_id' }
        )
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayerSeasonStatsFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error upserting player season stats:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// TEAM SEASON STATS API
// =====================================================

export const teamSeasonStatsApi = {
  async getAll(): Promise<ApiResponse<TeamSeasonStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAM_SEASON_STATS)
        .select('*')
        .order('win_pct', { ascending: false });

      if (error) throw error;

      const stats = (data || []).map(transformTeamSeasonStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching team season stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<TeamSeasonStats[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAM_SEASON_STATS)
        .select('*')
        .eq('season_id', seasonId)
        .order('win_pct', { ascending: false });

      if (error) throw error;

      const stats = (data || []).map(transformTeamSeasonStatsFromDB);

      return {
        data: stats,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching team season stats:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getByTeam(teamId: string, seasonId: string): Promise<ApiResponse<TeamSeasonStats | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAM_SEASON_STATS)
        .select('*')
        .eq('team_id', teamId)
        .eq('season_id', seasonId)
        .single();

      if (error) throw error;

      return {
        data: data ? transformTeamSeasonStatsFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching team season stats:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async upsert(
    stats: Omit<TeamSeasonStats, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<TeamSeasonStats>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TEAM_SEASON_STATS)
        .upsert(
          {
            team_id: stats.teamId,
            season_id: stats.seasonId,
            games_played: stats.gamesPlayed,
            wins: stats.wins,
            losses: stats.losses,
            points_for: stats.pointsFor,
            points_against: stats.pointsAgainst,
            win_pct: stats.winPct,
          },
          { onConflict: 'team_id,season_id' }
        )
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTeamSeasonStatsFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error upserting team season stats:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// PLAYOFFS API
// =====================================================

export const playoffsApi = {
  async getAll(): Promise<ApiResponse<Playoff[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYOFFS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const playoffs = (data || []).map(transformPlayoffFromDB);

      return {
        data: playoffs,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching playoffs:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<Playoff[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYOFFS)
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const playoffs = (data || []).map(transformPlayoffFromDB);

      return {
        data: playoffs,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching season playoffs:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Playoff | null>> {
    try {
      const { data, error } = await supabase.from(TABLES.PLAYOFFS).select('*').eq('id', id).single();

      if (error) throw error;

      return {
        data: data ? transformPlayoffFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching playoff:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(
    playoff: Omit<Playoff, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<ApiResponse<Playoff>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYOFFS)
        .insert([transformPlayoffToDB(playoff)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayoffFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating playoff:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Playoff>): Promise<ApiResponse<Playoff>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYOFFS)
        .update(transformPlayoffToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPlayoffFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating playoff:', error);
      return {
        data: null as any,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase.from(TABLES.PLAYOFFS).delete().eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting playoff:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// ANNOUNCEMENTS API
// =====================================================

export const announcementsApi = {
  async getAll(): Promise<ApiResponse<Announcement[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: (data || []).map(transformAnnouncementFromDB),
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Announcement | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformAnnouncementFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching announcement:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<Announcement[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*')
        .eq('season_id', seasonId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return {
        data: (data || []).map(transformAnnouncementFromDB),
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching announcements by season:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getActive(seasonId: string): Promise<ApiResponse<Announcement | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*')
        .eq('season_id', seasonId)
        .eq('active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      return {
        data: data ? transformAnnouncementFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching active announcement:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Announcement | null>> {
    try {
      const dbData = transformAnnouncementToDB(announcementData);
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformAnnouncementFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Announcement>): Promise<ApiResponse<Announcement | null>> {
    try {
      const dbData = transformAnnouncementToDB(updates);
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformAnnouncementFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating announcement:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting announcement:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// PHOTOS API
// =====================================================

export const photosApi = {
  async getAll(): Promise<ApiResponse<Photo[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return {
        data: (data || []).map(transformPhotoFromDB),
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching photos:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Photo | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformPhotoFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching photo:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async getBySeason(seasonId: string): Promise<ApiResponse<Photo[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .eq('season_id', seasonId)
        .order('uploaded_at', { ascending: false });

      if (error) throw error;

      return {
        data: (data || []).map(transformPhotoFromDB),
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching photos by season:', error);
      return {
        data: [],
        success: false,
        message: error.message,
      };
    }
  },

  async getFeatured(seasonId: string): Promise<ApiResponse<Photo | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .select('*')
        .eq('season_id', seasonId)
        .eq('is_featured', true)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"

      return {
        data: data ? transformPhotoFromDB(data) : null,
        success: true,
      };
    } catch (error: any) {
      console.error('Error fetching featured photo:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async create(photoData: Omit<Photo, 'id' | 'uploadedAt'>): Promise<ApiResponse<Photo | null>> {
    try {
      const dbData = transformPhotoToDB(photoData);
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .insert(dbData)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPhotoFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error creating photo:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async update(id: string, updates: Partial<Photo>): Promise<ApiResponse<Photo | null>> {
    try {
      const dbData = transformPhotoToDB(updates);
      const { data, error } = await supabase
        .from(TABLES.PHOTOS)
        .update(dbData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformPhotoFromDB(data),
        success: true,
      };
    } catch (error: any) {
      console.error('Error updating photo:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.PHOTOS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true,
      };
    } catch (error: any) {
      console.error('Error deleting photo:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};

// =====================================================
// DATA MANAGEMENT API
// =====================================================

export const dataApi = {
  async exportAll(): Promise<ApiResponse<any>> {
    try {
      const [
        playersRes,
        teamsRes,
        seasonsRes,
        playerTeamsRes,
        gamesRes,
        playerGameStatsRes,
        playerSeasonStatsRes,
        teamSeasonStatsRes,
        playoffsRes,
      ] = await Promise.all([
        supabase.from(TABLES.PLAYERS).select('*'),
        supabase.from(TABLES.TEAMS).select('*'),
        supabase.from(TABLES.SEASONS).select('*'),
        supabase.from(TABLES.PLAYER_TEAMS).select('*'),
        supabase.from(TABLES.GAMES).select('*'),
        supabase.from(TABLES.PLAYER_GAME_STATS).select('*'),
        supabase.from(TABLES.PLAYER_SEASON_STATS).select('*'),
        supabase.from(TABLES.TEAM_SEASON_STATS).select('*'),
        supabase.from(TABLES.PLAYOFFS).select('*'),
      ]);

      const data = {
        players: playersRes.data || [],
        teams: teamsRes.data || [],
        seasons: seasonsRes.data || [],
        playerTeams: playerTeamsRes.data || [],
        games: gamesRes.data || [],
        playerGameStats: playerGameStatsRes.data || [],
        playerSeasonStats: playerSeasonStatsRes.data || [],
        teamSeasonStats: teamSeasonStatsRes.data || [],
        playoffs: playoffsRes.data || [],
        exportDate: new Date().toISOString(),
      };

      return {
        data,
        success: true,
      };
    } catch (error: any) {
      console.error('Error exporting data:', error);
      return {
        data: null,
        success: false,
        message: error.message,
      };
    }
  },

  async resetAll(): Promise<ApiResponse<boolean>> {
    try {
      // Delete all data from all tables (in correct order due to foreign keys)
      await Promise.all([
        supabase.from(TABLES.PLAYER_GAME_STATS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from(TABLES.PLAYER_SEASON_STATS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from(TABLES.TEAM_SEASON_STATS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from(TABLES.PLAYOFFS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      await supabase.from(TABLES.GAMES).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      await supabase.from(TABLES.PLAYER_TEAMS).delete().neq('id', '00000000-0000-0000-0000-000000000000');

      await Promise.all([
        supabase.from(TABLES.PLAYERS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from(TABLES.TEAMS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from(TABLES.SEASONS).delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ]);

      return {
        data: true,
        success: true,
        message: 'All data has been reset',
      };
    } catch (error: any) {
      console.error('Error resetting data:', error);
      return {
        data: false,
        success: false,
        message: error.message,
      };
    }
  },
};
