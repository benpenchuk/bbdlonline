import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Team, Player, Game, Playoff, PlayoffMatch, Season, PlayerTeam, PlayerGameStats, PlayerSeasonStats, TeamSeasonStats, Announcement, Photo, ApiResponse } from '../core/types';
import {
  teamsApi,
  playersApi,
  gamesApi,
  playoffsApi,
  playoffMatchesApi,
  seasonsApi,
  playerTeamsApi,
  playerGameStatsApi,
  playerSeasonStatsApi,
  teamSeasonStatsApi,
  announcementsApi,
  photosApi,
  dataApi,
} from '../core/services/api';
import { recalculateAllStats } from '../core/services/statsRecalculation';

interface DataState {
  teams: Team[];
  players: Player[];
  games: Game[];
  playoffs: Playoff[];
  playoffMatches: PlayoffMatch[];
  seasons: Season[];
  playerTeams: PlayerTeam[];
  playerGameStats: PlayerGameStats[];
  playerSeasonStats: PlayerSeasonStats[];
  teamSeasonStats: TeamSeasonStats[];
  announcements: Announcement[];
  photos: Photo[];
  activeSeason: Season | null;
  loading: boolean;
}

interface DataContextType {
  // State
  teams: Team[];
  players: Player[];
  games: Game[];
  playoffs: Playoff[];
  playoffMatches: PlayoffMatch[];
  seasons: Season[];
  playerTeams: PlayerTeam[];
  playerGameStats: PlayerGameStats[];
  playerSeasonStats: PlayerSeasonStats[];
  teamSeasonStats: TeamSeasonStats[];
  announcements: Announcement[];
  photos: Photo[];
  activeSeason: Season | null;
  loading: boolean;

  // Team operations
  getTeams: () => Promise<Team[]>;
  getTeamById: (id: string) => Promise<Team | null>;
  createTeam: (team: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team>;
  deleteTeam: (id: string) => Promise<boolean>;

  // Player operations
  getPlayers: () => Promise<Player[]>;
  getPlayerById: (id: string) => Promise<Player | null>;
  createPlayer: (player: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Player>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<Player>;
  deletePlayer: (id: string) => Promise<boolean>;

  // Game operations
  getGames: () => Promise<Game[]>;
  getGameById: (id: string) => Promise<Game | null>;
  createGame: (game: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Game>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<Game>;
  deleteGame: (id: string) => Promise<boolean>;

  // Season operations
  getSeasons: () => Promise<Season[]>;
  getSeasonById: (id: string) => Promise<Season | null>;
  createSeason: (season: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Season>;
  updateSeason: (id: string, updates: Partial<Season>) => Promise<Season>;
  deleteSeason: (id: string) => Promise<boolean>;

  // PlayerTeam operations (roster management)
  getPlayerTeams: () => Promise<PlayerTeam[]>;
  getTeamRoster: (teamId: string, seasonId: string) => Promise<PlayerTeam[]>;
  createPlayerTeam: (playerTeam: Omit<PlayerTeam, 'id' | 'createdAt' | 'updatedAt'>) => Promise<PlayerTeam>;
  updatePlayerTeam: (id: string, updates: Partial<PlayerTeam>) => Promise<PlayerTeam>;
  deletePlayerTeam: (id: string) => Promise<boolean>;

  // Playoff operations
  getPlayoffs: () => Promise<Playoff[]>;
  getPlayoffById: (id: string) => Promise<Playoff | null>;
  createPlayoff: (playoff: Omit<Playoff, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Playoff>;
  updatePlayoff: (id: string, updates: Partial<Playoff>) => Promise<Playoff>;
  deletePlayoff: (id: string) => Promise<boolean>;

  // Playoff Match operations
  getPlayoffMatches: (playoffId: string) => PlayoffMatch[];
  createPlayoffMatch: (match: Omit<PlayoffMatch, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ApiResponse<PlayoffMatch>>;
  updatePlayoffMatch: (id: string, updates: Partial<PlayoffMatch>) => Promise<ApiResponse<PlayoffMatch>>;
  deletePlayoffMatch: (id: string) => Promise<ApiResponse<boolean>>;

  // Announcement operations
  getAnnouncements: () => Promise<Announcement[]>;
  getAnnouncementById: (id: string) => Promise<Announcement | null>;
  getActiveAnnouncement: (seasonId: string) => Promise<Announcement | null>;
  createAnnouncement: (announcement: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Announcement>;
  updateAnnouncement: (id: string, updates: Partial<Announcement>) => Promise<Announcement>;
  deleteAnnouncement: (id: string) => Promise<boolean>;

  // Photo operations
  getPhotos: () => Promise<Photo[]>;
  getPhotoById: (id: string) => Promise<Photo | null>;
  getFeaturedPhoto: (seasonId: string) => Promise<Photo | null>;
  createPhoto: (photo: Omit<Photo, 'id' | 'uploadedAt'>) => Promise<Photo>;
  updatePhoto: (id: string, updates: Partial<Photo>) => Promise<Photo>;
  deletePhoto: (id: string) => Promise<boolean>;

  // Data management
  exportData: () => Promise<any>;
  importData: (data: any) => Promise<boolean>;
  resetToDemo: () => Promise<boolean>;
  refreshData: () => Promise<void>;
  recalculateStats: () => Promise<void>;
}

// Removed localStorage keys - now using Supabase

// Game validation functions
const validateGameData = (gameData: Partial<Game>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for negative scores
  if (gameData.homeScore !== undefined && gameData.homeScore < 0) {
    errors.push('Home team score cannot be negative');
  }
  if (gameData.awayScore !== undefined && gameData.awayScore < 0) {
    errors.push('Away team score cannot be negative');
  }

  // Check for whole numbers only
  if (gameData.homeScore !== undefined && !Number.isInteger(gameData.homeScore)) {
    errors.push('Home team score must be a whole number');
  }
  if (gameData.awayScore !== undefined && !Number.isInteger(gameData.awayScore)) {
    errors.push('Away team score must be a whole number');
  }

  // Check that teams are not playing themselves
  if (gameData.homeTeamId && gameData.awayTeamId && gameData.homeTeamId === gameData.awayTeamId) {
    errors.push('A team cannot play against itself');
  }

  return { valid: errors.length === 0, errors };
};

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<DataState>({
    teams: [],
    players: [],
    games: [],
    playoffs: [],
    playoffMatches: [],
    seasons: [],
    playerTeams: [],
    playerGameStats: [],
    playerSeasonStats: [],
    teamSeasonStats: [],
    announcements: [],
    photos: [],
    activeSeason: null,
    loading: false,
  });

  // Initialize data on mount
  useEffect(() => {
    const initialize = async () => {
      console.log('DataContext: Initializing data from Supabase...');
      await loadAllData();
      console.log('DataContext: Data initialization complete');
    };
    initialize();
  }, []);

  const loadAllData = async () => {
    setState((prev) => ({ ...prev, loading: true }));
    try {
      console.log('DataContext: Loading data from Supabase...');

      // Fetch all data from Supabase
      const [
        teamsResponse,
        playersResponse,
        gamesResponse,
        playoffsResponse,
        playoffMatchesResponse,
        seasonsResponse,
        playerTeamsResponse,
        playerGameStatsResponse,
        playerSeasonStatsResponse,
        teamSeasonStatsResponse,
        announcementsResponse,
        photosResponse,
        activeSeasonResponse,
      ] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        gamesApi.getAll(),
        playoffsApi.getAll(),
        playoffMatchesApi.getAll(),
        seasonsApi.getAll(),
        playerTeamsApi.getAll(),
        playerGameStatsApi.getAll(),
        playerSeasonStatsApi.getAll(),
        teamSeasonStatsApi.getAll(),
        announcementsApi.getAll(),
        photosApi.getAll(),
        seasonsApi.getActive(),
      ]);

      const teams = teamsResponse.data || [];
      const players = playersResponse.data || [];
      const games = gamesResponse.data || [];
      const playoffs = playoffsResponse.data || [];
      const playoffMatches = playoffMatchesResponse.data || [];
      const seasons = seasonsResponse.data || [];
      const playerTeams = playerTeamsResponse.data || [];
      const playerGameStats = playerGameStatsResponse.data || [];
      const playerSeasonStats = playerSeasonStatsResponse.data || [];
      const teamSeasonStats = teamSeasonStatsResponse.data || [];
      const announcements = announcementsResponse.data || [];
      const photos = photosResponse.data || [];
      const activeSeason = activeSeasonResponse.data || null;

      console.log(
        'DataContext: Data loaded from Supabase - Teams:',
        teams.length,
        'Players:',
        players.length,
        'Games:',
        games.length,
        'Playoffs:',
        playoffs.length,
        'PlayoffMatches:',
        playoffMatches.length,
        'Seasons:',
        seasons.length,
        'PlayerTeams:',
        playerTeams.length,
        'PlayerGameStats:',
        playerGameStats.length,
        'PlayerSeasonStats:',
        playerSeasonStats.length,
        'TeamSeasonStats:',
        teamSeasonStats.length,
        'Announcements:',
        announcements.length,
        'Photos:',
        photos.length,
        'Active Season:',
        activeSeason?.name || 'None'
      );

      setState({
        teams,
        players,
        games,
        playoffs,
        playoffMatches,
        seasons,
        playerTeams,
        playerGameStats,
        playerSeasonStats,
        teamSeasonStats,
        announcements,
        photos,
        activeSeason,
        loading: false,
      });

      console.log('DataContext: State updated with Supabase data');
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  const refreshData = useCallback(async () => {
    await loadAllData();
  }, []);

  // Team operations
  const getTeams = async (): Promise<Team[]> => {
    return state.teams;
  };

  const getTeamById = async (id: string): Promise<Team | null> => {
    const response = await teamsApi.getById(id);
    return response.data;
  };

  const createTeam = async (teamData: Omit<Team, 'id' | 'createdAt' | 'updatedAt'>): Promise<Team> => {
    const response = await teamsApi.create(teamData);
    if (response.success && response.data) {
      const updatedTeams = [...state.teams, response.data];
      setState(prev => ({ ...prev, teams: updatedTeams }));
      return response.data;
    }
    throw new Error(response.message || 'Failed to create team');
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<Team> => {
    const response = await teamsApi.update(id, updates);
    if (response.success && response.data) {
      const updatedTeams = state.teams.map(team =>
        team.id === id ? response.data! : team
      );
      setState(prev => ({ ...prev, teams: updatedTeams }));
      return response.data;
    }
    throw new Error(response.message || 'Failed to update team');
  };

  const deleteTeam = async (id: string): Promise<boolean> => {
    const response = await teamsApi.delete(id);
    if (response.success) {
      const updatedTeams = state.teams.filter(team => team.id !== id);
      setState(prev => ({ ...prev, teams: updatedTeams }));
      return true;
    }
    throw new Error(response.message || 'Failed to delete team');
  };

  // Player operations
  const getPlayers = async (): Promise<Player[]> => {
    return state.players;
  };

  const getPlayerById = async (id: string): Promise<Player | null> => {
    const response = await playersApi.getById(id);
    return response.data;
  };

  const createPlayer = async (playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'>): Promise<Player> => {
    const response = await playersApi.create(playerData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create player');
  };

  const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player> => {
    const response = await playersApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update player');
  };

  const deletePlayer = async (id: string): Promise<boolean> => {
    const response = await playersApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete player');
  };

  // Game operations
  const getGames = async (): Promise<Game[]> => {
    return state.games;
  };

  const getGameById = async (id: string): Promise<Game | null> => {
    const response = await gamesApi.getById(id);
    return response.data;
  };

  const createGame = async (gameData: Omit<Game, 'id' | 'createdAt' | 'updatedAt'>): Promise<Game> => {
    // Validate game data
    const validation = validateGameData(gameData);
    if (!validation.valid) {
      throw new Error(`Game validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await gamesApi.create(gameData);
    if (response.success && response.data) {
      await refreshData();
      // If game is completed, recalculate stats (async, don't wait)
      if (response.data.status === 'completed') {
        recalculateStats().catch(err => console.error('Failed to recalculate stats after game creation:', err));
      }
      return response.data;
    }
    throw new Error(response.message || 'Failed to create game');
  };

  const updateGame = async (id: string, updates: Partial<Game>): Promise<Game> => {
    // Validate updates
    const validation = validateGameData(updates);
    if (!validation.valid) {
      throw new Error(`Game validation failed: ${validation.errors.join(', ')}`);
    }

    const response = await gamesApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      // If game is completed or was just completed, recalculate stats (async, don't wait)
      if (response.data.status === 'completed' || updates.status === 'completed') {
        recalculateStats().catch(err => console.error('Failed to recalculate stats after game update:', err));
      }
      return response.data;
    }
    throw new Error(response.message || 'Failed to update game');
  };

  const deleteGame = async (id: string): Promise<boolean> => {
    const response = await gamesApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete game');
  };

  // Season operations
  const getSeasons = async (): Promise<Season[]> => {
    return state.seasons;
  };

  const getSeasonById = async (id: string): Promise<Season | null> => {
    const response = await seasonsApi.getById(id);
    return response.data;
  };

  const createSeason = async (seasonData: Omit<Season, 'id' | 'createdAt' | 'updatedAt'>): Promise<Season> => {
    const response = await seasonsApi.create(seasonData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create season');
  };

  const updateSeason = async (id: string, updates: Partial<Season>): Promise<Season> => {
    const response = await seasonsApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update season');
  };

  const deleteSeason = async (id: string): Promise<boolean> => {
    const response = await seasonsApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete season');
  };

  // PlayerTeam operations (roster management)
  const getPlayerTeams = async (): Promise<PlayerTeam[]> => {
    return state.playerTeams;
  };

  const getTeamRoster = async (teamId: string, seasonId: string): Promise<PlayerTeam[]> => {
    const response = await playerTeamsApi.getByTeam(teamId, seasonId);
    return response.data || [];
  };

  const createPlayerTeam = async (
    playerTeamData: Omit<PlayerTeam, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<PlayerTeam> => {
    const response = await playerTeamsApi.create(playerTeamData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create player team');
  };

  const updatePlayerTeam = async (id: string, updates: Partial<PlayerTeam>): Promise<PlayerTeam> => {
    const response = await playerTeamsApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update player team');
  };

  const deletePlayerTeam = async (id: string): Promise<boolean> => {
    const response = await playerTeamsApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete player team');
  };

  // Playoff operations
  const getPlayoffs = async (): Promise<Playoff[]> => {
    return state.playoffs;
  };

  const getPlayoffById = async (id: string): Promise<Playoff | null> => {
    const response = await playoffsApi.getById(id);
    return response.data;
  };

  const createPlayoff = async (
    playoffData: Omit<Playoff, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Playoff> => {
    const response = await playoffsApi.create(playoffData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create playoff');
  };

  const updatePlayoff = async (id: string, updates: Partial<Playoff>): Promise<Playoff> => {
    const response = await playoffsApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update playoff');
  };

  const deletePlayoff = async (id: string): Promise<boolean> => {
    const response = await playoffsApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete playoff');
  };

  // Playoff Match operations
  const getPlayoffMatches = useCallback((playoffId: string) => {
    return state.playoffMatches.filter(m => m.playoffId === playoffId);
  }, [state.playoffMatches]);

  const createPlayoffMatch = useCallback(async (match: Omit<PlayoffMatch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const result = await playoffMatchesApi.create(match);
    if (result.success) {
      await refreshData();
    }
    return result;
  }, [refreshData]);

  const updatePlayoffMatch = useCallback(async (id: string, updates: Partial<PlayoffMatch>) => {
    const result = await playoffMatchesApi.update(id, updates);
    if (result.success) {
      await refreshData();
    }
    return result;
  }, [refreshData]);

  const deletePlayoffMatch = useCallback(async (id: string) => {
    const result = await playoffMatchesApi.delete(id);
    if (result.success) {
      await refreshData();
    }
    return result;
  }, [refreshData]);

  // Data management
  const exportData = async (): Promise<any> => {
    const response = await dataApi.exportAll();
    if (response.success) {
      return response.data;
    }
    throw new Error(response.message || 'Failed to export data');
  };

  const importData = async (data: any): Promise<boolean> => {
    try {
      // This would call an importAll API if it existed
      // For now, just reload data
      await loadAllData();
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  const resetToDemo = async (): Promise<boolean> => {
    try {
      const response = await dataApi.resetAll();
      if (response.success) {
        await loadAllData();
        return true;
      }
      throw new Error(response.message || 'Failed to reset data');
    } catch (error) {
      console.error('Failed to reset data:', error);
      return false;
    }
  };

  const recalculateStats = async (): Promise<void> => {
    try {
      console.log('Recalculating all stats...');
      await recalculateAllStats(state.games, state.players, state.playerTeams, state.seasons);
      // Reload data to get updated stats
      await loadAllData();
      console.log('Stats recalculation complete!');
    } catch (error) {
      console.error('Failed to recalculate stats:', error);
      throw error;
    }
  };

  // Announcement operations
  const getAnnouncements = async (): Promise<Announcement[]> => {
    return state.announcements;
  };

  const getAnnouncementById = async (id: string): Promise<Announcement | null> => {
    const response = await announcementsApi.getById(id);
    return response.data;
  };

  const getActiveAnnouncement = async (seasonId: string): Promise<Announcement | null> => {
    const response = await announcementsApi.getActive(seasonId);
    return response.data;
  };

  const createAnnouncement = async (
    announcementData: Omit<Announcement, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Announcement> => {
    const response = await announcementsApi.create(announcementData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create announcement');
  };

  const updateAnnouncement = async (id: string, updates: Partial<Announcement>): Promise<Announcement> => {
    const response = await announcementsApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update announcement');
  };

  const deleteAnnouncement = async (id: string): Promise<boolean> => {
    const response = await announcementsApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete announcement');
  };

  // Photo operations
  const getPhotos = async (): Promise<Photo[]> => {
    return state.photos;
  };

  const getPhotoById = async (id: string): Promise<Photo | null> => {
    const response = await photosApi.getById(id);
    return response.data;
  };

  const getFeaturedPhoto = async (seasonId: string): Promise<Photo | null> => {
    const response = await photosApi.getFeatured(seasonId);
    return response.data;
  };

  const createPhoto = async (
    photoData: Omit<Photo, 'id' | 'uploadedAt'>
  ): Promise<Photo> => {
    const response = await photosApi.create(photoData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create photo');
  };

  const updatePhoto = async (id: string, updates: Partial<Photo>): Promise<Photo> => {
    const response = await photosApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update photo');
  };

  const deletePhoto = async (id: string): Promise<boolean> => {
    const response = await photosApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete photo');
  };

  const contextValue: DataContextType = {
    // State
    teams: state.teams,
    players: state.players,
    games: state.games,
    playoffs: state.playoffs,
    playoffMatches: state.playoffMatches,
    seasons: state.seasons,
    playerTeams: state.playerTeams,
    playerGameStats: state.playerGameStats,
    playerSeasonStats: state.playerSeasonStats,
    teamSeasonStats: state.teamSeasonStats,
    announcements: state.announcements,
    photos: state.photos,
    activeSeason: state.activeSeason,
    loading: state.loading,

    // Team operations
    getTeams,
    getTeamById,
    createTeam,
    updateTeam,
    deleteTeam,

    // Player operations
    getPlayers,
    getPlayerById,
    createPlayer,
    updatePlayer,
    deletePlayer,

    // Game operations
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,

    // Season operations
    getSeasons,
    getSeasonById,
    createSeason,
    updateSeason,
    deleteSeason,

    // PlayerTeam operations
    getPlayerTeams,
    getTeamRoster,
    createPlayerTeam,
    updatePlayerTeam,
    deletePlayerTeam,

    // Playoff operations
    getPlayoffs,
    getPlayoffById,
    createPlayoff,
    updatePlayoff,
    deletePlayoff,

    // Playoff Match operations
    getPlayoffMatches,
    createPlayoffMatch,
    updatePlayoffMatch,
    deletePlayoffMatch,

    // Announcement operations
    getAnnouncements,
    getAnnouncementById,
    getActiveAnnouncement,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,

    // Photo operations
    getPhotos,
    getPhotoById,
    getFeaturedPhoto,
    createPhoto,
    updatePhoto,
    deletePhoto,

    // Data management
    exportData,
    importData,
    resetToDemo,
    refreshData,
    recalculateStats,
  };

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
