import React from 'react';
import { Trophy, Target, Users, Zap, Award, TrendingUp } from 'lucide-react';
import { Team, Game, Player, PlayerTeam } from '../../core/types';
import { calculateTeamStatsForGames } from '../../core/utils/statsCalculations';
import { getPlayerFullName, getPlayerInitials, getTeamPlayers } from '../../core/utils/playerHelpers';
import { getGameTags } from '../../core/utils/gameHelpers';
import TeamIcon from '../common/TeamIcon';

interface TeamStatsPanelProps {
  teamId: string;
  teams: Team[];
  games: Game[];
  players: Player[];
  playerTeams: PlayerTeam[];
  seasonId?: string;
}

const TeamStatsPanel: React.FC<TeamStatsPanelProps> = ({
  teamId,
  teams,
  games,
  players,
  playerTeams,
  seasonId
}) => {
  const team = teams.find(t => t.id === teamId);
  
  if (!team) return null;

  // Calculate team stats using the new function
  const teamStats = calculateTeamStatsForGames(teamId, games);
  const teamPlayers = getTeamPlayers(teamId, players, playerTeams, seasonId);
  
  const winPercentage = teamStats.gamesPlayed > 0
    ? Math.round((teamStats.wins / teamStats.gamesPlayed) * 100)
    : 0;

  // Calculate additional stats manually
  const teamGames = games.filter(g => 
    (g.homeTeamId === teamId || g.awayTeamId === teamId) && 
    g.status === 'completed'
  );

  let shutouts = 0;
  let blowoutWins = 0;
  let clutchWins = 0;

  teamGames.forEach(game => {
    const tags = getGameTags(game);
    const isWinner = game.winningTeamId === teamId;
    
    if (tags.isShutout && isWinner) shutouts++;
    if (tags.isBlowout && isWinner) blowoutWins++;
    if (tags.isClutch && isWinner) clutchWins++;
  });

  // Calculate head-to-head records
  const h2hRecords: Record<string, { wins: number; losses: number }> = {};
  teamGames.forEach(game => {
    const opponentId = game.homeTeamId === teamId ? game.awayTeamId : game.homeTeamId;
    if (!h2hRecords[opponentId]) {
      h2hRecords[opponentId] = { wins: 0, losses: 0 };
    }
    if (game.winningTeamId === teamId) {
      h2hRecords[opponentId].wins++;
    } else {
      h2hRecords[opponentId].losses++;
    }
  });

  return (
    <div className="team-stats-panel">
      <div className="team-header">
        <div className="team-identity">
          <TeamIcon iconId={team.abbreviation} color="#3b82f6" size={32} />
          <div className="team-info">
            <h3 className="team-name">{team.name}</h3>
            <div className="team-record">
              {teamStats.wins}W - {teamStats.losses}L ({winPercentage}%)
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
              <span className="stat-value">{teamStats.wins}</span>
            </div>
            
            <div className="stat-item">
              <Target size={16} />
              <span className="stat-label">Avg Points</span>
              <span className="stat-value">
                {teamStats.gamesPlayed > 0 
                  ? (teamStats.pointsFor / teamStats.gamesPlayed).toFixed(1)
                  : '0.0'}
              </span>
            </div>
            
            <div className="stat-item">
              <Users size={16} />
              <span className="stat-label">Games Played</span>
              <span className="stat-value">{teamStats.gamesPlayed}</span>
            </div>
            
            <div className="stat-item">
              <TrendingUp size={16} />
              <span className="stat-label">Total Points</span>
              <span className="stat-value">{teamStats.pointsFor}</span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <h4 className="stat-group-title">Special Achievements</h4>
          <div className="stats-row">
            <div className="stat-item">
              <Award size={16} />
              <span className="stat-label">Shutouts</span>
              <span className="stat-value">{shutouts}</span>
            </div>
            
            <div className="stat-item">
              <Zap size={16} />
              <span className="stat-label">Blowout Wins</span>
              <span className="stat-value">{blowoutWins}</span>
            </div>
            
            <div className="stat-item">
              <Users size={16} />
              <span className="stat-label">Clutch Wins</span>
              <span className="stat-value">{clutchWins}</span>
            </div>
            
            <div className="stat-item">
              <Trophy size={16} />
              <span className="stat-label">Point Diff</span>
              <span className="stat-value">
                {teamStats.pointsFor - teamStats.pointsAgainst > 0 ? '+' : ''}
                {teamStats.pointsFor - teamStats.pointsAgainst}
              </span>
            </div>
          </div>
        </div>

        <div className="stat-group">
          <h4 className="stat-group-title">Head-to-Head Records</h4>
          <div className="h2h-records">
            {Object.entries(h2hRecords).map(([opponentId, record]) => {
              const opponent = teams.find(t => t.id === opponentId);
              if (!opponent) return null;
              
              const totalGames = record.wins + record.losses;
              if (totalGames === 0) return null;

              return (
                <div key={opponentId} className="h2h-record">
                  <div className="opponent-info">
                    <TeamIcon iconId={opponent.abbreviation} color="#64748b" size={16} />
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
            {teamPlayers.map(player => {
              // Calculate player stats from games
              const playerGames = games.filter(g => 
                (g.homeTeamId === teamId || g.awayTeamId === teamId) && 
                g.status === 'completed'
              );
              const wins = playerGames.filter(g => g.winningTeamId === teamId).length;
              const losses = playerGames.length - wins;

              return (
                <div key={player.id} className="roster-player">
                  <div className="player-avatar-small">
                    {player.avatarUrl ? (
                      <img src={player.avatarUrl} alt={getPlayerFullName(player)} />
                    ) : (
                      <div className="player-initials-small">
                        {getPlayerInitials(player)}
                      </div>
                    )}
                  </div>
                  <div className="player-info">
                    <span className="player-name">{getPlayerFullName(player)}</span>
                    <span className="player-stats">
                      {wins}W - {losses}L
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamStatsPanel;
