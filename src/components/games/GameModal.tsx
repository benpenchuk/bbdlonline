import React from 'react';
import { X, Calendar, Clock, Trophy, Users, Target } from 'lucide-react';
import { Game, Team } from '../../types';
import { format } from 'date-fns';

interface GameModalProps {
  game: Game;
  teams: Team[];
  onClose: () => void;
}

const GameModal: React.FC<GameModalProps> = ({ game, teams, onClose }) => {
  const team1 = teams.find(t => t.id === game.team1Id);
  const team2 = teams.find(t => t.id === game.team2Id);

  if (!team1 || !team2) {
    return null;
  }

  const formatDate = (date: Date) => {
    return format(date, 'EEEE, MMMM d, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  const getScoreDifference = () => {
    if (game.status === 'completed' && game.team1Score !== undefined && game.team2Score !== undefined) {
      return Math.abs(game.team1Score - game.team2Score);
    }
    return 0;
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Game Details</h2>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body">
          {/* Game Status */}
          <div className="game-status-section">
            <div className={`status-badge status-${game.status}`}>
              {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
            </div>
            
            <div className="game-date-info">
              <div className="date-item">
                <Calendar size={16} />
                <span>{formatDate(game.scheduledDate)}</span>
              </div>
              {game.status === 'scheduled' && (
                <div className="date-item">
                  <Clock size={16} />
                  <span>{formatTime(game.scheduledDate)}</span>
                </div>
              )}
              {game.status === 'completed' && game.completedDate && (
                <div className="date-item">
                  <Trophy size={16} />
                  <span>Completed {formatTime(game.completedDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Teams and Score */}
          <div className="teams-section">
            <div className="team-info">
              <div className="team-header">
                <div 
                  className="team-color-large"
                  style={{ backgroundColor: team1.color }}
                />
                <div className="team-details">
                  <h3 className="team-name">{team1.name}</h3>
                  <div className="team-stats">
                    <Users size={14} />
                    <span>{team1.players.length} players</span>
                  </div>
                </div>
              </div>
              
              {game.status === 'completed' && (
                <div className={`team-score ${game.winnerId === team1.id ? 'winner' : ''}`}>
                  {game.team1Score}
                </div>
              )}
            </div>

            <div className="vs-section">
              {game.status === 'completed' ? (
                <div className="final-indicator">FINAL</div>
              ) : (
                <div className="vs-text">VS</div>
              )}
            </div>

            <div className="team-info">
              <div className="team-header">
                <div 
                  className="team-color-large"
                  style={{ backgroundColor: team2.color }}
                />
                <div className="team-details">
                  <h3 className="team-name">{team2.name}</h3>
                  <div className="team-stats">
                    <Users size={14} />
                    <span>{team2.players.length} players</span>
                  </div>
                </div>
              </div>
              
              {game.status === 'completed' && (
                <div className={`team-score ${game.winnerId === team2.id ? 'winner' : ''}`}>
                  {game.team2Score}
                </div>
              )}
            </div>
          </div>

          {/* Winner */}
          {game.status === 'completed' && game.winnerId && (
            <div className="winner-section">
              <Trophy size={20} />
              <span className="winner-text">
                Winner: {teams.find(t => t.id === game.winnerId)?.name}
              </span>
            </div>
          )}

          {/* Game Stats */}
          {game.status === 'completed' && (
            <div className="game-stats-section">
              <h4>Game Statistics</h4>
              <div className="stats-grid">
                <div className="stat-item">
                  <Target size={16} />
                  <span className="stat-label">Score Difference</span>
                  <span className="stat-value">{getScoreDifference()} points</span>
                </div>
                
                {game.isShutout && (
                  <div className="stat-highlight">
                    <span className="highlight-badge shutout">Shutout Game</span>
                    <span className="highlight-text">One team scored 0 points</span>
                  </div>
                )}
                
                {game.isBlowout && (
                  <div className="stat-highlight">
                    <span className="highlight-badge blowout">Blowout Victory</span>
                    <span className="highlight-text">Won by 7+ points</span>
                  </div>
                )}
                
                {game.isClutch && (
                  <div className="stat-highlight">
                    <span className="highlight-badge clutch">Clutch Game</span>
                    <span className="highlight-text">Won by 1-2 points</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="modal-actions">
            {game.status === 'scheduled' && (
              <>
                <button className="btn btn-outline">Edit Game</button>
                <button className="btn btn-danger">Cancel Game</button>
              </>
            )}
            {game.status === 'completed' && (
              <button className="btn btn-outline">Edit Score</button>
            )}
            <button className="btn btn-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameModal;
