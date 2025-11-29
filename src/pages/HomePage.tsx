import React, { useMemo } from 'react';
import { useData } from '../state';
import { Game } from '../core/types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CompactStandings from '../components/home/CompactStandings';
import CompactScores from '../components/home/CompactScores';
import CompactStatsLeaders from '../components/home/CompactStatsLeaders';
import AnnouncementCard from '../components/home/AnnouncementCard';
import PhotoCarousel from '../components/home/PhotoCarousel';
import SponsorCarousel from '../components/common/SponsorCarousel';

const HomePage: React.FC = () => {
  const { 
    games, 
    players, 
    teams, 
    playerTeams, 
    playerGameStats,
    playerSeasonStats,
    teamSeasonStats,
    announcements,
    photos,
    activeSeason,
    loading,
    getActiveAnnouncement,
    getFeaturedPhoto
  } = useData();

  // Filter data by active season
  const seasonGames = useMemo(() => {
    if (!activeSeason) return games;
    return games.filter(game => game.seasonId === activeSeason.id);
  }, [games, activeSeason]);

  const seasonPlayerSeasonStats = useMemo(() => {
    if (!activeSeason) return playerSeasonStats;
    return playerSeasonStats.filter(stat => stat.seasonId === activeSeason.id);
  }, [playerSeasonStats, activeSeason]);

  const seasonTeamSeasonStats = useMemo(() => {
    if (!activeSeason) return teamSeasonStats;
    return teamSeasonStats.filter(stat => stat.seasonId === activeSeason.id);
  }, [teamSeasonStats, activeSeason]);

  const seasonPlayerTeams = useMemo(() => {
    if (!activeSeason) return playerTeams;
    return playerTeams.filter(pt => pt.seasonId === activeSeason.id && pt.status === 'active');
  }, [playerTeams, activeSeason]);

  const seasonPlayerGameStats = useMemo(() => {
    if (!activeSeason) return playerGameStats;
    return playerGameStats.filter(stat => stat.seasonId === activeSeason.id);
  }, [playerGameStats, activeSeason]);

  // Get active announcement for current season
  const activeAnnouncement = useMemo(() => {
    if (!activeSeason) return null;
    return announcements.find(a => a.seasonId === activeSeason.id && a.active) || null;
  }, [announcements, activeSeason]);

  // Get featured photo and season photos
  const featuredPhoto = useMemo(() => {
    if (!activeSeason) return null;
    return photos.find(p => p.seasonId === activeSeason.id && p.isFeatured) || null;
  }, [photos, activeSeason]);

  const seasonPhotos = useMemo(() => {
    if (!activeSeason) return photos;
    return photos.filter(p => p.seasonId === activeSeason.id);
  }, [photos, activeSeason]);

  // Filter teams to only those with players in the active season
  const seasonTeams = useMemo(() => {
    if (!activeSeason) return teams;
    const seasonTeamIds = new Set(seasonPlayerTeams.map(pt => pt.teamId));
    return teams.filter(team => seasonTeamIds.has(team.id));
  }, [teams, seasonPlayerTeams, activeSeason]);

  // Calculate current week: Sunday 12:00 PM to following Saturday 11:59 PM
  const getCurrentWeekRange = () => {
    const now = new Date();
    const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday
    const currentHour = now.getHours();
    
    // Find the most recent Sunday at 12:00 PM
    let weekStart = new Date(now);
    weekStart.setHours(12, 0, 0, 0);
    
    // If it's Sunday but before 12 PM, go back to previous Sunday
    if (currentDay === 0 && currentHour < 12) {
      weekStart.setDate(weekStart.getDate() - 7);
    } else {
      // Go back to the most recent Sunday
      const daysToSubtract = currentDay === 0 ? 0 : currentDay;
      weekStart.setDate(weekStart.getDate() - daysToSubtract);
    }
    
    // Week ends on Saturday at 11:59 PM
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    
    return { weekStart, weekEnd };
  };

  // Get current week games with fallback
  const currentWeekGames = useMemo(() => {
    const { weekStart, weekEnd } = getCurrentWeekRange();
    
    // First, try to get games from the current week
    const weekGames = seasonGames.filter(game => {
      if (!game.gameDate) {
        // Unscheduled games are included if they're in the current week's status
        return game.status === 'scheduled' || game.status === 'completed';
      }
      
      const gameDate = new Date(game.gameDate);
      return gameDate >= weekStart && gameDate <= weekEnd;
    });

    // If we have current week games, return them sorted
    if (weekGames.length > 0) {
      return weekGames.sort((a, b) => {
        // If both have dates, sort by date
        if (a.gameDate && b.gameDate) {
          return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
        }
        
        // If only one has a date, prioritize it
        if (a.gameDate && !b.gameDate) return -1;
        if (!a.gameDate && b.gameDate) return 1;
        
        // If neither has a date, prioritize scheduled over completed
        if (a.status === 'scheduled' && b.status === 'completed') return -1;
        if (a.status === 'completed' && b.status === 'scheduled') return 1;
        
        return 0;
      });
    }

    // Fallback: Show upcoming scheduled games (next 10 games)
    const upcomingGames = seasonGames
      .filter(game => game.status === 'scheduled' && game.gameDate)
      .sort((a, b) => {
        if (!a.gameDate || !b.gameDate) return 0;
        return new Date(a.gameDate).getTime() - new Date(b.gameDate).getTime();
      })
      .slice(0, 10);

    if (upcomingGames.length > 0) {
      return upcomingGames;
    }

    // Final fallback: Show recent completed games (most recent 10)
    const recentGames = seasonGames
      .filter(game => game.status === 'completed' && game.gameDate)
      .sort((a, b) => {
        if (!a.gameDate || !b.gameDate) return 0;
        return new Date(b.gameDate).getTime() - new Date(a.gameDate).getTime();
      })
      .slice(0, 10);

    return recentGames;
  }, [seasonGames]);

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>Home</h1>
          <p className="page-subtitle">
            {activeSeason ? `${activeSeason.name} season overview` : 'League overview and latest updates'}
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="page-content home-page-compact">
        {/* Top Section: 3-Column Grid */}
        <div className="home-boxes-container">
          {/* Scores - Current Week Games */}
          <CompactScores
            games={currentWeekGames}
            teams={seasonTeams}
            limit={6}
          />

          {/* Standings Table */}
          <CompactStandings 
            teams={seasonTeams}
            games={seasonGames}
            teamSeasonStats={seasonTeamSeasonStats}
            limit={8}
          />

          {/* League Leaders */}
          <CompactStatsLeaders
            players={players}
            teams={seasonTeams}
            playerTeams={seasonPlayerTeams}
            playerGameStats={seasonPlayerGameStats}
            playerSeasonStats={seasonPlayerSeasonStats}
            limit={5}
          />
        </div>

        {/* Bottom Section: 2-Column Grid */}
        <div className="home-secondary-grid">
          {/* Left Column: Announcements & Photos */}
          <div className="home-secondary-left">
            <AnnouncementCard announcement={activeAnnouncement} />
            <PhotoCarousel photos={seasonPhotos} featuredPhoto={featuredPhoto} />
          </div>

          {/* Right Column: Sponsors */}
          <div className="home-secondary-right">
            <SponsorCarousel />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
