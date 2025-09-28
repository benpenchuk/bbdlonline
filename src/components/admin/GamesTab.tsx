import React, { useState } from 'react';
import { Plus, Edit, Trash2, Calendar } from 'lucide-react';
import { Game, Team } from '../../core/types';
import { useData } from '../../state';
import { format } from 'date-fns';
import GameFormModal from './GameFormModal';

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

  const getTeamColor = (teamId: string) => {
    return teams.find(t => t.id === teamId)?.color || '#6B7280';
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

  const sortedGames = [...games].sort((a, b) => 
    new Date(b.scheduledDate).getTime() - new Date(a.scheduledDate).getTime()
  );

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
        {sortedGames.map(game => (
          <div key={game.id} className="game-admin-item">
            <div className="game-info">
              <div className="game-teams">
                <div className="team-info">
                  <div 
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(game.team1Id) }}
                  />
                  <span>{getTeamName(game.team1Id)}</span>
                  {game.status === 'completed' && (
                    <span className={`score ${game.winnerId === game.team1Id ? 'winner' : ''}`}>
                      {game.team1Score}
                    </span>
                  )}
                </div>
                
                <div className="vs">vs</div>
                
                <div className="team-info">
                  <div 
                    className="team-color-dot"
                    style={{ backgroundColor: getTeamColor(game.team2Id) }}
                  />
                  <span>{getTeamName(game.team2Id)}</span>
                  {game.status === 'completed' && (
                    <span className={`score ${game.winnerId === game.team2Id ? 'winner' : ''}`}>
                      {game.team2Score}
                    </span>
                  )}
                </div>
              </div>

              <div className="game-meta">
                <div className={`game-status status-${game.status}`}>
                  {game.status.charAt(0).toUpperCase() + game.status.slice(1)}
                </div>
                <div className="game-date">
                  {format(game.scheduledDate, 'MMM d, yyyy h:mm a')}
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
        ))}
      </div>

      {games.length === 0 && (
        <div className="empty-state">
          <Calendar size={48} />
          <h3>No games scheduled</h3>
          <p>Schedule your first game to get started</p>
        </div>
      )}

      {/* Game Form Modal */}
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
