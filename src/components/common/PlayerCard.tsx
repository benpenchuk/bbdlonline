import React from 'react';
import { Player, Team } from '../../core/types';
import ProfilePicture from './ProfilePicture';

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
  const fullName = `${player.firstName} ${player.lastName}`;
  const initials = `${player.firstName[0]}${player.lastName[0]}`.toUpperCase();

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
      aria-label={onClick ? `View details for ${fullName}` : undefined}
    >
      {/* Avatar */}
      <div className="bbdl-player-card-avatar">
        <ProfilePicture
          imageUrl={player.avatarUrl}
          fallbackImage="player"
          alt={fullName}
          size={80}
        />
      </div>

      {/* Name */}
      <h3 className="bbdl-player-card-name">{fullName}</h3>
      {player.nickname && <p className="bbdl-player-card-nickname">"{player.nickname}"</p>}

      {/* Team Badge */}
      {team && (
        <div 
          className="bbdl-player-card-team-badge"
          title={team.name}
        >
          <ProfilePicture
            imageUrl={team.logoUrl}
            fallbackImage="team"
            alt={team.name}
            size={20}
          />
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

      {/* Hometown */}
      {(player.hometownCity || player.hometownState) && (
        <p className="bbdl-player-card-hometown">
          {player.hometownCity}, {player.hometownState}
        </p>
      )}
    </div>
  );
});

PlayerCard.displayName = 'PlayerCard';

export default PlayerCard;
