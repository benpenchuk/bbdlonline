import React, { useState } from 'react';
import { X, Trophy, Users, AlertCircle } from 'lucide-react';
import { Team } from '../../types';
import { validateTournamentSetup } from '../../utils/tournamentUtils';

interface CreateTournamentModalProps {
  teams: Team[];
  onClose: () => void;
  onCreateTournament: (name: string, selectedTeams: Team[]) => void;
}

const CreateTournamentModal: React.FC<CreateTournamentModalProps> = ({
  teams,
  onClose,
  onCreateTournament
}) => {
  const [tournamentName, setTournamentName] = useState('');
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
    if (!tournamentName.trim()) {
      setError('Tournament name is required');
      return;
    }

    const validation = validateTournamentSetup(selectedTeams);
    if (!validation.valid) {
      setError(validation.error || 'Invalid tournament setup');
      return;
    }

    onCreateTournament(tournamentName.trim(), selectedTeams);
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
            <h2>Create Tournament</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tournament Name */}
          <div className="form-group">
            <label htmlFor="tournament-name">Tournament Name</label>
            <input
              id="tournament-name"
              type="text"
              value={tournamentName}
              onChange={(e) => setTournamentName(e.target.value)}
              placeholder="Enter tournament name..."
              className="form-input"
              maxLength={50}
            />
          </div>

          {/* Tournament Type */}
          <div className="form-group">
            <label>Tournament Type</label>
            <div className="tournament-type-selection">
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
                  <div 
                    className="team-color"
                    style={{ backgroundColor: team.color }}
                  />
                  <div className="team-info">
                    <div className="team-name">{team.name}</div>
                    <div className="team-record">
                      {team.wins}W - {team.losses}L
                    </div>
                  </div>
                  <div className="team-players">
                    <Users size={14} />
                    <span>{team.players.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tournament Preview */}
          {selectedTeamIds.length >= 2 && (
            <div className="tournament-preview">
              <h4>Tournament Preview</h4>
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
            disabled={!tournamentName.trim() || selectedTeamIds.length < 2}
          >
            <Trophy size={16} />
            Create Tournament
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateTournamentModal;
