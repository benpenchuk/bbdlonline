import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { Team, Game, TeamSeasonStats } from '../../core/types';
import TeamIcon from '../common/TeamIcon';

interface StandingsPreviewProps {
  teams: Team[];
  games: Game[];
  teamSeasonStats: TeamSeasonStats[];
}

const StandingsPreview: React.FC<StandingsPreviewProps> = ({ teams, games, teamSeasonStats }) => {
  const topTeams = useMemo(() => {
    // Calculate standings for current season (or all-time)
    const standings = teams.map(team => {
      // Aggregate stats from teamSeasonStats
      const teamStats = teamSeasonStats.filter(stat => stat.teamId === team.id);
      
      let wins = 0;
      let losses = 0;
      let gamesPlayed = 0;
      let pointsFor = 0;
      let pointsAgainst = 0;

      teamStats.forEach(stat => {
        wins += stat.wins;
        losses += stat.losses;
        gamesPlayed += stat.gamesPlayed;
        pointsFor += stat.pointsFor;
        pointsAgainst += stat.pointsAgainst;
      });

      const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0;
      const pointDifferential = pointsFor - pointsAgainst;

      return {
        team,
        wins,
        losses,
        gamesPlayed,
        winPercentage,
        pointDifferential
      };
    });

    // Sort by win percentage, then point differential
    standings.sort((a, b) => {
      if (a.winPercentage !== b.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointDifferential - a.pointDifferential;
    });

    return standings.slice(0, 5); // Top 5 teams
  }, [teams, teamSeasonStats]);

  if (topTeams.length === 0) {
    return null;
  }

  return (
    <section className="home-section standings-preview-section">
      <Link to="/standings" className="section-header-link">
        <div className="section-header">
          <div className="section-header-left">
            <Trophy size={20} className="section-icon" />
            <h2 className="section-title">Standings</h2>
          </div>
          <ChevronRight size={20} className="section-link-icon" />
        </div>
      </Link>
      
      <div className="standings-preview-grid">
        {topTeams.map((standing, index) => {
          const rank = index + 1;
          const isLeader = rank === 1;
          
          return (
            <div 
              key={standing.team.id} 
              className={`standings-preview-card ${isLeader ? 'leader-card' : ''}`}
            >
              <div className="standings-preview-rank">
                {isLeader && <Trophy size={16} className="rank-trophy" />}
                <span className="rank-number">#{rank}</span>
              </div>
              
              <div className="standings-preview-team">
                <TeamIcon 
                  iconId={standing.team.abbreviation} 
                  color="#3b82f6" 
                  size={24} 
                />
                <div className="standings-preview-team-info">
                  <span className="team-name">{standing.team.name}</span>
                  <span className="team-record">
                    {standing.wins}-{standing.losses}
                  </span>
                </div>
              </div>
              
              <div className="standings-preview-diff">
                {standing.pointDifferential > 0 && (
                  <TrendingUp size={14} className="diff-icon positive" />
                )}
                {standing.pointDifferential < 0 && (
                  <TrendingDown size={14} className="diff-icon negative" />
                )}
                {standing.pointDifferential === 0 && (
                  <Minus size={14} className="diff-icon neutral" />
                )}
                <span className={`diff-value ${
                  standing.pointDifferential > 0 ? 'positive' :
                  standing.pointDifferential < 0 ? 'negative' : ''
                }`}>
                  {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StandingsPreview;

