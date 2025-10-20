import React from 'react';
import { Player, Team } from '../../core/types';
import TeamIcon from './TeamIcon';

interface PlayerCardProps {
  player: Player;
  team?: Team;
  record?: { wins: number; losses: number };
  avgPoints?: number;
  onClick?: (e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => void;
}

const PlayerCard: React.FC<PlayerCardProps> = React.memo(({ 
  player, 
  team, 
  record,
  avgPoints,
  onClick 
}) => {
  const gamesPlayed = record ? record.wins + record.losses : 0;

  return (
    <div 
      className={`bbdl-player-card ${onClick ? 'clickable' : ''}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick(e);
        }
      }}
      role={onClick ? 'button' : undefined}
      aria-label={onClick ? `View details for ${player.name}` : undefined}
    >
      {/* Avatar */}
      <div className="bbdl-player-card-avatar">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.name} />
        ) : (
          <div className="bbdl-player-card-initials">
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="bbdl-player-card-name">{player.name}</h3>

      {/* Team Badge */}
      {team && (
        <div 
          className="bbdl-player-card-team-badge"
          title={team.name}
        >
          <TeamIcon iconId={team.icon} color="#64748b" size={16} />
          <span className="team-badge-text">{team.name}</span>
        </div>
      )}

      {/* Stats Row */}
      <div className="bbdl-player-card-stats">
        <div className="bbdl-player-card-stat-box">
          <span className="stat-label">Record</span>
          <span className="stat-value">
            {record ? `${record.wins}–${record.losses}` : '0–0'}
          </span>
        </div>
        <div className="bbdl-player-card-stat-box">
          <span className="stat-label">Avg Pts</span>
          <span className="stat-value">
            {avgPoints !== undefined ? avgPoints.toFixed(1) : '0.0'}
          </span>
        </div>
      </div>

      {/* Bio Snippet */}
      {player.bio && (
        <p className="bbdl-player-card-bio">{player.bio}</p>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
