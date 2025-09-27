import React, { useState, useEffect } from 'react';
import { Search, Filter, SortAsc, Users, UserPlus } from 'lucide-react';
import { playersApi, teamsApi } from '../services/api';
import { Player, Team, PlayerSort } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlayerCard from '../components/common/PlayerCard';
import TeamSection from '../components/players/TeamSection';

const PlayersPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [filteredPlayers, setFilteredPlayers] = useState<Player[]>([]);
  
  // Filters and sorting
  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<PlayerSort>('wins');
  const [viewByTeam, setViewByTeam] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [playersRes, teamsRes] = await Promise.all([
          playersApi.getAll(),
          teamsApi.getAll()
        ]);

        if (playersRes.success) setPlayers(playersRes.data);
        if (teamsRes.success) setTeams(teamsRes.data);
      } catch (error) {
        console.error('Failed to load players data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let filtered = players;

    // Apply team filter
    if (teamFilter) {
      filtered = filtered.filter(player => player.teamId === teamFilter);
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query) ||
        player.bio.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'wins':
          return b.stats.wins - a.stats.wins;
        case 'games':
          return b.stats.gamesPlayed - a.stats.gamesPlayed;
        case 'average':
          return b.stats.averagePoints - a.stats.averagePoints;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    setFilteredPlayers(filtered);
  }, [players, searchQuery, teamFilter, sortBy]);

  if (loading) {
    return <LoadingSpinner message="Loading players..." />;
  }

  const groupPlayersByTeam = () => {
    const grouped: Record<string, Player[]> = {};
    
    teams.forEach(team => {
      grouped[team.id] = filteredPlayers.filter(player => player.teamId === team.id);
    });

    return grouped;
  };

  const playersByTeam = groupPlayersByTeam();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Player Profiles</h1>
          <p>Meet the players and their statistics</p>
        </div>
        
        <div className="page-actions">
          <button className="btn btn-primary">
            <UserPlus size={20} />
            Add Player
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="players-controls">
        <div className="controls-left">
          {/* Search */}
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Team Filter */}
          <div className="filter-select">
            <Filter size={20} />
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              className="filter-dropdown"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <div className="sort-select">
            <SortAsc size={20} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as PlayerSort)}
              className="sort-dropdown"
            >
              <option value="wins">Most Wins</option>
              <option value="average">Highest Average</option>
              <option value="games">Most Games</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>

        <div className="controls-right">
          {/* View Toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${viewByTeam ? 'view-btn-active' : ''}`}
              onClick={() => setViewByTeam(true)}
            >
              <Users size={20} />
              By Team
            </button>
            <button
              className={`view-btn ${!viewByTeam ? 'view-btn-active' : ''}`}
              onClick={() => setViewByTeam(false)}
            >
              All Players
            </button>
          </div>
        </div>
      </div>

      {/* Players Display */}
      <div className="players-content">
        {filteredPlayers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No players found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : viewByTeam ? (
          <div className="teams-sections">
            {teams.map(team => {
              const teamPlayers = playersByTeam[team.id];
              if (teamPlayers.length === 0) return null;
              
              return (
                <TeamSection
                  key={team.id}
                  team={team}
                  players={teamPlayers}
                />
              );
            })}
          </div>
        ) : (
          <div className="players-grid">
            {filteredPlayers.map((player, index) => {
              const team = teams.find(t => t.id === player.teamId);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={team}
                  rank={index + 1}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlayersPage;
