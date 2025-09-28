import React from 'react';
import { Calendar, Trophy, Users, TrendingUp, Target } from 'lucide-react';
import { Game, Player, Team } from '../../core/types';
import { getConfig } from '../../core/config/appConfig';

interface HeroSectionProps {
  games: Game[];
  players: Player[];
  teams: Team[];
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
    .sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  
  const nextGame = upcomingGames[0];
  const nextGameTeam1 = nextGame ? teams.find(t => t.id === nextGame.team1Id) : null;
  const nextGameTeam2 = nextGame ? teams.find(t => t.id === nextGame.team2Id) : null;

  // Get top performer
  const topPlayer = players.reduce((prev, current) => {
    return (current.stats.wins > prev.stats.wins) ? current : prev;
  }, players[0]);
  
  const topPlayerTeam = topPlayer ? teams.find(t => t.id === topPlayer.teamId) : null;

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
                <button className="btn btn-primary">
                  <Calendar size={16} />
                  View Schedule
                </button>
                <button className="btn btn-outline">
                  <Trophy size={16} />
                  Standings
                </button>
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
            {nextGame && nextGameTeam1 && nextGameTeam2 && (
              <div className="hero-info-card">
                <h3 className="info-card-title">
                  <Calendar size={16} />
                  Next Game
                </h3>
                <div className="next-game">
                  <div className="game-teams-preview">
                    <div className="team-preview">
                      <div 
                        className="team-color-preview" 
                        style={{ backgroundColor: nextGameTeam1.color }}
                      />
                      <span>{nextGameTeam1.name}</span>
                    </div>
                    <span className="vs-text">vs</span>
                    <div className="team-preview">
                      <div 
                        className="team-color-preview" 
                        style={{ backgroundColor: nextGameTeam2.color }}
                      />
                      <span>{nextGameTeam2.name}</span>
                    </div>
                  </div>
                  <div className="game-date-time">
                    {new Date(nextGame.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })} at {new Date(nextGame.scheduledDate).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
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
                    {topPlayer.photoUrl ? (
                      <img src={topPlayer.photoUrl} alt={topPlayer.name} />
                    ) : (
                      <div className="performer-initials">
                        {topPlayer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="performer-info">
                    <div className="performer-name">{topPlayer.name}</div>
                    {topPlayerTeam && (
                      <div className="performer-team">
                        <div 
                          className="team-color-dot" 
                          style={{ backgroundColor: topPlayerTeam.color }}
                        />
                        <span>{topPlayerTeam.name}</span>
                      </div>
                    )}
                    <div className="performer-stats">
                      {topPlayer.stats.wins} wins • {topPlayer.stats.averagePoints.toFixed(1)} avg
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
