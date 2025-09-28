import { Team, Player, Game, Tournament, ApiResponse } from '../types';
import { mockTeams, mockPlayers, generateMockGames, generateMockTournament, mockAnnouncements } from '../data/mockData';
import { calculatePlayerStats, calculateTeamStats } from '../utils/statsCalculations';

// Simulate API delay
const delay = (ms: number = 300) => new Promise(resolve => setTimeout(resolve, ms));

// Local storage keys
const STORAGE_KEYS = {
  teams: 'bbdl-teams',
  players: 'bbdl-players',
  games: 'bbdl-games',
  tournaments: 'bbdl-tournaments',
  announcements: 'bbdl-announcements'
};

// Initialize data if not exists
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

// Initialize data on module load
initializeData();

// Teams API
export const teamsApi = {
  async getAll(): Promise<ApiResponse<Team[]>> {
    await delay();
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    
    // Update team stats based on games
    const updatedTeams = teams.map((team: Team) => {
      const teamStats = calculateTeamStats(team, games, teams);
      return {
        ...team,
        wins: teamStats.record.wins,
        losses: teamStats.record.losses,
        totalPoints: teamStats.totalPoints,
        gamesPlayed: teamStats.record.wins + teamStats.record.losses
      };
    });
    
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(updatedTeams));
    
    return {
      data: updatedTeams,
      success: true
    };
  },

  async getById(id: string): Promise<ApiResponse<Team | null>> {
    await delay();
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const team = teams.find((t: Team) => t.id === id) || null;
    return {
      data: team,
      success: true
    };
  },

  async create(team: Omit<Team, 'id'>): Promise<ApiResponse<Team>> {
    await delay();
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const newTeam: Team = {
      ...team,
      id: `team-${Date.now()}`
    };
    teams.push(newTeam);
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
    return {
      data: newTeam,
      success: true
    };
  },

  async update(id: string, updates: Partial<Team>): Promise<ApiResponse<Team>> {
    await delay();
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const index = teams.findIndex((t: Team) => t.id === id);
    if (index === -1) {
      return {
        data: null as any,
        success: false,
        message: 'Team not found'
      };
    }
    teams[index] = { ...teams[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
    return {
      data: teams[index],
      success: true
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay();
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const filteredTeams = teams.filter((t: Team) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(filteredTeams));
    return {
      data: true,
      success: true
    };
  }
};

// Players API
export const playersApi = {
  async getAll(): Promise<ApiResponse<Player[]>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    
    // Update player stats based on games
    const updatedPlayers = players.map((player: Player) => ({
      ...player,
      stats: calculatePlayerStats(player, games)
    }));
    
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(updatedPlayers));
    
    return {
      data: updatedPlayers,
      success: true
    };
  },

  async getById(id: string): Promise<ApiResponse<Player | null>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const player = players.find((p: Player) => p.id === id) || null;
    return {
      data: player,
      success: true
    };
  },

  async getByTeam(teamId: string): Promise<ApiResponse<Player[]>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    
    const teamPlayers = players
      .filter((p: Player) => p.teamId === teamId)
      .map((player: Player) => ({
        ...player,
        stats: calculatePlayerStats(player, games)
      }));
    
    return {
      data: teamPlayers,
      success: true
    };
  },

  async create(player: Omit<Player, 'id'>): Promise<ApiResponse<Player>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const newPlayer: Player = {
      ...player,
      id: `player-${Date.now()}`
    };
    players.push(newPlayer);
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
    
    // Update team players list
    const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
    const teamIndex = teams.findIndex((t: Team) => t.id === player.teamId);
    if (teamIndex !== -1) {
      teams[teamIndex].players.push(newPlayer.id);
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
    }
    
    return {
      data: newPlayer,
      success: true
    };
  },

  async update(id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const index = players.findIndex((p: Player) => p.id === id);
    if (index === -1) {
      return {
        data: null as any,
        success: false,
        message: 'Player not found'
      };
    }
    
    const oldTeamId = players[index].teamId;
    players[index] = { ...players[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(players));
    
    // Update team players lists if team changed
    if (updates.teamId && updates.teamId !== oldTeamId) {
      const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
      
      // Remove from old team
      const oldTeamIndex = teams.findIndex((t: Team) => t.id === oldTeamId);
      if (oldTeamIndex !== -1) {
        teams[oldTeamIndex].players = teams[oldTeamIndex].players.filter((pid: string) => pid !== id);
      }
      
      // Add to new team
      const newTeamIndex = teams.findIndex((t: Team) => t.id === updates.teamId);
      if (newTeamIndex !== -1) {
        teams[newTeamIndex].players.push(id);
      }
      
      localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
    }
    
    return {
      data: players[index],
      success: true
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay();
    const players = JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]');
    const player = players.find((p: Player) => p.id === id);
    const filteredPlayers = players.filter((p: Player) => p.id !== id);
    localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(filteredPlayers));
    
    // Remove from team players list
    if (player) {
      const teams = JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]');
      const teamIndex = teams.findIndex((t: Team) => t.id === player.teamId);
      if (teamIndex !== -1) {
        teams[teamIndex].players = teams[teamIndex].players.filter((pid: string) => pid !== id);
        localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(teams));
      }
    }
    
    return {
      data: true,
      success: true
    };
  }
};

// Games API
export const gamesApi = {
  async getAll(): Promise<ApiResponse<Game[]>> {
    await delay();
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    // Convert date strings back to Date objects
    const gamesWithDates = games.map((game: any) => ({
      ...game,
      scheduledDate: new Date(game.scheduledDate),
      completedDate: game.completedDate ? new Date(game.completedDate) : undefined
    }));
    return {
      data: gamesWithDates,
      success: true
    };
  },

  async getById(id: string): Promise<ApiResponse<Game | null>> {
    await delay();
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    const game = games.find((g: Game) => g.id === id);
    if (game) {
      game.scheduledDate = new Date(game.scheduledDate);
      if (game.completedDate) game.completedDate = new Date(game.completedDate);
    }
    return {
      data: game || null,
      success: true
    };
  },

  async create(game: Omit<Game, 'id'>): Promise<ApiResponse<Game>> {
    await delay();
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    const newGame: Game = {
      ...game,
      id: `game-${Date.now()}`
    };
    games.push(newGame);
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
    return {
      data: newGame,
      success: true
    };
  },

  async update(id: string, updates: Partial<Game>): Promise<ApiResponse<Game>> {
    await delay();
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    const index = games.findIndex((g: Game) => g.id === id);
    if (index === -1) {
      return {
        data: null as any,
        success: false,
        message: 'Game not found'
      };
    }
    
    // Handle score updates and determine winner
    if (updates.team1Score !== undefined && updates.team2Score !== undefined) {
      const team1Score = updates.team1Score;
      const team2Score = updates.team2Score;
      const scoreDiff = Math.abs(team1Score - team2Score);
      
      updates.winnerId = team1Score > team2Score ? games[index].team1Id : games[index].team2Id;
      updates.isBlowout = scoreDiff >= 7;
      updates.isClutch = scoreDiff <= 2;
      updates.isShutout = team1Score === 0 || team2Score === 0;
      updates.status = 'completed';
      updates.completedDate = new Date();
    }
    
    games[index] = { ...games[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(games));
    return {
      data: games[index],
      success: true
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay();
    const games = JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]');
    const filteredGames = games.filter((g: Game) => g.id !== id);
    localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(filteredGames));
    return {
      data: true,
      success: true
    };
  }
};

// Tournaments API
export const tournamentsApi = {
  async getAll(): Promise<ApiResponse<Tournament[]>> {
    await delay();
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
    const tournamentsWithDates = tournaments.map((tournament: any) => ({
      ...tournament,
      createdDate: new Date(tournament.createdDate),
      completedDate: tournament.completedDate ? new Date(tournament.completedDate) : undefined
    }));
    return {
      data: tournamentsWithDates,
      success: true
    };
  },

  async getById(id: string): Promise<ApiResponse<Tournament | null>> {
    await delay();
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
    const tournament = tournaments.find((t: Tournament) => t.id === id);
    if (tournament) {
      tournament.createdDate = new Date(tournament.createdDate);
      if (tournament.completedDate) tournament.completedDate = new Date(tournament.completedDate);
    }
    return {
      data: tournament || null,
      success: true
    };
  },

  async create(tournament: Omit<Tournament, 'id'>): Promise<ApiResponse<Tournament>> {
    await delay();
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
    const newTournament: Tournament = {
      ...tournament,
      id: `tournament-${Date.now()}`
    };
    tournaments.push(newTournament);
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(tournaments));
    return {
      data: newTournament,
      success: true
    };
  },

  async update(id: string, updates: Partial<Tournament>): Promise<ApiResponse<Tournament>> {
    await delay();
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
    const index = tournaments.findIndex((t: Tournament) => t.id === id);
    if (index === -1) {
      return {
        data: null as any,
        success: false,
        message: 'Tournament not found'
      };
    }
    tournaments[index] = { ...tournaments[index], ...updates };
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(tournaments));
    return {
      data: tournaments[index],
      success: true
    };
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    await delay();
    const tournaments = JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]');
    const filteredTournaments = tournaments.filter((t: Tournament) => t.id !== id);
    localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(filteredTournaments));
    return {
      data: true,
      success: true
    };
  }
};

// Announcements API
export const announcementsApi = {
  async getAll(): Promise<ApiResponse<typeof mockAnnouncements>> {
    await delay();
    const announcements = JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || '[]');
    const announcementsWithDates = announcements.map((announcement: any) => ({
      ...announcement,
      date: new Date(announcement.date)
    }));
    return {
      data: announcementsWithDates,
      success: true
    };
  }
};

// Data management API
export const dataApi = {
  async exportAll(): Promise<ApiResponse<any>> {
    await delay();
    const data = {
      teams: JSON.parse(localStorage.getItem(STORAGE_KEYS.teams) || '[]'),
      players: JSON.parse(localStorage.getItem(STORAGE_KEYS.players) || '[]'),
      games: JSON.parse(localStorage.getItem(STORAGE_KEYS.games) || '[]'),
      tournaments: JSON.parse(localStorage.getItem(STORAGE_KEYS.tournaments) || '[]'),
      announcements: JSON.parse(localStorage.getItem(STORAGE_KEYS.announcements) || '[]'),
      exportDate: new Date().toISOString()
    };
    return {
      data,
      success: true
    };
  },

  async importAll(data: any): Promise<ApiResponse<boolean>> {
    await delay();
    try {
      if (data.teams) localStorage.setItem(STORAGE_KEYS.teams, JSON.stringify(data.teams));
      if (data.players) localStorage.setItem(STORAGE_KEYS.players, JSON.stringify(data.players));
      if (data.games) localStorage.setItem(STORAGE_KEYS.games, JSON.stringify(data.games));
      if (data.tournaments) localStorage.setItem(STORAGE_KEYS.tournaments, JSON.stringify(data.tournaments));
      if (data.announcements) localStorage.setItem(STORAGE_KEYS.announcements, JSON.stringify(data.announcements));
      
      return {
        data: true,
        success: true,
        message: 'Data imported successfully'
      };
    } catch (error) {
      return {
        data: false,
        success: false,
        message: 'Failed to import data'
      };
    }
  },

  async resetAll(): Promise<ApiResponse<boolean>> {
    await delay();
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    initializeData(); // Reinitialize with mock data
    return {
      data: true,
      success: true,
      message: 'All data has been reset'
    };
  }
};
