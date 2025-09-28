import React, { useState, useEffect } from 'react';
import { Filter, SortAsc, Grid, List, Search, Calendar, Plus } from 'lucide-react';
import { useData } from '../state';
import { Game, GameStatus, ViewMode } from '../core/types';
import { sortGames, filterGames } from '../core/utils/statsCalculations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import GameCard from '../components/common/GameCard';
import GameTable from '../components/games/GameTable';
import GameModal from '../components/games/GameModal';
import FilterPanel from '../components/games/FilterPanel';

const GamesPage: React.FC = () => {
  const { games, teams, loading } = useData();
  const [filteredGames, setFilteredGames] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  
  // Filters and sorting
  const [viewMode, setViewMode] = useState<ViewMode>('card');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'upcoming'>('upcoming');
  const [statusFilter, setStatusFilter] = useState<GameStatus[]>([]);
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);


  useEffect(() => {
    let filtered = games;

    // Apply filters
    const filters: any = {};
    if (statusFilter.length > 0) filters.status = statusFilter;
    if (teamFilter) filters.teamId = teamFilter;

    filtered = filterGames(filtered, filters);

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(game => {
        const team1 = teams.find(t => t.id === game.team1Id);
        const team2 = teams.find(t => t.id === game.team2Id);
        return (
          team1?.name.toLowerCase().includes(query) ||
          team2?.name.toLowerCase().includes(query)
        );
      });
    }

    // Apply sorting
    filtered = sortGames(filtered, sortBy);

    setFilteredGames(filtered);
  }, [games, teams, statusFilter, teamFilter, searchQuery, sortBy]);

  if (loading) {
    return <LoadingSpinner message="Loading games..." />;
  }

  const handleGameClick = (game: Game) => {
    setSelectedGame(game);
  };

  const closeModal = () => {
    setSelectedGame(null);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Games & Schedule</h1>
          <p>View all games, results, and upcoming matches</p>
        </div>
        
        <div className="page-actions">
          <button className="btn btn-primary">
            <Plus size={20} />
            Schedule Game
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="games-controls">
        <div className="controls-left">
          {/* Search */}
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filter Toggle */}
          <button
            className={`btn btn-outline ${showFilters ? 'btn-active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
            Filters
            {(statusFilter.length > 0 || teamFilter) && (
              <span className="filter-badge">
                {statusFilter.length + (teamFilter ? 1 : 0)}
              </span>
            )}
          </button>

          {/* Sort */}
          <div className="sort-select">
            <SortAsc size={20} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="sort-dropdown"
            >
              <option value="upcoming">Upcoming First</option>
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          {/* View Mode Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewMode === 'card' ? 'view-btn-active' : ''}`}
              onClick={() => setViewMode('card')}
            >
              <Grid size={20} />
            </button>
            <button
              className={`view-btn ${viewMode === 'table' ? 'view-btn-active' : ''}`}
              onClick={() => setViewMode('table')}
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <FilterPanel
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          teams={teams}
        />
      )}

      {/* Games Display */}
      <div className="games-content">
        {filteredGames.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No games found</h3>
            <p>Try adjusting your filters or search criteria</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="games-grid">
            {filteredGames.map(game => (
              <GameCard
                key={game.id}
                game={game}
                teams={teams}
                onClick={() => handleGameClick(game)}
              />
            ))}
          </div>
        ) : (
          <GameTable
            games={filteredGames}
            teams={teams}
            onGameClick={handleGameClick}
          />
        )}
      </div>

      {/* Game Detail Modal */}
      {selectedGame && (
        <GameModal
          game={selectedGame}
          teams={teams}
          onClose={closeModal}
        />
      )}
    </div>
  );
};

export default GamesPage;
