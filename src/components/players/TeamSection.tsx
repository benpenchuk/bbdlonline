import React from 'react';
import { ChevronRight } from 'lucide-react';
import { Team, Player } from '../../core/types';
import PlayerCard from '../common/PlayerCard';
import TeamIcon from '../common/TeamIcon';

type PlayerStatsMap = Map<string, { record: { wins: number; losses: number; }; avgPoints: number; }>;

interface TeamSectionProps {
  team: Team;
  players: Player[];
  teamStats: {
    totalWins: number;
    totalGames: number;
    averagePoints: number;
  };
  isCollapsed: boolean;
  onToggle: () => void;
  onPlayerClick: (player: Player, e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
  playerStats: PlayerStatsMap;
}

const TeamSection: React.FC<TeamSectionProps> = ({ 
  team, 
  players, 
  teamStats, 
  isCollapsed, 
  onToggle,
  onPlayerClick,
  playerStats,
}) => {
  const teamRecord = `${teamStats.totalWins}–${teamStats.totalGames - teamStats.totalWins}`;

  return (
    <div className="bbdl-team-section">
      {/* Team Header (Clickable to Expand/Collapse) */}
      <button
        className="bbdl-team-section-header"
        onClick={onToggle}
        aria-expanded={!isCollapsed}
        aria-controls={`team-players-${team.id}`}
      >
        <ChevronRight 
          size={20} 
          className={`chevron-icon ${isCollapsed ? '' : 'expanded'}`}
        />
        <TeamIcon iconId={team.icon} color={team.color} size={24} />
        <h2 className="team-section-title">{team.name}</h2>
        <div 
          className="team-section-record"
          title={`${team.name}: ${teamRecord}`}
        >
          {teamRecord}
        </div>
      </button>

      {/* Team Players Container */}
      <div 
        id={`team-players-${team.id}`}
        className={`bbdl-team-players-container ${isCollapsed ? 'collapsed' : 'expanded'}`}
        aria-hidden={isCollapsed}
      >
        {players.length > 0 ? (
          <div className="bbdl-team-players-grid">
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
          <div className="bbdl-empty-state">
            <p>No players on this team.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;
