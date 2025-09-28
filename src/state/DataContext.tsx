import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Team, Player, Game, Tournament } from '../core/types';
import { mockTeams, mockPlayers, generateMockGames, generateMockTournament, mockAnnouncements } from '../core/data/mockData';
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

const STORAGE_KEYS = {
  teams: 'bbdl-teams',
  players: 'bbdl-players',
  games: 'bbdl-games',
  tournaments: 'bbdl-tournaments',
  announcements: 'bbdl-announcements'
};

// Simulate API delay
const delay = (ms: number = 100) => new Promise(resolve => setTimeout(resolve, ms));

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
      console.log('DataContext: Initializing data...');
      initializeData();
      await loadAllData();
      console.log('DataContext: Data initialization complete');
    };
    initialize();
  }, []);

  const initializeData = () => {
    if (!localStorage.getItem(STORAGE_KEYS.teams)) {
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(mockTeams));
    }
    if (!localStorage.getItem(STORAGE_KEYS.players)) {
      localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(mockPlayers));
    }
    if (!localStorage.getItem(STORAGE_KEYS.games)) {
      localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(generateMockGames()));
    }
    if (!localStorage.getItem(STORAGE_KEYS.tournaments)) {
      localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify([generateMockTournament()]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.announcements)) {
      localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(mockAnnouncements));
    }
  };

  const loadAllData = async () => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      console.log('DataContext: Loading data from localStorage...');
      const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
      const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
      const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
      const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
      const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || '[]');
      
      console.log('DataContext: Raw data loaded - Teams:', teams.length, 'Players:', players.length, 'Games:', games.length, 'Tournaments:', tournaments.length, 'Announcements:', announcements.length);

      // Convert date strings back to Date objects
      const gamesWithDates = games.map((game: any) => ({
        ...game,
        scheduledDate: new Date(game.scheduledDate),
        completedDate: game.completedDate ? new Date(game.completedDate) : undefined
      }));

      const tournamentsWithDates = tournaments.map((tournament: any) => ({
        ...tournament,
        createdDate: new Date(tournament.createdDate),
        completedDate: tournament.completedDate ? new Date(tournament.completedDate) : undefined
      }));

      const announcementsWithDates = announcements.map((announcement: any) => ({
        ...announcement,
        date: new Date(announcement.date)
      }));

      // Keep teams as-is, ensure players have stats property (even if empty initially)
      const updatedTeams = teams;
      const updatedPlayers = players.map((player: Player) => ({
        ...player,
        stats: player.stats || {
          wins: 0,
          losses: 0,
          gamesPlayed: 0,
          totalPoints: 0,
          averagePoints: 0,
          shutouts: 0,
          blowoutWins: 0,
          clutchWins: 0,
          longestWinStreak: 0,
          currentWinStreak: 0
        }
      }));

      setState({
        teams: updatedTeams,
        players: updatedPlayers,
        games: gamesWithDates,
        tournaments: tournamentsWithDates,
        announcements: announcementsWithDates,
        loading: false
      });
      
      console.log('DataContext: State updated with processed data - Teams:', updatedTeams.length, 'Players:', updatedPlayers.length, 'Games:', gamesWithDates.length, 'Tournaments:', tournamentsWithDates.length, 'Announcements:', announcementsWithDates.length);
      
      // Initialize stats system with loaded data
      recalculateAllStats(gamesWithDates, updatedPlayers, updatedTeams);
    } catch (error) {
      console.error('Failed to load data:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const refreshData = async () => {
    await loadAllData();
  };

  const recalculateStats = async () => {
    await delay();
    recalculateAllStats(state.games, state.players, state.teams);
  };

  // Team operations
  const getTeams = async (): Promise<Team[]> => {
    await delay();
    return state.teams;
  };

  const getTeamById = async (id: string): Promise<Team | null> => {
    await delay();
    return state.teams.find(team => team.id === id) || null;
  };

  const createTeam = async (teamData: Omit<Team, 'id'>): Promise<Team> => {
    await delay();
    const newTeam: Team = {
      ...teamData,
      id: `team-${Date.now()}`
    };
    
    const updatedTeams = [...state.teams, newTeam];
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    setState(prev => ({ ...prev, teams: updatedTeams }));
    
    return newTeam;
  };

  const updateTeam = async (id: string, updates: Partial<Team>): Promise<Team> => {
    await delay();
    const updatedTeams = state.teams.map(team =>
      team.id === id ? { ...team, ...updates } : team
    );
    
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    setState(prev => ({ ...prev, teams: updatedTeams }));
    
    const updatedTeam = updatedTeams.find(team => team.id === id)!;
    return updatedTeam;
  };

  const deleteTeam = async (id: string): Promise<boolean> => {
    await delay();
    const updatedTeams = state.teams.filter(team => team.id !== id);
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    setState(prev => ({ ...prev, teams: updatedTeams }));
    return true;
  };

  // Player operations
  const getPlayers = async (): Promise<Player[]> => {
    await delay();
    return state.players;
  };

  const getPlayerById = async (id: string): Promise<Player | null> => {
    await delay();
    return state.players.find(player => player.id === id) || null;
  };

  const getPlayersByTeam = async (teamId: string): Promise<Player[]> => {
    await delay();
    return state.players.filter(player => player.teamId === teamId);
  };

  const createPlayer = async (playerData: Omit<Player, 'id'>): Promise<Player> => {
    await delay();
    const newPlayer: Player = {
      ...playerData,
      id: `player-${Date.now()}`
    };
    
    const updatedPlayers = [...state.players, newPlayer];
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(updatedPlayers));
    
    // Update team players list
    const updatedTeams = state.teams.map(team =>
      team.id === playerData.teamId
        ? { ...team, players: [...team.players, newPlayer.id] }
        : team
    );
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    
    setState(prev => ({ 
      ...prev, 
      players: updatedPlayers,
      teams: updatedTeams
    }));
    
    return newPlayer;
  };

  const updatePlayer = async (id: string, updates: Partial<Player>): Promise<Player> => {
    await delay();
    const oldPlayer = state.players.find(p => p.id === id);
    const updatedPlayers = state.players.map(player =>
      player.id === id ? { ...player, ...updates } : player
    );
    
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(updatedPlayers));
    
    // Update team players lists if team changed
    let updatedTeams = state.teams;
    if (updates.teamId && oldPlayer && updates.teamId !== oldPlayer.teamId) {
      updatedTeams = state.teams.map(team => {
        if (team.id === oldPlayer.teamId) {
          return { ...team, players: team.players.filter(pid => pid !== id) };
        }
        if (team.id === updates.teamId) {
          return { ...team, players: [...team.players, id] };
        }
        return team;
      });
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    }
    
    setState(prev => ({ 
      ...prev, 
      players: updatedPlayers,
      teams: updatedTeams
    }));
    
    const updatedPlayer = updatedPlayers.find(player => player.id === id)!;
    return updatedPlayer;
  };

  const deletePlayer = async (id: string): Promise<boolean> => {
    await delay();
    const player = state.players.find(p => p.id === id);
    const updatedPlayers = state.players.filter(player => player.id !== id);
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(updatedPlayers));
    
    // Remove from team players list
    let updatedTeams = state.teams;
    if (player) {
      updatedTeams = state.teams.map(team =>
        team.id === player.teamId
          ? { ...team, players: team.players.filter(pid => pid !== id) }
          : team
      );
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    }
    
    setState(prev => ({ 
      ...prev, 
      players: updatedPlayers,
      teams: updatedTeams
    }));
    return true;
  };

  // Game operations
  const getGames = async (): Promise<Game[]> => {
    await delay();
    return state.games;
  };

  const getGameById = async (id: string): Promise<Game | null> => {
    await delay();
    return state.games.find(game => game.id === id) || null;
  };

  const createGame = async (gameData: Omit<Game, 'id'>): Promise<Game> => {
    await delay();
    
    // Validate game data
    const validation = validateGameData(gameData);
    if (!validation.valid) {
      throw new Error(`Game validation failed: ${validation.errors.join(', ')}`);
    }
    
    const newGame: Game = {
      ...gameData,
      id: `game-${Date.now()}`
    };
    
    const updatedGames = [...state.games, newGame];
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(updatedGames));
    setState(prev => ({ ...prev, games: updatedGames }));
    
    // Recalculate stats if this is a completed game
    if (newGame.status === 'completed') {
      recalculateAllStats(updatedGames, state.players, state.teams);
    }
    
    return newGame;
  };

  const updateGame = async (id: string, updates: Partial<Game>): Promise<Game> => {
    await delay();
    
    // Validate updates
    const validation = validateGameData(updates);
    if (!validation.valid) {
      throw new Error(`Game validation failed: ${validation.errors.join(', ')}`);
    }
    
    const originalGame = state.games.find(game => game.id === id);
    if (!originalGame) {
      throw new Error(`Game with ID ${id} not found`);
    }
    
    const updatedGames = state.games.map(game => {
      if (game.id === id) {
        const updatedGame = { ...game, ...updates };
        
        // Handle score updates and determine winner
        if (updates.team1Score !== undefined && updates.team2Score !== undefined) {
          const team1Score = updates.team1Score;
          const team2Score = updates.team2Score;
          const scoreDiff = Math.abs(team1Score - team2Score);
          
          updatedGame.winnerId = team1Score > team2Score ? game.team1Id : game.team2Id;
          updatedGame.isBlowout = scoreDiff >= 10; // Use our constant
          updatedGame.isClutch = scoreDiff <= 2;
          updatedGame.isShutout = team1Score === 0 || team2Score === 0;
          updatedGame.status = 'completed';
          updatedGame.completedDate = new Date();
        }
        
        return updatedGame;
      }
      return game;
    });
    
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(updatedGames));
    setState(prev => ({ ...prev, games: updatedGames }));
    
    // Recalculate stats if the game is now completed or scores were updated
    const updatedGame = updatedGames.find(game => game.id === id)!;
    if (updatedGame.status === 'completed' || 
        (updates.team1Score !== undefined || updates.team2Score !== undefined)) {
      recalculateAllStats(updatedGames, state.players, state.teams);
    }
    
    return updatedGame;
  };

  const deleteGame = async (id: string): Promise<boolean> => {
    await delay();
    const updatedGames = state.games.filter(game => game.id !== id);
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(updatedGames));
    setState(prev => ({ ...prev, games: updatedGames }));
    
    // Recalculate stats after game deletion
    recalculateAllStats(updatedGames, state.players, state.teams);
    
    return true;
  };

  // Tournament operations
  const getTournaments = async (): Promise<Tournament[]> => {
    await delay();
    return state.tournaments;
  };

  const getTournamentById = async (id: string): Promise<Tournament | null> => {
    await delay();
    return state.tournaments.find(tournament => tournament.id === id) || null;
  };

  const createTournament = async (tournamentData: Omit<Tournament, 'id'>): Promise<Tournament> => {
    await delay();
    const newTournament: Tournament = {
      ...tournamentData,
      id: `tournament-${Date.now()}`
    };
    
    const updatedTournaments = [...state.tournaments, newTournament];
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(updatedTournaments));
    setState(prev => ({ ...prev, tournaments: updatedTournaments }));
    
    return newTournament;
  };

  const updateTournament = async (id: string, updates: Partial<Tournament>): Promise<Tournament> => {
    await delay();
    const updatedTournaments = state.tournaments.map(tournament =>
      tournament.id === id ? { ...tournament, ...updates } : tournament
    );
    
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(updatedTournaments));
    setState(prev => ({ ...prev, tournaments: updatedTournaments }));
    
    const updatedTournament = updatedTournaments.find(tournament => tournament.id === id)!;
    return updatedTournament;
  };

  const deleteTournament = async (id: string): Promise<boolean> => {
    await delay();
    const updatedTournaments = state.tournaments.filter(tournament => tournament.id !== id);
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(updatedTournaments));
    setState(prev => ({ ...prev, tournaments: updatedTournaments }));
    return true;
  };

  // Announcements
  const getAnnouncements = async (): Promise<any[]> => {
    await delay();
    return state.announcements;
  };

  // Data management
  const exportData = async (): Promise<any> => {
    await delay();
    const data = {
      teams: state.teams,
      players: state.players,
      games: state.games,
      tournaments: state.tournaments,
      announcements: state.announcements,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };
    return data;
  };

  const importData = async (data: any): Promise<boolean> => {
    await delay();
    try {
      if (data.teams) {
        localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(data.teams));
      }
      if (data.players) {
        localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(data.players));
      }
      if (data.games) {
        localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(data.games));
      }
      if (data.tournaments) {
        localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(data.tournaments));
      }
      if (data.announcements) {
        localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(data.announcements));
      }
      
      await loadAllData(); // Refresh state
      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  };

  const resetToDemo = async (): Promise<boolean> => {
    await delay();
    try {
      // Clear existing data
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      
      // Initialize with fresh demo data
      initializeData();
      await loadAllData();
      return true;
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
