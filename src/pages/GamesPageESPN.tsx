import React, { useState, useMemo } from 'react';
import { Calendar, Grid, Star } from 'lucide-react';
import { useData } from '../state';
import { Game } from '../core/types';
import { format, startOfDay, isSameDay, addDays, subDays } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DateNavigator from '../components/games/DateNavigator';
import ESPNGameCard from '../components/games/ESPNGameCard';
import GameModal from '../components/games/GameModal';

type ViewMode = 'daily' | 'multi-day';
type QuickFilter = 'all' | 'my-team' | 'completed' | 'upcoming';

const GamesPageESPN: React.FC = () => {
  const { games, teams, loading } = useData();
  const [selectedDate, setSelectedDate] = useState(startOfDay(new Date()));
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [myTeamId] = useState<string>('team-1'); // TODO: Get from user preferences

  // Group games by date
  const gamesByDate = useMemo(() => {
    const grouped = new Map<string, Game[]>();
    
    games.forEach(game => {
      const date = startOfDay(game.scheduledDate);
      const dateKey = format(date, 'yyyy-MM-dd');
      
      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, []);
      }
      grouped.get(dateKey)!.push(game);
    });

    // Sort games within each day
    grouped.forEach((dayGames) => {
      dayGames.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());
    });

    return grouped;
  }, [games]);

  // Get game counts by date
  const gameCountsByDate = useMemo(() => {
    const counts = new Map<string, number>();
    gamesByDate.forEach((games, dateKey) => {
      counts.set(dateKey, games.length);
    });
    return counts;
  }, [gamesByDate]);

  // Filter games based on quick filter
  const filterGames = (games: Game[]): Game[] => {
    switch (quickFilter) {
      case 'my-team':
        return games.filter(g => g.team1Id === myTeamId || g.team2Id === myTeamId);
      case 'completed':
        return games.filter(g => g.status === 'completed');
      case 'upcoming':
        return games.filter(g => g.status === 'scheduled');
      default:
        return games;
    }
  };

  // Get games to display
  const displayGames = useMemo(() => {
    if (viewMode === 'daily') {
      const dateKey = format(selectedDate, 'yyyy-MM-dd');
      const dayGames = gamesByDate.get(dateKey) || [];
      return filterGames(dayGames);
    } else {
      // Multi-day: show 3 days (yesterday, today, tomorrow)
      const days: { date: Date; games: Game[] }[] = [];
      
      for (let i = -1; i <= 1; i++) {
        const date = addDays(selectedDate, i);
        const dateKey = format(date, 'yyyy-MM-dd');
        const dayGames = gamesByDate.get(dateKey) || [];
        days.push({ date, games: filterGames(dayGames) });
      }
      
      return days;
    }
  }, [viewMode, selectedDate, gamesByDate, quickFilter, myTeamId]);

  // Touch/swipe handlers for mobile
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      setSelectedDate(prev => addDays(prev, 1));
    }
    if (isRightSwipe) {
      setSelectedDate(prev => subDays(prev, 1));
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading games..." />;
  }

  return (
    <div className="espn-games-page">
      {/* Header */}
      <div className="espn-page-header">
        <div className="espn-header-left">
          <h1>Games & Schedule</h1>
          <p className="espn-subtitle">Live scores, schedules, and standings</p>
        </div>
        
        <div className="espn-header-actions">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <button
              className={`view-mode-btn ${viewMode === 'daily' ? 'active' : ''}`}
              onClick={() => setViewMode('daily')}
              title="Daily view"
            >
              <Calendar size={18} />
              <span>Daily</span>
            </button>
            <button
              className={`view-mode-btn ${viewMode === 'multi-day' ? 'active' : ''}`}
              onClick={() => setViewMode('multi-day')}
              title="Multi-day view"
            >
              <Grid size={18} />
              <span>Multi-day</span>
            </button>
          </div>
        </div>
      </div>

      {/* Date Navigator */}
      <DateNavigator
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        gameCountsByDate={gameCountsByDate}
      />

      {/* Quick Filters */}
      <div className="espn-quick-filters">
        <button
          className={`quick-filter-btn ${quickFilter === 'all' ? 'active' : ''}`}
          onClick={() => setQuickFilter('all')}
        >
          All Games
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === 'my-team' ? 'active' : ''}`}
          onClick={() => setQuickFilter('my-team')}
        >
          <Star size={16} />
          My Team
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === 'completed' ? 'active' : ''}`}
          onClick={() => setQuickFilter('completed')}
        >
          Completed
        </button>
        <button
          className={`quick-filter-btn ${quickFilter === 'upcoming' ? 'active' : ''}`}
          onClick={() => setQuickFilter('upcoming')}
        >
          Upcoming
        </button>
      </div>

      {/* Games Display */}
      <div 
        className="espn-games-content"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {viewMode === 'daily' ? (
          // Daily View
          <div className="espn-daily-games">
            {displayGames.length === 0 ? (
              <div className="espn-no-games">
                <Calendar size={48} />
                <h3>No games scheduled</h3>
                <p>Check back later or select a different date</p>
              </div>
            ) : (
              <div className="espn-games-grid">
                {(displayGames as Game[]).map(game => (
                  <ESPNGameCard
                    key={game.id}
                    game={game}
                    teams={teams}
                    onClick={() => setSelectedGame(game)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          // Multi-day View
          <div className="espn-multiday-games">
            {(displayGames as { date: Date; games: Game[] }[]).map(({ date, games: dayGames }) => (
              <div key={format(date, 'yyyy-MM-dd')} className="espn-day-section">
                <div className="espn-day-header">
                  <h3>{format(date, 'EEEE, MMM d')}</h3>
                  <span className="espn-game-count">
                    {dayGames.length} {dayGames.length === 1 ? 'game' : 'games'}
                  </span>
                </div>
                
                {dayGames.length === 0 ? (
                  <div className="espn-day-no-games">
                    <p>No games scheduled</p>
                  </div>
                ) : (
                  <div className="espn-games-grid">
                    {dayGames.map(game => (
                      <ESPNGameCard
                        key={game.id}
                        game={game}
                        teams={teams}
                        onClick={() => setSelectedGame(game)}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Detail Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          teams={teams}
          onClose={() => setSelectedGame(null)}
        />
      )}
    </div>
  );
};

export default GamesPageESPN;

