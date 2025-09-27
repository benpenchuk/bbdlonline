import React, { useState } from 'react';
import { Plus, Edit, Trash2, UserPlus } from 'lucide-react';
import { Player, Team } from '../../types';
import { playersApi } from '../../services/api';

interface PlayersTabProps {
  players: Player[];
  teams: Team[];
  onDataChange: () => void;
}

const PlayersTab: React.FC<PlayersTabProps> = ({ players, teams, onDataChange }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#6B7280';
  };

  const handleDeletePlayer = async (playerId: string) => {
    if (window.confirm('Are you sure you want to delete this player?')) {
      try {
        await playersApi.delete(playerId);
        onDataChange();
      } catch (error) {
        console.error('Failed to delete player:', error);
      }
    }
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
        {players.map(player => (
          <div key={player.id} className="player-admin-card">
            <div className="player-header">
              <div className="player-avatar-small">
                {player.photoUrl ? (
                  <img src={player.photoUrl} alt={player.name} />
                ) : (
                  <div className="player-initials-small">
                    {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                )}
              </div>
              <div className="player-info">
                <h3>{player.name}</h3>
                <div className="player-team">
                  <div 
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(player.teamId) }}
                  />
                  <span>{getTeamName(player.teamId)}</span>
                </div>
              </div>
            </div>

            <div className="player-stats-summary">
              <div className="stat-item">
                <span className="stat-value">{player.stats.wins}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{player.stats.gamesPlayed}</span>
                <span className="stat-label">Games</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{player.stats.averagePoints.toFixed(1)}</span>
                <span className="stat-label">Avg</span>
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
        ))}
      </div>

      {players.length === 0 && (
        <div className="empty-state">
          <UserPlus size={48} />
          <h3>No players yet</h3>
          <p>Add players to start building your league</p>
        </div>
      )}
    </div>
  );
};

export default PlayersTab;
