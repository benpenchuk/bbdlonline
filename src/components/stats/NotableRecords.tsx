import React from 'react';
import { Trophy, Target, Zap, Award, Star, TrendingUp } from 'lucide-react';
import { Player, Team, Game } from '../../core/types';

interface NotableRecordsProps {
  players: Player[];
  teams: Team[];
  games: Game[];
}

const NotableRecords: React.FC<NotableRecordsProps> = ({ players, teams, games }) => {
  // Calculate notable records
  const getNotableRecords = () => {
    const completedGames = games.filter(g => g.status === 'completed');
    
    // Highest single game score
    let highestScore = 0;
    let highestScorePlayer = '';
    let highestScoreGame: Game | null = null;

    completedGames.forEach(game => {
      if (game.team1Score! > highestScore) {
        highestScore = game.team1Score!;
        highestScorePlayer = game.team1Id;
        highestScoreGame = game;
      }
      if (game.team2Score! > highestScore) {
        highestScore = game.team2Score!;
        highestScorePlayer = game.team2Id;
        highestScoreGame = game;
      }
    });

    // Most wins
    const mostWinsPlayer = players.reduce((max, player) => 
      player.stats.wins > max.stats.wins ? player : max
    );

    // Highest average
    const highestAveragePlayer = players.reduce((max, player) => 
      player.stats.averagePoints > max.stats.averagePoints ? player : max
    );

    // Longest win streak
    const longestStreakPlayer = players.reduce((max, player) => 
      player.stats.longestWinStreak > max.stats.longestWinStreak ? player : max
    );

    // Most shutouts
    const mostShutoutsPlayer = players.reduce((max, player) => 
      player.stats.shutouts > max.stats.shutouts ? player : max
    );

    // Most blowouts
    const mostBlowoutsPlayer = players.reduce((max, player) => 
      player.stats.blowoutWins > max.stats.blowoutWins ? player : max
    );

    // Most clutch wins
    const mostClutchPlayer = players.reduce((max, player) => 
      player.stats.clutchWins > max.stats.clutchWins ? player : max
    );

    // Team with best record
    const bestTeam = teams.reduce((max, team) => {
      const maxWinRate = max.wins + max.losses > 0 ? max.wins / (max.wins + max.losses) : 0;
      const teamWinRate = team.wins + team.losses > 0 ? team.wins / (team.wins + team.losses) : 0;
      return teamWinRate > maxWinRate ? team : max;
    });

    return {
      highestScore: { score: highestScore, team: teams.find(t => t.id === highestScorePlayer), game: highestScoreGame },
      mostWins: { player: mostWinsPlayer, team: teams.find(t => t.id === mostWinsPlayer.teamId) },
      highestAverage: { player: highestAveragePlayer, team: teams.find(t => t.id === highestAveragePlayer.teamId) },
      longestStreak: { player: longestStreakPlayer, team: teams.find(t => t.id === longestStreakPlayer.teamId) },
      mostShutouts: { player: mostShutoutsPlayer, team: teams.find(t => t.id === mostShutoutsPlayer.teamId) },
      mostBlowouts: { player: mostBlowoutsPlayer, team: teams.find(t => t.id === mostBlowoutsPlayer.teamId) },
      mostClutch: { player: mostClutchPlayer, team: teams.find(t => t.id === mostClutchPlayer.teamId) },
      bestTeam
    };
  };

  const records = getNotableRecords();

  const recordItems = [
    {
      title: 'Highest Single Game Score',
      value: records.highestScore.score,
      subtitle: records.highestScore.team?.name,
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Most Career Wins',
      value: records.mostWins.player.stats.wins,
      subtitle: `${records.mostWins.player.name} (${records.mostWins.team?.name})`,
      icon: Trophy,
      color: 'green'
    },
    {
      title: 'Highest Average Score',
      value: records.highestAverage.player.stats.averagePoints.toFixed(1),
      subtitle: `${records.highestAverage.player.name} (${records.highestAverage.team?.name})`,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Longest Win Streak',
      value: records.longestStreak.player.stats.longestWinStreak,
      subtitle: `${records.longestStreak.player.name} (${records.longestStreak.team?.name})`,
      icon: Star,
      color: 'purple'
    },
    {
      title: 'Most Shutouts',
      value: records.mostShutouts.player.stats.shutouts,
      subtitle: `${records.mostShutouts.player.name} (${records.mostShutouts.team?.name})`,
      icon: Award,
      color: 'red'
    },
    {
      title: 'Most Blowout Wins',
      value: records.mostBlowouts.player.stats.blowoutWins,
      subtitle: `${records.mostBlowouts.player.name} (${records.mostBlowouts.team?.name})`,
      icon: Zap,
      color: 'yellow'
    }
  ];

  // Recent achievements (players who achieved something in recent games)
  const getRecentAchievements = () => {
    const achievements: Array<{
      type: string;
      team?: string;
      description: string;
      icon: any;
    }> = [];
    const recentGames = games
      .filter(g => g.status === 'completed')
      .sort((a, b) => new Date(b.completedDate!).getTime() - new Date(a.completedDate!).getTime())
      .slice(0, 10);

    recentGames.forEach(game => {
      if (game.isShutout) {
        const winnerTeam = teams.find(t => t.id === game.winnerId);
        achievements.push({
          type: 'Shutout Victory',
          team: winnerTeam?.name,
          description: `Achieved a shutout victory`,
          icon: Award
        });
      }
      
      if (game.isBlowout) {
        const winnerTeam = teams.find(t => t.id === game.winnerId);
        achievements.push({
          type: 'Blowout Win',
          team: winnerTeam?.name,
          description: `Won by 7+ points`,
          icon: Zap
        });
      }
      
      if (game.isClutch) {
        const winnerTeam = teams.find(t => t.id === game.winnerId);
        achievements.push({
          type: 'Clutch Victory',
          team: winnerTeam?.name,
          description: `Won by 1-2 points`,
          icon: Star
        });
      }
    });

    return achievements.slice(0, 5); // Show only recent 5
  };

  const recentAchievements = getRecentAchievements();

  return (
    <div className="notable-records">
      <div className="records-grid">
        <div className="records-section">
          <h3>Season Records</h3>
          <div className="record-cards">
            {recordItems.map((record, index) => {
              const Icon = record.icon;
              return (
                <div key={index} className={`record-card record-${record.color}`}>
                  <div className="record-icon">
                    <Icon size={24} />
                  </div>
                  <div className="record-content">
                    <div className="record-value">{record.value}</div>
                    <div className="record-title">{record.title}</div>
                    <div className="record-subtitle">{record.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="achievements-section">
          <h3>Recent Achievements</h3>
          {recentAchievements.length > 0 ? (
            <div className="achievements-list">
              {recentAchievements.map((achievement, index) => {
                const Icon = achievement.icon;
                return (
                  <div key={index} className="achievement-item">
                    <div className="achievement-icon">
                      <Icon size={16} />
                    </div>
                    <div className="achievement-content">
                      <div className="achievement-type">{achievement.type}</div>
                      <div className="achievement-team">{achievement.team}</div>
                      <div className="achievement-description">{achievement.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="no-achievements">
              <Star size={32} />
              <p>No recent achievements</p>
            </div>
          )}
        </div>

        <div className="team-records-section">
          <h3>Team Excellence</h3>
          <div className="team-record-card">
            <div className="team-header">
              <div 
                className="team-color-large"
                style={{ backgroundColor: records.bestTeam.color }}
              />
              <div className="team-info">
                <h4>{records.bestTeam.name}</h4>
                <div className="team-achievement">Best Win Rate</div>
              </div>
            </div>
            <div className="team-stats">
              <div className="team-stat">
                <span className="stat-value">{records.bestTeam.wins}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="team-stat">
                <span className="stat-value">{records.bestTeam.losses}</span>
                <span className="stat-label">Losses</span>
              </div>
              <div className="team-stat">
                <span className="stat-value">
                  {records.bestTeam.wins + records.bestTeam.losses > 0 
                    ? Math.round((records.bestTeam.wins / (records.bestTeam.wins + records.bestTeam.losses)) * 100)
                    : 0}%
                </span>
                <span className="stat-label">Win Rate</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotableRecords;
