import React from 'react';
import { Trophy, Target, Calendar } from 'lucide-react';
import { HeadToHeadComparison as H2HType, Team } from '../../types';
import { format } from 'date-fns';

interface HeadToHeadComparisonProps {
  comparison: H2HType;
  teams: Team[];
}

const HeadToHeadComparison: React.FC<HeadToHeadComparisonProps> = ({
  comparison,
  teams
}) => {
  const team1 = teams.find(t => t.id === comparison.team1Id);
  const team2 = teams.find(t => t.id === comparison.team2Id);

  if (!team1 || !team2) return null;

  const team1WinPercentage = comparison.totalGames > 0 
    ? Math.round((comparison.team1Wins / comparison.totalGames) * 100)
    : 0;

  const team2WinPercentage = comparison.totalGames > 0 
    ? Math.round((comparison.team2Wins / comparison.totalGames) * 100)
    : 0;

  const getWinnerTeam = () => {
    if (comparison.team1Wins > comparison.team2Wins) return team1;
    if (comparison.team2Wins > comparison.team1Wins) return team2;
    return null;
  };

  const winnerTeam = getWinnerTeam();

  return (
    <div className="h2h-comparison">
      {comparison.totalGames === 0 ? (
        <div className="no-games">
          <Calendar size={32} />
          <p>These teams haven't played each other yet</p>
        </div>
      ) : (
        <>
          {/* Overall Record */}
          <div className="h2h-overview">
            <div className="team-comparison">
              <div className="team-side">
                <div className="team-header">
                  <div 
                    className="team-color-large"
                    style={{ backgroundColor: team1.color }}
                  />
                  <h3 className="team-name">{team1.name}</h3>
                </div>
                <div className="team-record">
                  <div className="wins-display">{comparison.team1Wins}</div>
                  <div className="wins-label">Wins</div>
                  <div className="win-percentage">{team1WinPercentage}%</div>
                </div>
              </div>

              <div className="vs-section">
                <div className="record-summary">
                  <div className="total-games">
                    {comparison.totalGames} Games
                  </div>
                  {winnerTeam && (
                    <div className="series-leader">
                      <Trophy size={16} />
                      <span>{winnerTeam.name} leads</span>
                    </div>
                  )}
                  {!winnerTeam && comparison.totalGames > 0 && (
                    <div className="series-tied">
                      <Trophy size={16} />
                      <span>Series tied</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="team-side">
                <div className="team-header">
                  <div 
                    className="team-color-large"
                    style={{ backgroundColor: team2.color }}
                  />
                  <h3 className="team-name">{team2.name}</h3>
                </div>
                <div className="team-record">
                  <div className="wins-display">{comparison.team2Wins}</div>
                  <div className="wins-label">Wins</div>
                  <div className="win-percentage">{team2WinPercentage}%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="h2h-stats">
            <div className="stat-item">
              <Target size={16} />
              <span className="stat-label">Avg Score Difference</span>
              <span className="stat-value">{comparison.averageScoreDifference.toFixed(1)} pts</span>
            </div>
          </div>

          {/* Last Game */}
          {comparison.lastGame && (
            <div className="last-game">
              <h4>Most Recent Game</h4>
              <div className="game-summary">
                <div className="game-date">
                  <Calendar size={14} />
                  <span>
                    {format(
                      comparison.lastGame.completedDate || comparison.lastGame.scheduledDate,
                      'MMM d, yyyy'
                    )}
                  </span>
                </div>
                
                <div className="game-score">
                  <span className={comparison.lastGame.winnerId === team1.id ? 'winner-score' : ''}>
                    {comparison.lastGame.team1Id === team1.id 
                      ? comparison.lastGame.team1Score 
                      : comparison.lastGame.team2Score}
                  </span>
                  <span className="score-separator">-</span>
                  <span className={comparison.lastGame.winnerId === team2.id ? 'winner-score' : ''}>
                    {comparison.lastGame.team1Id === team2.id 
                      ? comparison.lastGame.team1Score 
                      : comparison.lastGame.team2Score}
                  </span>
                </div>

                <div className="game-winner">
                  <Trophy size={14} />
                  <span>
                    {teams.find(t => t.id === comparison.lastGame?.winnerId)?.name} won
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default HeadToHeadComparison;
