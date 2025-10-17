import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, Users, UserPlus, X, Grid, List, ChevronUp, ChevronDown, Home, Shield, Target } from 'lucide-react';
import { useData } from '../state';
import { Player, Team } from '../core/types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlayerCard from '../components/common/PlayerCard';
import TeamSection from '../components/players/TeamSection';

// --- Helper Hooks ---
const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

const useLocalStorage = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(error);
      return initialValue;
    }
  });

  const setValue: React.Dispatch<React.SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };
  
  return [storedValue, setValue];
};

// --- Sorting Utilities ---
type SortOption = 'name-asc' | 'name-desc' | 'team-asc';

const sortPlayers = (players: (Player & { teamName: string })[], sortBy: SortOption) => {
  const sorted = [...players];
  switch (sortBy) {
    case 'name-asc':
      sorted.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'name-desc':
      sorted.sort((a, b) => b.name.localeCompare(a.name));
      break;
    case 'team-asc':
      sorted.sort((a, b) => {
        if (a.teamName < b.teamName) return -1;
        if (a.teamName > b.teamName) return 1;
        return a.name.localeCompare(b.name);
      });
      break;
    default:
      break;
  }
  return sorted;
};

// --- Main Component ---
const PlayersPage: React.FC = () => {
  const { players, teams, games, loading } = useData();

  // --- State and Persistence ---
  const [view, setView] = useLocalStorage<'all' | 'team'>('playersView', 'all');
  const [sortBy, setSortBy] = useLocalStorage<SortOption>('playersSort', 'name-asc');
  const [teamFilter, setTeamFilter] = useLocalStorage<string>('playersTeamFilter', '');
  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // --- Modal State ---
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // --- Team Collapse State ---
  const [collapsedTeams, setCollapsedTeams] = useLocalStorage<Record<string, boolean>>('collapsedTeams', {});

  const toggleTeamCollapse = (teamId: string) => {
    setCollapsedTeams(prev => ({ ...prev, [teamId]: !prev[teamId] }));
  };

  const areAllCollapsed = useMemo(() => {
    const teamIds = teams.map(t => t.id);
    return teamIds.length > 0 && teamIds.every(id => collapsedTeams[id]);
  }, [teams, collapsedTeams]);

  const toggleAllTeams = () => {
    if (areAllCollapsed) {
      setCollapsedTeams({});
    } else {
      const allCollapsed: Record<string, boolean> = {};
      teams.forEach(t => allCollapsed[t.id] = true);
      setCollapsedTeams(allCollapsed);
    }
  };

  // --- Data Computation ---
  const playerStats = useMemo(() => {
    const statsMap = new Map<string, { record: { wins: number, losses: number }, avgPoints: number, gamesPlayed: number, totalPoints: number }>();
    players.forEach(p => {
        let wins = 0;
        let losses = 0;
        let totalPoints = 0;
        let gamesPlayed = 0;

        games.forEach(g => {
            const isTeam1 = g.team1Id === p.teamId;
            const isTeam2 = g.team2Id === p.teamId;
            if((isTeam1 || isTeam2) && g.status === 'completed' && g.team1Score !== undefined && g.team2Score !== undefined){
                gamesPlayed++;
                totalPoints += isTeam1 ? g.team1Score : g.team2Score;
                if(g.winnerId === p.teamId) {
                    wins++;
                } else {
                    losses++;
                }
            }
        });
        statsMap.set(p.id, {
            record: { wins, losses },
            avgPoints: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
            gamesPlayed,
            totalPoints,
        });
    });
    return statsMap;
  }, [players, games]);

  const displayPlayers = useMemo(() => {
    const playersWithTeams = players.map(p => {
      const team = teams.find(t => t.id === p.teamId);
      return { ...p, teamName: team?.name || 'Unassigned' };
    });

    let filtered = playersWithTeams;

    if (teamFilter) {
      filtered = filtered.filter(player => player.teamId === teamFilter);
    }

    if (debouncedSearchQuery) {
      const query = debouncedSearchQuery.toLowerCase();
      filtered = filtered.filter(player =>
        player.name.toLowerCase().includes(query)
      );
    }

    return sortPlayers(filtered, sortBy);
  }, [players, teams, teamFilter, debouncedSearchQuery, sortBy]);
  
  const playersByTeam = useMemo(() => {
    const grouped: Record<string, Player[]> = {};
    teams.forEach(team => {
      grouped[team.id] = displayPlayers.filter(player => player.teamId === team.id);
    });
    return grouped;
  }, [teams, displayPlayers]);
  
  const teamAggregateStats = useMemo(() => {
    const teamStatsMap = new Map<string, { totalWins: number, totalGames: number, totalPoints: number }>();
    teams.forEach(t => teamStatsMap.set(t.id, { totalWins: 0, totalGames: 0, totalPoints: 0 }));

    games.forEach(g => {
        if (g.status === 'completed' && g.team1Score !== undefined && g.team2Score !== undefined) {
            const team1Stats = teamStatsMap.get(g.team1Id);
            const team2Stats = teamStatsMap.get(g.team2Id);

            if (team1Stats) {
                team1Stats.totalGames++;
                team1Stats.totalPoints += g.team1Score;
                if (g.winnerId === g.team1Id) {
                    team1Stats.totalWins++;
                }
            }

            if (team2Stats) {
                team2Stats.totalGames++;
                team2Stats.totalPoints += g.team2Score;
                if (g.winnerId === g.team2Id) {
                    team2Stats.totalWins++;
                }
            }
        }
    });

    const finalStats = new Map<string, { totalWins: number, totalGames: number, averagePoints: number }>();
    teamStatsMap.forEach((stats, teamId) => {
        finalStats.set(teamId, {
            totalWins: stats.totalWins,
            totalGames: stats.totalGames,
            averagePoints: stats.totalGames > 0 ? stats.totalPoints / stats.totalGames : 0,
        })
    });
    return finalStats;
}, [games, teams]);


  // --- Modal Logic ---
  const openModal = (player: Player, e: React.MouseEvent<HTMLDivElement> | React.KeyboardEvent<HTMLDivElement>) => {
    setSelectedPlayer(player);
  };

  const closeModal = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    if (selectedPlayer) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedPlayer, closeModal]);


  if (loading) {
    return <LoadingSpinner message="Loading players..." />;
  }

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

      <div className="players-controls">
        <div className="controls-left">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
              aria-label="Search players by name"
            />
          </div>
          <div className="filter-select">
            <select
              value={teamFilter}
              onChange={(e) => setTeamFilter(e.target.value)}
              aria-label="Filter by team"
            >
              <option value="">All Teams</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>
          <div className="sort-select">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              aria-label="Sort players"
            >
              <option value="name-asc">Name A→Z</option>
              <option value="name-desc">Name Z→A</option>
              <option value="team-asc">Team A→Z</option>
            </select>
          </div>
        </div>
        <div className="controls-right">
          {view === 'team' && (
             <button className="btn btn-outline expand-collapse-controls" onClick={toggleAllTeams}>
               {areAllCollapsed ? <ChevronDown size={16}/> : <ChevronUp size={16} />}
               {areAllCollapsed ? 'Expand All' : 'Collapse All'}
             </button>
          )}
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'all' ? 'view-btn-active' : ''}`}
              onClick={() => setView('all')}
              aria-label="View all players"
            >
              <Grid size={20} />
              All Players
            </button>
            <button
              className={`view-btn ${view === 'team' ? 'view-btn-active' : ''}`}
              onClick={() => setView('team')}
              aria-label="View players by team"
            >
              <List size={20} />
              By Team
            </button>
          </div>
        </div>
      </div>

      <div className="players-content">
        {displayPlayers.length === 0 ? (
          <div className="empty-state">
            <Users size={48} />
            <h3>No players found</h3>
            <p>Try adjusting your search or filter criteria</p>
          </div>
        ) : view === 'all' ? (
          <div className="players-grid">
            {displayPlayers.map(player => {
              const team = teams.find(t => t.id === player.teamId);
              const stats = playerStats.get(player.id);
              return (
                <PlayerCard
                  key={player.id}
                  player={player}
                  team={team}
                  record={stats?.record}
                  avgPoints={stats?.avgPoints}
                  onClick={(e) => openModal(player, e)}
                />
              );
            })}
          </div>
        ) : (
          <div className="teams-sections">
            {teams.map(team => {
              const teamPlayers = playersByTeam[team.id];
              const teamAggStats = teamAggregateStats.get(team.id);
              if (!teamPlayers || teamPlayers.length === 0) return null;
              
              return (
                <TeamSection
                  key={team.id}
                  team={team}
                  players={teamPlayers}
                  teamStats={teamAggStats!}
                  isInitiallyCollapsed={!!collapsedTeams[team.id]}
                  onToggleCollapse={() => toggleTeamCollapse(team.id)}
                  onPlayerClick={(player, e) => openModal(player, e)}
                  playerStats={playerStats}
                />
              );
            })}
          </div>
        )}
      </div>

      {selectedPlayer && (
        <div 
            className={`modal-backdrop open`}
            onClick={closeModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="player-details-title"
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="player-details-title" className="modal-title">Player Details</h2>
              <button className="modal-close-btn" onClick={closeModal} aria-label="Close player details">
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Player details content goes here */}
              <div className="player-modal-content">
                <div className="player-modal-header">
                  <div className="player-avatar large">
                    {selectedPlayer.photoUrl ? (
                      <img src={selectedPlayer.photoUrl} alt={selectedPlayer.name} className="player-photo" />
                    ) : (
                      <div className="player-initials">
                        {selectedPlayer.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div className="player-modal-info">
                    <h3 className="player-name">{selectedPlayer.name}</h3>
                    <div className="player-meta">
                       <div className="meta-item">
                         <Home size={14} />
                         <span>{selectedPlayer.bio || '—'}</span>
                       </div>
                       <div className="meta-item player-team-badge">
                         <div
                           className="team-color-dot"
                           style={{ backgroundColor: teams.find(t => t.id === selectedPlayer.teamId)?.color }}
                         />
                         <span>{teams.find(t => t.id === selectedPlayer.teamId)?.name || '—'}</span>
                       </div>
                    </div>
                  </div>
                </div>

                <div className="player-modal-body">
                    <h4>Season Summary</h4>
                    <div className="player-stats-compact">
                      <div className="stat-item-compact">
                        <Shield size={14} />
                        <span className="stat-label">Record</span>
                        <span className="stat-value">{playerStats.get(selectedPlayer.id)?.record.wins ?? '0'}–{playerStats.get(selectedPlayer.id)?.record.losses ?? '0'}</span>
                      </div>
                      <div className="stat-item-compact">
                        <Users size={14} />
                        <span className="stat-label">Games Played</span>
                        <span className="stat-value">{playerStats.get(selectedPlayer.id)?.gamesPlayed ?? '0'}</span>
                      </div>
                      <div className="stat-item-compact">
                        <Target size={14} />
                        <span className="stat-label">Avg Pts</span>
                        <span className="stat-value">{playerStats.get(selectedPlayer.id)?.avgPoints.toFixed(1) ?? '0.0'}</span>
                      </div>
                    </div>

                    <h4>Recent Games (Last 5)</h4>
                    <div className="recent-games-list">
                      {games.filter(g => (g.team1Id === selectedPlayer.teamId || g.team2Id === selectedPlayer.teamId) && g.status === 'completed').slice(-5).reverse().map(game => {
                        const isTeam1 = game.team1Id === selectedPlayer.teamId;
                        const opponent = teams.find(t => t.id === (isTeam1 ? game.team2Id : game.team1Id));
                        const win = game.winnerId === selectedPlayer.teamId;
                        return (
                          <div key={game.id} className="recent-game-item">
                            <div className="game-info">
                              vs {opponent?.name || 'Unknown'}
                              <small>{new Date(game.completedDate!).toLocaleDateString()}</small>
                            </div>
                            <div className={`game-result ${win ? 'win' : 'loss'}`}>
                              {win ? 'W' : 'L'}
                            </div>
                            <div className="game-score">
                                {isTeam1 ? game.team1Score : game.team2Score} - {isTeam1 ? game.team2Score : game.team1Score}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlayersPage;
