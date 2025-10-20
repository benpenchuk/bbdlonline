import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Player, Team, Game } from '../../core/types';
import TeamIcon from '../common/TeamIcon';

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
            {player.photoUrl ? (
              <img src={player.photoUrl} alt={player.name} />
            ) : (
              <div className="bbdl-modal-initials">
                {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
          </div>
          <div className="bbdl-modal-header-info">
            <h2 id="player-modal-title" className="bbdl-modal-title">
              {player.name}
            </h2>
            {team && (
              <div 
                className="bbdl-modal-team-badge"
                title={team.name}
              >
                <TeamIcon iconId={team.icon} color="#64748b" size={18} />
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

        {/* Bio Section */}
        {player.bio && (
          <div className="bbdl-modal-bio">
            <h3>About</h3>
            <p>{player.bio}</p>
          </div>
        )}

        {/* Recent Games */}
        {recentGames.length > 0 && (
          <div className="bbdl-modal-recent-games">
            <h3>Recent Games</h3>
            <div className="bbdl-modal-games-list">
              {recentGames.slice(0, 5).map((game) => {
                const isTeam1 = game.team1Id === player.teamId;
                const opponent = teams.find(t => t.id === (isTeam1 ? game.team2Id : game.team1Id));
                const isWin = game.winnerId === player.teamId;
                const playerScore = isTeam1 ? game.team1Score : game.team2Score;
                const opponentScore = isTeam1 ? game.team2Score : game.team1Score;

                return (
                  <div key={game.id} className="bbdl-modal-game-item">
                    <div className="game-opponent">
                      vs {opponent?.name || 'Unknown'}
                    </div>
                    <div className={`game-result ${isWin ? 'win' : 'loss'}`}>
                      {isWin ? 'W' : 'L'}
                    </div>
                    <div className="game-score">
                      {playerScore ?? 0} – {opponentScore ?? 0}
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

