import React from 'react';
import { Playoff, Team } from '../../core/types';
import { Construction } from 'lucide-react';

interface PlayoffBracketProps {
  playoff: Playoff;
  teams: Team[];
  onAdvanceWinner?: (matchId: string, winnerId: string, team1Score: number, team2Score: number) => void;
}

// Playoff bracket is being rebuilt for new schema
const PlayoffBracket: React.FC<PlayoffBracketProps> = ({ playoff }) => {
  return (
    <div className="playoff-bracket">
      <div className="playoff-rebuild-notice" style={{ textAlign: 'center', padding: '3rem' }}>
        <Construction size={48} style={{ margin: '0 auto 1rem', display: 'block', color: '#f59e0b' }} />
        <h3>{playoff.name}</h3>
        <p>Playoff brackets will be available once the playoff system is rebuilt for the new schema.</p>
      </div>
    </div>
  );
};

export default PlayoffBracket;
