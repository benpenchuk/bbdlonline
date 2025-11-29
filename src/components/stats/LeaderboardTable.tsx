import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Award, Zap, Users, BarChart3 } from 'lucide-react';
import { LeaderboardEntry, Player, Team, PlayerTeam } from '../../core/types';
import ProfilePicture from '../common/ProfilePicture';
import { getPlayerFullName } from '../../core/utils/playerHelpers';

interface LeaderboardTableProps {
  entries: LeaderboardEntry[];
  players: Player[];
  teams: Team[];
  playerTeams: PlayerTeam[];
  category: 'wins' | 'average' | 'shutouts' | 'blowouts' | 'clutch' | 'streak';
}

const LeaderboardTable: React.FC<LeaderboardTableProps> = ({
  entries,
  players,
  teams,
  playerTeams,
  category
}) => {
  const navigate = useNavigate();

  const handlePlayerClick = (playerSlug: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/players/${playerSlug}`, {
      state: {
        from: '/stats',
        fromLabel: 'Stats',
        scrollY: window.scrollY
      }
    });
  };

  const handleTeamClick = (teamId: string, teamName: string, e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/team/${teamId}`, {
      state: {
        from: '/stats',
        fromLabel: 'Stats',
        scrollY: window.scrollY
      }
    });
  };

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
              if (!player) return null;

              const playerTeamEntry = playerTeams.find(pt => pt.playerId === player.id && pt.status === 'active');
              const team = playerTeamEntry ? teams.find(t => t.id === playerTeamEntry.teamId) : undefined;

              // LeaderboardEntry should have stats, but provide fallback
              const gamesPlayed = entry.gamesPlayed || 0;
              const wins = entry.wins || 0;
              const winPercentage = gamesPlayed > 0 
                ? Math.round((wins / gamesPlayed) * 100)
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
                    <a 
                      href={`/players/${player.slug}`}
                      onClick={(e) => handlePlayerClick(player.slug, e)}
                      className="player-cell player-cell-link"
                    >
                      <ProfilePicture
                        imageUrl={player.avatarUrl}
                        fallbackImage="player"
                        alt={getPlayerFullName(player)}
                        size={32}
                      />
                      <span className="player-name">{getPlayerFullName(player)}</span>
                    </a>
                  </td>
                  
                  <td>
                    {team ? (
                      <a 
                        href={`/team/${team.id}`}
                        onClick={(e) => handleTeamClick(team.id, team.name, e)}
                        className="team-cell-link"
                      >
                        <div className="team-cell">
                          <ProfilePicture
                            imageUrl={team.logoUrl}
                            fallbackImage="team"
                            alt={team.name}
                            size={20}
                          />
                          <span>{team.name}</span>
                        </div>
                      </a>
                    ) : (
                      <span className="text-muted">No team</span>
                    )}
                  </td>
                  
                  <td>
                    <span className="stat-value-large">{formatValue(entry.value)}</span>
                  </td>
                  
                  <td>
                    <span className="games-played">{gamesPlayed}</span>
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
