import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team, Player, Game, Tournament } from '../core/types';
import { teamsApi, playersApi, gamesApi, tournamentsApi, announcementsApi, dataApi } from '../core/services/api';
import { recalculateAllStats } from '../core/services/stats';

interface DataState {
  teams: Team[];
  players: Player[];
  games: Game[];
  tournaments: Tournament[];
  announcements: any[];
  loading: boolean;
}

interface DataContextType {
  // State
  teams: Team[];
  players: Player[];
  games: Game[];
  tournaments: Tournament[];
  announcements: any[];
  loading: boolean;

  // Team operations
  getTeams: () => Promise<Team[]>;
  getTeamById: (id: string) => Promise<Team | null>;
  createTeam: (team: Omit<Team, 'id'>) => Promise<Team>;
  updateTeam: (id: string, updates: Partial<Team>) => Promise<Team>;
  deleteTeam: (id: string) => Promise<boolean>;

  // Player operations
  getPlayers: () => Promise<Player[]>;
  getPlayerById: (id: string) => Promise<Player | null>;
  getPlayersByTeam: (teamId: string) => Promise<Player[]>;
  createPlayer: (player: Omit<Player, 'id'>) => Promise<Player>;
  updatePlayer: (id: string, updates: Partial<Player>) => Promise<Player>;
  deletePlayer: (id: string) => Promise<boolean>;

  // Game operations
  getGames: () => Promise<Game[]>;
  getGameById: (id: string) => Promise<Game | null>;
  createGame: (game: Omit<Game, 'id'>) => Promise<Game>;
  updateGame: (id: string, updates: Partial<Game>) => Promise<Game>;
  deleteGame: (id: string) => Promise<boolean>;

  // Tournament operations
  getTournaments: () => Promise<Tournament[]>;
  getTournamentById: (id: string) => Promise<Tournament | null>;
  createTournament: (tournament: Omit<Tournament, 'id'>) => Promise<Tournament>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<Tournament>;
  deleteTournament: (id: string) => Promise<boolean>;

  // Announcements
  getAnnouncements: () => Promise<any[]>;

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
  if (gameData.team1Score !== undefined && gameData.team1Score < 0) {
    errors.push('Team 1 score cannot be negative');
  }
  if (gameData.team2Score !== undefined && gameData.team2Score < 0) {
    errors.push('Team 2 score cannot be negative');
  }

  // Check for whole numbers only
  if (gameData.team1Score !== undefined && !Number.isInteger(gameData.team1Score)) {
    errors.push('Team 1 score must be a whole number');
  }
  if (gameData.team2Score !== undefined && !Number.isInteger(gameData.team2Score)) {
    errors.push('Team 2 score must be a whole number');
  }

  // Check that teams are not playing themselves
  if (gameData.team1Id && gameData.team2Id && gameData.team1Id === gameData.team2Id) {
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
    tournaments: [],
    announcements: [],
    loading: false
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
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('DataContext: Loading data from Supabase...');
      
      // Fetch all data from Supabase
      const [teamsResponse, playersResponse, gamesResponse, tournamentsResponse, announcementsResponse] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        gamesApi.getAll(),
        tournamentsApi.getAll(),
        announcementsApi.getAll()
      ]);

      const teams = teamsResponse.data || [];
      const players = playersResponse.data || [];
      const games = gamesResponse.data || [];
      const tournaments = tournamentsResponse.data || [];
      const announcements = announcementsResponse.data || [];
      
      console.log('DataContext: Data loaded from Supabase - Teams:', teams.length, 'Players:', players.length, 'Games:', games.length, 'Tournaments:', tournaments.length, 'Announcements:', announcements.length);

      setState({
        teams,
        players,
        games,
        tournaments,
        announcements,
        loading: false
      });
      
      console.log('DataContext: State updated with Supabase data');
      
      // Initialize stats system with loaded data
      if (games.length > 0) {
        recalculateAllStats(games, players, teams);
      }
    } catch (error) {
      console.error('Failed to load data from Supabase:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const recalculateStats = async () => {
    recalculateAllStats(state.games, state.players, state.teams);
  };

  // Team operations
  const getTeams = async (): Promise<Team[]> => {
    return state.teams;
  };

  const getTeamById = async (id: string): Promise<Team | null> => {
    const response = await teamsApi.getById(id);
    return response.data;
  };

  const createTeam = async (teamData: Omit<Team, 'id'>): Promise<Team> => {
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

  const getPlayersByTeam = async (teamId: string): Promise<Player[]> => {
    const response = await playersApi.getByTeam(teamId);
    return response.data || [];
  };

  const createPlayer = async (playerData: Omit<Player, 'id'>): Promise<Player> => {
    const response = await playersApi.create(playerData);
    if (response.success && response.data) {
      await refreshData(); // Refresh to get updated teams and players
      return response.data;
    }
    throw new Error(response.message || 'Failed to create player');
  };

  const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player> => {
    const response = await playersApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData(); // Refresh to get updated teams and players
      return response.data;
    }
    throw new Error(response.message || 'Failed to update player');
  };

  const deletePlayer = async (id: string): Promise<boolean> => {
    const response = await playersApi.delete(id);
    if (response.success) {
      await refreshData(); // Refresh to get updated teams and players
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

  const createGame = async (gameData: Omit<Game, 'id'>): Promise<Game> => {
    // Validate game data
    const validation = validateGameData(gameData);
    if (!validation.valid) {
      throw new Error(`Game validation failed: ${validation.errors.join(', ')}`);
    }
    
    const response = await gamesApi.create(gameData);
    if (response.success && response.data) {
      await refreshData(); // Refresh to update games and stats
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
      await refreshData(); // Refresh to update games and stats
      return response.data;
    }
    throw new Error(response.message || 'Failed to update game');
  };

  const deleteGame = async (id: string): Promise<boolean> => {
    const response = await gamesApi.delete(id);
    if (response.success) {
      await refreshData(); // Refresh to update games and stats
      return true;
    }
    throw new Error(response.message || 'Failed to delete game');
  };

  // Tournament operations
  const getTournaments = async (): Promise<Tournament[]> => {
    return state.tournaments;
  };

  const getTournamentById = async (id: string): Promise<Tournament | null> => {
    const response = await tournamentsApi.getById(id);
    return response.data;
  };

  const createTournament = async (tournamentData: Omit<Tournament, 'id'>): Promise<Tournament> => {
    const response = await tournamentsApi.create(tournamentData);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to create tournament');
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<Tournament> => {
    const response = await tournamentsApi.update(id, updates);
    if (response.success && response.data) {
      await refreshData();
      return response.data;
    }
    throw new Error(response.message || 'Failed to update tournament');
  };

  const deleteTournament = async (id: string): Promise<boolean> => {
    const response = await tournamentsApi.delete(id);
    if (response.success) {
      await refreshData();
      return true;
    }
    throw new Error(response.message || 'Failed to delete tournament');
  };

  // Announcements
  const getAnnouncements = async (): Promise<any[]> => {
    return state.announcements;
  };

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
      const response = await dataApi.importAll(data);
      if (response.success) {
        await loadAllData(); // Refresh state
        return true;
      }
      throw new Error(response.message || 'Failed to import data');
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

  const contextValue: DataContextType = {
    // State
    teams: state.teams,
    players: state.players,
    games: state.games,
    tournaments: state.tournaments,
    announcements: state.announcements,
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
    getPlayersByTeam,
    createPlayer,
    updatePlayer,
    deletePlayer,

    // Game operations
    getGames,
    getGameById,
    createGame,
    updateGame,
    deleteGame,

    // Tournament operations
    getTournaments,
    getTournamentById,
    createTournament,
    updateTournament,
    deleteTournament,

    // Announcements
    getAnnouncements,

    // Data management
    exportData,
    importData,
    resetToDemo,
    refreshData,
    recalculateStats
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
