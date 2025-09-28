import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users } from 'lucide-react';
import { Team, Player } from '../../core/types';
import { useData, useAuth } from '../../state';

interface TeamsTabProps {
  teams: Team[];
  players: Player[];
}

const TeamsTab: React.FC<TeamsTabProps> = ({ teams, players }) => {
  const { deleteTeam, refreshData } = useData();
  const { demoMode } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);

  const getTeamPlayers = (teamId: string) => {
    return players.filter(p => p.teamId === teamId);
  };

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
          const teamPlayers = getTeamPlayers(team.id);
          return (
            <div key={team.id} className="team-item">
              <div className="team-info">
                <div 
                  className="team-color-large"
                  style={{ backgroundColor: team.color }}
                />
                <div className="team-details">
                  <h3>{team.name}</h3>
                  <div className="team-stats">
                    <span>{team.wins}W - {team.losses}L</span>
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
        }))}
      </div>

      {teams.length === 0 && (
        <div className="empty-state">
          <Users size={48} />
          <h3>No teams yet</h3>
          <p>Create your first team to get started</p>
        </div>
      )}
    </div>
  );
};

export default TeamsTab;
