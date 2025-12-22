import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Team, Game, TeamSeasonStats } from '../../core/types';
import ProfilePicture from '../common/ProfilePicture';

interface CompactStandingsProps {
  teams: Team[];
  games: Game[];
  teamSeasonStats: TeamSeasonStats[];
  limit?: number;
}

const CompactStandings: React.FC<CompactStandingsProps> = ({
  teams,
  games,
  teamSeasonStats,
  limit
}) => {
  const navigate = useNavigate();

  const handleTeamClick = (teamId: string, teamName: string) => {
    navigate(`/team/${teamId}`, {
      state: {
        from: '/',
        fromLabel: 'Home',
        scrollY: window.scrollY
      }
    });
  };

  const standings = useMemo(() => {
    const standingsData = teams.map(team => {
      const teamStat = teamSeasonStats.find(s => s.teamId === team.id);
      const wins = teamStat?.wins || 0;
      const losses = teamStat?.losses || 0;
      const pointsFor = teamStat?.pointsFor || 0;
      const pointsAgainst = teamStat?.pointsAgainst || 0;
      const gamesPlayed = wins + losses;
      const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0;
      const pointDifferential = pointsFor - pointsAgainst;

      return {
        team,
        wins,
        losses,
        pointsFor,
        pointsAgainst,
        pointDifferential,
        winPercentage,
        gamesPlayed
      };
    });

    // Sort by win percentage, then point differential
    standingsData.sort((a, b) => {
      if (a.winPercentage !== b.winPercentage) {
        return b.winPercentage - a.winPercentage;
      }
      return b.pointDifferential - a.pointDifferential;
    });

    // Calculate Games Back (GB) - difference in wins from leader
    const leaderWins = standingsData.length > 0 ? standingsData[0].wins : 0;
    const standingsWithGB = standingsData.map(standing => {
      const gamesBack = leaderWins > 0 && standing.wins < leaderWins 
        ? leaderWins - standing.wins 
        : null;
      
      // Check if tied for lead (same wins as leader)
      const isTiedForLead = standing.wins === leaderWins && leaderWins > 0;
      
      return {
        ...standing,
        gamesBack: isTiedForLead ? null : gamesBack
      };
    });

    // If limit is provided, use it; otherwise show all teams
    return limit ? standingsWithGB.slice(0, limit) : standingsWithGB;
  }, [teams, teamSeasonStats, limit]);

  return (
    <div className="standings-card-container">
      <h3 className="standings-card-title section-title">Standings</h3>
      <div className="standings-card-separator"></div>
      <div className="standings-card-table">
        <table className="standings-card-table-inner">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th className="numeric">W</th>
              <th className="numeric">L</th>
              <th className="numeric">GB</th>
              <th className="numeric">PF</th>
              <th className="numeric">PA</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((standing, index) => (
              <tr key={standing.team.id}>
                <td className="numeric tabular-nums">{index + 1}</td>
                <td>
                  <div className="standings-team-cell">
                    <ProfilePicture
                      imageUrl={standing.team.logoUrl}
                      fallbackImage="team"
                      alt={standing.team.name}
                      size={24}
                    />
                    <a 
                      href={`/team/${standing.team.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleTeamClick(standing.team.id, standing.team.name);
                      }}
                      className="standings-team-link"
                    >
                      {standing.team.name}
                    </a>
                  </div>
                </td>
                <td className="numeric tabular-nums">{standing.wins}</td>
                <td className="numeric tabular-nums">{standing.losses}</td>
                <td className="numeric tabular-nums">
                  {standing.gamesBack === null ? '--' : standing.gamesBack}
                </td>
                <td className="numeric tabular-nums">{standing.pointsFor}</td>
                <td className="numeric tabular-nums">{standing.pointsAgainst}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="standings-card-footer">
        <Link to="/standings" className="standings-view-full-link">
          View Full Standings
        </Link>
      </div>
    </div>
  );
};

export default CompactStandings;

