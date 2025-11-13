import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Team, Player, PlayerTeam, Game } from '../../core/types';
import { useData, useAuth } from '../../state';
import { getTeamPlayers as getTeamPlayersHelper } from '../../core/utils/playerHelpers';
import { calculateTeamStatsForGames } from '../../core/utils/statsCalculations';
import TeamIcon from '../common/TeamIcon';

interface TeamsTabProps {
  teams: Team[];
  players: Player[];
  playerTeams: PlayerTeam[];
  games: Game[];
}

const TeamsTab: React.FC<TeamsTabProps> = ({ teams, players, playerTeams, games }) => {
  const { deleteTeam, refreshData, activeSeason } = useData();
  const { demoMode } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const teamName = team?.name || 'this team';
    
    const confirmMessage = demoMode 
      ? `Are you sure you want to delete "${teamName}"?\n\n⚠️ DEMO MODE: This action cannot be undone!`
      : `Are you sure you want to delete "${teamName}"?`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Extra confirmation in demo mode
    if (demoMode) {
      if (!window.confirm(`🛡️ DEMO MODE PROTECTION: This will permanently delete "${teamName}" and all associated data. Are you absolutely certain?`)) {
        return;
      }
    }

    try {
      await deleteTeam(teamId);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete team:', error);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Teams Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Add Team
        </button>
      </div>

      <div className="teams-list">
        {teams.length === 0 ? (
          <div className="no-data-message">
            <p>No teams found. The data might still be loading or there may be an issue with data initialization.</p>
            <p>Teams count: {teams.length}</p>
          </div>
        ) : (
          teams.map(team => {
            const teamPlayers = getTeamPlayersHelper(team.id, players, playerTeams, activeSeason?.id);
            const teamStats = calculateTeamStatsForGames(team.id, games);

            return (
              <div key={team.id} className="team-item">
                <div className="team-info">
                  <TeamIcon iconId={team.abbreviation} color="#3b82f6" size={32} />
                  <div className="team-details">
                    <h3>{team.name}</h3>
                    <div className="team-stats">
                      <span>{teamStats.wins}W - {teamStats.losses}L</span>
                      <span>•</span>
                      <span>{teamPlayers.length} players</span>
                    </div>
                  </div>
                </div>
                
                <div className="team-actions">
                  <button 
                    className="btn btn-outline btn-small"
                    onClick={() => setEditingTeam(team)}
                  >
                    <Edit size={14} />
                    Edit
                  </button>
                  <button 
                    className="btn btn-danger btn-small"
                    onClick={() => handleDeleteTeam(team.id)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No teams yet</h3>
          <p>Create your first team to get started</p>
        </div>
      )}

      {/* TODO: Add Team Form Modal */}
      {showCreateForm && (
        <div className="modal-overlay" onClick={() => setShowCreateForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Team</h2>
              <button onClick={() => setShowCreateForm(false)}>×</button>
            </div>
            <div className="modal-body">
              <p>Team creation form coming soon...</p>
            </div>
          </div>
        </div>
      )}
      
      {editingTeam && (
        <div className="modal-overlay" onClick={() => setEditingTeam(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Team</h2>
              <button onClick={() => setEditingTeam(null)}>×</button>
            </div>
            <div className="modal-body">
              <p>Team editing form coming soon...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamsTab;
