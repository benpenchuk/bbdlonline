import React, { useState } from 'react';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { useData } from '../../state';
import { Playoff } from '../../core/types';
import CreatePlayoffModal from '../playoffs/CreatePlayoffModal';

const PlayoffsTab: React.FC = () => {
  const { 
    playoffs, 
    seasons, 
    teams,
    playoffMatches,
    deletePlayoff,
    refreshData
  } = useData();
  
  const [showCreateForm, setShowCreateForm] = useState(false);

  const activeSeason = seasons.find(s => s.status === 'active');
  
  // Filter playoffs for active season (or all if no active season)
  const displayPlayoffs = activeSeason 
    ? playoffs.filter(p => p.seasonId === activeSeason.id)
    : playoffs;

  const handleDelete = async (playoff: Playoff) => {
    const playoffName = playoff.name || 'this playoff';
    
    if (!window.confirm(`Are you sure you want to delete "${playoffName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await deletePlayoff(playoff.id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete playoff:', error);
      alert('Failed to delete playoff. Please try again.');
    }
  };

  const getPlayoffMatchCount = (playoffId: string): number => {
    return playoffMatches.filter(m => m.playoffId === playoffId).length;
  };

  const getStatusBadgeClass = (status: string): string => {
    switch (status) {
      case 'planned': return 'status-info';
      case 'in_progress': return 'status-warning';
      case 'completed': return 'status-success';
      case 'canceled': return 'status-error';
      default: return 'status-info';
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'planned': return 'Planned';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'canceled': return 'Canceled';
      default: return status;
    }
  };

  const sortedPlayoffs = [...displayPlayoffs].sort((a, b) => {
    // Sort by created date, newest first
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Playoffs Management</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          <span>Create Playoff</span>
        </button>
      </div>

      {sortedPlayoffs.length === 0 ? (
        <div className="empty-state">
          <Trophy size={48} />
          <h3>No Playoffs Yet</h3>
          <p>Create your first playoff bracket for the current season</p>
        </div>
      ) : (
        <div className="games-admin-list">
          {sortedPlayoffs.map(playoff => {
            const season = seasons.find(s => s.id === playoff.seasonId);
            const matchCount = getPlayoffMatchCount(playoff.id);
            
            return (
              <div key={playoff.id} className="game-admin-item">
                <div className="game-info">
                  <div className="game-teams">
                    <Trophy size={20} style={{ marginRight: '8px' }} />
                    <strong>{playoff.name}</strong>
                  </div>
                  <div className="game-meta">
                    <div className={`game-status status-${playoff.status}`}>
                      <span className={`status-badge ${getStatusBadgeClass(playoff.status)}`}>
                        {getStatusLabel(playoff.status)}
                      </span>
                    </div>
                    <div className="game-date">
                      {season?.name || 'Unknown Season'}
                      <span style={{ margin: '0 8px' }}>•</span>
                      {playoff.bracketType === 'single_elimination' ? 'Single Elimination' : 'Double Elimination'}
                      {matchCount > 0 && (
                        <>
                          <span style={{ margin: '0 8px' }}>•</span>
                          {matchCount} matches
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="game-actions">
                  <button
                    className="btn btn-danger btn-small"
                    onClick={() => handleDelete(playoff)}
                  >
                    <Trash2 size={14} />
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreateForm && (
        <CreatePlayoffModal
          teams={teams}
          onClose={() => setShowCreateForm(false)}
          onSave={async () => {
            await refreshData();
            setShowCreateForm(false);
          }}
        />
      )}
    </div>
  );
};

export default PlayoffsTab;



