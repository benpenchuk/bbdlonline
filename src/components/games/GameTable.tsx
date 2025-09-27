import React from 'react';
import { Trophy, Clock, X, Calendar } from 'lucide-react';
import { Game, Team } from '../../types';
import { format } from 'date-fns';

interface GameTableProps {
  games: Game[];
  teams: Team[];
  onGameClick: (game: Game) => void;
}

const GameTable: React.FC<GameTableProps> = ({ games, teams, onGameClick }) => {
  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#6B7280';
  };

  const getStatusIcon = (status: Game['status']) => {
    switch (status) {
      case 'completed':
        return <Trophy size={16} className="text-green-600" />;
      case 'scheduled':
        return <Clock size={16} className="text-blue-600" />;
      case 'cancelled':
        return <X size={16} className="text-red-600" />;
    }
  };

  const formatDate = (game: Game) => {
    if (game.status === 'completed' && game.completedDate) {
      return format(game.completedDate, 'MMM d, yyyy');
    }
    return format(game.scheduledDate, 'MMM d, yyyy');
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
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Score</th>
            <th>Winner</th>
            <th>Tags</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr 
              key={game.id} 
              className="table-row-clickable"
              onClick={() => onGameClick(game)}
            >
              <td>
                <div className="status-cell">
                  {getStatusIcon(game.status)}
                  <span className="status-text">
                    {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                  </span>
                </div>
              </td>
              
              <td>
                <div className="date-cell">
                  <span className="date-text">{formatDate(game)}</span>
                  {game.status === 'scheduled' && (
                    <span className="time-text">{formatTime(game.scheduledDate)}</span>
                  )}
                </div>
              </td>

              <td>
                <div className="team-cell">
                  <div 
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(game.team1Id) }}
                  />
                  <span>{getTeamName(game.team1Id)}</span>
                </div>
              </td>

              <td>
                <div className="team-cell">
                  <div 
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(game.team2Id) }}
                  />
                  <span>{getTeamName(game.team2Id)}</span>
                </div>
              </td>

              <td>
                {game.status === 'completed' ? (
                  <div className="score-cell">
                    <span className={game.winnerId === game.team1Id ? 'winner-score' : ''}>
                      {game.team1Score}
                    </span>
                    <span className="score-separator">-</span>
                    <span className={game.winnerId === game.team2Id ? 'winner-score' : ''}>
                      {game.team2Score}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              <td>
                {game.winnerId ? (
                  <div className="winner-cell">
                    <Trophy size={14} />
                    <span>{getTeamName(game.winnerId)}</span>
                  </div>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>

              <td>
                <div className="tags-cell">
                  {game.isShutout && <span className="tag tag-shutout">Shutout</span>}
                  {game.isBlowout && <span className="tag tag-blowout">Blowout</span>}
                  {game.isClutch && <span className="tag tag-clutch">Clutch</span>}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default GameTable;
