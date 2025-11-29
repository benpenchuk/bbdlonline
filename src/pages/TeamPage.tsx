import React, { useMemo, useEffect, useState } from 'react';
import { useParams, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Trophy, 
  Target, 
  Users, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  MapPin,
  ArrowLeft,
  ChevronDown,
  Flame,
  BarChart3,
  Award
} from 'lucide-react';
import { useData } from '../state';
import { Game, Team } from '../core/types';
import { getTeamPlayers } from '../core/utils/playerHelpers';
import { getWinnerId } from '../core/utils/gameHelpers';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProfilePicture from '../components/common/ProfilePicture';
import PlayerCard from '../components/common/PlayerCard';

// Type for navigation state
interface LocationState {
  from?: string;
  fromLabel?: string;
  scrollY?: number;
  restoreScrollY?: number;
}

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { teams, games, players, playerTeams, seasons, activeSeason, loading } = useData();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Get navigation state
  const locationState = location.state as LocationState | null;
  const backPath = locationState?.from || '/standings';
  const backLabel = locationState?.fromLabel || 'Standings';
  const savedScrollY = locationState?.scrollY ?? 0;

  // Scroll to top when navigating to this page
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Restore scroll position when returning from player detail
  useEffect(() => {
    if (locationState?.restoreScrollY) {
      setTimeout(() => {
        window.scrollTo(0, locationState.restoreScrollY!);
      }, 0);
      window.history.replaceState({}, document.title);
    }
  }, [locationState?.restoreScrollY]);

  // Set default season when data loads
  useEffect(() => {
    if (!selectedSeasonId && activeSeason) {
      setSelectedSeasonId(activeSeason.id);
    } else if (!selectedSeasonId && seasons.length > 0) {
      const sorted = [...seasons].sort((a, b) => b.year - a.year);
      setSelectedSeasonId(sorted[0].id);
    }
  }, [activeSeason, seasons, selectedSeasonId]);

  const team = useMemo(() => {
    if (!id) return null;
    return teams.find(t => t.id === id);
  }, [teams, id]);

  // Filter games by selected season and team
  const teamGames = useMemo(() => {
    if (!id || !selectedSeasonId) return [];
    return games
      .filter(g => 
        (g.homeTeamId === id || g.awayTeamId === id) &&
        g.seasonId === selectedSeasonId
      )
      .sort((a, b) => {
        const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return dateB - dateA;
      });
  }, [games, id, selectedSeasonId]);

  const completedGames = useMemo(() => {
    return teamGames.filter(g => g.status === 'completed');
  }, [teamGames]);

  // Calculate team stats
  const teamStats = useMemo(() => {
    if (!id || completedGames.length === 0) return null;

    let wins = 0;
    let losses = 0;
    let pointsFor = 0;
    let pointsAgainst = 0;

    completedGames.forEach(game => {
      const isHome = game.homeTeamId === id;
      const teamScore = isHome ? game.homeScore : game.awayScore;
      const opponentScore = isHome ? game.awayScore : game.homeScore;

      pointsFor += teamScore;
      pointsAgainst += opponentScore;

      if (game.winningTeamId === id) {
        wins++;
      } else {
        losses++;
      }
    });

    return {
      gamesPlayed: completedGames.length,
      wins,
      losses,
      pointsFor,
      pointsAgainst,
      pointDiff: pointsFor - pointsAgainst,
      winPct: completedGames.length > 0 ? (wins / completedGames.length) * 100 : 0,
      avgPointsFor: completedGames.length > 0 ? pointsFor / completedGames.length : 0,
      avgPointsAgainst: completedGames.length > 0 ? pointsAgainst / completedGames.length : 0,
    };
  }, [id, completedGames]);

  // Calculate streak
  const currentStreak = useMemo(() => {
    if (!id || completedGames.length === 0) return { type: null as 'W' | 'L' | null, length: 0 };

    const sorted = [...completedGames].sort((a, b) => {
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateB - dateA;
    });

    const firstResult = sorted[0].winningTeamId === id;
    let streak = 0;

    for (const game of sorted) {
      const won = game.winningTeamId === id;
      if (won === firstResult) {
        streak++;
      } else {
        break;
      }
    }

    return { type: firstResult ? 'W' as const : 'L' as const, length: streak };
  }, [id, completedGames]);

  // Calculate "heat" - avg points for over last 5 games
  const heat = useMemo(() => {
    if (!id || completedGames.length === 0) return 0;

    const sorted = [...completedGames].sort((a, b) => {
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateB - dateA;
    });

    const last5 = sorted.slice(0, 5);
    const totalPoints = last5.reduce((sum, game) => {
      const isHome = game.homeTeamId === id;
      return sum + (isHome ? game.homeScore : game.awayScore);
    }, 0);

    return last5.length > 0 ? totalPoints / last5.length : 0;
  }, [id, completedGames]);

  // Get team players for selected season
  const teamPlayers = useMemo(() => {
    if (!id) return [];
    return getTeamPlayers(id, players, playerTeams, selectedSeasonId);
  }, [id, players, playerTeams, selectedSeasonId]);

  // Group games by week
  const gamesByWeek = useMemo(() => {
    const grouped = new Map<number, Game[]>();
    teamGames.forEach(game => {
      if (game.week) {
        if (!grouped.has(game.week)) {
          grouped.set(game.week, []);
        }
        grouped.get(game.week)!.push(game);
      }
    });
    return grouped;
  }, [teamGames]);

  // Handle back navigation
  const handleBack = () => {
    navigate(backPath, { state: { restoreScrollY: savedScrollY } });
  };

  // Handle player click
  const handlePlayerClick = (playerSlug: string) => {
    navigate(`/players/${playerSlug}`, {
      state: {
        from: `/team/${id}`,
        fromLabel: team?.name || 'Team',
        scrollY: window.scrollY
      }
    });
  };

  if (loading) {
    return <LoadingSpinner message="Loading team..." />;
  }

  if (!team) {
    return (
      <div className="page-container">
        <div className="team-detail-not-found">
          <h2>Team Not Found</h2>
          <p>The team you're looking for doesn't exist or has been removed.</p>
          <button className="btn btn-primary" onClick={() => navigate('/standings')}>
            <ArrowLeft size={16} />
            Back to Standings
          </button>
        </div>
      </div>
    );
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  const formatDateTime = (game: Game): string => {
    if (!game.gameDate) return 'TBD';
    return format(new Date(game.gameDate), 'MMM d, yyyy');
  };

  const getOpponent = (game: Game): Team | null => {
    const opponentId = game.homeTeamId === id ? game.awayTeamId : game.homeTeamId;
    return teams.find(t => t.id === opponentId) || null;
  };

  const formatStreak = (streak: { type: 'W' | 'L' | null; length: number }) => {
    if (!streak.type || streak.length === 0) return '-';
    return `${streak.type}${streak.length}`;
  };

  return (
    <div className="page-container team-detail-page">
      {/* Back Navigation */}
      <button className="team-detail-back" onClick={handleBack}>
        <ArrowLeft size={18} />
        <span>Back to {backLabel}</span>
      </button>

      {/* Team Header */}
      <header className="team-detail-header">
        <div className="team-detail-logo">
          <ProfilePicture
            imageUrl={team.logoUrl}
            fallbackImage="team"
            alt={team.name}
            size={120}
          />
        </div>

        <div className="team-detail-info">
          <h1 className="team-detail-name">{team.name}</h1>
          
          {team.abbreviation && (
            <span className="team-detail-abbr">{team.abbreviation}</span>
          )}

          <div className="team-detail-meta">
            {team.homeCity && team.homeState && (
              <span className="team-detail-location">
                <MapPin size={14} />
                {team.homeCity}, {team.homeState}
              </span>
            )}
          </div>

          {/* Record Badge */}
          {teamStats && (
            <div className="team-detail-record-badge">
              <span className="record-wins">{teamStats.wins}</span>
              <span className="record-separator">-</span>
              <span className="record-losses">{teamStats.losses}</span>
              <span className="record-pct">({teamStats.winPct.toFixed(0)}%)</span>
            </div>
          )}
        </div>

        {/* Season Selector */}
        <div className="team-detail-season-selector">
          <label htmlFor="team-season-select">Season</label>
          <div className="team-season-select-wrapper">
            <select
              id="team-season-select"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            >
              {seasons
                .sort((a, b) => b.year - a.year)
                .map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </div>
      </header>

      {/* Summary Stats Cards */}
      <section className="team-detail-summary">
        <h2 className="team-detail-section-title">
          <TrendingUp size={20} />
          Season Summary
        </h2>

        {teamStats ? (
          <div className="team-summary-cards">
            <div className="team-summary-card">
              <div className="team-summary-icon">
                <Calendar size={20} />
              </div>
              <div className="team-summary-value">{teamStats.gamesPlayed}</div>
              <div className="team-summary-label">Games Played</div>
            </div>

            <div className="team-summary-card">
              <div className="team-summary-icon win">
                <Trophy size={20} />
              </div>
              <div className="team-summary-value">{teamStats.wins}</div>
              <div className="team-summary-label">Wins</div>
            </div>

            <div className="team-summary-card">
              <div className="team-summary-icon">
                <Award size={20} />
              </div>
              <div className="team-summary-value">{teamStats.winPct.toFixed(1)}%</div>
              <div className="team-summary-label">Win Rate</div>
            </div>

            <div className="team-summary-card">
              <div className="team-summary-icon cups">
                <TrendingUp size={20} />
              </div>
              <div className="team-summary-value">{teamStats.pointsFor}</div>
              <div className="team-summary-label">Points For</div>
            </div>

            <div className="team-summary-card">
              <div className="team-summary-icon">
                <TrendingDown size={20} />
              </div>
              <div className="team-summary-value">{teamStats.pointsAgainst}</div>
              <div className="team-summary-label">Points Against</div>
            </div>

            <div className="team-summary-card">
              <div className={`team-summary-icon ${teamStats.pointDiff > 0 ? 'positive' : teamStats.pointDiff < 0 ? 'negative' : ''}`}>
                <Target size={20} />
              </div>
              <div className={`team-summary-value ${teamStats.pointDiff > 0 ? 'text-success' : teamStats.pointDiff < 0 ? 'text-error' : ''}`}>
                {teamStats.pointDiff > 0 ? '+' : ''}{teamStats.pointDiff}
              </div>
              <div className="team-summary-label">Point Diff</div>
            </div>

            <div className="team-summary-card">
              <div className={`team-summary-icon ${currentStreak.type === 'W' ? 'streak-w' : currentStreak.type === 'L' ? 'streak-l' : ''}`}>
                <TrendingUp size={20} />
              </div>
              <div className="team-summary-value">{formatStreak(currentStreak)}</div>
              <div className="team-summary-label">Current Streak</div>
            </div>

            <div className="team-summary-card">
              <div className={`team-summary-icon ${heat >= 15 ? 'heat-hot' : heat >= 10 ? 'heat-warm' : ''}`}>
                <Flame size={20} />
              </div>
              <div className="team-summary-value">{heat.toFixed(1)}</div>
              <div className="team-summary-label">Heat (Last 5)</div>
            </div>
          </div>
        ) : (
          <div className="team-detail-empty">
            <p>No stats available for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>

      {/* Roster Section */}
      <section className="team-detail-roster">
        <h2 className="team-detail-section-title">
          <Users size={20} />
          Roster
        </h2>

        {teamPlayers.length > 0 ? (
          <div className="team-roster-grid">
            {teamPlayers.map(player => {
              const playerGames = completedGames;
              const wins = playerGames.filter(g => g.winningTeamId === id).length;
              const gamesPlayed = playerGames.length;

              return (
                <div
                  key={player.id}
                  className="team-roster-player-card"
                  onClick={() => handlePlayerClick(player.slug)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handlePlayerClick(player.slug);
                    }
                  }}
                >
                  <PlayerCard
                    player={player}
                    team={team}
                    record={gamesPlayed > 0 ? { wins, losses: gamesPlayed - wins } : undefined}
                    avgPoints={undefined}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="team-detail-empty">
            <p>No players on this team for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>

      {/* Game History */}
      <section className="team-detail-games">
        <h2 className="team-detail-section-title">
          <Calendar size={20} />
          Game History
        </h2>

        {teamGames.length > 0 ? (
          <div className="team-games-container">
            {Array.from(gamesByWeek.entries())
              .sort(([weekA], [weekB]) => weekB - weekA)
              .map(([week, weekGames]) => (
                <div key={week} className="team-games-week">
                  <h3 className="team-games-week-title">Week {week}</h3>
                  <div className="team-games-list">
                    {weekGames.map(game => {
                      const opponent = getOpponent(game);
                      if (!opponent) return null;

                      const winnerId = getWinnerId(game);
                      const isWinner = winnerId === id;
                      const isHome = game.homeTeamId === id;
                      const teamScore = isHome ? game.homeScore : game.awayScore;
                      const opponentScore = isHome ? game.awayScore : game.homeScore;
                      const isCompleted = game.status === 'completed';

                      return (
                        <div key={game.id} className="team-game-card">
                          <div className="team-game-date">
                            {formatDateTime(game)}
                          </div>

                          <div className="team-game-matchup">
                            <div className={`team-game-team ${isCompleted && isWinner ? 'winner' : ''}`}>
                              <ProfilePicture
                                imageUrl={team.logoUrl}
                                fallbackImage="team"
                                alt={team.name}
                                size={32}
                              />
                              <span className="team-game-name">{team.name}</span>
                              {isCompleted && (
                                <span className={`team-game-score ${isWinner ? 'winner-score' : ''}`}>
                                  {teamScore}
                                </span>
                              )}
                            </div>

                            <div className="team-game-vs">vs</div>

                            <Link
                              to={`/team/${opponent.id}`}
                              state={{ from: `/team/${id}`, fromLabel: team.name, scrollY: window.scrollY }}
                              className={`team-game-team ${isCompleted && !isWinner ? 'winner' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ProfilePicture
                                imageUrl={opponent.logoUrl}
                                fallbackImage="team"
                                alt={opponent.name}
                                size={32}
                              />
                              <span className="team-game-name">{opponent.name}</span>
                              {isCompleted && (
                                <span className={`team-game-score ${!isWinner ? 'winner-score' : ''}`}>
                                  {opponentScore}
                                </span>
                              )}
                            </Link>
                          </div>

                          <div className={`team-game-result ${isCompleted ? (isWinner ? 'result-win' : 'result-loss') : 'result-pending'}`}>
                            {isCompleted ? (isWinner ? 'W' : 'L') : game.status === 'scheduled' ? 'Scheduled' : game.status}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

            {/* Games without week assignment */}
            {teamGames.filter(g => !g.week).length > 0 && (
              <div className="team-games-week">
                <h3 className="team-games-week-title">Other Games</h3>
                <div className="team-games-list">
                  {teamGames.filter(g => !g.week).map(game => {
                    const opponent = getOpponent(game);
                    if (!opponent) return null;

                    const winnerId = getWinnerId(game);
                    const isWinner = winnerId === id;
                    const isHome = game.homeTeamId === id;
                    const teamScore = isHome ? game.homeScore : game.awayScore;
                    const opponentScore = isHome ? game.awayScore : game.homeScore;
                    const isCompleted = game.status === 'completed';

                    return (
                      <div key={game.id} className="team-game-card">
                        <div className="team-game-date">
                          {formatDateTime(game)}
                        </div>

                        <div className="team-game-matchup">
                          <div className={`team-game-team ${isCompleted && isWinner ? 'winner' : ''}`}>
                            <ProfilePicture
                              imageUrl={team.logoUrl}
                              fallbackImage="team"
                              alt={team.name}
                              size={32}
                            />
                            <span className="team-game-name">{team.name}</span>
                            {isCompleted && (
                              <span className={`team-game-score ${isWinner ? 'winner-score' : ''}`}>
                                {teamScore}
                              </span>
                            )}
                          </div>

                          <div className="team-game-vs">vs</div>

                          <Link
                            to={`/team/${opponent.id}`}
                            state={{ from: `/team/${id}`, fromLabel: team.name, scrollY: window.scrollY }}
                            className={`team-game-team ${isCompleted && !isWinner ? 'winner' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <ProfilePicture
                              imageUrl={opponent.logoUrl}
                              fallbackImage="team"
                              alt={opponent.name}
                              size={32}
                            />
                            <span className="team-game-name">{opponent.name}</span>
                            {isCompleted && (
                              <span className={`team-game-score ${!isWinner ? 'winner-score' : ''}`}>
                                {opponentScore}
                              </span>
                            )}
                          </Link>
                        </div>

                        <div className={`team-game-result ${isCompleted ? (isWinner ? 'result-win' : 'result-loss') : 'result-pending'}`}>
                          {isCompleted ? (isWinner ? 'W' : 'L') : game.status === 'scheduled' ? 'Scheduled' : game.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="team-detail-empty">
            <p>No games found for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>

      {/* Charts Placeholder */}
      <section className="team-charts-placeholder">
        <div className="team-charts-placeholder-content">
          <BarChart3 size={32} />
          <h3>Charts Coming Soon</h3>
          <p>Head-to-head records, scoring trends, and performance over time will appear here.</p>
        </div>
      </section>
    </div>
  );
};

export default TeamPage;
