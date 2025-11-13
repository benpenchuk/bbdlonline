import React from 'react';
import { Trophy, Target, Zap, Award, Star, TrendingUp } from 'lucide-react';
import { Player, Team, Game, PlayerTeam } from '../../core/types';
import TeamIcon from '../common/TeamIcon';
import { getPlayerFullName } from '../../core/utils/playerHelpers';
import { getWinnerId, getGameTags } from '../../core/utils/gameHelpers';
import { calculateTeamStatsForGames } from '../../core/utils/statsCalculations';

interface NotableRecordsProps {
  players: Player[];
  teams: Team[];
  games: Game[];
  playerTeams: PlayerTeam[];
}

const NotableRecords: React.FC<NotableRecordsProps> = ({ players, teams, games, playerTeams }) => {
  // Calculate notable records
  const getNotableRecords = () => {
    const completedGames = games.filter(g => g.status === 'completed');
    
    // Highest single game score
    let highestScore = 0;
    let highestScoreTeamId = '';
    let highestScoreGame: Game | null = null;

    completedGames.forEach(game => {
      if (game.homeScore > highestScore) {
        highestScore = game.homeScore;
        highestScoreTeamId = game.homeTeamId;
        highestScoreGame = game;
      }
      if (game.awayScore > highestScore) {
        highestScore = game.awayScore;
        highestScoreTeamId = game.awayTeamId;
        highestScoreGame = game;
      }
    });

    // Calculate stats for all players
    const playersWithStats = players.map(player => {
      const playerTeamEntry = playerTeams.find(pt => pt.playerId === player.id && pt.status === 'active');
      const team = playerTeamEntry ? teams.find(t => t.id === playerTeamEntry.teamId) : undefined;
      
      if (!playerTeamEntry) {
        return { player, stats: null, team };
      }

      // Compute stats for this player
      const playerGames = completedGames.filter(g => 
        g.homeTeamId === playerTeamEntry.teamId || g.awayTeamId === playerTeamEntry.teamId
      );

      let wins = 0, losses = 0, totalPoints = 0, shutouts = 0, blowoutWins = 0, clutchWins = 0;
      let currentStreak = 0, longestWinStreak = 0;
      let lastWasWin = false;

      playerGames.forEach(game => {
        const isHome = game.homeTeamId === playerTeamEntry.teamId;
        const teamScore = isHome ? game.homeScore : game.awayScore;
        const oppScore = isHome ? game.awayScore : game.homeScore;
        const winnerId = getWinnerId(game);
        const isWin = winnerId === playerTeamEntry.teamId;
        const tags = getGameTags(game);

        totalPoints += teamScore;
        if (isWin) {
          wins++;
          if (lastWasWin) {
            currentStreak++;
          } else {
            currentStreak = 1;
            lastWasWin = true;
          }
          longestWinStreak = Math.max(longestWinStreak, currentStreak);
          
          if (tags.isShutout) shutouts++;
          if (tags.isBlowout) blowoutWins++;
          if (tags.isClutch) clutchWins++;
        } else {
          losses++;
          currentStreak = 0;
          lastWasWin = false;
        }
      });

      const gamesPlayed = wins + losses;
      const stats = {
        record: { wins, losses },
        avgPoints: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
        gamesPlayed,
        shutouts,
        blowoutWins,
        clutchWins,
        longestWinStreak
      };

      return { player, stats, team };
    }).filter(p => p.stats !== null) as Array<{ player: Player; stats: any; team?: Team }>;

    // Most wins
    const mostWinsEntry = playersWithStats.reduce((max, current) => 
      current.stats.record.wins > max.stats.record.wins ? current : max
    , playersWithStats[0] || { player: players[0], stats: { record: { wins: 0 } }, team: undefined });

    // Highest average
    const highestAverageEntry = playersWithStats.reduce((max, current) => 
      current.stats.avgPoints > max.stats.avgPoints ? current : max
    , playersWithStats[0] || { player: players[0], stats: { avgPoints: 0 }, team: undefined });

    // Longest win streak
    const longestStreakEntry = playersWithStats.reduce((max, current) => 
      current.stats.longestWinStreak > max.stats.longestWinStreak ? current : max
    , playersWithStats[0] || { player: players[0], stats: { longestWinStreak: 0 }, team: undefined });

    // Most shutouts
    const mostShutoutsEntry = playersWithStats.reduce((max, current) => 
      current.stats.shutouts > max.stats.shutouts ? current : max
    , playersWithStats[0] || { player: players[0], stats: { shutouts: 0 }, team: undefined });

    // Most blowouts
    const mostBlowoutsEntry = playersWithStats.reduce((max, current) => 
      current.stats.blowoutWins > max.stats.blowoutWins ? current : max
    , playersWithStats[0] || { player: players[0], stats: { blowoutWins: 0 }, team: undefined });

    // Most clutch wins
    const mostClutchEntry = playersWithStats.reduce((max, current) => 
      current.stats.clutchWins > max.stats.clutchWins ? current : max
    , playersWithStats[0] || { player: players[0], stats: { clutchWins: 0 }, team: undefined });

    // Team with best record
    const teamsWithStats = teams.map(team => {
      const stats = calculateTeamStatsForGames(team.id, games);
      return { team, stats };
    });

    const bestTeamEntry = teamsWithStats.reduce((max, current) => {
      const maxWinRate = max.stats.gamesPlayed > 0 ? max.stats.wins / max.stats.gamesPlayed : 0;
      const currentWinRate = current.stats.gamesPlayed > 0 ? current.stats.wins / current.stats.gamesPlayed : 0;
      return currentWinRate > maxWinRate ? current : max;
    }, teamsWithStats[0] || { team: teams[0], stats: { wins: 0, losses: 0, gamesPlayed: 0, pointsFor: 0, pointsAgainst: 0, winPct: 0 } });

    return {
      highestScore: { score: highestScore, team: teams.find(t => t.id === highestScoreTeamId), game: highestScoreGame },
      mostWins: mostWinsEntry,
      highestAverage: highestAverageEntry,
      longestStreak: longestStreakEntry,
      mostShutouts: mostShutoutsEntry,
      mostBlowouts: mostBlowoutsEntry,
      mostClutch: mostClutchEntry,
      bestTeam: bestTeamEntry
    };
  };

  const records = getNotableRecords();

  const recordItems = [
    {
      title: 'Highest Single Game Score',
      value: records.highestScore.score,
      subtitle: records.highestScore.team?.name || 'N/A',
      icon: Target,
      color: 'orange'
    },
    {
      title: 'Most Career Wins',
      value: records.mostWins.stats.record.wins,
      subtitle: `${getPlayerFullName(records.mostWins.player)} (${records.mostWins.team?.name || 'No Team'})`,
      icon: Trophy,
      color: 'green'
    },
    {
      title: 'Highest Average Score',
      value: records.highestAverage.stats.avgPoints.toFixed(1),
      subtitle: `${getPlayerFullName(records.highestAverage.player)} (${records.highestAverage.team?.name || 'No Team'})`,
      icon: TrendingUp,
      color: 'blue'
    },
    {
      title: 'Longest Win Streak',
      value: records.longestStreak.stats.longestWinStreak,
      subtitle: `${getPlayerFullName(records.longestStreak.player)} (${records.longestStreak.team?.name || 'No Team'})`,
      icon: Star,
      color: 'purple'
    },
    {
      title: 'Most Shutouts',
      value: records.mostShutouts.stats.shutouts,
      subtitle: `${getPlayerFullName(records.mostShutouts.player)} (${records.mostShutouts.team?.name || 'No Team'})`,
      icon: Award,
      color: 'red'
    },
    {
      title: 'Most Blowout Wins',
      value: records.mostBlowouts.stats.blowoutWins,
      subtitle: `${getPlayerFullName(records.mostBlowouts.player)} (${records.mostBlowouts.team?.name || 'No Team'})`,
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
      .sort((a, b) => {
        const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    recentGames.forEach(game => {
      const tags = getGameTags(game);
      const winnerId = getWinnerId(game);
      const winnerTeam = winnerId ? teams.find(t => t.id === winnerId) : undefined;

      if (tags.isShutout) {
        achievements.push({
          type: 'Shutout Victory',
          team: winnerTeam?.name,
          description: `Achieved a shutout victory`,
          icon: Award
        });
      }
      
      if (tags.isBlowout) {
        achievements.push({
          type: 'Blowout Win',
          team: winnerTeam?.name,
          description: `Won by 7+ points`,
          icon: Zap
        });
      }
      
      if (tags.isClutch) {
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
              <TeamIcon iconId={records.bestTeam.team.abbreviation} color="#3b82f6" size={32} />
              <div className="team-info">
                <h4>{records.bestTeam.team.name}</h4>
                <div className="team-achievement">Best Win Rate</div>
              </div>
            </div>
            <div className="team-stats">
              <div className="team-stat">
                <span className="stat-value">{records.bestTeam.stats.wins}</span>
                <span className="stat-label">Wins</span>
              </div>
              <div className="team-stat">
                <span className="stat-value">{records.bestTeam.stats.losses}</span>
                <span className="stat-label">Losses</span>
              </div>
              <div className="team-stat">
                <span className="stat-value">
                  {records.bestTeam.stats.gamesPlayed > 0 
                    ? Math.round((records.bestTeam.stats.wins / records.bestTeam.stats.gamesPlayed) * 100)
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
