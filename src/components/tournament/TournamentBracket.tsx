import React, { useState } from 'react';
import { Trophy, Edit3, Save, X } from 'lucide-react';
import { Tournament, Team, TournamentMatch } from '../../core/types';
import { getBracketStructure, advanceWinner, getRoundName } from '../../core/utils/tournamentUtils';

interface TournamentBracketProps {
  tournament: Tournament;
  teams: Team[];
  onUpdateTournament: (tournament: Tournament) => void;
}

interface MatchEditState {
  matchId: string;
  team1Score: string;
  team2Score: string;
}

const TournamentBracket: React.FC<TournamentBracketProps> = ({
  tournament,
  teams,
  onUpdateTournament
}) => {
  const [editingMatch, setEditingMatch] = useState<MatchEditState | null>(null);
  
  const bracketStructure = getBracketStructure(tournament.bracket);
  const totalRounds = Math.max(...tournament.bracket.map(m => m.round));

  const getTeamName = (teamId?: string) => {
    if (!teamId) return 'TBD';
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const getTeamColor = (teamId?: string) => {
    if (!teamId) return '#6B7280';
    return teams.find(t => t.id === teamId)?.color || '#6B7280';
  };

  const handleEditMatch = (match: TournamentMatch) => {
    if (match.status === 'completed' || (!match.team1Id || !match.team2Id)) return;
    
    setEditingMatch({
      matchId: match.id,
      team1Score: match.team1Score?.toString() || '',
      team2Score: match.team2Score?.toString() || ''
    });
  };

  const handleSaveMatch = () => {
    if (!editingMatch) return;
    
    const team1Score = parseInt(editingMatch.team1Score);
    const team2Score = parseInt(editingMatch.team2Score);
    
    if (isNaN(team1Score) || isNaN(team2Score) || team1Score < 0 || team2Score < 0) {
      return; // Invalid scores
    }

    const match = tournament.bracket.find(m => m.id === editingMatch.matchId);
    if (!match || !match.team1Id || !match.team2Id) return;

    const winnerId = team1Score > team2Score ? match.team1Id : match.team2Id;
    const updatedBracket = advanceWinner(tournament.bracket, match.id, winnerId, team1Score, team2Score);
    
    const updatedTournament = {
      ...tournament,
      bracket: updatedBracket,
      status: 'in-progress' as const
    };

    onUpdateTournament(updatedTournament);
    setEditingMatch(null);
  };

  const handleCancelEdit = () => {
    setEditingMatch(null);
  };

  const renderMatch = (match: TournamentMatch) => {
    const isEditing = editingMatch?.matchId === match.id;
    const canEdit = match.team1Id && match.team2Id && match.status === 'pending';
    
    return (
      <div key={match.id} className={`bracket-match ${match.status}`}>
        <div className="match-header">
          <span className="match-position">Match {match.position}</span>
          {canEdit && !isEditing && (
            <button 
              className="edit-match-btn"
              onClick={() => handleEditMatch(match)}
            >
              <Edit3 size={14} />
            </button>
          )}
        </div>

        <div className="match-teams">
          <div className={`match-team ${match.winnerId === match.team1Id ? 'winner' : ''}`}>
            <div 
              className="team-color-indicator"
              style={{ backgroundColor: getTeamColor(match.team1Id) }}
            />
            <span className="team-name">{getTeamName(match.team1Id)}</span>
            
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editingMatch.team1Score}
                onChange={(e) => setEditingMatch({
                  ...editingMatch,
                  team1Score: e.target.value
                })}
                className="score-input"
                placeholder="0"
              />
            ) : match.status === 'completed' ? (
              <span className="team-score">{match.team1Score}</span>
            ) : (
              <span className="team-score">-</span>
            )}
          </div>

          <div className={`match-team ${match.winnerId === match.team2Id ? 'winner' : ''}`}>
            <div 
              className="team-color-indicator"
              style={{ backgroundColor: getTeamColor(match.team2Id) }}
            />
            <span className="team-name">{getTeamName(match.team2Id)}</span>
            
            {isEditing ? (
              <input
                type="number"
                min="0"
                value={editingMatch.team2Score}
                onChange={(e) => setEditingMatch({
                  ...editingMatch,
                  team2Score: e.target.value
                })}
                className="score-input"
                placeholder="0"
              />
            ) : match.status === 'completed' ? (
              <span className="team-score">{match.team2Score}</span>
            ) : (
              <span className="team-score">-</span>
            )}
          </div>
        </div>

        {isEditing && (
          <div className="match-edit-actions">
            <button 
              className="btn btn-small btn-primary"
              onClick={handleSaveMatch}
            >
              <Save size={12} />
              Save
            </button>
            <button 
              className="btn btn-small btn-outline"
              onClick={handleCancelEdit}
            >
              <X size={12} />
              Cancel
            </button>
          </div>
        )}

        {match.status === 'completed' && match.winnerId && (
          <div className="match-winner">
            <Trophy size={12} />
            <span>{getTeamName(match.winnerId)}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="tournament-bracket">
      <div className="bracket-container">
        {bracketStructure.map(round => (
          <div key={round.round} className="bracket-round">
            <div className="round-header">
              <h3 className="round-title">
                {getRoundName(round.round, totalRounds)}
              </h3>
              <span className="round-subtitle">Round {round.round}</span>
            </div>
            
            <div className="round-matches">
              {round.matches.map(match => renderMatch(match))}
            </div>
          </div>
        ))}
      </div>

      {/* Tournament Instructions */}
      <div className="bracket-instructions">
        <h4>How to Use the Bracket</h4>
        <ul>
          <li>Click the edit button on any pending match to enter scores</li>
          <li>Winners automatically advance to the next round</li>
          <li>The tournament completes when the final match is scored</li>
          <li>BYE matches are automatically advanced</li>
        </ul>
      </div>
    </div>
  );
};

export default TournamentBracket;
