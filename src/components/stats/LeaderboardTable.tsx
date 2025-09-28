import React from 'react';
import { Trophy, Target, Award, Zap, Users, BarChart3 } from 'lucide-react';
import { LeaderboardEntry, Player, Team } from '../../core/types';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  players: Player[];
  teams: Team[];
  category: 'wins' | 'average' | 'shutouts' | 'blowouts' | 'clutch' | 'streak';
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  players,
  teams,
  category
}) => {
  const getCategoryIcon = () => {
    switch (category) {
      case 'wins': return Trophy;
      case 'average': return Target;
      case 'shutouts': return Award;
      case 'blowouts': return Zap;
      case 'clutch': return Users;
      case 'streak': return BarChart3;
    }
  };

  const getCategoryLabel = () => {
    switch (category) {
      case 'wins': return 'Wins';
      case 'average': return 'Avg Points';
      case 'shutouts': return 'Shutouts';
      case 'blowouts': return 'Blowouts';
      case 'clutch': return 'Clutch Wins';
      case 'streak': return 'Win Streak';
    }
  };

  const formatValue = (value: number) => {
    if (category === 'average') {
      return value.toFixed(1);
    }
    return value.toString();
  };

  const Icon = getCategoryIcon();

  return (
    <div className="leaderboard-table">
      <div className="leaderboard-header">
        <Icon size={20} />
        <h3>{getCategoryLabel()} Leaders</h3>
      </div>

      <div className="table-container">
        <table className="leaderboard">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Team</th>
              <th>{getCategoryLabel()}</th>
              <th>Games</th>
              <th>Win %</th>
            </tr>
          </thead>
          <tbody>
            {entries.slice(0, 10).map((entry, index) => {
              const player = players.find(p => p.id === entry.playerId);
              const team = teams.find(t => t.id === player?.teamId);
              
              if (!player || !team) return null;

              const winPercentage = player.stats.gamesPlayed > 0 
                ? Math.round((player.stats.wins / player.stats.gamesPlayed) * 100)
                : 0;

              return (
                <tr key={entry.playerId} className={`rank-${entry.rank <= 3 ? entry.rank : 'other'}`}>
                  <td>
                    <div className="rank-cell">
                      <span className="rank-number">#{entry.rank}</span>
                      {entry.rank <= 3 && (
                        <div className={`medal medal-${entry.rank}`}>
                          {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
                        </div>
                      )}
                    </div>
                  </td>
                  
                  <td>
                    <div className="player-cell">
                      <div className="player-avatar-small">
                        {player.photoUrl ? (
                          <img src={player.photoUrl} alt={player.name} />
                        ) : (
                          <div className="player-initials-small">
                            {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="player-name">{player.name}</span>
                    </div>
                  </td>
                  
                  <td>
                    <div className="team-cell">
                      <div 
                        className="team-color-dot"
                        style={{ backgroundColor: team.color }}
                      />
                      <span>{team.name}</span>
                    </div>
                  </td>
                  
                  <td>
                    <span className="stat-value-large">{formatValue(entry.value)}</span>
                  </td>
                  
                  <td>
                    <span className="games-played">{player.stats.gamesPlayed}</span>
                  </td>
                  
                  <td>
                    <span className="win-percentage">{winPercentage}%</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {entries.length === 0 && (
        <div className="empty-leaderboard">
          <Icon size={32} />
          <p>No data available for this category</p>
        </div>
      )}
    </div>
  );
};

export default LeaderboardTable;
