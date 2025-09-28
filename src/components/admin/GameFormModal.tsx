import React, { useState } from 'react';
import { X, Calendar, Trophy, AlertCircle } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { useData } from '../../state';

interface GameFormModalProps {
  game?: Game | null; // null for create, Game object for edit
  teams: Team[];
  onClose: () => void;
  onSave: () => void;
}

const GameFormModal: React.FC<GameFormModalProps> = ({ game, teams, onClose, onSave }) => {
  const { createGame, updateGame } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [team1Id, setTeam1Id] = useState(game?.team1Id || '');
  const [team2Id, setTeam2Id] = useState(game?.team2Id || '');
  const [scheduledDate, setScheduledDate] = useState(
    game?.scheduledDate ? new Date(game.scheduledDate).toISOString().slice(0, 16) : ''
  );
  const [team1Score, setTeam1Score] = useState(game?.team1Score?.toString() || '');
  const [team2Score, setTeam2Score] = useState(game?.team2Score?.toString() || '');
  const [status, setStatus] = useState(game?.status || 'scheduled');

  const isEditing = !!game;
  const title = isEditing ? 'Edit Game' : 'Schedule New Game';

  // Validation
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!team1Id) errors.push('Team 1 is required');
    if (!team2Id) errors.push('Team 2 is required');
    if (team1Id === team2Id) errors.push('Teams cannot play against themselves');
    if (!scheduledDate) errors.push('Scheduled date is required');
    
    // Score validation for completed games
    if (status === 'completed') {
      if (!team1Score || !team2Score) {
        errors.push('Scores are required for completed games');
      } else {
        const score1 = parseInt(team1Score);
        const score2 = parseInt(team2Score);
        
        if (isNaN(score1) || isNaN(score2)) {
          errors.push('Scores must be valid numbers');
        } else if (score1 < 0 || score2 < 0) {
          errors.push('Scores cannot be negative');
        } else if (!Number.isInteger(score1) || !Number.isInteger(score2)) {
          errors.push('Scores must be whole numbers');
        }
      }
    }
    
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameData: Partial<Game> = {
        team1Id,
        team2Id,
        scheduledDate: new Date(scheduledDate),
        status: status as Game['status']
      };

      // Add scores if the game is completed
      if (status === 'completed') {
        gameData.team1Score = parseInt(team1Score);
        gameData.team2Score = parseInt(team2Score);
        gameData.completedDate = new Date();
      }

      if (isEditing && game) {
        await updateGame(game.id, gameData);
      } else {
        await createGame(gameData as Omit<Game, 'id'>);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save game:', error);
      setError(error.message || 'Failed to save game. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">
            <Trophy size={24} />
            <h2>{title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {/* Team Selection */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="team1">Team 1</label>
              <select
                id="team1"
                value={team1Id}
                onChange={(e) => setTeam1Id(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Team 1...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === team2Id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="vs-indicator">VS</div>

            <div className="form-group">
              <label htmlFor="team2">Team 2</label>
              <select
                id="team2"
                value={team2Id}
                onChange={(e) => setTeam2Id(e.target.value)}
                className="form-select"
                required
              >
                <option value="">Select Team 2...</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id} disabled={team.id === team1Id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date and Time */}
          <div className="form-group">
            <label htmlFor="scheduledDate">
              <Calendar size={16} />
              Scheduled Date & Time
            </label>
            <input
              id="scheduledDate"
              type="datetime-local"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="form-input"
              required
            />
          </div>

          {/* Game Status */}
          <div className="form-group">
            <label htmlFor="status">Game Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Game['status'])}
              className="form-select"
            >
              <option value="scheduled">Scheduled</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Scores (only show if completed) */}
          {status === 'completed' && (
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="team1Score">
                  {teams.find(t => t.id === team1Id)?.name || 'Team 1'} Score
                </label>
                <input
                  id="team1Score"
                  type="number"
                  min="0"
                  step="1"
                  value={team1Score}
                  onChange={(e) => setTeam1Score(e.target.value)}
                  className="form-input"
                  placeholder="0"
                />
              </div>

              <div className="form-group">
                <label htmlFor="team2Score">
                  {teams.find(t => t.id === team2Id)?.name || 'Team 2'} Score
                </label>
                <input
                  id="team2Score"
                  type="number"
                  min="0"
                  step="1"
                  value={team2Score}
                  onChange={(e) => setTeam2Score(e.target.value)}
                  className="form-input"
                  placeholder="0"
                />
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

          {/* Form Actions */}
          <div className="modal-actions">
            <button type="button" className="btn btn-outline" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <div className="loading-spinner small" />
              ) : (
                <>
                  <Trophy size={16} />
                  {isEditing ? 'Update Game' : 'Schedule Game'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GameFormModal;
