import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Users, Calendar, Settings } from 'lucide-react';
import { tournamentsApi, teamsApi } from '../services/api';
import { Tournament, Team } from '../types';
import { createTournament, getBracketStructure, isTournamentComplete, getTournamentWinner } from '../utils/tournamentUtils';
import LoadingSpinner from '../components/common/LoadingSpinner';
import TournamentCard from '../components/tournament/TournamentCard';
import TournamentBracket from '../components/tournament/TournamentBracket';
import CreateTournamentModal from '../components/tournament/CreateTournamentModal';
import TournamentHistory from '../components/tournament/TournamentHistory';

const TournamentPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'current' | 'history'>('current');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [tournamentsRes, teamsRes] = await Promise.all([
          tournamentsApi.getAll(),
          teamsApi.getAll()
        ]);

        if (tournamentsRes.success) setTournaments(tournamentsRes.data);
        if (teamsRes.success) setTeams(teamsRes.data);
      } catch (error) {
        console.error('Failed to load tournament data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const handleCreateTournament = async (name: string, selectedTeams: Team[]) => {
    try {
      const newTournament = createTournament(name, selectedTeams);
      const response = await tournamentsApi.create(newTournament);
      
      if (response.success) {
        setTournaments([...tournaments, response.data]);
        setSelectedTournament(response.data);
        setShowCreateModal(false);
      }
    } catch (error) {
      console.error('Failed to create tournament:', error);
    }
  };

  const handleUpdateTournament = async (tournament: Tournament) => {
    try {
      const response = await tournamentsApi.update(tournament.id, tournament);
      if (response.success) {
        setTournaments(tournaments.map(t => t.id === tournament.id ? response.data : t));
        setSelectedTournament(response.data);
      }
    } catch (error) {
      console.error('Failed to update tournament:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading tournaments..." />;
  }

  const activeTournaments = tournaments.filter(t => t.status !== 'completed');
  const completedTournaments = tournaments.filter(t => t.status === 'completed');

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Tournaments</h1>
          <p>Create and manage tournament brackets</p>
        </div>
        
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            <Plus size={20} />
            Create Tournament
          </button>
        </div>
      </div>

      {/* Tournament Type Info */}
      <div className="tournament-types-info">
        <div className="type-card available">
          <Trophy size={20} />
          <div className="type-info">
            <h3>Single Elimination</h3>
            <p>Available - Classic knockout tournament format</p>
          </div>
        </div>
        
        <div className="type-card coming-soon">
          <Users size={20} />
          <div className="type-info">
            <h3>Double Elimination</h3>
            <p>Coming Soon - Second chance tournament format</p>
          </div>
        </div>
        
        <div className="type-card coming-soon">
          <Calendar size={20} />
          <div className="type-info">
            <h3>Round Robin</h3>
            <p>Coming Soon - Everyone plays everyone format</p>
          </div>
        </div>
      </div>

      {/* Tournament Tabs */}
      <div className="tournament-tabs">
        <button
          className={`tab-btn ${activeTab === 'current' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('current')}
        >
          <Settings size={16} />
          Current Tournaments ({activeTournaments.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'tab-btn-active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          <Trophy size={16} />
          Tournament History ({completedTournaments.length})
        </button>
      </div>

      {/* Tournament Content */}
      <div className="tournament-content">
        {activeTab === 'current' ? (
          <div className="current-tournaments">
            {activeTournaments.length === 0 ? (
              <div className="empty-state">
                <Trophy size={48} />
                <h3>No active tournaments</h3>
                <p>Create a new tournament to get started</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <Plus size={20} />
                  Create Tournament
                </button>
              </div>
            ) : selectedTournament ? (
              <div className="tournament-view">
                <div className="tournament-header">
                  <button 
                    className="btn btn-outline"
                    onClick={() => setSelectedTournament(null)}
                  >
                    ← Back to Tournaments
                  </button>
                  
                  <div className="tournament-info">
                    <h2>{selectedTournament.name}</h2>
                    <div className="tournament-meta">
                      <span className={`status-badge status-${selectedTournament.status}`}>
                        {selectedTournament.status.charAt(0).toUpperCase() + selectedTournament.status.slice(1)}
                      </span>
                      <span className="tournament-type">
                        {selectedTournament.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                      <span className="team-count">
                        {selectedTournament.teams.length} Teams
                      </span>
                    </div>
                  </div>
                  
                  {isTournamentComplete(selectedTournament.bracket) && (
                    <div className="tournament-winner">
                      <Trophy size={20} />
                      <span>Winner: {teams.find(t => t.id === getTournamentWinner(selectedTournament.bracket))?.name}</span>
                    </div>
                  )}
                </div>

                <TournamentBracket
                  tournament={selectedTournament}
                  teams={teams}
                  onUpdateTournament={handleUpdateTournament}
                />
              </div>
            ) : (
              <div className="tournaments-grid">
                {activeTournaments.map(tournament => (
                  <TournamentCard
                    key={tournament.id}
                    tournament={tournament}
                    teams={teams}
                    onClick={() => setSelectedTournament(tournament)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <TournamentHistory
            tournaments={completedTournaments}
            teams={teams}
            onViewTournament={setSelectedTournament}
          />
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <CreateTournamentModal
          teams={teams}
          onClose={() => setShowCreateModal(false)}
          onCreateTournament={handleCreateTournament}
        />
      )}
    </div>
  );
};

export default TournamentPage;
