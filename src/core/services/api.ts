import { Team, Player, Game, Tournament, ApiResponse } from '../types';
import { supabase, TABLES } from '../config/supabaseClient';
import { calculatePlayerStats, calculateTeamStats } from '../utils/statsCalculations';

// =====================================================
// UTILITY FUNCTIONS FOR DATA TRANSFORMATION
// =====================================================

// Convert snake_case from DB to camelCase for TypeScript
const transformTeamFromDB = (dbTeam: any): Team => ({
  id: dbTeam.id,
  name: dbTeam.name,
  color: dbTeam.color,
  icon: dbTeam.icon,
  wins: dbTeam.wins || 0,
  losses: dbTeam.losses || 0,
  totalPoints: dbTeam.total_points || 0,
  gamesPlayed: dbTeam.games_played || 0,
  players: dbTeam.players || []
});

const transformPlayerFromDB = (dbPlayer: any): Player => ({
  id: dbPlayer.id,
  name: dbPlayer.name,
  teamId: dbPlayer.team_id,
  bio: dbPlayer.bio || '',
  year: dbPlayer.year,
  photoUrl: dbPlayer.photo_url,
  stats: dbPlayer.stats || {
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
});

const transformGameFromDB = (dbGame: any): Game => ({
  id: dbGame.id,
  team1Id: dbGame.team1_id,
  team2Id: dbGame.team2_id,
  team1Score: dbGame.team1_score,
  team2Score: dbGame.team2_score,
  scheduledDate: new Date(dbGame.scheduled_date),
  completedDate: dbGame.completed_date ? new Date(dbGame.completed_date) : undefined,
  status: dbGame.status,
  winnerId: dbGame.winner_id,
  isBlowout: dbGame.is_blowout || false,
  isClutch: dbGame.is_clutch || false,
  isShutout: dbGame.is_shutout || false
});

const transformTournamentFromDB = (dbTournament: any): Tournament => ({
  id: dbTournament.id,
  name: dbTournament.name,
  type: dbTournament.type,
  status: dbTournament.status,
  teams: dbTournament.teams || [],
  bracket: dbTournament.bracket || [],
  winnerId: dbTournament.winner_id,
  createdDate: new Date(dbTournament.created_date),
  completedDate: dbTournament.completed_date ? new Date(dbTournament.completed_date) : undefined
});

// Convert camelCase to snake_case for DB inserts/updates
const transformTeamToDB = (team: Partial<Team>) => ({
  id: team.id,
  name: team.name,
  color: team.color,
  icon: team.icon,
  wins: team.wins,
  losses: team.losses,
  total_points: team.totalPoints,
  games_played: team.gamesPlayed,
  players: team.players
});

const transformPlayerToDB = (player: Partial<Player>) => ({
  id: player.id,
  name: player.name,
  team_id: player.teamId,
  bio: player.bio,
  year: player.year,
  photo_url: player.photoUrl,
  stats: player.stats
});

const transformGameToDB = (game: Partial<Game>) => ({
  id: game.id,
  team1_id: game.team1Id,
  team2_id: game.team2Id,
  team1_score: game.team1Score,
  team2_score: game.team2Score,
  scheduled_date: game.scheduledDate?.toISOString(),
  completed_date: game.completedDate?.toISOString(),
  status: game.status,
  winner_id: game.winnerId,
  is_blowout: game.isBlowout,
  is_clutch: game.isClutch,
  is_shutout: game.isShutout
});

const transformTournamentToDB = (tournament: Partial<Tournament>) => ({
  id: tournament.id,
  name: tournament.name,
  type: tournament.type,
  status: tournament.status,
  teams: tournament.teams,
  bracket: tournament.bracket,
  winner_id: tournament.winnerId,
  created_date: tournament.createdDate?.toISOString(),
  completed_date: tournament.completedDate?.toISOString()
});

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
      
      // Get all games for stats calculation
      const gamesResponse = await supabase.from(TABLES.GAMES).select('*');
      const games = (gamesResponse.data || []).map(transformGameFromDB);

      // Update team stats based on games
      const updatedTeams = teams.map((team) => {
        const teamStats = calculateTeamStats(team, games, teams);
        return {
          ...team,
          wins: teamStats.record.wins,
          losses: teamStats.record.losses,
          totalPoints: teamStats.totalPoints,
          gamesPlayed: teamStats.record.wins + teamStats.record.losses
        };
      });

      return {
        data: updatedTeams,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching teams:', error);
      return {
        data: [],
        success: false,
        message: error.message
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
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching team:', error);
      return {
        data: null,
        success: false,
        message: error.message
      };
    }
  },

  async create(team: Omit<Team, 'id'>): Promise<ApiResponse<Team>> {
    try {
      const newTeam = {
        ...team,
        id: `team-${Date.now()}`
      };

      const { data, error } = await supabase
        .from(TABLES.TEAMS)
        .insert([transformTeamToDB(newTeam)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTeamFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error creating team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
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
        success: true
      };
    } catch (error: any) {
      console.error('Error updating team:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
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
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting team:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  }
};

// =====================================================
// PLAYERS API
// =====================================================

export const playersApi = {
  async getAll(): Promise<ApiResponse<Player[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .order('name');

      if (error) throw error;

      const players = (data || []).map(transformPlayerFromDB);

      // Get all games for stats calculation
      const gamesResponse = await supabase.from(TABLES.GAMES).select('*');
      const games = (gamesResponse.data || []).map(transformGameFromDB);

      // Update player stats based on games
      const updatedPlayers = players.map((player) => ({
        ...player,
        stats: calculatePlayerStats(player, games)
      }));

      return {
        data: updatedPlayers,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching players:', error);
      return {
        data: [],
        success: false,
        message: error.message
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
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching player:', error);
      return {
        data: null,
        success: false,
        message: error.message
      };
    }
  },

  async getByTeam(teamId: string): Promise<ApiResponse<Player[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .select('*')
        .eq('team_id', teamId)
        .order('name');

      if (error) throw error;

      const players = (data || []).map(transformPlayerFromDB);

      // Get all games for stats calculation
      const gamesResponse = await supabase.from(TABLES.GAMES).select('*');
      const games = (gamesResponse.data || []).map(transformGameFromDB);

      const teamPlayers = players.map((player) => ({
        ...player,
        stats: calculatePlayerStats(player, games)
      }));

      return {
        data: teamPlayers,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching team players:', error);
      return {
        data: [],
        success: false,
        message: error.message
      };
    }
  },

  async create(player: Omit<Player, 'id'>): Promise<ApiResponse<Player>> {
    try {
      const newPlayer = {
        ...player,
        id: `player-${Date.now()}`
      };

      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .insert([transformPlayerToDB(newPlayer)])
        .select()
        .single();

      if (error) throw error;

      // Update team players list
      const { data: teamData } = await supabase
        .from(TABLES.TEAMS)
        .select('players')
        .eq('id', player.teamId)
        .single();

      if (teamData) {
        const updatedPlayers = [...(teamData.players || []), newPlayer.id];
        await supabase
          .from(TABLES.TEAMS)
          .update({ players: updatedPlayers })
          .eq('id', player.teamId);
      }

      return {
        data: transformPlayerFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error creating player:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async update(id: string, updates: Partial<Player>): Promise<ApiResponse<Player>> {
    try {
      // Get current player to check if team changed
      const { data: currentPlayer } = await supabase
        .from(TABLES.PLAYERS)
        .select('team_id')
        .eq('id', id)
        .single();

      const { data, error } = await supabase
        .from(TABLES.PLAYERS)
        .update(transformPlayerToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      // Update team players lists if team changed
      if (updates.teamId && currentPlayer && updates.teamId !== currentPlayer.team_id) {
        // Remove from old team
        const { data: oldTeam } = await supabase
          .from(TABLES.TEAMS)
          .select('players')
          .eq('id', currentPlayer.team_id)
          .single();

        if (oldTeam) {
          const updatedOldPlayers = (oldTeam.players || []).filter((pid: string) => pid !== id);
          await supabase
            .from(TABLES.TEAMS)
            .update({ players: updatedOldPlayers })
            .eq('id', currentPlayer.team_id);
        }

        // Add to new team
        const { data: newTeam } = await supabase
          .from(TABLES.TEAMS)
          .select('players')
          .eq('id', updates.teamId)
          .single();

        if (newTeam) {
          const updatedNewPlayers = [...(newTeam.players || []), id];
          await supabase
            .from(TABLES.TEAMS)
            .update({ players: updatedNewPlayers })
            .eq('id', updates.teamId);
        }
      }

      return {
        data: transformPlayerFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error updating player:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      // Get player to find team
      const { data: player } = await supabase
        .from(TABLES.PLAYERS)
        .select('team_id')
        .eq('id', id)
        .single();

      const { error } = await supabase
        .from(TABLES.PLAYERS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Remove from team players list
      if (player) {
        const { data: team } = await supabase
          .from(TABLES.TEAMS)
          .select('players')
          .eq('id', player.team_id)
          .single();

        if (team) {
          const updatedPlayers = (team.players || []).filter((pid: string) => pid !== id);
          await supabase
            .from(TABLES.TEAMS)
            .update({ players: updatedPlayers })
            .eq('id', player.team_id);
        }
      }

      return {
        data: true,
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting player:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  }
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
        .order('scheduled_date', { ascending: false });

      if (error) throw error;

      const games = (data || []).map(transformGameFromDB);

      return {
        data: games,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching games:', error);
      return {
        data: [],
        success: false,
        message: error.message
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
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching game:', error);
      return {
        data: null,
        success: false,
        message: error.message
      };
    }
  },

  async create(game: Omit<Game, 'id'>): Promise<ApiResponse<Game>> {
    try {
      const newGame = {
        ...game,
        id: `game-${Date.now()}`
      };

      const { data, error } = await supabase
        .from(TABLES.GAMES)
        .insert([transformGameToDB(newGame)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformGameFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error creating game:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async update(id: string, updates: Partial<Game>): Promise<ApiResponse<Game>> {
    try {
      // Get current game
      const { data: currentGame } = await supabase
        .from(TABLES.GAMES)
        .select('*')
        .eq('id', id)
        .single();

      if (!currentGame) {
        throw new Error('Game not found');
      }

      // Handle score updates and determine winner
      const updateData = { ...updates };
      if (updates.team1Score !== undefined && updates.team2Score !== undefined) {
        const team1Score = updates.team1Score;
        const team2Score = updates.team2Score;
        const scoreDiff = Math.abs(team1Score - team2Score);

        updateData.winnerId = team1Score > team2Score ? currentGame.team1_id : currentGame.team2_id;
        updateData.isBlowout = scoreDiff >= 7;
        updateData.isClutch = scoreDiff <= 2;
        updateData.isShutout = team1Score === 0 || team2Score === 0;
        updateData.status = 'completed';
        updateData.completedDate = new Date();
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
        success: true
      };
    } catch (error: any) {
      console.error('Error updating game:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.GAMES)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting game:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  }
};

// =====================================================
// TOURNAMENTS API
// =====================================================

export const tournamentsApi = {
  async getAll(): Promise<ApiResponse<Tournament[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TOURNAMENTS)
        .select('*')
        .order('created_date', { ascending: false });

      if (error) throw error;

      const tournaments = (data || []).map(transformTournamentFromDB);

      return {
        data: tournaments,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching tournaments:', error);
      return {
        data: [],
        success: false,
        message: error.message
      };
    }
  },

  async getById(id: string): Promise<ApiResponse<Tournament | null>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TOURNAMENTS)
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        data: data ? transformTournamentFromDB(data) : null,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching tournament:', error);
      return {
        data: null,
        success: false,
        message: error.message
      };
    }
  },

  async create(tournament: Omit<Tournament, 'id'>): Promise<ApiResponse<Tournament>> {
    try {
      const newTournament = {
        ...tournament,
        id: `tournament-${Date.now()}`
      };

      const { data, error } = await supabase
        .from(TABLES.TOURNAMENTS)
        .insert([transformTournamentToDB(newTournament)])
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTournamentFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error creating tournament:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async update(id: string, updates: Partial<Tournament>): Promise<ApiResponse<Tournament>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.TOURNAMENTS)
        .update(transformTournamentToDB(updates))
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return {
        data: transformTournamentFromDB(data),
        success: true
      };
    } catch (error: any) {
      console.error('Error updating tournament:', error);
      return {
        data: null as any,
        success: false,
        message: error.message
      };
    }
  },

  async delete(id: string): Promise<ApiResponse<boolean>> {
    try {
      const { error } = await supabase
        .from(TABLES.TOURNAMENTS)
        .delete()
        .eq('id', id);

      if (error) throw error;

      return {
        data: true,
        success: true
      };
    } catch (error: any) {
      console.error('Error deleting tournament:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  }
};

// =====================================================
// ANNOUNCEMENTS API
// =====================================================

export const announcementsApi = {
  async getAll(): Promise<ApiResponse<any[]>> {
    try {
      const { data, error } = await supabase
        .from(TABLES.ANNOUNCEMENTS)
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;

      const announcements = (data || []).map((a: any) => ({
        id: a.id,
        title: a.title,
        content: a.content,
        date: new Date(a.date),
        important: a.important || false
      }));

      return {
        data: announcements,
        success: true
      };
    } catch (error: any) {
      console.error('Error fetching announcements:', error);
      return {
        data: [],
        success: false,
        message: error.message
      };
    }
  }
};

// =====================================================
// DATA MANAGEMENT API
// =====================================================

export const dataApi = {
  async exportAll(): Promise<ApiResponse<any>> {
    try {
      const [teamsRes, playersRes, gamesRes, tournamentsRes, announcementsRes] = await Promise.all([
        supabase.from(TABLES.TEAMS).select('*'),
        supabase.from(TABLES.PLAYERS).select('*'),
        supabase.from(TABLES.GAMES).select('*'),
        supabase.from(TABLES.TOURNAMENTS).select('*'),
        supabase.from(TABLES.ANNOUNCEMENTS).select('*')
      ]);

      const data = {
        teams: teamsRes.data || [],
        players: playersRes.data || [],
        games: gamesRes.data || [],
        tournaments: tournamentsRes.data || [],
        announcements: announcementsRes.data || [],
        exportDate: new Date().toISOString()
      };

      return {
        data,
        success: true
      };
    } catch (error: any) {
      console.error('Error exporting data:', error);
      return {
        data: null,
        success: false,
        message: error.message
      };
    }
  },

  async importAll(data: any): Promise<ApiResponse<boolean>> {
    try {
      // Note: This is a simple import. For production, you'd want transaction support
      if (data.teams && data.teams.length > 0) {
        await supabase.from(TABLES.TEAMS).insert(data.teams);
      }
      if (data.players && data.players.length > 0) {
        await supabase.from(TABLES.PLAYERS).insert(data.players);
      }
      if (data.games && data.games.length > 0) {
        await supabase.from(TABLES.GAMES).insert(data.games);
      }
      if (data.tournaments && data.tournaments.length > 0) {
        await supabase.from(TABLES.TOURNAMENTS).insert(data.tournaments);
      }
      if (data.announcements && data.announcements.length > 0) {
        await supabase.from(TABLES.ANNOUNCEMENTS).insert(data.announcements);
      }

      return {
        data: true,
        success: true,
        message: 'Data imported successfully'
      };
    } catch (error: any) {
      console.error('Error importing data:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  },

  async resetAll(): Promise<ApiResponse<boolean>> {
    try {
      // Delete all data from all tables
      await Promise.all([
        supabase.from(TABLES.GAMES).delete().neq('id', ''),
        supabase.from(TABLES.TOURNAMENTS).delete().neq('id', ''),
        supabase.from(TABLES.ANNOUNCEMENTS).delete().neq('id', ''),
        supabase.from(TABLES.PLAYERS).delete().neq('id', ''),
        supabase.from(TABLES.TEAMS).delete().neq('id', '')
      ]);

      return {
        data: true,
        success: true,
        message: 'All data has been reset'
      };
    } catch (error: any) {
      console.error('Error resetting data:', error);
      return {
        data: false,
        success: false,
        message: error.message
      };
    }
  }
};
