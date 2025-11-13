import React from 'react';
import { Playoff, Team } from '../../core/types';

interface PlayoffCardProps {
  playoff: Playoff;
  teams: Team[];
  onClick: () => void;
}

// Playoff system is being rebuilt for new schema
const PlayoffCard: React.FC<PlayoffCardProps> = ({ playoff, teams, onClick }) => {
  return (
    <div className="playoff-card" onClick={onClick}>
      <div className="playoff-card-header">
        <h3>{playoff.name}</h3>
        <span className="playoff-status">{playoff.status}</span>
      </div>
      <p className="playoff-rebuild-notice">
        Playoff details will be available once the system is rebuilt.
      </p>
    </div>
  );
};

export default PlayoffCard;
