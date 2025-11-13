import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useData } from '../state';
import { Player } from '../core/types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import PlayerCard from '../components/common/PlayerCard';
import TeamSection from '../components/players/TeamSection';
import ViewToggle, { ViewMode } from '../components/players/ViewToggle';
import PlayerModal from '../components/players/PlayerModal';
import { getPlayerFullName, getTeamPlayers } from '../core/utils/playerHelpers';
import { getWinnerId } from '../core/utils/gameHelpers';

// --- Helper Hook for localStorage ---
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

// --- Main Component ---
const PlayersPage: React.FC = () => {
  const { players, teams, games, playerTeams, loading } = useData();

  // --- View State ---
  const [view, setView] = useLocalStorage<ViewMode>('bbdl-players-view', 'player');
  
  // --- Modal State ---
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  
  // --- Team Collapse State (store as array, use as Set) ---
  const [expandedTeamsArray, setExpandedTeamsArray] = useLocalStorage<string[]>(
    'bbdl-expanded-teams', 
    teams.map(t => t.id)
  );

  // Clean up corrupted localStorage data on mount
  useEffect(() => {
    if (!Array.isArray(expandedTeamsArray)) {
      setExpandedTeamsArray(teams.map(t => t.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  // Convert array to Set for easy .has() checks
  // Ensure expandedTeamsArray is always an array (in case of corrupted localStorage)
  const expandedTeams = useMemo(() => {
    const safeArray = Array.isArray(expandedTeamsArray) ? expandedTeamsArray : teams.map(t => t.id);
    return new Set(safeArray);
  }, [expandedTeamsArray, teams]);

  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeamsArray(prev => {
      const safeArray = Array.isArray(prev) ? prev : [];
      const newSet = new Set(safeArray);
      if (newSet.has(teamId)) {
        newSet.delete(teamId);
      } else {
        newSet.add(teamId);
      }
      return Array.from(newSet);
    });
  };

  const areAllExpanded = useMemo(() => {
    const teamIds = teams.map(t => t.id);
    return teamIds.length > 0 && teamIds.every(id => expandedTeams.has(id));
  }, [teams, expandedTeams]);

  const toggleAllTeams = () => {
    if (areAllExpanded) {
      setExpandedTeamsArray([]);
    } else {
      setExpandedTeamsArray(teams.map(t => t.id));
    }
  };

  // --- Calculate Player Stats ---
  const playerStats = useMemo(() => {
    const statsMap = new Map<string, { record: { wins: number, losses: number }, avgPoints: number, gamesPlayed: number, totalPoints: number }>();
    
    players.forEach(p => {
      let wins = 0;
      let losses = 0;
      let totalPoints = 0;
      let gamesPlayed = 0;

      // Find player's team
      const playerTeamEntry = playerTeams.find(pt => pt.playerId === p.id && pt.status === 'active');
      const playerTeamId = playerTeamEntry?.teamId;

      if (playerTeamId) {
        games.forEach(g => {
          const isHome = g.homeTeamId === playerTeamId;
          const isAway = g.awayTeamId === playerTeamId;
          
          if ((isHome || isAway) && g.status === 'completed') {
            gamesPlayed++;
            totalPoints += isHome ? g.homeScore : g.awayScore;
            
            const winnerId = getWinnerId(g);
            if (winnerId === playerTeamId) {
              wins++;
            } else {
              losses++;
            }
          }
        });
      }

      statsMap.set(p.id, {
        record: { wins, losses },
        avgPoints: gamesPlayed > 0 ? totalPoints / gamesPlayed : 0,
        gamesPlayed,
        totalPoints,
      });
    });

    return statsMap;
  }, [players, games, playerTeams]);

  // --- Calculate Team Stats ---
  const teamStats = useMemo(() => {
    const teamStatsMap = new Map<string, { totalWins: number, totalGames: number, totalPoints: number }>();
    teams.forEach(t => teamStatsMap.set(t.id, { totalWins: 0, totalGames: 0, totalPoints: 0 }));

    games.forEach(g => {
      if (g.status === 'completed') {
        const homeStats = teamStatsMap.get(g.homeTeamId);
        const awayStats = teamStatsMap.get(g.awayTeamId);
        const winnerId = getWinnerId(g);

        if (homeStats) {
          homeStats.totalGames++;
          homeStats.totalPoints += g.homeScore;
          if (winnerId === g.homeTeamId) {
            homeStats.totalWins++;
          }
        }

        if (awayStats) {
          awayStats.totalGames++;
          awayStats.totalPoints += g.awayScore;
          if (winnerId === g.awayTeamId) {
            awayStats.totalWins++;
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
      });
    });

    return finalStats;
  }, [games, teams]);

  // --- Group Players by Team ---
  const playersByTeam = useMemo(() => {
    const grouped: Record<string, Player[]> = {};
    teams.forEach(team => {
      grouped[team.id] = getTeamPlayers(team.id, players, playerTeams);
    });
    return grouped;
  }, [teams, players, playerTeams]);

  // --- Get Recent Games for Selected Player ---
  const selectedPlayerRecentGames = useMemo(() => {
    if (!selectedPlayer) return [];
    
    // Find player's team
    const playerTeamEntry = playerTeams.find(pt => pt.playerId === selectedPlayer.id && pt.status === 'active');
    const playerTeamId = playerTeamEntry?.teamId;
    
    if (!playerTeamId) return [];
    
    return games
      .filter(g => 
        (g.homeTeamId === playerTeamId || g.awayTeamId === playerTeamId) && 
        g.status === 'completed'
      )
      .sort((a, b) => {
        const dateA = a.gameDate ? new Date(a.gameDate).getTime() : 0;
        const dateB = b.gameDate ? new Date(b.gameDate).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 5);
  }, [selectedPlayer, games, playerTeams]);

  // --- Modal Logic ---
  const openModal = (player: Player) => {
    setSelectedPlayer(player);
  };

  const closeModal = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  // --- Loading State ---
  if (loading) {
    return <LoadingSpinner message="Loading players..." />;
  }

  return (
    <div className="bbdl-players-page">
      {/* Page Header */}
      <div className="bbdl-page-header">
        <div className="bbdl-page-title-section">
          <h1>Players</h1>
        </div>
      </div>

      {/* View Controls */}
      <div className="bbdl-players-controls">
        <ViewToggle activeView={view} onViewChange={setView} />
        
        {view === 'team' && (
          <button 
            className="bbdl-collapse-all-btn"
            onClick={toggleAllTeams}
            aria-label={areAllExpanded ? 'Collapse all teams' : 'Expand all teams'}
          >
            {areAllExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            {areAllExpanded ? 'Collapse All' : 'Expand All'}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div id="players-content" className="bbdl-players-content">
        {view === 'player' ? (
          // BY PLAYER VIEW
          <div className="bbdl-players-grid">
            {players
              .sort((a, b) => getPlayerFullName(a).localeCompare(getPlayerFullName(b)))
              .map(player => {
                const playerTeamEntry = playerTeams.find(pt => pt.playerId === player.id && pt.status === 'active');
                const team = playerTeamEntry ? teams.find(t => t.id === playerTeamEntry.teamId) : undefined;
                const stats = playerStats.get(player.id);
                return (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    team={team}
                    record={stats?.record}
                    avgPoints={stats?.avgPoints}
                    onClick={() => openModal(player)}
                  />
                );
              })}
          </div>
        ) : (
          // BY TEAM VIEW
          <div className="bbdl-teams-sections">
            {teams
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(team => {
                const teamPlayers = playersByTeam[team.id] || [];
                const teamAggStats = teamStats.get(team.id);
                
                if (teamPlayers.length === 0) return null;
                
                return (
                  <TeamSection
                    key={team.id}
                    team={team}
                    players={teamPlayers}
                    teamStats={teamAggStats!}
                    isCollapsed={!expandedTeams.has(team.id)}
                    onToggle={() => toggleTeamExpand(team.id)}
                    onPlayerClick={(player) => openModal(player)}
                    playerStats={playerStats}
                  />
                );
              })}
          </div>
        )}
      </div>

      {/* Player Modal */}
      {selectedPlayer && (
        <PlayerModal
          player={selectedPlayer}
          team={teams.find(t => playerTeams.find(pt => pt.playerId === selectedPlayer.id && pt.teamId === t.id && pt.status === 'active'))}
          isOpen={!!selectedPlayer}
          onClose={closeModal}
          stats={playerStats.get(selectedPlayer.id)}
          recentGames={selectedPlayerRecentGames}
          teams={teams}
        />
      )}
    </div>
  );
};

export default PlayersPage;
