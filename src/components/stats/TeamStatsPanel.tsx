import React from 'react';
import { Trophy, Target, Users, Zap, Award, TrendingUp } from 'lucide-react';
import { Team, Game, Player } from '../../types';
import { calculateTeamStats } from '../../utils/statsCalculations';

interface TeamStatsPanelProps {
  teamId: string;
  teams: Team[];
  games: Game[];
  players: Player[];
}

const TeamStatsPanel: React.FC<TeamStatsPanelProps> = ({
  teamId,
  teams,
  games,
  players
}) => {
  const team = teams.find(t => t.id === teamId);
  
  if (!team) return null;

  const teamStats = calculateTeamStats(team, games, teams);
  const teamPlayers = players.filter(p => p.teamId === teamId);
  
  const winPercentage = teamStats.record.wins + teamStats.record.losses > 0
    ? Math.round((teamStats.record.wins / (teamStats.record.wins + teamStats.record.losses)) * 100)
    : 0;

  return (
    <div className="team-stats-panel">
      <div className="team-header">
        <div className="team-identity">
          <div 
            className="team-color-large"
            style={{ backgroundColor: team.color }}
          />
          <div className="team-info">
            <h3 className="team-name">{team.name}</h3>
            <div className="team-record">
              {teamStats.record.wins}W - {teamStats.record.losses}L ({winPercentage}%)
            </div>
          </div>
        </div>
      </div>

      <div className="team-stats-grid">
        <div className="stat-group">
          <h4 className="stat-group-title">Overall Performance</h4>
          <div className="stats-row">
            <div className="stat-item">
              <Trophy size={16} />
              <span className="stat-label">Wins</span>
              <span className="stat-value">{teamStats.record.wins}</span>
            </div>
            
            <div className="stat-item">
              <Target size={16} />
              <span className="stat-label">Avg Points</span>
              <span className="stat-value">{teamStats.averagePoints.toFixed(1)}</span>
            </div>
            
            <div className="stat-item">
              <Users size={16} />
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{teamStats.record.wins + teamStats.record.losses}</span>
            </div>
            
            <div className="stat-item">
              <TrendingUp size={16} />
              <span className="stat-label">Total Points</span>
              <span className="stat-value">{teamStats.totalPoints}</span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <h4 className="stat-group-title">Special Achievements</h4>
          <div className="stats-row">
            <div className="stat-item">
              <Award size={16} />
              <span className="stat-label">Shutouts</span>
              <span className="stat-value">{teamStats.shutouts}</span>
            </div>
            
            <div className="stat-item">
              <Zap size={16} />
              <span className="stat-label">Blowout Wins</span>
              <span className="stat-value">{teamStats.blowoutWins}</span>
            </div>
            
            <div className="stat-item">
              <Users size={16} />
              <span className="stat-label">Clutch Wins</span>
              <span className="stat-value">{teamStats.clutchWins}</span>
            </div>
            
            <div className="stat-item">
              <Trophy size={16} />
              <span className="stat-label">Win Streak</span>
              <span className="stat-value">{teamStats.longestWinStreak}</span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <h4 className="stat-group-title">Head-to-Head Records</h4>
          <div className="h2h-records">
            {Object.entries(teamStats.vsTeamRecords).map(([opponentId, record]) => {
              const opponent = teams.find(t => t.id === opponentId);
              if (!opponent) return null;
              
              const totalGames = record.wins + record.losses;
              if (totalGames === 0) return null;

              return (
                <div key={opponentId} className="h2h-record">
                  <div className="opponent-info">
                    <div 
                      className="team-color-dot"
                      style={{ backgroundColor: opponent.color }}
                    />
                    <span className="opponent-name">{opponent.name}</span>
                  </div>
                  <div className="record-stats">
                    <span className="record-text">
                      {record.wins}-{record.losses}
                    </span>
                    {totalGames > 0 && (
                      <span className="record-percentage">
                        ({Math.round((record.wins / totalGames) * 100)}%)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="stat-group">
          <h4 className="stat-group-title">Team Roster</h4>
          <div className="team-roster">
            {teamPlayers.map(player => (
              <div key={player.id} className="roster-player">
                <div className="player-avatar-small">
                  {player.photoUrl ? (
                    <img src={player.photoUrl} alt={player.name} />
                  ) : (
                    <div className="player-initials-small">
                      {player.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="player-info">
                  <span className="player-name">{player.name}</span>
                  <span className="player-stats">
                    {player.stats.wins}W - {player.stats.losses}L
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsPanel;
