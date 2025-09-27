import React from 'react';
import { Trophy, Calendar, Users, Eye } from 'lucide-react';
import { Tournament, Team } from '../../types';
import { format } from 'date-fns';

interface TournamentHistoryProps {
  tournaments: Tournament[];
  teams: Team[];
  onViewTournament: (tournament: Tournament) => void;
}

const TournamentHistory: React.FC<TournamentHistoryProps> = ({
  tournaments,
  teams,
  onViewTournament
}) => {
  const getWinnerTeam = (tournament: Tournament) => {
    return teams.find(t => t.id === tournament.winnerId);
  };

  const getParticipatingTeams = (tournament: Tournament) => {
    return teams.filter(t => tournament.teams.includes(t.id));
  };

  if (tournaments.length === 0) {
    return (
      <div className="empty-state">
        <Trophy size={48} />
        <h3>No completed tournaments</h3>
        <p>Tournament history will appear here once tournaments are completed</p>
      </div>
    );
  }

  return (
    <div className="tournament-history">
      <div className="history-list">
        {tournaments.map(tournament => {
          const winner = getWinnerTeam(tournament);
          const participants = getParticipatingTeams(tournament);
          
          return (
            <div key={tournament.id} className="history-item">
              <div className="tournament-summary">
                <div className="tournament-basic-info">
                  <h3 className="tournament-name">{tournament.name}</h3>
                  <div className="tournament-meta">
                    <div className="meta-item">
                      <Calendar size={14} />
                      <span>
                        {format(tournament.createdDate, 'MMM d, yyyy')}
                        {tournament.completedDate && (
                          <> - {format(tournament.completedDate, 'MMM d, yyyy')}</>
                        )}
                      </span>
                    </div>
                    
                    <div className="meta-item">
                      <Users size={14} />
                      <span>{tournament.teams.length} teams</span>
                    </div>
                    
                    <div className="meta-item tournament-type">
                      {tournament.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                  </div>
                </div>

                {winner && (
                  <div className="tournament-winner-info">
                    <div className="winner-badge">
                      <Trophy size={16} />
                      <span>Champion</span>
                    </div>
                    <div className="winner-team">
                      <div 
                        className="team-color-dot"
                        style={{ backgroundColor: winner.color }}
                      />
                      <span className="winner-name">{winner.name}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="tournament-participants">
                <div className="participants-label">Participants:</div>
                <div className="participants-list">
                  {participants.slice(0, 6).map(team => (
                    <div key={team.id} className="participant-team">
                      <div 
                        className="team-color-dot"
                        style={{ backgroundColor: team.color }}
                      />
                      <span>{team.name}</span>
                    </div>
                  ))}
                  {participants.length > 6 && (
                    <div className="more-participants">
                      +{participants.length - 6} more
                    </div>
                  )}
                </div>
              </div>

              <div className="tournament-actions">
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => onViewTournament(tournament)}
                >
                  <Eye size={14} />
                  View Bracket
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TournamentHistory;
