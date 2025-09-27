import React from 'react';
import { Trophy, Users, Calendar, Play } from 'lucide-react';
import { Tournament, Team } from '../../types';
import { format } from 'date-fns';
import { isTournamentComplete, getTournamentWinner } from '../../utils/tournamentUtils';

interface TournamentCardProps {
  tournament: Tournament;
  teams: Team[];
  onClick: () => void;
}

const TournamentCard: React.FC<TournamentCardProps> = ({ tournament, teams, onClick }) => {
  const isComplete = isTournamentComplete(tournament.bracket);
  const winnerId = getTournamentWinner(tournament.bracket);
  const winnerTeam = winnerId ? teams.find(t => t.id === winnerId) : null;
  
  const participatingTeams = teams.filter(team => tournament.teams.includes(team.id));

  return (
    <div className="tournament-card" onClick={onClick}>
      <div className="tournament-card-header">
        <div className="tournament-title">
          <h3>{tournament.name}</h3>
          <div className={`tournament-status status-${tournament.status}`}>
            {tournament.status.charAt(0).toUpperCase() + tournament.status.slice(1)}
          </div>
        </div>
        
        <div className="tournament-type">
          {tournament.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </div>
      </div>

      <div className="tournament-info">
        <div className="info-item">
          <Users size={16} />
          <span>{tournament.teams.length} Teams</span>
        </div>
        
        <div className="info-item">
          <Calendar size={16} />
          <span>{format(tournament.createdDate, 'MMM d, yyyy')}</span>
        </div>
      </div>

      {/* Teams Preview */}
      <div className="tournament-teams">
        <div className="teams-list">
          {participatingTeams.slice(0, 4).map(team => (
            <div key={team.id} className="team-item">
              <div 
                className="team-color-dot"
                style={{ backgroundColor: team.color }}
              />
              <span className="team-name">{team.name}</span>
            </div>
          ))}
          {participatingTeams.length > 4 && (
            <div className="more-teams">
              +{participatingTeams.length - 4} more
            </div>
          )}
        </div>
      </div>

      {/* Tournament Result */}
      {isComplete && winnerTeam ? (
        <div className="tournament-winner">
          <Trophy size={16} />
          <span className="winner-text">Winner: {winnerTeam.name}</span>
        </div>
      ) : (
        <div className="tournament-action">
          <Play size={16} />
          <span>
            {tournament.status === 'setup' ? 'Ready to Start' : 'In Progress'}
          </span>
        </div>
      )}

      <div className="tournament-card-footer">
        <button className="btn btn-outline btn-small">
          View Bracket
        </button>
      </div>
    </div>
  );
};

export default TournamentCard;
