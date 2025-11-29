import React, { useState } from 'react';
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { Player, Team, PlayerTeam, Game } from '../../core/types';
import { useData } from '../../state';
import { getPlayerFullName, getPlayerTeam } from '../../core/utils/playerHelpers';
import ProfilePicture from '../common/ProfilePicture';
import PlayerFormModal from './PlayerFormModal';

interface PlayersTabProps {
  players: Player[];
  teams: Team[];
  playerTeams: PlayerTeam[];
  games: Game[];
}

const PlayersTab: React.FC<PlayersTabProps> = ({ players, teams, playerTeams, games }) => {
  const { deletePlayer, refreshData, activeSeason } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await deletePlayer(playerId);
        await refreshData();
      } catch (error) {
        console.error('Failed to delete player:', error);
      }
    }
  };

  // Calculate player stats from games
  const getPlayerStats = (playerId: string) => {
    // Find player's team(s)
    const playerTeamEntries = playerTeams.filter(pt => pt.playerId === playerId && pt.status === 'active');
    if (playerTeamEntries.length === 0) return { wins: 0, losses: 0, gamesPlayed: 0 };

    const teamIds = playerTeamEntries.map(pt => pt.teamId);
    
    const playerGames = games.filter(g => 
      g.status === 'completed' &&
      (teamIds.includes(g.homeTeamId) || teamIds.includes(g.awayTeamId))
    );

    const wins = playerGames.filter(g => teamIds.includes(g.winningTeamId || '')).length;
    const gamesPlayed = playerGames.length;
    const losses = gamesPlayed - wins;

    return { wins, losses, gamesPlayed };
  };

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Players Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Add Player
        </button>
      </div>

      <div className="players-grid">
        {players.map(player => {
          const playerTeam = getPlayerTeam(player, teams, playerTeams, activeSeason?.id);
          const stats = getPlayerStats(player.id);

          return (
            <div key={player.id} className="player-admin-card">
              <div className="player-header">
                <ProfilePicture
                  imageUrl={player.avatarUrl}
                  fallbackImage="player"
                  alt={getPlayerFullName(player)}
                  size={48}
                />
                <div className="player-info">
                  <h3>{getPlayerFullName(player)}</h3>
                  {playerTeam && (
                    <div className="player-team">
                      <ProfilePicture
                        imageUrl={playerTeam.logoUrl}
                        fallbackImage="team"
                        alt={playerTeam.name}
                        size={18}
                      />
                      <span>{playerTeam.name}</span>
                    </div>
                  )}
                  {!playerTeam && (
                    <div className="player-team">
                      <span className="text-muted">No team assigned</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="player-stats-summary">
                <div className="stat-item">
                  <span className="stat-value">{stats.wins}</span>
                  <span className="stat-label">Wins</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.gamesPlayed}</span>
                  <span className="stat-label">Games</span>
                </div>
                <div className="stat-item">
                  <span className="stat-value">{stats.losses}</span>
                  <span className="stat-label">Losses</span>
                </div>
              </div>

              <div className="player-actions">
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => setEditingPlayer(player)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeletePlayer(player.id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        
        {players.length === 0 && (
          <div className="empty-state">
            <UserPlus size={48} />
            <h3>No players</h3>
            <p>Click "Add Player" to create a new player.</p>
          </div>
        )}
      </div>

      {/* Player Form Modal */}
      {(showCreateForm || editingPlayer) && (
        <PlayerFormModal
          player={editingPlayer}
          onClose={() => {
            setShowCreateForm(false);
            setEditingPlayer(null);
          }}
          onSave={async () => {
            await refreshData();
            setShowCreateForm(false);
            setEditingPlayer(null);
          }}
        />
      )}
    </div>
  );
};

export default PlayersTab;
