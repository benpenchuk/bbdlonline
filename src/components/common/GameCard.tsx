import React from 'react';
import { Calendar, Clock, Trophy, X } from 'lucide-react';
import { Game, Team } from '../../types';
import { format } from 'date-fns';

interface GameCardProps {
  game: Game;
  teams: Team[];
  compact?: boolean;
  onClick?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, teams, compact = false, onClick }) => {
  const team1 = teams.find(t => t.id === game.team1Id);
  const team2 = teams.find(t => t.id === game.team2Id);
  
  if (!team1 || !team2) {
    return null;
  }

  const getStatusIcon = () => {
    switch (game.status) {
      case 'completed':
        return <Trophy size={16} />;
      case 'scheduled':
        return <Clock size={16} />;
      case 'cancelled':
        return <X size={16} />;
      default:
        return null;
    }
  };

  const getStatusColor = () => {
    switch (game.status) {
      case 'completed':
        return 'status-completed';
      case 'scheduled':
        return 'status-scheduled';
      case 'cancelled':
        return 'status-cancelled';
      default:
        return '';
    }
  };

  const formatDate = (date: Date) => {
    if (game.status === 'completed' && game.completedDate) {
      return format(game.completedDate, 'MMM d, yyyy');
    }
    return format(date, 'MMM d, yyyy');
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <div 
      className={`game-card ${compact ? 'game-card-compact' : ''} ${onClick ? 'game-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="game-card-header">
        <div className={`game-status ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="game-status-text">
            {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
          </span>
        </div>
        
        <div className="game-date">
          <Calendar size={14} />
          <span>{formatDate(game.scheduledDate)}</span>
          {game.status === 'scheduled' && (
            <span className="game-time">{formatTime(game.scheduledDate)}</span>
          )}
        </div>
      </div>

      <div className="game-teams">
        <div className="game-team">
          <div 
            className="team-color" 
            style={{ backgroundColor: team1.color }}
          />
          <span className="team-name">{team1.name}</span>
          {game.status === 'completed' && (
            <span className={`team-score ${game.winnerId === team1.id ? 'winner-score' : ''}`}>
              {game.team1Score}
            </span>
          )}
        </div>

        <div className="game-vs">vs</div>

        <div className="game-team">
          <div 
            className="team-color" 
            style={{ backgroundColor: team2.color }}
          />
          <span className="team-name">{team2.name}</span>
          {game.status === 'completed' && (
            <span className={`team-score ${game.winnerId === team2.id ? 'winner-score' : ''}`}>
              {game.team2Score}
            </span>
          )}
        </div>
      </div>

      {game.status === 'completed' && (game.isBlowout || game.isClutch || game.isShutout) && (
        <div className="game-tags">
          {game.isShutout && <span className="game-tag tag-shutout">Shutout</span>}
          {game.isBlowout && <span className="game-tag tag-blowout">Blowout</span>}
          {game.isClutch && <span className="game-tag tag-clutch">Clutch</span>}
        </div>
      )}
    </div>
  );
};

export default GameCard;
