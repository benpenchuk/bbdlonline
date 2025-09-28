import React from 'react';
import { Users, Trophy, Target, ChevronDown } from 'lucide-react';
import { Team, Player } from '../../core/types';
import PlayerCard from '../common/PlayerCard';

type PlayerStatsMap = Map<string, { record: { wins: number; losses: number; }; avgPoints: number; }>;

interface TeamSectionProps {
  team: Team;
  players: Player[];
  teamStats: {
    totalWins: number;
    totalGames: number;
    averagePoints: number;
  };
  isInitiallyCollapsed: boolean;
  onToggleCollapse: () => void;
  onPlayerClick: (player: Player, e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  playerStats: PlayerStatsMap;
}

const TeamSection: React.FC<TeamSectionProps> = ({ 
  team, 
  players, 
  teamStats, 
  isInitiallyCollapsed, 
  onToggleCollapse,
  onPlayerClick,
  playerStats,
}) => {
  return (
    <div className="team-section" data-collapsed={isInitiallyCollapsed}>
      <div className="team-header" onClick={onToggleCollapse} aria-expanded={!isInitiallyCollapsed}>
        <div className="team-info-left">
          <div 
            className="team-color-dot"
            style={{ backgroundColor: team.color }}
          />
          <h2 className="team-name">{team.name}</h2>
        </div>
        <div className="team-header-stats">
            <div className="team-header-stat">
              <Users size={16} />
              <strong>{players.length}</strong>
              <span>Players</span>
            </div>
            <div className="team-header-stat">
              <Trophy size={16} />
              <strong>{teamStats.totalWins}</strong>
              <span>Wins</span>
            </div>
            <div className="team-header-stat">
              <Target size={16} />
              <strong>{teamStats.averagePoints.toFixed(1)}</strong>
              <span>Avg Pts</span>
            </div>
        </div>
        <button className="collapse-icon">
          <ChevronDown size={24} style={{ transform: isInitiallyCollapsed ? 'rotate(0deg)' : 'rotate(180deg)', transition: 'transform 0.3s' }} />
        </button>
      </div>

      <div className="team-players-container" data-collapsed={isInitiallyCollapsed}>
        {players.length > 0 ? (
          <div className="players-grid">
            {players.map(player => {
              const stats = playerStats.get(player.id);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={team}
                  record={stats?.record}
                  avgPoints={stats?.avgPoints}
                  onClick={(e) => onPlayerClick(player, e)}
                />
              );
            })}
          </div>
        ) : (
          <div className="empty-state" style={{padding: 'var(--space-lg)', minHeight: '100px'}}>
            <p>No players match the current filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;
