import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Trophy, Target, Users, Calendar, TrendingUp, TrendingDown, MapPin } from 'lucide-react';
import { useData } from '../state';
import { Game, Player, PlayerTeam } from '../core/types';
import { calculateTeamStatsForGames } from '../core/utils/statsCalculations';
import { getPlayerFullName, getTeamPlayers } from '../core/utils/playerHelpers';
import { getGameTags, getWinnerId } from '../core/utils/gameHelpers';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TeamIcon from '../components/common/TeamIcon';
import PlayerCard from '../components/common/PlayerCard';

const TeamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { teams, games, players, playerTeams, activeSeason, teamSeasonStats, loading } = useData();

  const team = useMemo(() => {
    if (!id) return null;
    return teams.find(t => t.id === id);
  }, [teams, id]);

  // Filter games by active season and team
  const teamGames = useMemo(() => {
    if (!id) return [];
    let filtered = games.filter(g => 
      (g.homeTeamId === id || g.awayTeamId === id)
    );
    
    if (activeSeason) {
      filtered = filtered.filter(g => g.seasonId === activeSeason.id);
    }
    
    return filtered.sort((a, b) => {
      const dateA = a.gameDate ? a.gameDate.getTime() : 0;
      const dateB = b.gameDate ? b.gameDate.getTime() : 0;
      return dateB - dateA; // Most recent first
    });
  }, [games, id, activeSeason]);

  // Calculate team stats
  const teamStats = useMemo(() => {
    if (!id) return null;
    return calculateTeamStatsForGames(id, teamGames.filter(g => g.status === 'completed'));
  }, [id, teamGames]);

  // Get team players
  const teamPlayers = useMemo(() => {
    if (!id) return [];
    return getTeamPlayers(id, players, playerTeams, activeSeason?.id);
  }, [id, players, playerTeams, activeSeason]);

  // Get team season stats
  const seasonStats = useMemo(() => {
    if (!id || !activeSeason) return null;
    return teamSeasonStats.find(s => s.teamId === id && s.seasonId === activeSeason.id);
  }, [id, activeSeason, teamSeasonStats]);

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

  if (loading) {
    return <LoadingSpinner message="Loading team..." />;
  }

  if (!team) {
    return (
      <div className="team-page">
        <div className="team-page-error">
          <h2>Team Not Found</h2>
          <p>The team you're looking for doesn't exist.</p>
          <Link to="/standings" className="btn btn-primary">View All Teams</Link>
        </div>
      </div>
    );
  }

  const winPercentage = teamStats && teamStats.gamesPlayed > 0
    ? Math.round((teamStats.wins / teamStats.gamesPlayed) * 100)
    : 0;

  const formatDateTime = (game: Game): string => {
    if (!game.gameDate) return 'TBD';
    const date = format(game.gameDate, 'MMM d, yyyy');
    const time = format(game.gameDate, 'h:mm a');
    return `${date} at ${time}`;
  };

  const getOpponent = (game: Game): { id: string; name: string; abbreviation: string } | null => {
    const opponentId = game.homeTeamId === id ? game.awayTeamId : game.homeTeamId;
    const opponent = teams.find(t => t.id === opponentId);
    if (!opponent) return null;
    return {
      id: opponent.id,
      name: opponent.name,
      abbreviation: opponent.abbreviation,
    };
  };

  return (
    <div className="team-page">
      {/* Header */}
      <div className="team-page-header">
        <div className="team-page-identity">
          <TeamIcon iconId={team.abbreviation} color="#3b82f6" size={48} />
          <div className="team-page-info">
            <h1 className="team-page-name">{team.name}</h1>
            {team.abbreviation && (
              <p className="team-page-abbreviation">{team.abbreviation}</p>
            )}
            {team.homeCity && team.homeState && (
              <p className="team-page-location">
                <MapPin size={14} />
                {team.homeCity}, {team.homeState}
              </p>
            )}
          </div>
        </div>

        {/* Record */}
        {teamStats && (
          <div className="team-page-record">
            <div className="record-main">
              <span className="record-wins">{teamStats.wins}</span>
              <span className="record-separator">-</span>
              <span className="record-losses">{teamStats.losses}</span>
            </div>
            <div className="record-percentage">{winPercentage}%</div>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      {teamStats && (
        <div className="team-page-stats">
          <div className="stat-card">
            <Trophy size={20} />
            <div className="stat-content">
              <span className="stat-label">Wins</span>
              <span className="stat-value">{teamStats.wins}</span>
            </div>
          </div>
          
          <div className="stat-card">
            <Target size={20} />
            <div className="stat-content">
              <span className="stat-label">Avg Points</span>
              <span className="stat-value">
                {teamStats.gamesPlayed > 0 
                  ? (teamStats.pointsFor / teamStats.gamesPlayed).toFixed(1)
                  : '0.0'}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <TrendingUp size={20} />
            <div className="stat-content">
              <span className="stat-label">Points For</span>
              <span className="stat-value">{teamStats.pointsFor}</span>
            </div>
          </div>

          <div className="stat-card">
            <TrendingDown size={20} />
            <div className="stat-content">
              <span className="stat-label">Points Against</span>
              <span className="stat-value">{teamStats.pointsAgainst}</span>
            </div>
          </div>

          <div className="stat-card">
            <Target size={20} />
            <div className="stat-content">
              <span className="stat-label">Point Diff</span>
              <span className={`stat-value ${teamStats.pointsFor - teamStats.pointsAgainst > 0 ? 'positive' : teamStats.pointsFor - teamStats.pointsAgainst < 0 ? 'negative' : ''}`}>
                {teamStats.pointsFor - teamStats.pointsAgainst > 0 ? '+' : ''}
                {teamStats.pointsFor - teamStats.pointsAgainst}
              </span>
            </div>
          </div>

          <div className="stat-card">
            <Calendar size={20} />
            <div className="stat-content">
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{teamStats.gamesPlayed}</span>
            </div>
          </div>
        </div>
      )}

      {/* Roster */}
      <div className="team-page-section">
        <h2 className="section-title">
          <Users size={20} />
          Roster
        </h2>
        {teamPlayers.length > 0 ? (
          <div className="team-page-roster">
            {teamPlayers.map(player => {
              // Calculate player stats for this team
              const playerGames = teamGames.filter(g => 
                g.status === 'completed' &&
                (g.homeTeamId === id || g.awayTeamId === id)
              );
              
              // This is simplified - in a real app you'd get player stats from playerGameStats
              const wins = playerGames.filter(g => getWinnerId(g) === id).length;
              const gamesPlayed = playerGames.length;
              
              return (
                <Link 
                  key={player.id} 
                  to={`/players`}
                  className="team-page-player-link"
                >
                  <PlayerCard
                    player={player}
                    team={team}
                    record={gamesPlayed > 0 ? { wins, losses: gamesPlayed - wins } : undefined}
                    avgPoints={undefined}
                  />
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No players on this team.</p>
          </div>
        )}
      </div>

      {/* Game History */}
      <div className="team-page-section">
        <h2 className="section-title">
          <Calendar size={20} />
          Game History
        </h2>
        {teamGames.length > 0 ? (
          <div className="team-page-games">
            {Array.from(gamesByWeek.entries())
              .sort(([weekA], [weekB]) => weekB - weekA) // Most recent week first
              .map(([week, weekGames]) => (
                <div key={week} className="team-page-week-section">
                  <h3 className="week-title">Week {week}</h3>
                  <div className="week-games-list">
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
                        <div key={game.id} className="team-page-game-card">
                          <div className="game-card-status">
                            <span className={`status-badge status-${game.status}`}>
                              {game.status === 'completed' ? 'Final' : 
                               game.status === 'scheduled' ? 'Scheduled' :
                               game.status === 'in_progress' ? 'Live' : 'Canceled'}
                            </span>
                          </div>

                          <div className="game-card-teams">
                            <div className={`game-card-team ${isCompleted && isWinner ? 'winner' : ''}`}>
                              <TeamIcon iconId={team.abbreviation} color="#3b82f6" size={20} />
                              <span className="team-name">{team.name}</span>
                              {isCompleted && (
                                <span className={`team-score ${isWinner ? 'winner-score' : ''}`}>
                                  {teamScore}
                                </span>
                              )}
                            </div>

                            <div className="game-card-vs">vs</div>

                            <Link 
                              to={`/team/${opponent.id}`}
                              className={`game-card-team ${isCompleted && !isWinner ? 'winner' : ''}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <TeamIcon iconId={opponent.abbreviation} color="#ef4444" size={20} />
                              <span className="team-name">{opponent.name}</span>
                              {isCompleted && (
                                <span className={`team-score ${!isWinner ? 'winner-score' : ''}`}>
                                  {opponentScore}
                                </span>
                              )}
                            </Link>
                          </div>

                          <div className="game-card-datetime">
                            <Calendar size={14} />
                            <span>{formatDateTime(game)}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            
            {/* Games without week assignment */}
            {teamGames.filter(g => !g.week).length > 0 && (
              <div className="team-page-week-section">
                <h3 className="week-title">Other Games</h3>
                <div className="week-games-list">
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
                      <div key={game.id} className="team-page-game-card">
                        <div className="game-card-status">
                          <span className={`status-badge status-${game.status}`}>
                            {game.status === 'completed' ? 'Final' : 
                             game.status === 'scheduled' ? 'Scheduled' :
                             game.status === 'in_progress' ? 'Live' : 'Canceled'}
                          </span>
                        </div>

                        <div className="game-card-teams">
                          <div className={`game-card-team ${isCompleted && isWinner ? 'winner' : ''}`}>
                            <TeamIcon iconId={team.abbreviation} color="#3b82f6" size={20} />
                            <span className="team-name">{team.name}</span>
                            {isCompleted && (
                              <span className={`team-score ${isWinner ? 'winner-score' : ''}`}>
                                {teamScore}
                              </span>
                            )}
                          </div>

                          <div className="game-card-vs">vs</div>

                          <Link 
                            to={`/team/${opponent.id}`}
                            className={`game-card-team ${isCompleted && !isWinner ? 'winner' : ''}`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <TeamIcon iconId={opponent.abbreviation} color="#ef4444" size={20} />
                            <span className="team-name">{opponent.name}</span>
                            {isCompleted && (
                              <span className={`team-score ${!isWinner ? 'winner-score' : ''}`}>
                                {opponentScore}
                              </span>
                            )}
                          </Link>
                        </div>

                        <div className="game-card-datetime">
                          <Calendar size={14} />
                          <span>{formatDateTime(game)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>No games found for this team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamPage;

