import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Crown, 
  Search, 
  ChevronDown, 
  ChevronUp,
  Flame,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { useData } from '../state';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProfilePicture from '../components/common/ProfilePicture';
import {
  computeAllPlayerStats,
  computeAllTeamStats,
  getSeasonLeaders,
  filterPlayerStats,
  filterTeamStats,
  sortPlayerStats,
  sortTeamStats,
  ComputedPlayerStats,
  ComputedTeamStats,
  SortDirection,
} from '../core/utils/statsHelpers';

type StatsView = 'players' | 'teams';
type PlayerSortKey = 'playerName' | 'gamesPlayed' | 'wins' | 'losses' | 'winPct' | 'totalCups' | 'cupsPerGame' | 'accuracy' | 'currentStreak' | 'heat';
type TeamSortKey = 'teamName' | 'gamesPlayed' | 'wins' | 'losses' | 'winPct' | 'cupsFor' | 'cupsAgainst' | 'cupDifferential' | 'currentStreak';

const StatsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    players, 
    teams, 
    games, 
    playerTeams, 
    playerGameStats,
    seasons,
    activeSeason, 
    loading 
  } = useData();

  // State
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeView, setActiveView] = useState<StatsView>('players');
  const [playerSortKey, setPlayerSortKey] = useState<PlayerSortKey>('winPct');
  const [playerSortDir, setPlayerSortDir] = useState<SortDirection>('desc');
  const [teamSortKey, setTeamSortKey] = useState<TeamSortKey>('winPct');
  const [teamSortDir, setTeamSortDir] = useState<SortDirection>('desc');

  // Restore scroll position when returning from player detail
  useEffect(() => {
    const state = location.state as { restoreScrollY?: number } | null;
    if (state?.restoreScrollY) {
      setTimeout(() => {
        window.scrollTo(0, state.restoreScrollY!);
      }, 0);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Set default season when data loads
  React.useEffect(() => {
    if (!selectedSeasonId && activeSeason) {
      setSelectedSeasonId(activeSeason.id);
    } else if (!selectedSeasonId && seasons.length > 0) {
      // Fall back to most recent season
      const sorted = [...seasons].sort((a, b) => b.year - a.year);
      setSelectedSeasonId(sorted[0].id);
    }
  }, [activeSeason, seasons, selectedSeasonId]);

  // Compute stats
  const playerStats = useMemo(() => {
    if (!selectedSeasonId) return [];
    return computeAllPlayerStats(
      selectedSeasonId,
      games,
      playerGameStats,
      playerTeams,
      players,
      teams
    );
  }, [selectedSeasonId, games, playerGameStats, playerTeams, players, teams]);

  const teamStats = useMemo(() => {
    if (!selectedSeasonId) return [];
    return computeAllTeamStats(selectedSeasonId, games, teams);
  }, [selectedSeasonId, games, teams]);

  const seasonLeaders = useMemo(() => {
    if (!selectedSeasonId) return { topScorer: null, mostAccurate: null, topTeam: null };
    return getSeasonLeaders(
      selectedSeasonId,
      games,
      playerGameStats,
      playerTeams,
      players,
      teams
    );
  }, [selectedSeasonId, games, playerGameStats, playerTeams, players, teams]);

  // Filter and sort
  const filteredPlayerStats = useMemo(() => {
    const filtered = filterPlayerStats(playerStats, searchQuery);
    return sortPlayerStats(filtered, playerSortKey as keyof ComputedPlayerStats, playerSortDir);
  }, [playerStats, searchQuery, playerSortKey, playerSortDir]);

  const filteredTeamStats = useMemo(() => {
    const filtered = filterTeamStats(teamStats, searchQuery);
    return sortTeamStats(filtered, teamSortKey as keyof ComputedTeamStats, teamSortDir);
  }, [teamStats, searchQuery, teamSortKey, teamSortDir]);

  // Sort handlers
  const handlePlayerSort = (key: PlayerSortKey) => {
    if (playerSortKey === key) {
      setPlayerSortDir(playerSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setPlayerSortKey(key);
      setPlayerSortDir('desc');
    }
  };

  const handleTeamSort = (key: TeamSortKey) => {
    if (teamSortKey === key) {
      setTeamSortDir(teamSortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setTeamSortKey(key);
      setTeamSortDir('desc');
    }
  };

  // Navigation
  const handlePlayerClick = (playerSlug: string) => {
    navigate(`/players/${playerSlug}`, { 
      state: { 
        from: '/stats', 
        fromLabel: 'Stats',
        scrollY: window.scrollY 
      } 
    });
  };

  const handleTeamClick = (teamId: string) => {
    navigate(`/team/${teamId}`, {
      state: {
        from: '/stats',
        fromLabel: 'Stats',
        scrollY: window.scrollY
      }
    });
  };

  // Render sort indicator
  const SortIndicator: React.FC<{ active: boolean; direction: SortDirection }> = ({ active, direction }) => {
    if (!active) return <ChevronDown size={14} className="stats-sort-icon inactive" />;
    return direction === 'asc' 
      ? <ChevronUp size={14} className="stats-sort-icon active" />
      : <ChevronDown size={14} className="stats-sort-icon active" />;
  };

  // Format streak display
  const formatStreak = (streak: { type: 'W' | 'L' | null; length: number }) => {
    if (!streak.type || streak.length === 0) return '-';
    return `${streak.type}${streak.length}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header stats-page-header">
        <div className="page-title-section">
          <h1>Statistics</h1>
          <p className="page-subtitle">League stats, leaderboards, and performance metrics</p>
        </div>

        <div className="page-controls stats-controls">
          {/* Season Selector */}
          <div className="stats-season-selector">
            <label htmlFor="season-select" className="stats-select-label">Season</label>
            <div className="stats-select-wrapper">
              <select
                id="season-select"
                className="stats-select"
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
              >
                {seasons.length === 0 && (
                  <option value="">No seasons available</option>
                )}
                {seasons
                  .sort((a, b) => b.year - a.year)
                  .map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
              </select>
              <ChevronDown size={18} className="stats-select-chevron" />
            </div>
          </div>

          {/* Search Bar */}
          <div className="stats-search-container">
            <Search size={18} className="stats-search-icon" />
            <input
              type="text"
              className="stats-search-input"
              placeholder={`Search ${activeView}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* View Toggle */}
          <div className="stats-view-toggle">
            <button
              className={`stats-toggle-btn ${activeView === 'players' ? 'active' : ''}`}
              onClick={() => setActiveView('players')}
            >
              Player Stats
            </button>
            <button
              className={`stats-toggle-btn ${activeView === 'teams' ? 'active' : ''}`}
              onClick={() => setActiveView('teams')}
            >
              Team Stats
            </button>
          </div>
        </div>
      </div>

      {/* Hero Stat Cards */}
      <section className="stats-hero-section">
        <div className="stats-hero-cards">
          {/* Top Scorer */}
          <div className="stats-hero-card stats-hero-scorer">
            <div className="stats-hero-icon">
              <Trophy size={24} />
            </div>
            <div className="stats-hero-content">
              <span className="stats-hero-label">Top Cup Scorer</span>
              {seasonLeaders.topScorer ? (
                <>
                  <div className="stats-hero-player">
                    <ProfilePicture
                      imageUrl={seasonLeaders.topScorer.player.avatarUrl}
                      fallbackImage="player"
                      alt={`${seasonLeaders.topScorer.player.firstName} ${seasonLeaders.topScorer.player.lastName}`}
                      size={32}
                    />
                    <span className="stats-hero-name">
                      {seasonLeaders.topScorer.player.firstName} {seasonLeaders.topScorer.player.lastName}
                    </span>
                  </div>
                  <span className="stats-hero-value">{seasonLeaders.topScorer.cups} cups</span>
                </>
              ) : (
                <span className="stats-hero-empty">No data yet</span>
              )}
            </div>
          </div>

          {/* Most Accurate */}
          <div className="stats-hero-card stats-hero-accurate">
            <div className="stats-hero-icon">
              <Target size={24} />
            </div>
            <div className="stats-hero-content">
              <span className="stats-hero-label">Most Accurate</span>
              {seasonLeaders.mostAccurate ? (
                <>
                  <div className="stats-hero-player">
                    <ProfilePicture
                      imageUrl={seasonLeaders.mostAccurate.player.avatarUrl}
                      fallbackImage="player"
                      alt={`${seasonLeaders.mostAccurate.player.firstName} ${seasonLeaders.mostAccurate.player.lastName}`}
                      size={32}
                    />
                    <span className="stats-hero-name">
                      {seasonLeaders.mostAccurate.player.firstName} {seasonLeaders.mostAccurate.player.lastName}
                    </span>
                  </div>
                  <span className="stats-hero-value">{seasonLeaders.mostAccurate.accuracy.toFixed(1)}%</span>
                </>
              ) : (
                <span className="stats-hero-empty">Min. {3} games required</span>
              )}
            </div>
          </div>

          {/* Top Team */}
          <div className="stats-hero-card stats-hero-team">
            <div className="stats-hero-icon">
              <Crown size={24} />
            </div>
            <div className="stats-hero-content">
              <span className="stats-hero-label">Top Team</span>
              {seasonLeaders.topTeam ? (
                <>
                  <div className="stats-hero-player">
                    <ProfilePicture
                      imageUrl={seasonLeaders.topTeam.team.logoUrl}
                      fallbackImage="team"
                      alt={seasonLeaders.topTeam.team.name}
                      size={32}
                    />
                    <span className="stats-hero-name">{seasonLeaders.topTeam.team.name}</span>
                  </div>
                  <span className="stats-hero-value">
                    {seasonLeaders.topTeam.record} ({seasonLeaders.topTeam.winPct.toFixed(0)}%)
                  </span>
                </>
              ) : (
                <span className="stats-hero-empty">No data yet</span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Data Tables */}
      <section className="stats-tables-section">
        {activeView === 'players' ? (
          /* Player Stats Table */
          <div className="stats-table-container">
            <div className="stats-table-header">
              <h2>
                <TrendingUp size={20} />
                Player Statistics
              </h2>
              <span className="stats-table-count">
                {filteredPlayerStats.length} player{filteredPlayerStats.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredPlayerStats.length === 0 ? (
              <div className="stats-empty-state">
                <BarChart3 size={48} />
                <h3>No player data available</h3>
                <p>
                  {searchQuery 
                    ? 'No players match your search criteria.' 
                    : 'No player statistics found for the selected season.'}
                </p>
              </div>
            ) : (
              <div className="stats-table-scroll">
                <table className="stats-table stats-player-table">
                  <thead>
                    <tr>
                      <th className="stats-th-sticky" onClick={() => handlePlayerSort('playerName')}>
                        <span>Player</span>
                        <SortIndicator active={playerSortKey === 'playerName'} direction={playerSortDir} />
                      </th>
                      <th>Team</th>
                      <th onClick={() => handlePlayerSort('gamesPlayed')}>
                        <span>GP</span>
                        <SortIndicator active={playerSortKey === 'gamesPlayed'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('wins')}>
                        <span>W</span>
                        <SortIndicator active={playerSortKey === 'wins'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('losses')}>
                        <span>L</span>
                        <SortIndicator active={playerSortKey === 'losses'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('winPct')}>
                        <span>Win%</span>
                        <SortIndicator active={playerSortKey === 'winPct'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('totalCups')}>
                        <span>Cups</span>
                        <SortIndicator active={playerSortKey === 'totalCups'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('cupsPerGame')}>
                        <span>C/G</span>
                        <SortIndicator active={playerSortKey === 'cupsPerGame'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('accuracy')}>
                        <span>Acc%</span>
                        <SortIndicator active={playerSortKey === 'accuracy'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('currentStreak')}>
                        <span>Streak</span>
                        <SortIndicator active={playerSortKey === 'currentStreak'} direction={playerSortDir} />
                      </th>
                      <th onClick={() => handlePlayerSort('heat')} className="stats-th-heat">
                        <span><Flame size={14} /> Heat</span>
                        <SortIndicator active={playerSortKey === 'heat'} direction={playerSortDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlayerStats.map((ps) => (
                      <tr 
                        key={ps.playerId} 
                        className="stats-row-clickable"
                        onClick={() => handlePlayerClick(ps.playerSlug)}
                      >
                        <td className="stats-td-player">
                          <ProfilePicture
                            imageUrl={ps.avatarUrl}
                            fallbackImage="player"
                            alt={ps.playerName}
                            size={28}
                          />
                          <span className="stats-player-name">{ps.playerName}</span>
                        </td>
                        <td className="stats-td-team">
                          {ps.teamNames.length > 0 ? ps.teamNames.join(', ') : '-'}
                        </td>
                        <td>{ps.gamesPlayed}</td>
                        <td className="stats-td-wins">{ps.wins}</td>
                        <td className="stats-td-losses">{ps.losses}</td>
                        <td className="stats-td-pct">{ps.winPct.toFixed(1)}%</td>
                        <td>{ps.totalCups}</td>
                        <td>{ps.cupsPerGame.toFixed(1)}</td>
                        <td>{ps.totalThrows > 0 ? `${ps.accuracy.toFixed(1)}%` : '-'}</td>
                        <td className={`stats-td-streak ${ps.currentStreak.type === 'W' ? 'streak-win' : ps.currentStreak.type === 'L' ? 'streak-loss' : ''}`}>
                          {formatStreak(ps.currentStreak)}
                        </td>
                        <td className="stats-td-heat">
                          <div className="stats-heat-indicator">
                            <Flame size={14} className={ps.heat >= 5 ? 'heat-hot' : ps.heat >= 3 ? 'heat-warm' : ''} />
                            <span>{ps.heat.toFixed(1)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Team Stats Table */
          <div className="stats-table-container">
            <div className="stats-table-header">
              <h2>
                <Crown size={20} />
                Team Statistics
              </h2>
              <span className="stats-table-count">
                {filteredTeamStats.length} team{filteredTeamStats.length !== 1 ? 's' : ''}
              </span>
            </div>

            {filteredTeamStats.length === 0 ? (
              <div className="stats-empty-state">
                <BarChart3 size={48} />
                <h3>No team data available</h3>
                <p>
                  {searchQuery 
                    ? 'No teams match your search criteria.' 
                    : 'No team statistics found for the selected season.'}
                </p>
              </div>
            ) : (
              <div className="stats-table-scroll">
                <table className="stats-table stats-team-table">
                  <thead>
                    <tr>
                      <th className="stats-th-sticky" onClick={() => handleTeamSort('teamName')}>
                        <span>Team</span>
                        <SortIndicator active={teamSortKey === 'teamName'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('gamesPlayed')}>
                        <span>GP</span>
                        <SortIndicator active={teamSortKey === 'gamesPlayed'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('wins')}>
                        <span>W</span>
                        <SortIndicator active={teamSortKey === 'wins'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('losses')}>
                        <span>L</span>
                        <SortIndicator active={teamSortKey === 'losses'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('winPct')}>
                        <span>Win%</span>
                        <SortIndicator active={teamSortKey === 'winPct'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('cupsFor')}>
                        <span>CF</span>
                        <SortIndicator active={teamSortKey === 'cupsFor'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('cupsAgainst')}>
                        <span>CA</span>
                        <SortIndicator active={teamSortKey === 'cupsAgainst'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('cupDifferential')}>
                        <span>Diff</span>
                        <SortIndicator active={teamSortKey === 'cupDifferential'} direction={teamSortDir} />
                      </th>
                      <th onClick={() => handleTeamSort('currentStreak')}>
                        <span>Streak</span>
                        <SortIndicator active={teamSortKey === 'currentStreak'} direction={teamSortDir} />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTeamStats.map((ts) => (
                      <tr 
                        key={ts.teamId} 
                        className="stats-row-clickable"
                        onClick={() => handleTeamClick(ts.teamId)}
                      >
                        <td className="stats-td-team-name">
                          <ProfilePicture
                            imageUrl={ts.logoUrl}
                            fallbackImage="team"
                            alt={ts.teamName}
                            size={28}
                          />
                          <span className="stats-team-name">{ts.teamName}</span>
                        </td>
                        <td>{ts.gamesPlayed}</td>
                        <td className="stats-td-wins">{ts.wins}</td>
                        <td className="stats-td-losses">{ts.losses}</td>
                        <td className="stats-td-pct">{ts.winPct.toFixed(1)}%</td>
                        <td>{ts.cupsFor}</td>
                        <td>{ts.cupsAgainst}</td>
                        <td className={`stats-td-diff ${ts.cupDifferential > 0 ? 'diff-positive' : ts.cupDifferential < 0 ? 'diff-negative' : ''}`}>
                          {ts.cupDifferential > 0 ? '+' : ''}{ts.cupDifferential}
                        </td>
                        <td className={`stats-td-streak ${ts.currentStreak.type === 'W' ? 'streak-win' : ts.currentStreak.type === 'L' ? 'streak-loss' : ''}`}>
                          {formatStreak(ts.currentStreak)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Charts Placeholder */}
      <section className="stats-charts-placeholder">
        <div className="stats-charts-placeholder-content">
          <BarChart3 size={32} />
          <h3>Charts Coming Soon</h3>
          <p>Team accuracy comparison, cups per game distribution, and more visualizations will appear here.</p>
        </div>
      </section>
    </div>
  );
};

export default StatsPage;
