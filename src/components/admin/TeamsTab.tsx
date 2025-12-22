import React, { useState } from 'react';
import { Plus, Edit, Trash2, Users, UserCog } from 'lucide-react';
import { Team, Player, PlayerTeam, Game } from '../../core/types';
import { useData } from '../../state';
import { getTeamPlayers as getTeamPlayersHelper } from '../../core/utils/playerHelpers';
import { calculateTeamStatsForGames } from '../../core/utils/statsCalculations';
import ProfilePicture from '../common/ProfilePicture';
import TeamFormModal from './TeamFormModal';
import RosterManagementModal from './RosterManagementModal';

interface TeamsTabProps {
  teams: Team[];
  players: Player[];
  playerTeams: PlayerTeam[];
  games: Game[];
}

const TeamsTab: React.FC<TeamsTabProps> = ({ teams, players, playerTeams, games }) => {
  const { deleteTeam, refreshData, activeSeason } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [managingRoster, setManagingRoster] = useState<Team | null>(null);

  const handleDeleteTeam = async (teamId: string) => {
    const team = teams.find(t => t.id === teamId);
    const teamName = team?.name || 'this team';
    
    if (!window.confirm(`Are you sure you want to delete "${teamName}"? This action cannot be undone.`)) {
      return;
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
          <span>Add Team</span>
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
                  {team.logoUrl ? (
                    <img 
                      src={team.logoUrl} 
                      alt={team.name}
                      className="team-logo-small"
                      onError={(e) => {
                        // Fallback to TeamIcon if logo fails to load
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        const parent = target.parentElement;
                        if (parent && !parent.querySelector('.team-icon-fallback')) {
                          const iconDiv = document.createElement('div');
                          iconDiv.className = 'team-icon-fallback';
                          parent.appendChild(iconDiv);
                        }
                      }}
                    />
                  ) : (
                    <ProfilePicture
                      imageUrl={null}
                      fallbackImage="team"
                      alt={team.name}
                      size={48}
                    />
                  )}
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
                    onClick={() => setManagingRoster(team)}
                    title="Manage roster"
                  >
                    <UserCog size={14} />
                    Roster
                  </button>
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

      {/* Team Form Modal */}
      {(showCreateForm || editingTeam) && (
        <TeamFormModal
          team={editingTeam}
          onClose={() => {
            setShowCreateForm(false);
            setEditingTeam(null);
          }}
          onSave={async () => {
            await refreshData();
            setShowCreateForm(false);
            setEditingTeam(null);
          }}
        />
      )}

      {/* Roster Management Modal */}
      {managingRoster && (
        <RosterManagementModal
          team={managingRoster}
          onClose={() => setManagingRoster(null)}
          onSave={async () => {
            await refreshData();
          }}
        />
      )}
    </div>
  );
};

export default TeamsTab;
