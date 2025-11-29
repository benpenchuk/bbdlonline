import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Trophy, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useData } from '../state';
import { Team, Game, Season, TeamSeasonStats } from '../core/types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getWinnerId } from '../core/utils/gameHelpers';
import ProfilePicture from '../components/common/ProfilePicture';

// =====================================================
// TYPES
// =====================================================

interface TeamStanding {
  rank: number;
  team: Team;
  wins: number;
  losses: number;
  gamesPlayed: number;
  winPercentage: number;
  gamesBehind: number | null;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  streak: string; // e.g., "W3", "L2"
  last5: string; // e.g., "3-2"
  last5Games: ('W' | 'L')[];
}

// =====================================================
// HELPER FUNCTIONS
// =====================================================

const getAvailableSeasons = (seasons: Season[], games: Game[]): string[] => {
  // Get seasons that have completed games
  const seasonsWithGames = new Set<string>();
  games.forEach(game => {
    if (game.status === 'completed' && game.seasonId) {
      seasonsWithGames.add(game.seasonId);
    }
  });
  
  const availableSeasons = seasons
    .filter(s => seasonsWithGames.has(s.id))
    .sort((a, b) => b.year - a.year);
  
  return ['All Time', ...availableSeasons.map(s => s.id)];
};

const calculateHeadToHead = (team1Id: string, team2Id: string, games: Game[]): { team1Wins: number; team2Wins: number } => {
  let team1Wins = 0;
  let team2Wins = 0;
  
  games.forEach(game => {
    if (game.status !== 'completed') return;
    
    const isMatchup = (game.homeTeamId === team1Id && game.awayTeamId === team2Id) ||
                     (game.homeTeamId === team2Id && game.awayTeamId === team1Id);
    
    if (isMatchup) {
      const winnerId = getWinnerId(game);
      if (winnerId === team1Id) {
        team1Wins++;
      } else if (winnerId === team2Id) {
        team2Wins++;
      }
    }
  });
  
  return { team1Wins, team2Wins };
};

const calculateStreak = (teamId: string, games: Game[]): string => {
  const teamGames = games
    .filter(g => 
      g.status === 'completed' && 
      (g.homeTeamId === teamId || g.awayTeamId === teamId)
    )
    .sort((a, b) => {
      const dateA = a.gameDate ? a.gameDate.getTime() : 0;
      const dateB = b.gameDate ? b.gameDate.getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  
  if (teamGames.length === 0) return '-';
  
  const lastGame = teamGames[0];
  const isWin = getWinnerId(lastGame) === teamId;
  let streakCount = 0;
  
  for (const game of teamGames) {
    const gameIsWin = getWinnerId(game) === teamId;
    if (gameIsWin === isWin) {
      streakCount++;
    } else {
      break;
    }
  }
  
  return `${isWin ? 'W' : 'L'}${streakCount}`;
};

const calculateLast5 = (teamId: string, games: Game[]): { record: string; results: ('W' | 'L')[] } => {
  const teamGames = games
    .filter(g => 
      g.status === 'completed' && 
      (g.homeTeamId === teamId || g.awayTeamId === teamId)
    )
    .sort((a, b) => {
      const dateA = a.gameDate ? a.gameDate.getTime() : 0;
      const dateB = b.gameDate ? b.gameDate.getTime() : 0;
      return dateB - dateA; // Most recent first
    })
    .slice(0, 5);
  
  if (teamGames.length === 0) return { record: '0-0', results: [] };
  
  const results = teamGames.map(game => getWinnerId(game) === teamId ? 'W' : 'L') as ('W' | 'L')[];
  const wins = results.filter(r => r === 'W').length;
  const losses = results.filter(r => r === 'L').length;
  
  return { record: `${wins}-${losses}`, results: results.reverse() }; // Reverse to show oldest to newest
};

const calculateTeamStandings = (
  teams: Team[],
  games: Game[],
  teamSeasonStats: TeamSeasonStats[],
  selectedSeasonId: string | null
): TeamStanding[] => {
  // Get stats for the selected season (or aggregate all seasons if "All Time")
  const statsForSeason = selectedSeasonId && selectedSeasonId !== 'All Time'
    ? teamSeasonStats.filter(s => s.seasonId === selectedSeasonId)
    : teamSeasonStats;

  // Calculate basic stats for each team using database stats
  const standings: TeamStanding[] = teams.map(team => {
    // Aggregate stats if "All Time", otherwise use single season stats
    let wins = 0;
    let losses = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;
    let gamesPlayed = 0;

    if (selectedSeasonId === 'All Time') {
      // Aggregate across all seasons
      const teamAllStats = teamSeasonStats.filter(s => s.teamId === team.id);
      teamAllStats.forEach(stat => {
        wins += stat.wins;
        losses += stat.losses;
        pointsFor += stat.pointsFor;
        pointsAgainst += stat.pointsAgainst;
        gamesPlayed += stat.gamesPlayed;
      });
    } else {
      // Single season stats
      const teamStat = statsForSeason.find(s => s.teamId === team.id);
      if (teamStat) {
        wins = teamStat.wins;
        losses = teamStat.losses;
        pointsFor = teamStat.pointsFor;
        pointsAgainst = teamStat.pointsAgainst;
        gamesPlayed = teamStat.gamesPlayed;
      }
    }

    const winPercentage = gamesPlayed > 0 ? wins / gamesPlayed : 0;
    const pointDifferential = pointsFor - pointsAgainst;
    const streak = calculateStreak(team.id, games);
    const last5Data = calculateLast5(team.id, games);

    return {
      rank: 0, // Will be set after sorting
      team,
      wins,
      losses,
      gamesPlayed,
      winPercentage,
      gamesBehind: null, // Will be calculated after sorting
      pointsFor,
      pointsAgainst,
      pointDifferential,
      streak,
      last5: last5Data.record,
      last5Games: last5Data.results
    };
  });
  
  // Sort standings
  standings.sort((a, b) => {
    // 1. Win percentage (descending)
    if (a.winPercentage !== b.winPercentage) {
      return b.winPercentage - a.winPercentage;
    }
    
    // 2. Head-to-head record
    const h2h = calculateHeadToHead(a.team.id, b.team.id, games);
    if (h2h.team1Wins !== h2h.team2Wins) {
      return h2h.team2Wins - h2h.team1Wins; // If b has more wins against a, b comes first
    }
    
    // 3. Point differential (descending)
    if (a.pointDifferential !== b.pointDifferential) {
      return b.pointDifferential - a.pointDifferential;
    }
    
    // 4. Points for (descending)
    if (a.pointsFor !== b.pointsFor) {
      return b.pointsFor - a.pointsFor;
    }
    
    // 5. Alphabetically by team name
    return a.team.name.localeCompare(b.team.name);
  });
  
  // Assign ranks and calculate games behind
  const leader = standings[0];
  
  standings.forEach((standing, index) => {
    standing.rank = index + 1;
    
    if (index === 0 || standing.gamesPlayed === 0) {
      standing.gamesBehind = null;
    } else {
      // GB = [(Leader Wins - Leader Losses) - (Team Wins - Team Losses)] / 2
      const leaderDiff = leader.wins - leader.losses;
      const teamDiff = standing.wins - standing.losses;
      standing.gamesBehind = (leaderDiff - teamDiff) / 2;
    }
  });
  
  return standings;
};

// =====================================================
// MAIN COMPONENT
// =====================================================

// Type for navigation state
interface LocationState {
  restoreScrollY?: number;
}

const StandingsPage: React.FC = () => {
  const { teams, games, seasons, teamSeasonStats, loading } = useData();
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSeason, setSelectedSeason] = useState<string>('All Time');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Restore scroll position when returning from team detail
  useEffect(() => {
    const state = location.state as LocationState | null;
    if (state?.restoreScrollY) {
      setTimeout(() => {
        window.scrollTo(0, state.restoreScrollY!);
      }, 0);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Handle team click with navigation state
  const handleTeamClick = (teamId: string, teamName: string) => {
    navigate(`/team/${teamId}`, {
      state: {
        from: '/standings',
        fromLabel: 'Standings',
        scrollY: window.scrollY
      }
    });
  };
  
  // Get available seasons
  const availableSeasons = useMemo(() => {
    return getAvailableSeasons(seasons, games);
  }, [seasons, games]);
  
  // Set default season on mount
  React.useEffect(() => {
    if (availableSeasons.length > 0 && !availableSeasons.includes(selectedSeason)) {
      setSelectedSeason(availableSeasons[0]);
    }
  }, [availableSeasons, selectedSeason]);
  
  // Filter games by selected season (for streak and last5 calculations)
  const filteredGames = useMemo(() => {
    if (selectedSeason === 'All Time') {
      return games.filter(g => g.status === 'completed');
    }
    return games.filter(g => {
      return g.seasonId === selectedSeason && g.status === 'completed';
    });
  }, [games, selectedSeason]);
  
  // Calculate standings using database stats
  const standings = useMemo(() => {
    return calculateTeamStandings(teams, filteredGames, teamSeasonStats, selectedSeason);
  }, [teams, filteredGames, teamSeasonStats, selectedSeason]);
  
  // Filter standings by search query
  const filteredStandings = useMemo(() => {
    if (!searchQuery.trim()) return standings;
    const query = searchQuery.toLowerCase();
    return standings.filter(s => 
      s.team.name.toLowerCase().includes(query)
    );
  }, [standings, searchQuery]);
  
  if (loading) {
    return <LoadingSpinner message="Loading standings..." />;
  }
  
  const hasGames = filteredGames.length > 0;
  
  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>Standings</h1>
          <p className="page-subtitle">League standings and team records</p>
        </div>
        
        {/* Controls */}
        <div className="page-controls standings-controls">
          {/* Season Selector */}
          <div className="season-selector">
            <label htmlFor="season-select">Season:</label>
            <select
              id="season-select"
              value={selectedSeason}
              onChange={(e) => setSelectedSeason(e.target.value)}
              className="season-dropdown"
            >
              {availableSeasons.map(seasonId => {
                if (seasonId === 'All Time') {
                  return <option key={seasonId} value={seasonId}>{seasonId}</option>;
                }
                const season = seasons.find(s => s.id === seasonId);
                return (
                  <option key={seasonId} value={seasonId}>
                    {season ? season.name : seasonId}
                  </option>
                );
              })}
            </select>
          </div>
          
          {/* Search Bar */}
          <div className="standings-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="standings-search-input"
            />
          </div>
        </div>
      </div>
      
      {/* Standings Content */}
      <div className="page-content">
      {!hasGames ? (
        <div className="standings-empty-state">
          <Trophy size={64} />
          <h2>No Games Yet</h2>
          <p>There are no completed games for the selected season.</p>
          <p className="empty-state-hint">Games will appear here once they're completed.</p>
        </div>
      ) : filteredStandings.length === 0 ? (
        <div className="standings-empty-state">
          <Search size={64} />
          <h2>No Teams Found</h2>
          <p>No teams match your search criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="standings-table-container">
            <table className="standings-table">
              <thead>
                <tr>
                  <th className="standings-th standings-th-rank">#</th>
                  <th className="standings-th standings-th-team">Team</th>
                  <th className="standings-th standings-th-record">Record</th>
                  <th className="standings-th standings-th-pct">Win %</th>
                  <th className="standings-th standings-th-gb">GB</th>
                  <th className="standings-th standings-th-pf">PF</th>
                  <th className="standings-th standings-th-pa">PA</th>
                  <th className="standings-th standings-th-diff">Diff</th>
                  <th className="standings-th standings-th-streak">Streak</th>
                  <th className="standings-th standings-th-last5">Last 5</th>
                </tr>
              </thead>
              <tbody>
                {filteredStandings.map(standing => (
                  <tr 
                    key={standing.team.id} 
                    className="standings-row"
                  >
                    <td className="standings-td standings-td-rank">
                      {standing.rank === 1 && <Trophy size={16} className="rank-icon" />}
                      {standing.rank}
                    </td>
                    <td className="standings-td standings-td-team">
                      <a 
                        href={`/team/${standing.team.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleTeamClick(standing.team.id, standing.team.name);
                        }}
                        className="team-cell-link"
                      >
                        <div className="team-cell">
                          <ProfilePicture
                            imageUrl={standing.team.logoUrl}
                            fallbackImage="team"
                            alt={standing.team.name}
                            size={28}
                          />
                          <span className="team-name">{standing.team.name}</span>
                        </div>
                      </a>
                    </td>
                    <td className="standings-td standings-td-record">
                      {standing.wins}-{standing.losses}
                    </td>
                    <td className="standings-td standings-td-pct">
                      {standing.winPercentage.toFixed(3)}
                    </td>
                    <td className="standings-td standings-td-gb">
                      {standing.gamesBehind === null ? '—' : standing.gamesBehind.toFixed(1)}
                    </td>
                    <td className="standings-td standings-td-pf">
                      {standing.pointsFor}
                    </td>
                    <td className="standings-td standings-td-pa">
                      {standing.pointsAgainst}
                    </td>
                    <td className={`standings-td standings-td-diff ${
                      standing.pointDifferential > 0 ? 'diff-positive' :
                      standing.pointDifferential < 0 ? 'diff-negative' : ''
                    }`}>
                      <div className="diff-cell">
                        {standing.pointDifferential > 0 && <TrendingUp size={14} />}
                        {standing.pointDifferential < 0 && <TrendingDown size={14} />}
                        {standing.pointDifferential === 0 && <Minus size={14} />}
                        <span>{standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}</span>
                      </div>
                    </td>
                    <td className="standings-td standings-td-streak">
                      <span className={`streak-badge ${standing.streak.startsWith('W') ? 'streak-win' : 'streak-loss'}`}>
                        {standing.streak}
                      </span>
                    </td>
                    <td className="standings-td standings-td-last5">
                      <div className="last5-container">
                        {standing.last5Games.map((result, idx) => (
                          <span 
                            key={idx} 
                            className={`last5-dot ${result === 'W' ? 'last5-win' : 'last5-loss'}`}
                            title={result === 'W' ? 'Win' : 'Loss'}
                          >
                            {result}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="standings-cards-container">
            {filteredStandings.map(standing => (
              <div 
                key={standing.team.id} 
                className="standings-card"
                onClick={() => handleTeamClick(standing.team.id, standing.team.name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleTeamClick(standing.team.id, standing.team.name);
                  }
                }}
              >
                <div className="standings-card-header">
                  <div className="standings-card-rank">
                    {standing.rank === 1 && <Trophy size={18} className="rank-icon" />}
                    <span className="rank-number">#{standing.rank}</span>
                  </div>
                  <div className="standings-card-team">
                    <ProfilePicture
                      imageUrl={standing.team.logoUrl}
                      fallbackImage="team"
                      alt={standing.team.name}
                      size={32}
                    />
                    <span className="team-name">{standing.team.name}</span>
                  </div>
                </div>
                
                <div className="standings-card-stats">
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Record</span>
                      <span className="stat-value">{standing.wins}-{standing.losses}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Win %</span>
                      <span className="stat-value">{standing.winPercentage.toFixed(3)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">GB</span>
                      <span className="stat-value">
                        {standing.gamesBehind === null ? '—' : standing.gamesBehind.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="stat-group">
                    <div className="stat-item">
                      <span className="stat-label">Diff</span>
                      <span className={`stat-value ${
                        standing.pointDifferential > 0 ? 'diff-positive' :
                        standing.pointDifferential < 0 ? 'diff-negative' : ''
                      }`}>
                        {standing.pointDifferential > 0 ? '+' : ''}{standing.pointDifferential}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Streak</span>
                      <span className={`stat-value streak-badge ${
                        standing.streak.startsWith('W') ? 'streak-win' : 'streak-loss'
                      }`}>
                        {standing.streak}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="standings-card-last5">
                  <span className="last5-label">Last 5:</span>
                  <div className="last5-container">
                    {standing.last5Games.map((result, idx) => (
                      <span 
                        key={idx} 
                        className={`last5-dot ${result === 'W' ? 'last5-win' : 'last5-loss'}`}
                        title={result === 'W' ? 'Win' : 'Loss'}
                      >
                        {result}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default StandingsPage;

