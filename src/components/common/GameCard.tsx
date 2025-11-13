import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import TeamIcon from './TeamIcon';
import GameStatusBadge from './GameStatusBadge';

interface GameCardProps {
  game: Game;
  teams: Team[];
  compact?: boolean;
  onClick?: () => void;
}

const GameCard: React.FC<GameCardProps> = ({ game, teams, compact = false, onClick }) => {
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  // Calculate game characteristics from scores
  const scoreDiff = Math.abs(game.homeScore - game.awayScore);
  const isBlowout = game.status === 'completed' && scoreDiff >= 7;
  const isClutch = game.status === 'completed' && scoreDiff <= 2;
  const isShutout = game.status === 'completed' && (game.homeScore === 0 || game.awayScore === 0);

  const formatDate = (date?: Date) => {
    if (!date) return 'TBD';
    return format(new Date(date), 'MMM d, yyyy');
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  };

  return (
    <div 
      className={`game-card ${compact ? 'game-card-compact' : ''} ${onClick ? 'game-card-clickable' : ''}`}
      onClick={onClick}
    >
      <div className="game-card-header">
        <GameStatusBadge 
          status={game.status} 
          gameDate={game.gameDate}
          className="game-status-badge-top"
        />
        
        <div className="game-date">
          <Calendar size={14} />
          <span>{formatDate(game.gameDate)}</span>
          {game.status === 'scheduled' && game.gameDate && (
            <span className="game-time">{formatTime(game.gameDate)}</span>
          )}
        </div>
      </div>

      <div className="game-teams">
        <Link to={`/team/${homeTeam.id}`} className="game-team" onClick={(e) => e.stopPropagation()}>
          <TeamIcon iconId={homeTeam.abbreviation} color="#3b82f6" size={20} />
          <span className="team-name">{homeTeam.name}</span>
          {game.status === 'completed' && (
            <span className={`team-score ${game.winningTeamId === homeTeam.id ? 'winner-score' : ''}`}>
              {game.homeScore}
            </span>
          )}
        </Link>

        <div className="game-vs">vs</div>

        <Link to={`/team/${awayTeam.id}`} className="game-team" onClick={(e) => e.stopPropagation()}>
          <TeamIcon iconId={awayTeam.abbreviation} color="#ef4444" size={20} />
          <span className="team-name">{awayTeam.name}</span>
          {game.status === 'completed' && (
            <span className={`team-score ${game.winningTeamId === awayTeam.id ? 'winner-score' : ''}`}>
              {game.awayScore}
            </span>
          )}
        </Link>
      </div>

      {game.status === 'completed' && (isBlowout || isClutch || isShutout) && (
        <div className="game-tags">
          {isShutout && <span className="game-tag tag-shutout">Shutout</span>}
          {isBlowout && <span className="game-tag tag-blowout">Blowout</span>}
          {isClutch && <span className="game-tag tag-clutch">Clutch</span>}
        </div>
      )}
    </div>
  );
};

export default GameCard;
