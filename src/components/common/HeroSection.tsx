import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Trophy, Users, TrendingUp, Target } from 'lucide-react';
import { Game, Player, Team, PlayerTeam } from '../../core/types';
import { getConfig } from '../../core/config/appConfig';
import { getPlayerFullName, getPlayerInitials } from '../../core/utils/playerHelpers';
import TeamIcon from './TeamIcon';

interface HeroSectionProps {
  games: Game[];
  players: Player[];
  teams: Team[];
  playerTeams: PlayerTeam[];
  seasonStats: {
    totalGames: number;
    completedGames: number;
    averageScore: number;
    totalPoints: number;
  };
}

const HeroSection: React.FC<HeroSectionProps> = ({ 
  games, 
  players, 
  teams,
  playerTeams,
  seasonStats 
}) => {
  const config = getConfig();
  
  // Calculate season progress
  const seasonProgress = seasonStats.totalGames > 0 
    ? Math.round((seasonStats.completedGames / seasonStats.totalGames) * 100)
    : 0;

  // Get next upcoming game
  const upcomingGames = games
    .filter(game => game.status === 'scheduled')
    .sort((a, b) => {
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateA - dateB;
    });
  
  const nextGame = upcomingGames[0];
  const nextGameHomeTeam = nextGame ? teams.find(t => t.id === nextGame.homeTeamId) : null;
  const nextGameAwayTeam = nextGame ? teams.find(t => t.id === nextGame.awayTeamId) : null;

  // For top player, we'd need to compute stats from games
  // For now, just show the first active player (this should be improved with actual stats calculation)
  const topPlayer = players[0];
  const topPlayerTeamEntry = topPlayer ? playerTeams.find(pt => pt.playerId === topPlayer.id && pt.status === 'active') : null;
  const topPlayerTeam = topPlayerTeamEntry ? teams.find(t => t.id === topPlayerTeamEntry.teamId) : null;

  return (
    <div className="hero-section">
      <div className="hero-background">
        <div className="hero-content">
          {/* Main Hero Content */}
          <div className="hero-main">
            <div className="hero-text">
              <div className="league-badge">
                <Trophy size={20} />
                <span>Official League</span>
              </div>
              <h1 className="hero-title">{config.league.name}</h1>
              <p className="hero-subtitle">{config.league.season}</p>
              <p className="hero-description">
                The premier beer dye competition featuring {teams.length} teams and {players.length} competitive players. 
                Join us for intense matches, great competition, and unforgettable moments.
              </p>
              
              {/* Season Progress */}
              <div className="season-progress">
                <div className="progress-header">
                  <span className="progress-label">Season Progress</span>
                  <span className="progress-percentage">{seasonProgress}% Complete</span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${seasonProgress}%` }}
                  />
                </div>
                <div className="progress-stats">
                  <span>{seasonStats.completedGames} of {seasonStats.totalGames} games played</span>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="hero-actions">
                <Link to="/games" className="btn btn-primary">
                  <Calendar size={16} />
                  View Schedule
                </Link>
                <Link to="/standings" className="btn btn-secondary">
                  <Trophy size={16} />
                  Standings
                </Link>
              </div>
            </div>

            {/* Hero Stats Cards */}
            <div className="hero-stats">
              <div className="hero-stat-card">
                <div className="stat-icon">
                  <Users size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{players.length}</div>
                  <div className="stat-label">Active Players</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="stat-icon">
                  <Trophy size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{teams.length}</div>
                  <div className="stat-label">Teams</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="stat-icon">
                  <TrendingUp size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{seasonStats.averageScore.toFixed(1)}</div>
                  <div className="stat-label">Avg Score</div>
                </div>
              </div>

              <div className="hero-stat-card">
                <div className="stat-icon">
                  <Target size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-number">{seasonStats.totalPoints.toLocaleString()}</div>
                  <div className="stat-label">Total Points</div>
                </div>
              </div>
            </div>
          </div>

          {/* Side Info Cards */}
          <div className="hero-sidebar">
            {/* Next Game Card */}
            {nextGame && nextGameHomeTeam && nextGameAwayTeam && (
              <div className="hero-info-card">
                <h3 className="info-card-title">
                  <Calendar size={16} />
                  Next Game
                </h3>
                <div className="next-game">
                  <div className="game-teams-preview">
                    <div className="team-preview">
                      <TeamIcon iconId={nextGameHomeTeam.abbreviation} color="#3b82f6" size={16} />
                      <span>{nextGameHomeTeam.name}</span>
                    </div>
                    <span className="vs-text">vs</span>
                    <div className="team-preview">
                      <TeamIcon iconId={nextGameAwayTeam.abbreviation} color="#ef4444" size={16} />
                      <span>{nextGameAwayTeam.name}</span>
                    </div>
                  </div>
                  <div className="game-date-time">
                    {nextGame.gameDate && (
                      <>
                        {new Date(nextGame.gameDate).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })} at {new Date(nextGame.gameDate).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit'
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Top Performer Card */}
            {topPlayer && (
              <div className="hero-info-card">
                <h3 className="info-card-title">
                  <Trophy size={16} />
                  Leading Player
                </h3>
                <div className="top-performer">
                  <div className="performer-avatar">
                    {topPlayer.avatarUrl ? (
                      <img src={topPlayer.avatarUrl} alt={getPlayerFullName(topPlayer)} />
                    ) : (
                      <div className="performer-initials">
                        {getPlayerInitials(topPlayer)}
                      </div>
                    )}
                  </div>
                  <div className="performer-info">
                    <div className="performer-name">{getPlayerFullName(topPlayer)}</div>
                    {topPlayerTeam && (
                      <div className="performer-team">
                        <TeamIcon iconId={topPlayerTeam.abbreviation} color="#64748b" size={14} />
                        <span>{topPlayerTeam.name}</span>
                      </div>
                    )}
                    <div className="performer-stats">
                      {/* Stats would need to be computed from games */}
                      Season leader
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
