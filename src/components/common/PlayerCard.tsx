import React from 'react';
import { Trophy, Target, Zap, Award } from 'lucide-react';
import { Player, Team } from '../../types';

interface PlayerCardProps {
  player: Player;
  team?: Team;
  rank?: number;
  compact?: boolean;
  onClick?: () => void;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ 
  player, 
  team, 
  rank, 
  compact = false, 
  onClick 
}) => {
  const winPercentage = player.stats.gamesPlayed > 0 
    ? Math.round((player.stats.wins / player.stats.gamesPlayed) * 100)
    : 0;

  return (
    <div 
      className={`player-card ${compact ? 'player-card-compact' : ''} ${onClick ? 'player-card-clickable' : ''}`}
      onClick={onClick}
    >
      {rank && (
        <div className="player-rank">
          <span className="rank-number">#{rank}</span>
        </div>
      )}

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
        <h3 className="player-name">{player.name}</h3>
        {team && (
          <div className="player-team">
            <div 
              className="team-color-dot" 
              style={{ backgroundColor: team.color }}
            />
            <span>{team.name}</span>
          </div>
        )}
        
        {!compact && player.bio && (
          <p className="player-bio">{player.bio}</p>
        )}
      </div>

      <div className="player-stats">
        <div className="stat-item">
          <Trophy size={16} />
          <span className="stat-value">{player.stats.wins}</span>
          <span className="stat-label">Wins</span>
        </div>

        <div className="stat-item">
          <Target size={16} />
          <span className="stat-value">{player.stats.averagePoints.toFixed(1)}</span>
          <span className="stat-label">Avg</span>
        </div>

        {!compact && (
          <>
            <div className="stat-item">
              <Zap size={16} />
              <span className="stat-value">{winPercentage}%</span>
              <span className="stat-label">Win %</span>
            </div>

            <div className="stat-item">
              <Award size={16} />
              <span className="stat-value">{player.stats.longestWinStreak}</span>
              <span className="stat-label">Streak</span>
            </div>
          </>
        )}
      </div>

      {!compact && (player.stats.shutouts > 0 || player.stats.clutchWins > 0 || player.stats.blowoutWins > 0) && (
        <div className="player-badges">
          {player.stats.shutouts > 0 && (
            <span className="badge badge-shutout" title="Shutouts">
              🥅 {player.stats.shutouts}
            </span>
          )}
          {player.stats.clutchWins > 0 && (
            <span className="badge badge-clutch" title="Clutch Wins">
              🎯 {player.stats.clutchWins}
            </span>
          )}
          {player.stats.blowoutWins > 0 && (
            <span className="badge badge-blowout" title="Blowout Wins">
              💥 {player.stats.blowoutWins}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default PlayerCard;
