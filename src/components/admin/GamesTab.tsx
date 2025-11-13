import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { useData } from '../../state';
import { format } from 'date-fns';
import GameFormModal from './GameFormModal';
import TeamIcon from '../common/TeamIcon';
import { getWinnerId } from '../../core/utils/gameHelpers';

interface GamesTabProps {
  games: Game[];
  teams: Team[];
}

const GamesTab: React.FC<GamesTabProps> = ({ games, teams }) => {
  const { deleteGame, refreshData } = useData();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);

  const getTeamName = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.name || 'Unknown Team';
  };

  const handleDeleteGame = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await deleteGame(gameId);
        await refreshData();
      } catch (error) {
        console.error('Failed to delete game:', error);
      }
    }
  };

  const handleCloseModal = () => {
    setShowCreateForm(false);
    setEditingGame(null);
  };

  const handleSaveGame = async () => {
    await refreshData();
  };

  const sortedGames = [...games].sort((a, b) => {
    const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
    const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
    return dateB - dateA;
  });

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Games Management</h2>
        <button 
          className="btn btn-primary"
          onClick={() => setShowCreateForm(true)}
        >
          <Plus size={16} />
          Schedule Game
        </button>
      </div>

      <div className="games-admin-list">
        {sortedGames.map(game => {
          const homeTeam = teams.find(t => t.id === game.homeTeamId);
          const awayTeam = teams.find(t => t.id === game.awayTeamId);
          const winnerId = getWinnerId(game);

          return (
            <div key={game.id} className="game-admin-item">
              <div className="game-info">
                <div className="game-teams">
                  <div className="team-info">
                    {homeTeam && (
                      <TeamIcon iconId={homeTeam.abbreviation} color="#3b82f6" size={16} />
                    )}
                    <span>{getTeamName(game.homeTeamId)}</span>
                    {game.status === 'completed' && (
                      <span className={`score ${winnerId === game.homeTeamId ? 'winner' : ''}`}>
                        {game.homeScore}
                      </span>
                    )}
                  </div>
                  
                  <div className="vs">vs</div>
                  
                  <div className="team-info">
                    {awayTeam && (
                      <TeamIcon iconId={awayTeam.abbreviation} color="#ef4444" size={16} />
                    )}
                    <span>{getTeamName(game.awayTeamId)}</span>
                    {game.status === 'completed' && (
                      <span className={`score ${winnerId === game.awayTeamId ? 'winner' : ''}`}>
                        {game.awayScore}
                      </span>
                    )}
                  </div>
                </div>

                <div className="game-meta">
                  <div className={`game-status status-${game.status}`}>
                    {game.status.charAt(0).toUpperCase() + game.status.slice(1).replace('_', ' ')}
                  </div>
                  <div className="game-date">
                    {game.gameDate && format(game.gameDate, 'MMM d, yyyy h:mm a')}
                  </div>
                </div>
              </div>

              <div className="game-actions">
                <button 
                  className="btn btn-outline btn-small"
                  onClick={() => setEditingGame(game)}
                >
                  <Edit size={14} />
                  Edit
                </button>
                <button 
                  className="btn btn-danger btn-small"
                  onClick={() => handleDeleteGame(game.id)}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          );
        })}
        
        {sortedGames.length === 0 && (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No games scheduled</h3>
            <p>Click "Schedule Game" to add a new game.</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {(showCreateForm || editingGame) && (
        <GameFormModal
          game={editingGame}
          teams={teams}
          onClose={handleCloseModal}
          onSave={handleSaveGame}
        />
      )}
    </div>
  );
};

export default GamesTab;
