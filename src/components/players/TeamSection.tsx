import React from 'react';
import { Users, Trophy, Target } from 'lucide-react';
import { Team, Player } from '../../types';
import PlayerCard from '../common/PlayerCard';

interface TeamSectionProps {
  team: Team;
  players: Player[];
}

const TeamSection: React.FC<TeamSectionProps> = ({ team, players }) => {
  const teamStats = {
    totalWins: players.reduce((sum, player) => sum + player.stats.wins, 0),
    totalGames: players.reduce((sum, player) => sum + player.stats.gamesPlayed, 0),
    averagePoints: players.length > 0 
      ? players.reduce((sum, player) => sum + player.stats.averagePoints, 0) / players.length
      : 0
  };

  return (
    <div className="team-section">
      <div className="team-header">
        <div className="team-info">
          <div className="team-identity">
            <div 
              className="team-color-large"
              style={{ backgroundColor: team.color }}
            />
            <div className="team-details">
              <h2 className="team-name">{team.name}</h2>
              <div className="team-record">
                {team.wins}W - {team.losses}L
              </div>
            </div>
          </div>
          
          <div className="team-stats">
            <div className="team-stat">
              <Users size={16} />
              <span className="stat-value">{players.length}</span>
              <span className="stat-label">Players</span>
            </div>
            
            <div className="team-stat">
              <Trophy size={16} />
              <span className="stat-value">{teamStats.totalWins}</span>
              <span className="stat-label">Total Wins</span>
            </div>
            
            <div className="team-stat">
              <Target size={16} />
              <span className="stat-value">{teamStats.averagePoints.toFixed(1)}</span>
              <span className="stat-label">Avg Points</span>
            </div>
          </div>
        </div>
      </div>

      <div className="team-players">
        {players.length > 0 ? (
          <div className="players-grid">
            {players.map(player => (
              <PlayerCard
                key={player.id}
                player={player}
                team={team}
              />
            ))}
          </div>
        ) : (
          <div className="empty-team">
            <Users size={32} />
            <p>No players in this team</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TeamSection;
