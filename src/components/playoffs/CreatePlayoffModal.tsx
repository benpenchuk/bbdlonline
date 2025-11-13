import React, { useState } from 'react';
import { X, Trophy, Users, AlertCircle } from 'lucide-react';
import { Team } from '../../core/types';
import { validatePlayoffSetup } from '../../core/utils/playoffUtils';

interface CreatePlayoffModalProps {
  teams: Team[];
  onClose: () => void;
  onCreatePlayoff: (name: string, selectedTeams: Team[]) => void;
}

const CreatePlayoffModal: React.FC<CreatePlayoffModalProps> = ({
  teams,
  onClose,
  onCreatePlayoff
}) => {
  const [playoffName, setPlayoffName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [error, setError] = useState('');

  const selectedTeams = teams.filter(team => selectedTeamIds.includes(team.id));

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    } else if (selectedTeamIds.length < 16) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
    setError('');
  };

  const handleCreate = () => {
    if (!playoffName.trim()) {
      setError('Playoff name is required');
      return;
    }

    const validation = validatePlayoffSetup(selectedTeams);
    if (!validation.valid) {
      setError(validation.message || 'Invalid playoff setup');
      return;
    }

    onCreatePlayoff(playoffName.trim(), selectedTeams);
  };

  const getRecommendedBracketSize = () => {
    const count = selectedTeamIds.length;
    if (count <= 2) return 4;
    if (count <= 4) return 4;
    if (count <= 8) return 8;
    return 16;
  };

  const bracketSize = getRecommendedBracketSize();
  const byeCount = bracketSize - selectedTeamIds.length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Trophy size={24} />
            <h2>Create Playoff</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Playoff Name */}
          <div className="form-group">
            <label htmlFor="playoff-name">Playoff Name</label>
            <input
              id="playoff-name"
              type="text"
              value={playoffName}
              onChange={(e) => setPlayoffName(e.target.value)}
              placeholder="Enter playoff name..."
              className="form-input"
              maxLength={50}
            />
          </div>

          {/* Playoff Type */}
          <div className="form-group">
            <label>Playoff Type</label>
            <div className="playoff-type-selection">
              <div className="type-option selected">
                <Trophy size={20} />
                <div>
                  <div className="type-name">Single Elimination</div>
                  <div className="type-description">Classic knockout format</div>
                </div>
              </div>
              
              <div className="type-option disabled">
                <Users size={20} />
                <div>
                  <div className="type-name">Double Elimination</div>
                  <div className="type-description">Coming Soon</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team Selection */}
          <div className="form-group">
            <div className="team-selection-header">
              <label>Select Teams ({selectedTeamIds.length}/16)</label>
              <div className="bracket-info">
                <span>Bracket Size: {bracketSize} teams</span>
                {byeCount > 0 && (
                  <span className="bye-info">({byeCount} BYEs)</span>
                )}
              </div>
            </div>
            
            <div className="team-selection-grid">
              {teams.map(team => (
                <div
                  key={team.id}
                  className={`team-option ${
                    selectedTeamIds.includes(team.id) ? 'selected' : ''
                  } ${
                    !selectedTeamIds.includes(team.id) && selectedTeamIds.length >= 16 ? 'disabled' : ''
                  }`}
                  onClick={() => handleTeamToggle(team.id)}
                >
                  <div className="team-info">
                    <div className="team-name">{team.name}</div>
                    <div className="team-record">
                      {/* Team record calculated from games */}
                    </div>
                  </div>
                  <div className="team-players">
                    <Users size={14} />
                    <span>Team</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Playoff Preview */}
          {selectedTeamIds.length >= 2 && (
            <div className="playoff-preview">
              <h4>Playoff Preview</h4>
              <div className="preview-stats">
                <div className="preview-stat">
                  <span className="stat-label">Teams:</span>
                  <span className="stat-value">{selectedTeamIds.length}</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-label">Bracket Size:</span>
                  <span className="stat-value">{bracketSize}</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-label">Total Matches:</span>
                  <span className="stat-value">{bracketSize - 1}</span>
                </div>
                <div className="preview-stat">
                  <span className="stat-label">Rounds:</span>
                  <span className="stat-value">{Math.log2(bracketSize)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="error-message">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!playoffName.trim() || selectedTeamIds.length < 2}
          >
            <Trophy size={16} />
            Create Playoff
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlayoffModal;
