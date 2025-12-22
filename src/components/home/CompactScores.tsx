import React from 'react';
import { Link } from 'react-router-dom';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import ProfilePicture from '../common/ProfilePicture';

// Get current scroll position for navigation state
const getNavState = (teamName: string) => ({
  from: '/',
  fromLabel: 'Home',
  scrollY: window.scrollY
});

interface CompactScoresProps {
  games: Game[];
  teams: Team[];
  limit?: number;
}

const CompactScores: React.FC<CompactScoresProps> = ({
  games,
  teams,
  limit = 10
}) => {
  const getTeam = (teamId: string) => teams.find(t => t.id === teamId);

  const formatDate = (date?: Date) => {
    if (!date) return '';
    return format(new Date(date), 'MMM d');
  };

  const formatTime = (date?: Date) => {
    if (!date) return '';
    return format(new Date(date), 'h:mm a');
  };

  const getGameStatus = (game: Game): 'Completed' | 'Scheduled' | 'Unscheduled' => {
    if (game.status === 'completed') return 'Completed';
    if (game.gameDate) return 'Scheduled';
    return 'Unscheduled';
  };

  const getHomeScore = (game: Game) => {
    if (game.status === 'completed') {
      return game.homeScore.toString();
    }
    return '0';
  };

  const getAwayScore = (game: Game) => {
    if (game.status === 'completed') {
      return game.awayScore.toString();
    }
    return '0';
  };

  const getDateTimeDisplay = (game: Game) => {
    if (!game.gameDate) return '';
    
    const status = getGameStatus(game);
    const dateStr = formatDate(game.gameDate);
    const timeStr = formatTime(game.gameDate);
    
    if (status === 'Scheduled') {
      return `Scheduled ${dateStr} ${timeStr}`;
    }
    
    return `${dateStr} ${timeStr}`;
  };

  const getWinnerId = (game: Game): string | null => {
    if (game.status !== 'completed') return null;
    if (game.homeScore > game.awayScore) return game.homeTeamId;
    if (game.awayScore > game.homeScore) return game.awayTeamId;
    return null; // Tie
  };

  return (
    <div className="scores-card-container">
      <h3 className="scores-card-title section-title">Scores</h3>
      <div className="scores-card-separator"></div>
      <div className="scores-list">
        {games.length === 0 ? (
          <div className="scores-empty-state">No games scheduled for this week</div>
        ) : (
          (() => {
            const displayedGames = limit ? games.slice(0, limit) : games;
            return displayedGames.map((game, index) => {
              const homeTeam = getTeam(game.homeTeamId);
              const awayTeam = getTeam(game.awayTeamId);

              if (!homeTeam || !awayTeam) return null;

              const homeScore = getHomeScore(game);
              const awayScore = getAwayScore(game);
              const dateTime = getDateTimeDisplay(game);
              const winnerId = getWinnerId(game);
              const isHomeWinner = winnerId === game.homeTeamId;
              const isAwayWinner = winnerId === game.awayTeamId;

              return (
                <div key={game.id} className="scores-game-card">
                  {/* Home Team */}
                  <div className={`scores-team-item ${isHomeWinner ? 'scores-team-winner' : ''}`}>
                    <div className="scores-team-icon-wrapper">
                      <ProfilePicture
                        imageUrl={homeTeam.logoUrl}
                        fallbackImage="team"
                        alt={homeTeam.name}
                        size={32}
                      />
                    </div>
                    <Link 
                      to={`/team/${homeTeam.id}`} 
                      state={getNavState(homeTeam.name)}
                      className="scores-team-name"
                    >
                      {homeTeam.name}
                    </Link>
                    <span className={`scores-team-score ${isHomeWinner ? 'scores-team-score-winner' : ''}`}>
                      {homeScore}
                    </span>
                    {isHomeWinner && <span className="scores-winner-indicator">✓</span>}
                  </div>
                  
                  {/* Away Team */}
                  <div className={`scores-team-item ${isAwayWinner ? 'scores-team-winner' : ''}`}>
                    <div className="scores-team-icon-wrapper">
                      <ProfilePicture
                        imageUrl={awayTeam.logoUrl}
                        fallbackImage="team"
                        alt={awayTeam.name}
                        size={32}
                      />
                    </div>
                    <Link 
                      to={`/team/${awayTeam.id}`} 
                      state={getNavState(awayTeam.name)}
                      className="scores-team-name"
                    >
                      {awayTeam.name}
                    </Link>
                    <span className={`scores-team-score ${isAwayWinner ? 'scores-team-score-winner' : ''}`}>
                      {awayScore}
                    </span>
                    {isAwayWinner && <span className="scores-winner-indicator">✓</span>}
                  </div>
                  
                  {/* Game Metadata */}
                  {dateTime && (
                    <div className="scores-game-meta">
                      <span className="scores-game-datetime">{dateTime}</span>
                    </div>
                  )}
                </div>
              );
            });
          })()
        )}
      </div>
      <div className="scores-card-footer">
        <Link to="/games" className="scores-view-full-link">
          View Full Scoreboard
        </Link>
      </div>
    </div>
  );
};

export default CompactScores;

