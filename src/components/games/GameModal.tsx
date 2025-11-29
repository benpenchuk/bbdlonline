import React from 'react';
import { Link } from 'react-router-dom';
import { X, Calendar, MapPin, Trophy, Users, Clock } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import ProfilePicture from '../common/ProfilePicture';
import { getGameTags, getWinnerId } from '../../core/utils/gameHelpers';

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
  const tags = getGameTags(game);
  const isCompleted = game.status === 'completed';

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getScoreDifference = () => {
    if (game.status === 'completed') {
      return Math.abs(game.homeScore - game.awayScore);
    }
    return 0;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="game-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-group">
            <Trophy size={24} />
            <h2>Game Details</h2>
          </div>
          <button onClick={onClose} className="modal-close" aria-label="Close modal">
            <X size={24} />
          </button>
        </div>

        {/* Game Info */}
        <div className="game-modal-content">
          <div className="game-info-section">
            <div className="game-meta">
              <div className="meta-group">
                {game.gameDate && (
                  <div className="date-item">
                    <Calendar size={16} />
                    <span>{formatDate(game.gameDate)}</span>
                  </div>
                )}
                {game.status === 'scheduled' && game.gameDate && (
                  <div className="date-item">
                    <Clock size={16} />
                    <span>{formatTime(game.gameDate)}</span>
                  </div>
                )}
              </div>
              
              <div className="meta-group">
                <div className="status-badge status-{game.status}">
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>

          {/* Teams */}
          <div className="game-matchup">
            {/* Home Team */}
            <Link 
              to={`/team/${homeTeam.id}`} 
              state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
              className="team-display" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="team-header-display">
                <ProfilePicture
                  imageUrl={homeTeam.logoUrl}
                  fallbackImage="team"
                  alt={homeTeam.name}
                  size={64}
                />
                <div className="team-details">
                  <h3 className="team-name">{homeTeam.name}</h3>
                </div>
              </div>
              
              {game.status === 'completed' && (
                <div className={`team-score ${winnerId === homeTeam.id ? 'winner' : ''}`}>
                  {game.homeScore}
                </div>
              )}
            </Link>

            <div className="vs-divider">
              {isCompleted ? 'FINAL' : 'VS'}
            </div>

            {/* Away Team */}
            <Link 
              to={`/team/${awayTeam.id}`} 
              state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
              className="team-display" 
              onClick={(e) => e.stopPropagation()}
            >
              <div className="team-header-display">
                <ProfilePicture
                  imageUrl={awayTeam.logoUrl}
                  fallbackImage="team"
                  alt={awayTeam.name}
                  size={64}
                />
                <div className="team-details">
                  <h3 className="team-name">{awayTeam.name}</h3>
                </div>
              </div>
              
              {game.status === 'completed' && (
                <div className={`team-score ${winnerId === awayTeam.id ? 'winner' : ''}`}>
                  {game.awayScore}
                </div>
              )}
            </Link>
          </div>

          {/* Winner */}
          {game.status === 'completed' && winnerId && (
            <div className="winner-section">
              <Trophy size={20} />
              <span className="winner-text">
                Winner: {teams.find(t => t.id === winnerId)?.name}
              </span>
            </div>
          )}

          {/* Game Stats */}
          {game.status === 'completed' && (
            <div className="game-stats-section">
              <h4>Game Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <span className="stat-label">Score Difference</span>
                  <span className="stat-value">{getScoreDifference()}</span>
                </div>
                
                {tags.isShutout && (
                  <div className="stat-highlight">
                    <span className="highlight-badge shutout">Shutout Game</span>
                    <span className="highlight-text">One team scored 0 points</span>
                  </div>
                )}
                
                {tags.isBlowout && (
                  <div className="stat-highlight">
                    <span className="highlight-badge blowout">Blowout Victory</span>
                    <span className="highlight-text">Won by 7+ points</span>
                  </div>
                )}
                
                {tags.isClutch && (
                  <div className="stat-highlight">
                    <span className="highlight-badge clutch">Clutch Game</span>
                    <span className="highlight-text">Won by 1-2 points</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div className="location-section">
            <div className="location-info">
              <MapPin size={16} />
              <span>Bando Backyard</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button onClick={onClose} className="btn btn-primary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
