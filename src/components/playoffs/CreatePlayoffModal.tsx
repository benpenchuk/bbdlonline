import React, { useState } from 'react';
import { X, Trophy, Users, AlertCircle } from 'lucide-react';
import { Team } from '../../core/types';
import { useData } from '../../state';
import { validatePlayoffSetup, generateBracketMatches, seedTeams } from '../../core/utils/playoffUtils';

interface CreatePlayoffModalProps {
  teams: Team[];
  onClose: () => void;
  onSave: () => void;
}

const CreatePlayoffModal: React.FC<CreatePlayoffModalProps> = ({
  teams,
  onClose,
  onSave
}) => {
  const { 
    createPlayoff, 
    createPlayoffMatch,
    teamSeasonStats,
    seasons,
    refreshData
  } = useData();
  
  const activeSeason = seasons.find(s => s.status === 'active');
  
  const [playoffName, setPlayoffName] = useState('');
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Filter to show only active teams for playoff creation
  const seasonTeams = teams.filter(team => team.status === 'active');
  const selectedTeams = seasonTeams.filter(team => selectedTeamIds.includes(team.id));

  const handleTeamToggle = (teamId: string) => {
    if (selectedTeamIds.includes(teamId)) {
      setSelectedTeamIds(selectedTeamIds.filter(id => id !== teamId));
    } else if (selectedTeamIds.length < 16) {
      setSelectedTeamIds([...selectedTeamIds, teamId]);
    }
    setError('');
  };

  const handleCreate = async () => {
    if (!playoffName.trim()) {
      setError('Playoff name is required');
      return;
    }

    if (!activeSeason) {
      setError('No active season found. Please set an active season first.');
      return;
    }

    const validation = validatePlayoffSetup(selectedTeams);
    if (!validation.valid) {
      setError(validation.message || 'Invalid playoff setup');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Seed teams by their season stats
      const standings = teamSeasonStats
        .filter(stat => stat.seasonId === activeSeason?.id)
        .map(stat => ({
          teamId: stat.teamId,
          wins: stat.wins,
          losses: stat.losses,
          pointsFor: stat.pointsFor,
          pointsAgainst: stat.pointsAgainst
        }));
      
      const seededTeams = seedTeams(selectedTeams, standings);

      // Create the playoff
      const playoff = await createPlayoff({
        seasonId: activeSeason?.id,
        name: playoffName.trim(),
        bracketType: 'single_elimination',
        status: 'planned'
      });

      // Generate and create playoff matches
      const matches = generateBracketMatches(playoff.id, seededTeams);
      
      // Create all matches
      for (const match of matches) {
        await createPlayoffMatch(match);
      }

      await refreshData();
      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to create playoff:', error);
      setError(error.message || 'Failed to create playoff. Please try again.');
    } finally {
      setLoading(false);
    }
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
      <div className="modal-content modal-content-large" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <Trophy size={20} />
            Create Playoff
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={20} />
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
            <label>
              Select Teams ({selectedTeamIds.length} selected)
              {selectedTeamIds.length > 0 && (
                <span className="team-selection-label-info">
                  • Bracket Size: {bracketSize} teams
                  {byeCount > 0 && ` • ${byeCount} byes`}
                </span>
              )}
            </label>

            <div className="team-selection-container">
              {seasonTeams.map(team => {
                const isSelected = selectedTeamIds.includes(team.id);
                const stats = teamSeasonStats.find(
                  s => s.teamId === team.id && s.seasonId === activeSeason?.id
                );

                return (
                  <div
                    key={team.id}
                    className={`team-selection-item ${isSelected ? 'selected' : ''}`}
                    onClick={() => handleTeamToggle(team.id)}
                  >
                    <div className="team-selection-header">
                      <strong className="team-selection-name">{team.name}</strong>
                      {isSelected && (
                        <span className="team-selection-checkmark">✓</span>
                      )}
                    </div>

                    {stats && stats.gamesPlayed > 0 ? (
                      <div className="team-selection-record">
                        <span>{stats.wins}-{stats.losses}</span>
                        <span>•</span>
                        <span>{(stats.winPct * 100).toFixed(0)}%</span>
                      </div>
                    ) : (
                      <div className="team-selection-no-games">
                        No games played
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {seasonTeams.length === 0 && (
              <div className="team-selection-empty">
                No active teams found for this season
              </div>
            )}
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
            <div className="alert alert-error">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-outline"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleCreate}
            disabled={!playoffName.trim() || selectedTeamIds.length < 2 || loading}
          >
            {loading ? (
              <>
                <div className="spinner-small" />
                Creating...
              </>
            ) : (
              <>
                <Trophy size={16} />
                Create Playoff
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreatePlayoffModal;
