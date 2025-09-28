import React from 'react';
import { Home, Shield, Target } from 'lucide-react';
import { Player, Team } from '../../core/types';

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
  return (
    <div 
      className={`player-card ${onClick ? 'player-card-clickable' : ''}`}
      onClick={onClick}
      tabIndex={onClick ? 0 : -1}
      onKeyPress={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          onClick(e);
        }
      }}
    >
      <div className="player-avatar">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.name} className="player-photo" />
        ) : (
          <div className="player-initials">
            {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
        )}
      </div>

      <div className="player-info">
        <h3 className="player-name">{player.name || '—'}</h3>
        
        <div className="player-meta">
          <div className="meta-item">
            <Home size={14} />
            <span>{player.bio || '—'}</span>
          </div>
          {team && (
            <div className="meta-item player-team-badge">
              <div 
                className="team-color-dot" 
                style={{ backgroundColor: team.color }}
              />
              <span>{team.name || '—'}</span>
            </div>
          )}
        </div>
        
        <div className="player-stats-compact">
          <div className="stat-item-compact">
            <Shield size={14} />
            <span className="stat-label">Record</span>
            <span className="stat-value">{record ? `${record.wins}–${record.losses}` : '—'}</span>
          </div>
          <div className="stat-item-compact">
            <Target size={14} />
            <span className="stat-label">Avg Pts</span>
            <span className="stat-value">{avgPoints?.toFixed(1) ?? '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default PlayerCard;
