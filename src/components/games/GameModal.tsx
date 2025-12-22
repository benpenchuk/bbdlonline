import React from 'react';
import { Link } from 'react-router-dom';
import { X, Trophy, CheckCircle } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import ProfilePicture from '../common/ProfilePicture';
import { getWinnerId } from '../../core/utils/gameHelpers';

interface GameModalProps {
  game: Game;
  teams: Team[];
  onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ game, teams, onClose }) => {
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);

  if (!homeTeam || !awayTeam) {
    return null;
  }

  const winnerId = getWinnerId(game);
  const isCompleted = game.status === 'completed';
  const homeIsWinner = winnerId === homeTeam.id;
  const awayIsWinner = winnerId === awayTeam.id;

  const formatDateShort = (date: Date) => {
    return format(date, 'EEE, MMM d, yyyy');
  };

  const getStatusText = () => {
    switch (game.status) {
      case 'completed':
        return 'FINAL';
      case 'in_progress':
        return 'IN PROGRESS';
      case 'scheduled':
        return 'SCHEDULED';
      default:
        return 'SCHEDULED';
    }
  };

  const getScoreDifference = () => {
    if (game.status === 'completed') {
      return Math.abs(game.homeScore - game.awayScore);
    }
    return 0;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="game-modal-redesign" onClick={(e) => e.stopPropagation()}>
        {/* Header Section */}
        <div className="game-modal-header">
          {/* Row 1: Title and Close */}
          <div className="game-modal-header-row">
            <div className="game-modal-title-group">
              <Trophy size={24} />
              <h2 className="game-modal-title">Game Details</h2>
            </div>
            <button onClick={onClose} className="game-modal-close" aria-label="Close modal">
              <X size={24} />
            </button>
          </div>

          {/* Row 2: Date and Location */}
          <div className="game-modal-meta">
            <span className="game-modal-date">
              {game.gameDate ? formatDateShort(game.gameDate) : 'Date TBD'}
            </span>
            <span className="game-modal-separator">•</span>
            <span className="game-modal-location">Bando Backyard</span>
          </div>
        </div>

        {/* Matchup Section */}
        <div className="game-modal-matchup">
          {/* Home Team */}
          <Link 
            to={`/team/${homeTeam.id}`} 
            state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
            className={`game-modal-team-block ${homeIsWinner ? 'game-modal-winner' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfilePicture
              imageUrl={homeTeam.logoUrl}
              fallbackImage="team"
              alt={homeTeam.name}
              size={40}
            />
            <h3 className="game-modal-team-name">{homeTeam.name}</h3>
            {isCompleted && homeIsWinner && (
              <CheckCircle size={16} className="game-modal-win-check" />
            )}
            {isCompleted && !homeIsWinner && (
              <div className="game-modal-win-placeholder" />
            )}
          </Link>

          {/* Center: Scores */}
          <div className="game-modal-scores">
            {isCompleted ? (
              <>
                <div className="game-modal-scores-row">
                  <span className={`game-modal-score ${homeIsWinner ? 'game-modal-score-winner' : ''}`}>
                    {game.homeScore}
                  </span>
                  <span className="game-modal-score-divider">—</span>
                  <span className={`game-modal-score ${awayIsWinner ? 'game-modal-score-winner' : ''}`}>
                    {game.awayScore}
                  </span>
                </div>
                <div className="game-modal-status-text">{getStatusText()}</div>
              </>
            ) : (
              <div className="game-modal-status-text">{getStatusText()}</div>
            )}
          </div>

          {/* Away Team */}
          <Link 
            to={`/team/${awayTeam.id}`} 
            state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
            className={`game-modal-team-block ${awayIsWinner ? 'game-modal-winner' : ''}`}
            onClick={(e) => e.stopPropagation()}
          >
            <ProfilePicture
              imageUrl={awayTeam.logoUrl}
              fallbackImage="team"
              alt={awayTeam.name}
              size={40}
            />
            <h3 className="game-modal-team-name">{awayTeam.name}</h3>
            {isCompleted && awayIsWinner && (
              <CheckCircle size={16} className="game-modal-win-check" />
            )}
            {isCompleted && !awayIsWinner && (
              <div className="game-modal-win-placeholder" />
            )}
          </Link>
        </div>

        {/* Stats Section */}
        {isCompleted && (
          <div className="game-modal-stats">
            <div className="game-modal-stat-item">
              <span className="game-modal-stat-label">SCORE DIFFERENCE</span>
              <span className="game-modal-stat-value">{getScoreDifference()}</span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="game-modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
