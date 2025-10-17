import React from 'react';
import { Clock, MapPin, Trophy, Calendar } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import TeamIcon from '../common/TeamIcon';
import { useNavigate } from 'react-router-dom';

interface ESPNGameCardProps {
  game: Game;
  teams: Team[];
  onClick?: () => void;
}

const ESPNGameCard: React.FC<ESPNGameCardProps> = ({ game, teams, onClick }) => {
  const navigate = useNavigate();
  const team1 = teams.find(t => t.id === game.team1Id);
  const team2 = teams.find(t => t.id === game.team2Id);
  
  if (!team1 || !team2) {
    return null;
  }

  const handleTeamClick = (e: React.MouseEvent, teamId: string) => {
    e.stopPropagation();
    // Future: navigate(`/team/${teamId}`);
    console.log('Navigate to team page:', teamId);
  };

  const getStatusDisplay = () => {
    switch (game.status) {
      case 'completed':
        return { text: 'Final', color: 'completed' };
      case 'scheduled':
        return { text: format(game.scheduledDate, 'h:mm a'), color: 'scheduled' };
      case 'cancelled':
        return { text: 'Cancelled', color: 'cancelled' };
      default:
        return { text: '', color: '' };
    }
  };

  const status = getStatusDisplay();
  const isCompleted = game.status === 'completed';

  return (
    <div 
      className="espn-game-card"
      onClick={onClick}
    >
      <div className="espn-game-status-bar">
        <span className={`espn-status-badge status-${status.color}`}>
          {status.text}
        </span>
        {game.status === 'scheduled' && (
          <div className="espn-game-date">
            <Calendar size={14} />
            <span>{format(game.scheduledDate, 'MMM d')}</span>
          </div>
        )}
      </div>

      <div className="espn-game-matchup">
        {/* Team 1 */}
        <div 
          className={`espn-team ${isCompleted && game.winnerId === team1.id ? 'espn-team-winner' : ''}`}
          onClick={(e) => handleTeamClick(e, team1.id)}
        >
          <div className="espn-team-info">
            <TeamIcon iconId={team1.icon} color={team1.color} size={28} />
            <div className="espn-team-details">
              <span className="espn-team-name">{team1.name}</span>
              <span className="espn-team-record">{team1.wins}-{team1.losses}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="espn-team-score">
              {game.team1Score}
            </div>
          )}
        </div>

        {/* VS Divider */}
        <div className="espn-vs-divider">
          <span>VS</span>
        </div>

        {/* Team 2 */}
        <div 
          className={`espn-team ${isCompleted && game.winnerId === team2.id ? 'espn-team-winner' : ''}`}
          onClick={(e) => handleTeamClick(e, team2.id)}
        >
          <div className="espn-team-info">
            <TeamIcon iconId={team2.icon} color={team2.color} size={28} />
            <div className="espn-team-details">
              <span className="espn-team-name">{team2.name}</span>
              <span className="espn-team-record">{team2.wins}-{team2.losses}</span>
            </div>
          </div>
          {isCompleted && (
            <div className="espn-team-score">
              {game.team2Score}
            </div>
          )}
        </div>
      </div>

      {/* Game Tags */}
      {isCompleted && (game.isShutout || game.isBlowout || game.isClutch) && (
        <div className="espn-game-tags">
          {game.isShutout && <span className="espn-tag tag-shutout">Shutout</span>}
          {game.isBlowout && <span className="espn-tag tag-blowout">Blowout</span>}
          {game.isClutch && <span className="espn-tag tag-clutch">Clutch</span>}
        </div>
      )}

      {/* Venue/Location */}
      <div className="espn-game-footer">
        <div className="espn-venue">
          <MapPin size={14} />
          <span>Bando Backyard</span>
        </div>
        {isCompleted && game.winnerId === team1.id && (
          <Trophy size={14} className="winner-trophy" />
        )}
      </div>
    </div>
  );
};

export default ESPNGameCard;

