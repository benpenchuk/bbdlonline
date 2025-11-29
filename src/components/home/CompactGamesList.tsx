import React from 'react';
import { Link } from 'react-router-dom';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import ProfilePicture from '../common/ProfilePicture';
import { getWinnerId } from '../../core/utils/gameHelpers';

interface CompactGamesListProps {
  games: Game[];
  teams: Team[];
  title: string;
  linkTo?: string;
  limit?: number;
}

const CompactGamesList: React.FC<CompactGamesListProps> = ({
  games,
  teams,
  title,
  linkTo = '/games',
  limit = 7
}) => {
  const formatDate = (date?: Date) => {
    if (!date) return 'TBD';
    return format(new Date(date), 'MMM d');
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  };

  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

  return (
    <div className="compact-games-card">
      <div className="compact-card-header">
        <h3 className="compact-card-title">{title}</h3>
        <Link to={linkTo} className="compact-card-link">
          View All →
        </Link>
      </div>
      <div className="compact-games-list">
        {games.slice(0, limit).map(game => {
          const homeTeam = getTeam(game.homeTeamId);
          const awayTeam = getTeam(game.awayTeamId);
          const winnerId = game.status === 'completed' ? getWinnerId(game) : null;

          if (!homeTeam || !awayTeam) return null;

          return (
            <div key={game.id} className="compact-game-item">
              <div className="compact-game-teams">
                <div className={`compact-game-team ${winnerId === homeTeam.id ? 'winner' : ''}`}>
                  <ProfilePicture
                    imageUrl={homeTeam.logoUrl}
                    fallbackImage="team"
                    alt={homeTeam.name}
                    size={20}
                  />
                  <span className="compact-team-name">{homeTeam.name}</span>
                  {game.status === 'completed' && (
                    <span className="compact-game-score tabular-nums">{game.homeScore}</span>
                  )}
                </div>
                <div className={`compact-game-team ${winnerId === awayTeam.id ? 'winner' : ''}`}>
                  <ProfilePicture
                    imageUrl={awayTeam.logoUrl}
                    fallbackImage="team"
                    alt={awayTeam.name}
                    size={20}
                  />
                  <span className="compact-team-name">{awayTeam.name}</span>
                  {game.status === 'completed' && (
                    <span className="compact-game-score tabular-nums">{game.awayScore}</span>
                  )}
                </div>
              </div>
              <div className="compact-game-meta">
                {game.status === 'completed' ? (
                  <span className="compact-game-date">{formatDate(game.gameDate)}</span>
                ) : (
                  <span className="compact-game-date">
                    {formatDate(game.gameDate)} {game.gameDate && formatTime(game.gameDate)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {games.length === 0 && (
          <div className="compact-empty-state">No games available</div>
        )}
      </div>
    </div>
  );
};

export default CompactGamesList;

