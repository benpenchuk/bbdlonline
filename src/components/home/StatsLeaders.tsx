import React, { useMemo } from 'react';
import { Trophy, Target, Award, Zap } from 'lucide-react';
import { Player, Team, PlayerTeam, PlayerGameStats, PlayerSeasonStats } from '../../core/types';
import { getPlayerFullName } from '../../core/utils/playerHelpers';
import TeamIcon from '../common/TeamIcon';

interface PlayerStatLeader {
  playerId: string;
  value: number;
  player: Player;
  team?: Team;
}

interface StatsLeadersProps {
  players: Player[];
  teams: Team[];
  playerTeams: PlayerTeam[];
  playerGameStats: PlayerGameStats[];
  playerSeasonStats: PlayerSeasonStats[];
}

type StatCategory = 'points' | 'tableHitPct' | 'dinks' | 'sinks';

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<any>;
  formatValue: (value: number) => string;
}

const StatsLeaders: React.FC<StatsLeadersProps> = ({
  players,
  teams,
  playerTeams,
  playerGameStats,
  playerSeasonStats
}) => {
  // Calculate player stats from player_game_stats or use precomputed player_season_stats
  const playerStatsMap = useMemo(() => {
    const statsMap = new Map<string, {
      points: number;
      tableHitPct: number;
      dinks: number;
      sinks: number;
      tableHitsTotal: number;
      throwsMissedTotal: number;
    }>();

    // First, try to use player_season_stats if available
    if (playerSeasonStats.length > 0) {
      playerSeasonStats.forEach(stat => {
        const existing = statsMap.get(stat.playerId) || {
          points: 0,
          tableHitPct: 0,
          dinks: 0,
          sinks: 0,
          tableHitsTotal: 0,
          throwsMissedTotal: 0
        };
        
        statsMap.set(stat.playerId, {
          points: existing.points + stat.pointsScoredTotal,
          tableHitPct: stat.tableHitPct || existing.tableHitPct, // Use precomputed if available
          dinks: existing.dinks + stat.cupsHitTotal,
          sinks: existing.sinks + 0, // sinks not in PlayerSeasonStats, will calculate from game stats
          tableHitsTotal: existing.tableHitsTotal + (stat.tableHitsTotal || 0),
          throwsMissedTotal: existing.throwsMissedTotal + (stat.throwsMissedTotal || 0)
        });
      });
    }

    // Calculate from player_game_stats (for sinks and to fill in missing data)
    if (playerGameStats.length > 0) {
      playerGameStats.forEach(gameStat => {
        const existing = statsMap.get(gameStat.playerId) || {
          points: 0,
          tableHitPct: 0,
          dinks: 0,
          sinks: 0,
          tableHitsTotal: 0,
          throwsMissedTotal: 0
        };

        // Aggregate stats
        const newStats = {
          points: existing.points + gameStat.pointsScored,
          dinks: existing.dinks + gameStat.cupsHit,
          sinks: existing.sinks + gameStat.sinks,
          tableHitsTotal: existing.tableHitsTotal + (gameStat.tableHits || 0),
          throwsMissedTotal: existing.throwsMissedTotal + (gameStat.throwsMissed || 0),
          tableHitPct: existing.tableHitPct
        };

        // Calculate table hit percentage from totals
        const totalThrows = newStats.tableHitsTotal + newStats.throwsMissedTotal;
        if (totalThrows > 0) {
          newStats.tableHitPct = (newStats.tableHitsTotal / totalThrows) * 100;
        }

        statsMap.set(gameStat.playerId, newStats);
      });
    }

    return statsMap;
  }, [playerGameStats, playerSeasonStats]);

  // Get leaders for each category
  const getLeaders = (category: StatCategory, limit: number = 5): PlayerStatLeader[] => {
    const leaders: PlayerStatLeader[] = [];

    players.forEach(player => {
      const stats = playerStatsMap.get(player.id);
      if (!stats) return;

      let value: number;
      switch (category) {
        case 'points':
          value = stats.points;
          break;
        case 'tableHitPct':
          value = stats.tableHitPct;
          break;
        case 'dinks':
          value = stats.dinks;
          break;
        case 'sinks':
          value = stats.sinks;
          break;
        default:
          return;
      }

      // Only include players with valid stats
      if (value > 0 || category === 'tableHitPct') {
        const playerTeamEntry = playerTeams.find(pt => pt.playerId === player.id && pt.status === 'active');
        const team = playerTeamEntry ? teams.find(t => t.id === playerTeamEntry.teamId) : undefined;

        leaders.push({
          playerId: player.id,
          value,
          player,
          team
        });
      }
    });

    // Sort by value (descending)
    leaders.sort((a, b) => b.value - a.value);

    return leaders.slice(0, limit);
  };

  const categories: Record<StatCategory, CategoryConfig> = {
    points: {
      label: 'Points',
      icon: Trophy as any,
      formatValue: (v) => v.toFixed(0)
    },
    tableHitPct: {
      label: 'Table Hit %',
      icon: Target as any,
      formatValue: (v) => `${v.toFixed(1)}%`
    },
    dinks: {
      label: 'Dinks',
      icon: Award as any,
      formatValue: (v) => v.toFixed(0)
    },
    sinks: {
      label: 'Sinks',
      icon: Zap as any,
      formatValue: (v) => v.toFixed(0)
    }
  };

  return (
    <section className="home-section stats-leaders-section">
      <h2 className="section-title">Stat Leaders</h2>
      
      <div className="stats-leaders-container">
        {Object.entries(categories).map(([category, config]) => {
          const leaders = getLeaders(category as StatCategory);
          const Icon = config.icon;

          if (leaders.length === 0) return null;

          return (
            <div key={category} className="stat-leader-group">
              <div className="stat-leader-header">
                <Icon size={18} />
                <h3 className="stat-leader-title">{config.label}</h3>
              </div>
              
              <div className="stat-leader-list">
                {leaders.map((leader, index) => {
                  const rank = index + 1;
                  const isTop3 = rank <= 3;

                  return (
                    <div 
                      key={leader.playerId} 
                      className={`stat-leader-item ${isTop3 ? `rank-${rank}` : ''}`}
                    >
                      <div className="stat-leader-rank">
                        {rank === 1 && <Trophy size={14} className="rank-icon gold" />}
                        {rank === 2 && <Trophy size={14} className="rank-icon silver" />}
                        {rank === 3 && <Trophy size={14} className="rank-icon bronze" />}
                        {rank > 3 && <span className="rank-number">#{rank}</span>}
                      </div>
                      
                      <div className="stat-leader-player">
                        {leader.team && (
                          <TeamIcon 
                            iconId={leader.team.abbreviation} 
                            color="#3b82f6" 
                            size={16} 
                          />
                        )}
                        <span className="player-name">{getPlayerFullName(leader.player)}</span>
                      </div>
                      
                      <div className="stat-leader-value">
                        {config.formatValue(leader.value)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default StatsLeaders;

