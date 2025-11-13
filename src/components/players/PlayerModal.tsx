import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Player, Team, Game } from '../../core/types';
import TeamIcon from '../common/TeamIcon';
import { getPlayerFullName, getPlayerInitials } from '../../core/utils/playerHelpers';
import { getWinnerId } from '../../core/utils/gameHelpers';

interface PlayerModalProps {
  player: Player;
  team?: Team;
  isOpen: boolean;
  onClose: () => void;
  stats?: {
    record: { wins: number; losses: number };
    avgPoints: number;
    gamesPlayed: number;
  };
  recentGames?: Game[];
  teams?: Team[];
}

const PlayerModal: React.FC<PlayerModalProps> = ({ 
  player, 
  team, 
  isOpen, 
  onClose,
  stats,
  recentGames = [],
  teams = []
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap
  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  // ESC key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const fullName = getPlayerFullName(player);
  const initials = getPlayerInitials(player);

  const modalContent = (
    <div 
      className={`bbdl-modal-backdrop ${isOpen ? 'open' : ''}`}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="player-modal-title"
    >
      <div 
        className="bbdl-modal-content"
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          ref={closeButtonRef}
          className="bbdl-modal-close"
          onClick={onClose}
          aria-label="Close player details"
        >
          <X size={24} />
        </button>

        {/* Header with Avatar and Name */}
        <div className="bbdl-modal-header">
          <div className="bbdl-modal-avatar">
            {player.avatarUrl ? (
              <img src={player.avatarUrl} alt={fullName} />
            ) : (
              <div className="bbdl-modal-initials">
                {initials}
              </div>
            )}
          </div>
          <div className="bbdl-modal-header-info">
            <h2 id="player-modal-title" className="bbdl-modal-title">
              {fullName}
            </h2>
            {team && (
              <div 
                className="bbdl-modal-team-badge"
                title={team.name}
              >
                <TeamIcon iconId={team.abbreviation} color="#64748b" size={18} />
                <span className="team-badge-text">{team.name}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Section */}
        <div className="bbdl-modal-stats">
          <div className="bbdl-modal-stat-box">
            <span className="stat-label">Record</span>
            <span className="stat-value">
              {stats ? `${stats.record.wins}–${stats.record.losses}` : '0–0'}
            </span>
          </div>
          <div className="bbdl-modal-stat-box">
            <span className="stat-label">Avg Points</span>
            <span className="stat-value">
              {stats ? stats.avgPoints.toFixed(1) : '0.0'}
            </span>
          </div>
          <div className="bbdl-modal-stat-box">
            <span className="stat-label">Games</span>
            <span className="stat-value">
              {stats ? stats.gamesPlayed : 0}
            </span>
          </div>
        </div>

        {/* Bio Section - Use hometown instead */}
        {(player.hometownCity || player.hometownState) && (
          <div className="bbdl-modal-bio">
            <h3>Hometown</h3>
            <p>{player.hometownCity}{player.hometownCity && player.hometownState ? ', ' : ''}{player.hometownState}</p>
          </div>
        )}

        {/* Recent Games */}
        {recentGames.length > 0 && team && (
          <div className="bbdl-modal-recent-games">
            <h3>Recent Games</h3>
            <div className="bbdl-modal-games-list">
              {recentGames.slice(0, 5).map((game) => {
                const isHome = game.homeTeamId === team.id;
                const isAway = game.awayTeamId === team.id;
                
                if (!isHome && !isAway) return null;
                
                const opponentId = isHome ? game.awayTeamId : game.homeTeamId;
                const opponent = teams.find(t => t.id === opponentId);
                const winnerId = getWinnerId(game);
                const isWin = winnerId === team.id;
                const playerScore = isHome ? game.homeScore : game.awayScore;
                const opponentScore = isHome ? game.awayScore : game.homeScore;

                return (
                  <div key={game.id} className="bbdl-modal-game-item">
                    <div className="game-opponent">
                      vs {opponent?.name || 'Unknown'}
                    </div>
                    <div className={`game-result ${isWin ? 'win' : 'loss'}`}>
                      {isWin ? 'W' : 'L'}
                    </div>
                    <div className="game-score">
                      {playerScore} – {opponentScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PlayerModal;
