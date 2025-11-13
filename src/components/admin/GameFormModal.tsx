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
  const { createGame, updateGame, activeSeason } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Form state
  const [homeTeamId, setHomeTeamId] = useState(game?.homeTeamId || '');
  const [awayTeamId, setAwayTeamId] = useState(game?.awayTeamId || '');
  const [gameDate, setGameDate] = useState(
    game?.gameDate ? new Date(game.gameDate).toISOString().slice(0, 16) : ''
  );
  const [homeScore, setHomeScore] = useState(game?.homeScore?.toString() || '');
  const [awayScore, setAwayScore] = useState(game?.awayScore?.toString() || '');
  const [status, setStatus] = useState(game?.status || 'scheduled');

  const isEditing = !!game;
  const title = isEditing ? 'Edit Game' : 'Schedule New Game';

  // Validation
  const validateForm = (): string[] => {
    const errors: string[] = [];
    
    if (!homeTeamId) errors.push('Home team is required');
    if (!awayTeamId) errors.push('Away team is required');
    if (homeTeamId === awayTeamId) errors.push('Teams cannot play against themselves');
    if (!gameDate) errors.push('Game date is required');
    if (!activeSeason) errors.push('No active season found');
    
    // Score validation for completed games
    if (status === 'completed') {
      if (!homeScore || !awayScore) {
        errors.push('Scores are required for completed games');
      } else {
        const score1 = parseInt(homeScore);
        const score2 = parseInt(awayScore);
        
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

    if (!activeSeason) {
      setError('No active season found');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gameData: Partial<Game> = {
        homeTeamId,
        awayTeamId,
        gameDate: new Date(gameDate),
        status: status as Game['status'],
        seasonId: activeSeason.id,
        homeScore: status === 'completed' ? parseInt(homeScore) : 0,
        awayScore: status === 'completed' ? parseInt(awayScore) : 0,
      };

      // Calculate winner if completed
      if (status === 'completed') {
        const h = parseInt(homeScore);
        const a = parseInt(awayScore);
        if (h > a) {
          gameData.winningTeamId = homeTeamId;
        } else if (a > h) {
          gameData.winningTeamId = awayTeamId;
        }
        // If tied, winningTeamId stays null
      }

      if (isEditing && game) {
        await updateGame(game.id, gameData);
      } else {
        await createGame(gameData as Omit<Game, 'id' | 'createdAt' | 'updatedAt'>);
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
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Calendar size={20} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Home Team */}
            <div className="form-group">
              <label htmlFor="homeTeam" className="form-label">
                Home Team *
              </label>
              <select
                id="homeTeam"
                value={homeTeamId}
                onChange={(e) => setHomeTeamId(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="">Select home team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Away Team */}
            <div className="form-group">
              <label htmlFor="awayTeam" className="form-label">
                Away Team *
              </label>
              <select
                id="awayTeam"
                value={awayTeamId}
                onChange={(e) => setAwayTeamId(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="">Select away team</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Game Date */}
            <div className="form-group">
              <label htmlFor="gameDate" className="form-label">
                Game Date & Time *
              </label>
              <input
                type="datetime-local"
                id="gameDate"
                value={gameDate}
                onChange={(e) => setGameDate(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as Game['status'])}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="canceled">Canceled</option>
              </select>
            </div>

            {/* Scores (only for completed games) */}
            {status === 'completed' && (
              <>
                <div className="form-group">
                  <label htmlFor="homeScore" className="form-label">
                    Home Team Score *
                  </label>
                  <input
                    type="number"
                    id="homeScore"
                    value={homeScore}
                    onChange={(e) => setHomeScore(e.target.value)}
                    className="form-input"
                    min="0"
                    step="1"
                    required
                    disabled={loading}
                    placeholder="0"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="awayScore" className="form-label">
                    Away Team Score *
                  </label>
                  <input
                    type="number"
                    id="awayScore"
                    value={awayScore}
                    onChange={(e) => setAwayScore(e.target.value)}
                    className="form-input"
                    min="0"
                    step="1"
                    required
                    disabled={loading}
                    placeholder="0"
                  />
                </div>
              </>
            )}
          </div>

          {/* Footer Actions */}
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
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <Trophy size={16} />
                  {isEditing ? 'Update Game' : 'Create Game'}
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
