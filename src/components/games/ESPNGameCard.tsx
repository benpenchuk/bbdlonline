import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Trophy, Calendar } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import ProfilePicture from '../common/ProfilePicture';
import { getGameTags, getWinnerId } from '../../core/utils/gameHelpers';

interface ESPNGameCardProps {
  game: Game;
  teams: Team[];
  onClick?: () => void;
}

const ESPNGameCard: React.FC<ESPNGameCardProps> = ({ game, teams, onClick }) => {
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);
  
  if (!homeTeam || !awayTeam) {
    return null;
  }

  const handleTeamClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const getStatusDisplay = () => {
    switch (game.status) {
      case 'completed':
        return { text: 'Final', color: 'completed' };
      case 'scheduled':
        return { text: game.gameDate ? format(game.gameDate, 'h:mm a') : 'TBD', color: 'scheduled' };
      case 'in_progress':
        return { text: 'Live', color: 'in_progress' };
      case 'canceled':
        return { text: 'Canceled', color: 'canceled' };
      default:
        return { text: '', color: '' };
    }
  };

  const status = getStatusDisplay();
  const isCompleted = game.status === 'completed';
  const winnerId = getWinnerId(game);
  const tags = getGameTags(game);

  return (
    <div 
      className="espn-game-card"
      onClick={onClick}
    >
      <div className="espn-game-status-bar">
        <span className={`espn-status-badge status-${status.color}`}>
          {status.text}
        </span>
        {!isCompleted && game.gameDate && (
          <div className="espn-game-date">
            <Calendar size={14} />
            <span>{format(game.gameDate, 'MMM d')}</span>
          </div>
        )}
      </div>

      <div className="espn-game-body">
        {/* Home Team */}
        <Link 
          to={`/team/${homeTeam.id}`}
          state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
          className={`espn-team ${isCompleted && winnerId === homeTeam.id ? 'espn-team-winner' : ''}`}
          onClick={handleTeamClick}
        >
          <div className="espn-team-info">
            <ProfilePicture
              imageUrl={homeTeam.logoUrl}
              fallbackImage="team"
              alt={homeTeam.name}
              size={40}
            />
            <div className="espn-team-details">
              <span className="espn-team-name">{homeTeam.name}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="espn-team-score">
              {game.homeScore}
            </div>
          )}
        </Link>

        <div className="espn-vs-divider">
          {isCompleted ? 'FINAL' : 'VS'}
        </div>

        {/* Away Team */}
        <Link 
          to={`/team/${awayTeam.id}`}
          state={{ from: '/games', fromLabel: 'Games', scrollY: window.scrollY }}
          className={`espn-team ${isCompleted && winnerId === awayTeam.id ? 'espn-team-winner' : ''}`}
          onClick={handleTeamClick}
        >
          <div className="espn-team-info">
            <ProfilePicture
              imageUrl={awayTeam.logoUrl}
              fallbackImage="team"
              alt={awayTeam.name}
              size={40}
            />
            <div className="espn-team-details">
              <span className="espn-team-name">{awayTeam.name}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="espn-team-score">
              {game.awayScore}
            </div>
          )}
        </Link>
      </div>

      {/* Game Tags */}
      {isCompleted && (tags.isShutout || tags.isBlowout || tags.isClutch) && (
        <div className="espn-game-tags">
          {tags.isShutout && <span className="espn-tag tag-shutout">Shutout</span>}
          {tags.isBlowout && <span className="espn-tag tag-blowout">Blowout</span>}
          {tags.isClutch && <span className="espn-tag tag-clutch">Clutch</span>}
        </div>
      )}

      {/* Location */}
      <div className="espn-game-location">
        <div className="espn-location">
          <MapPin size={14} />
          <span>Bando Backyard</span>
        </div>
        {isCompleted && winnerId === homeTeam.id && (
          <Trophy size={14} className="winner-trophy" />
        )}
      </div>
    </div>
  );
};

export default ESPNGameCard;
