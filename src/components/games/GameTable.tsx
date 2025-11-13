import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Clock, X, Calendar, AlertCircle } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import TeamIcon from '../common/TeamIcon';
import { getGameTags, getWinnerId } from '../../core/utils/gameHelpers';

interface GameTableProps {
  games: Game[];
  teams: Team[];
  onGameClick: (game: Game) => void;
}

const GameTable: React.FC<GameTableProps> = ({ games, teams, onGameClick }) => {
  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeam = (teamId: string) => {
    return teams.find(t => t.id === teamId);
  };

  const getStatusIcon = (status: Game['status']) => {
    switch (status) {
      case 'completed':
        return <Trophy size={16} className="text-green-600" />;
      case 'in_progress':
        return <AlertCircle size={16} className="text-yellow-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      case 'canceled':
        return <X size={16} className="text-red-600" />;
    }
  };

  const formatDate = (game: Game) => {
    return game.gameDate ? format(game.gameDate, 'MMM d, yyyy') : 'TBD';
  };

  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };

  return (
    <div className="table-container">
      <table className="games-table">
        <thead>
          <tr>
            <th>Status</th>
            <th>Date</th>
            <th>Home Team</th>
            <th>Away Team</th>
            <th>Score</th>
            <th>Winner</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => {
            const homeTeam = getTeam(game.homeTeamId);
            const awayTeam = getTeam(game.awayTeamId);
            const winnerId = getWinnerId(game);
            const tags = getGameTags(game);

            return (
              <tr 
                key={game.id} 
                className="table-row-clickable"
                onClick={() => onGameClick(game)}
              >
                <td>
                  <div className="status-cell">
                    {getStatusIcon(game.status)}
                    <span className="status-text">
                      {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
                    </span>
                  </div>
                </td>
                
                <td>
                  <div className="date-cell">
                    <span className="date-text">{formatDate(game)}</span>
                    {game.status === 'scheduled' && game.gameDate && (
                      <span className="time-text">{formatTime(game.gameDate)}</span>
                    )}
                  </div>
                </td>
                
                <td>
                  {homeTeam ? (
                    <Link to={`/team/${homeTeam.id}`} className="team-cell-link" onClick={(e) => e.stopPropagation()}>
                      <div className="team-cell">
                        <TeamIcon 
                          iconId={homeTeam.abbreviation}
                          color="#3b82f6"
                          size={16} 
                        />
                        <span>{homeTeam.name}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="team-cell">
                      <span>{getTeamName(game.homeTeamId)}</span>
                    </div>
                  )}
                </td>

                <td>
                  {awayTeam ? (
                    <Link to={`/team/${awayTeam.id}`} className="team-cell-link" onClick={(e) => e.stopPropagation()}>
                      <div className="team-cell">
                        <TeamIcon 
                          iconId={awayTeam.abbreviation}
                          color="#ef4444"
                          size={16} 
                        />
                        <span>{awayTeam.name}</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="team-cell">
                      <span>{getTeamName(game.awayTeamId)}</span>
                    </div>
                  )}
                </td>

                <td>
                  {game.status === 'completed' ? (
                    <div className="score-cell">
                      <span className={winnerId === game.homeTeamId ? 'winner-score' : ''}>
                        {game.homeScore}
                      </span>
                      <span className="score-separator">-</span>
                      <span className={winnerId === game.awayTeamId ? 'winner-score' : ''}>
                        {game.awayScore}
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted">-</span>
                  )}
                </td>

                <td>
                  {winnerId ? (
                    <div className="winner-cell">
                      <Trophy size={14} />
                      <span>{getTeamName(winnerId)}</span>
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>

                <td>
                  <div className="tags-cell">
                    {tags.isShutout && <span className="tag tag-shutout">Shutout</span>}
                    {tags.isBlowout && <span className="tag tag-blowout">Blowout</span>}
                    {tags.isClutch && <span className="tag tag-clutch">Clutch</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      
      {games.length === 0 && (
        <div className="empty-table-state">
          <Calendar size={48} />
          <p>No games to display</p>
        </div>
      )}
    </div>
  );
};

export default GameTable;
