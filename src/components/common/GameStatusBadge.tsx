import React from 'react';
import { Radio, Clock, Trophy, X } from 'lucide-react';
import { GameStatus } from '../../core/types';

interface GameStatusBadgeProps {
  status: GameStatus;
  gameDate?: Date;
  className?: string;
}

const GameStatusBadge: React.FC<GameStatusBadgeProps> = ({ status, gameDate, className = '' }) => {
  // Check if game is "live" - either in_progress OR scheduled for today
  const isLive = status === 'in_progress' || 
    (status === 'scheduled' && gameDate && isGameToday(gameDate));

  if (isLive && status === 'scheduled') {
    // Game scheduled for today - show "LIVE" badge
    return (
      <span className={`game-status-badge badge-live ${className}`}>
        <Radio size={12} />
        <span>LIVE</span>
      </span>
    );
  }

  const getStatusInfo = () => {
    switch (status) {
      case 'in_progress':
        return {
          icon: Radio,
          label: 'LIVE',
          className: 'badge-live'
        };
      case 'scheduled':
        return {
          icon: Clock,
          label: 'Scheduled',
          className: 'badge-scheduled'
        };
      case 'completed':
        return {
          icon: Trophy,
          label: 'Final',
          className: 'badge-completed'
        };
      case 'canceled':
        return {
          icon: X,
          label: 'Canceled',
          className: 'badge-canceled'
        };
      default:
        return {
          icon: Clock,
          label: 'Scheduled',
          className: 'badge-scheduled'
        };
    }
  };

  const statusInfo = getStatusInfo();
  const Icon = statusInfo.icon;

  return (
    <span className={`game-status-badge ${statusInfo.className} ${className}`}>
      <Icon size={12} />
      <span>{statusInfo.label}</span>
    </span>
  );
};

// Helper function to check if a game date is today
const isGameToday = (date: Date): boolean => {
  const today = new Date();
  const gameDate = new Date(date);
  
  return (
    today.getFullYear() === gameDate.getFullYear() &&
    today.getMonth() === gameDate.getMonth() &&
    today.getDate() === gameDate.getDate()
  );
};

export default GameStatusBadge;

