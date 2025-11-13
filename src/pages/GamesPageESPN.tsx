import React, { useState, useMemo } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useData } from '../state';
import { Game, Team } from '../core/types';
import { format } from 'date-fns';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GameModal from '../components/games/GameModal';
import TeamIcon from '../components/common/TeamIcon';
import { getWinnerId } from '../core/utils/gameHelpers';

const GamesPageESPN: React.FC = () => {
  const { games, teams, activeSeason, loading } = useData();
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);

  // Filter games by active season
  const seasonGames = useMemo(() => {
    if (!activeSeason) return games;
    return games.filter(game => game.seasonId === activeSeason.id);
  }, [games, activeSeason]);

  // Determine default week (most recent week with games, or current week)
  const defaultWeek = useMemo(() => {
    const weeksWithGames = new Set<number>();
    seasonGames.forEach(game => {
      if (game.week) {
        weeksWithGames.add(game.week);
      }
    });
    
    if (weeksWithGames.size === 0) return null;
    
    // Get the highest week number that has games
    return Math.max(...Array.from(weeksWithGames));
  }, [seasonGames]);

  // Set default week on mount
  React.useEffect(() => {
    if (selectedWeek === null && defaultWeek !== null) {
      setSelectedWeek(defaultWeek);
    }
  }, [defaultWeek, selectedWeek]);

  // Filter games by selected week
  const weekGames = useMemo(() => {
    if (selectedWeek === null) return [];
    return seasonGames
      .filter(game => game.week === selectedWeek)
      .sort((a, b) => {
        // Sort by date, then by status (completed first)
        const dateA = a.gameDate ? a.gameDate.getTime() : 0;
        const dateB = b.gameDate ? b.gameDate.getTime() : 0;
        if (dateA !== dateB) return dateA - dateB;
        
        // If same date, completed games first
        if (a.status === 'completed' && b.status !== 'completed') return -1;
        if (a.status !== 'completed' && b.status === 'completed') return 1;
        return 0;
      });
  }, [seasonGames, selectedWeek]);

  // Get available weeks (all weeks 1-6, but mark which ones have games)
  const availableWeeks = useMemo(() => {
    return [1, 2, 3, 4, 5, 6];
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading games..." />;
  }

  const getTeam = (teamId: string): Team | undefined => {
    return teams.find(t => t.id === teamId);
  };

  const getStatusText = (game: Game): string => {
    switch (game.status) {
      case 'completed':
        return 'Completed';
      case 'scheduled':
        return 'Scheduled';
      case 'in_progress':
        return 'In Progress';
      case 'canceled':
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  const formatDateTime = (game: Game): string => {
    if (!game.gameDate) return 'TBD';
    const date = format(game.gameDate, 'MMM d, yyyy');
    const time = format(game.gameDate, 'h:mm a');
    return `${date} at ${time}`;
  };

  return (
    <div className="games-page-week">
      {/* Header */}
      <div className="games-page-header">
        <div className="games-header-left">
          <h1>Games</h1>
        </div>
        
        {/* Week Selector */}
        <div className="week-selector-container">
          <label htmlFor="week-select" className="week-select-label">Week</label>
          <div className="week-select-wrapper">
            <select
              id="week-select"
              className="week-select"
              value={selectedWeek || ''}
              onChange={(e) => setSelectedWeek(e.target.value ? parseInt(e.target.value) : null)}
            >
              {availableWeeks.length === 0 && (
                <option value="">No weeks available</option>
              )}
              {availableWeeks.map(week => (
                <option key={week} value={week}>
                  Week {week}
                </option>
              ))}
            </select>
            <ChevronDown size={18} className="week-select-chevron" />
          </div>
        </div>
      </div>

      {/* Games List */}
      <div className="games-week-content">
        {selectedWeek === null ? (
          <div className="games-empty-state">
            <Calendar size={48} />
            <h3>No week selected</h3>
            <p>Select a week to view games</p>
          </div>
        ) : weekGames.length === 0 ? (
          <div className="games-empty-state">
            <Calendar size={48} />
            <h3>No games scheduled</h3>
            <p>No games found for Week {selectedWeek}</p>
          </div>
        ) : (
          <div className="games-week-list">
            {weekGames.map(game => {
              const homeTeam = getTeam(game.homeTeamId);
              const awayTeam = getTeam(game.awayTeamId);
              
              if (!homeTeam || !awayTeam) return null;

              const winnerId = getWinnerId(game);
              const isCompleted = game.status === 'completed';

              return (
                <div key={game.id} className="game-week-card">
                  {/* Status Badge */}
                  <div className="game-week-status">
                    <span className={`status-badge status-${game.status}`}>
                      {getStatusText(game)}
                    </span>
                  </div>

                  {/* Teams and Scores */}
                  <div className="game-week-teams">
                    {/* Home Team */}
                    <div className={`game-week-team ${isCompleted && winnerId === homeTeam.id ? 'winner' : ''}`}>
                      <TeamIcon iconId={homeTeam.abbreviation} color="#3b82f6" size={24} />
                      <Link 
                        to={`/team/${homeTeam.id}`} 
                        className="game-week-team-name"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {homeTeam.name}
                      </Link>
                      {isCompleted && (
                        <span className={`game-week-score ${winnerId === homeTeam.id ? 'winner-score' : ''}`}>
                          {game.homeScore}
                        </span>
                      )}
                    </div>

                    {/* VS Divider */}
                    <div className="game-week-vs">vs</div>

                    {/* Away Team */}
                    <div className={`game-week-team ${isCompleted && winnerId === awayTeam.id ? 'winner' : ''}`}>
                      <TeamIcon iconId={awayTeam.abbreviation} color="#ef4444" size={24} />
                      <Link 
                        to={`/team/${awayTeam.id}`} 
                        className="game-week-team-name"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {awayTeam.name}
                      </Link>
                      {isCompleted && (
                        <span className={`game-week-score ${winnerId === awayTeam.id ? 'winner-score' : ''}`}>
                          {game.awayScore}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Date and Time */}
                  <div className="game-week-datetime">
                    <Calendar size={14} />
                    <span>{formatDateTime(game)}</span>
                  </div>

                  {/* Click handler for modal */}
                  <div 
                    className="game-week-card-overlay"
                    onClick={() => setSelectedGame(game)}
                  />
                </div>
              );
            })}
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
