import React from 'react';
import { Link } from 'react-router-dom';
import { Game, Team } from '../../core/types';
import { format } from 'date-fns';
import TeamIcon from '../common/TeamIcon';

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

  return (
    <div className="scores-card-container">
      <h3 className="scores-card-title">Scores</h3>
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

              const status = getGameStatus(game);
              const homeScore = getHomeScore(game);
              const awayScore = getAwayScore(game);
              const dateTime = getDateTimeDisplay(game);

              return (
                <React.Fragment key={game.id}>
                  <div className={`scores-game-group ${index < displayedGames.length - 1 ? 'scores-game-group-separated' : ''}`}>
                    {/* Home Team */}
                    <div className="scores-team-item">
                      <div className="scores-team-icon-wrapper">
                        <TeamIcon 
                          iconId={homeTeam.abbreviation} 
                          color="#64748b" 
                          size={20} 
                        />
                      </div>
                      <Link to={`/team/${homeTeam.id}`} className="scores-team-name">
                        {homeTeam.name}
                      </Link>
                      <span className="scores-team-score">{homeScore}</span>
                    </div>
                    
                    {/* Away Team */}
                    <div className="scores-team-item">
                      <div className="scores-team-icon-wrapper">
                        <TeamIcon 
                          iconId={awayTeam.abbreviation} 
                          color="#64748b" 
                          size={20} 
                        />
                      </div>
                      <Link to={`/team/${awayTeam.id}`} className="scores-team-name">
                        {awayTeam.name}
                      </Link>
                      <span className="scores-team-score">{awayScore}</span>
                    </div>
                    
                    {/* Game Metadata */}
                    <div className="scores-game-meta">
                      {dateTime && <span className="scores-game-datetime">{dateTime}</span>}
                    </div>
                  </div>
                </React.Fragment>
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

