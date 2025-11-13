import React, { useMemo } from 'react';
import { Radio } from 'lucide-react';
import { Game, Team } from '../../core/types';
import GameCard from '../common/GameCard';
import GameStatusBadge from '../common/GameStatusBadge';

interface LiveGamesSectionProps {
  games: Game[];
  teams: Team[];
}

const LiveGamesSection: React.FC<LiveGamesSectionProps> = ({ games, teams }) => {
  const liveGames = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return games.filter(game => {
      // Include in_progress games
      if (game.status === 'in_progress') return true;
      
      // Include scheduled games happening today
      if (game.status === 'scheduled' && game.gameDate) {
        const gameDate = new Date(game.gameDate);
        const gameDay = new Date(gameDate.getFullYear(), gameDate.getMonth(), gameDate.getDate());
        return gameDay.getTime() === today.getTime();
      }
      
      return false;
    }).sort((a, b) => {
      // Sort by date, most recent first
      const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
      const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
      return dateB - dateA;
    });
  }, [games]);

  if (liveGames.length === 0) {
    return null;
  }

  return (
    <section className="home-section live-games-section">
      <div className="section-header">
        <div className="section-header-left">
          <Radio size={20} className="section-icon live-icon" />
          <h2 className="section-title">Live Games</h2>
        </div>
      </div>
      
      <div className="games-grid">
        {liveGames.map(game => (
          <div key={game.id} className="live-game-wrapper">
            <GameStatusBadge 
              status={game.status} 
              gameDate={game.gameDate}
              className="live-badge-overlay"
            />
            <GameCard game={game} teams={teams} compact />
          </div>
        ))}
      </div>
    </section>
  );
};

export default LiveGamesSection;

