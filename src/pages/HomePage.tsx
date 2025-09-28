import React from 'react';
import { Calendar, Trophy, TrendingUp, Users, Clock, Award } from 'lucide-react';
import { useData } from '../state';
import { getConfig } from '../core/config/appConfig';
import { calculateSeasonStats, sortGames } from '../core/utils/statsCalculations';
import { getLeagueLeaders } from '../core/services/stats';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import GameCard from '../components/common/GameCard';
import PlayerCard from '../components/common/PlayerCard';
import HeroSection from '../components/common/HeroSection';
import WeatherWidget from '../components/common/WeatherWidget';
import SponsorCarousel from '../components/common/SponsorCarousel';

const HomePage: React.FC = () => {
  const { games, players, teams, announcements, loading } = useData();
  const config = getConfig();

  if (loading) {
    return <LoadingSpinner />;
  }

  const seasonStats = calculateSeasonStats(games);
  const upcomingGames = sortGames(
    games.filter(game => game.status === 'scheduled'),
    'upcoming'
  ).slice(0, 5);
  
  const recentResults = sortGames(
    games.filter(game => game.status === 'completed'),
    'newest'
  ).slice(0, 5);

  const leagueLeaders = getLeagueLeaders(games, players);
  const topPlayers = leagueLeaders.mostWins.slice(0, 5);

  return (
    <div className="page-container">
      {/* Hero Section */}
      <HeroSection 
        games={games}
        players={players}
        teams={teams}
        seasonStats={seasonStats}
      />

      {/* Dashboard Grid */}
      <div className="dashboard-grid">
        {/* Season Overview Stats */}
        {config.homepage.sections.statCards && (
          <section className="dashboard-section dashboard-section-stats">
            <h2 className="section-title">{config.homepage.sectionTitles.statCards}</h2>
            <div className="stat-cards-grid">
              <StatCard
                title="Total Games"
                value={seasonStats.totalGames}
                icon={Calendar}
                color="blue"
              />
              <StatCard
                title="Completed"
                value={seasonStats.completedGames}
                icon={Trophy}
                color="green"
              />
              <StatCard
                title="Average Score"
                value={seasonStats.averageScore.toFixed(1)}
                icon={TrendingUp}
                color="purple"
              />
              <StatCard
                title="Active Players"
                value={players.length}
                icon={Users}
                color="orange"
              />
            </div>
          </section>
        )}

        {/* Upcoming Games */}
        {config.homepage.sections.upcomingGames && upcomingGames.length > 0 && (
          <section className="dashboard-section dashboard-section-upcoming">
            <div className="section-header">
              <h2 className="section-title">{config.homepage.sectionTitles.upcomingGames}</h2>
              <Clock className="section-icon" size={20} />
            </div>
            <div className="games-list">
              {upcomingGames.map(game => (
                <GameCard key={game.id} game={game} teams={teams} compact />
              ))}
            </div>
          </section>
        )}

        {/* Recent Results */}
        {config.homepage.sections.recentResults && recentResults.length > 0 && (
          <section className="dashboard-section dashboard-section-recent">
            <div className="section-header">
              <h2 className="section-title">{config.homepage.sectionTitles.recentResults}</h2>
              <Trophy className="section-icon" size={20} />
            </div>
            <div className="games-list">
              {recentResults.map(game => (
                <GameCard key={game.id} game={game} teams={teams} compact />
              ))}
            </div>
          </section>
        )}

        {/* Top Players */}
        {config.homepage.sections.topPlayers && topPlayers.length > 0 && (
          <section className="dashboard-section dashboard-section-players">
            <div className="section-header">
              <h2 className="section-title">{config.homepage.sectionTitles.topPlayers}</h2>
              <Award className="section-icon" size={20} />
            </div>
            <div className="players-list">
              {topPlayers.map((entry, index) => {
                const player = players.find(p => p.id === entry.playerId);
                const team = teams.find(t => t.id === player?.teamId);
                return player ? (
                  <PlayerCard 
                    key={player.id} 
                    player={player} 
                    team={team}
                  />
                ) : null;
              })}
            </div>
          </section>
        )}

        {/* League Announcements */}
        {config.homepage.sections.announcements && announcements.length > 0 && (
          <section className="dashboard-section dashboard-section-announcements">
            <h2 className="section-title">{config.homepage.sectionTitles.announcements}</h2>
            <div className="announcements-list">
              {announcements.slice(0, 3).map(announcement => (
                <div key={announcement.id} className={`announcement ${announcement.important ? 'announcement-important' : ''}`}>
                  <h3 className="announcement-title">{announcement.title}</h3>
                  <p className="announcement-content">{announcement.content}</p>
                  <span className="announcement-date">
                    {new Date(announcement.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Weather Widget */}
        <section className="dashboard-section dashboard-section-weather">
          <WeatherWidget />
        </section>

        {/* Sponsor Carousel */}
        {config.homepage.sections.sponsors && (
          <section className="dashboard-section dashboard-section-sponsors">
            <SponsorCarousel />
          </section>
        )}
      </div>
    </div>
  );
};

export default HomePage;
