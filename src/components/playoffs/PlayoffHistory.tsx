import React from 'react';
import { Playoff, Team } from '../../core/types';
import { Construction } from 'lucide-react';

interface PlayoffHistoryProps {
  playoffs: Playoff[];
  teams: Team[];
  onSelectPlayoff: (playoff: Playoff) => void;
}

// Playoff history is being rebuilt for new schema
const PlayoffHistory: React.FC<PlayoffHistoryProps> = ({ playoffs }) => {
  return (
    <div className="playoff-history">
      <div className="playoff-rebuild-notice">
        <Construction size={32} />
        <p>Playoff history will be available once the playoff system is rebuilt for the new schema.</p>
      </div>
    </div>
  );
};

export default PlayoffHistory;
