import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Player, Team, PlayerTeam, PlayerGameStats, PlayerSeasonStats } from '../../core/types';
import { getPlayerFullName } from '../../core/utils/playerHelpers';

interface CompactStatsLeadersProps {
  players: Player[];
  teams: Team[];
  playerTeams: PlayerTeam[];
  playerGameStats: PlayerGameStats[];
  playerSeasonStats: PlayerSeasonStats[];
  limit?: number;
}

const CompactStatsLeaders: React.FC<CompactStatsLeadersProps> = ({
  players,
  teams,
  playerTeams,
  playerGameStats,
  playerSeasonStats,
  limit = 5
}) => {
  const playerStatsMap = useMemo(() => {
    const statsMap = new Map<string, {
      points: number;
      tableHitPct: number;
      dinks: number;
      sinks: number;
      tableHitsTotal: number;
      throwsMissedTotal: number;
    }>();

    // Use player_season_stats if available
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
          tableHitPct: stat.tableHitPct || existing.tableHitPct,
          dinks: existing.dinks + stat.cupsHitTotal,
          sinks: existing.sinks + 0,
          tableHitsTotal: existing.tableHitsTotal + (stat.tableHitsTotal || 0),
          throwsMissedTotal: existing.throwsMissedTotal + (stat.throwsMissedTotal || 0)
        });
      });
    }

    // Calculate from player_game_stats
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

        const newStats = {
          points: existing.points + gameStat.pointsScored,
          dinks: existing.dinks + gameStat.cupsHit,
          sinks: existing.sinks + gameStat.sinks,
          tableHitsTotal: existing.tableHitsTotal + (gameStat.tableHits || 0),
          throwsMissedTotal: existing.throwsMissedTotal + (gameStat.throwsMissed || 0),
          tableHitPct: existing.tableHitPct
        };

        const totalThrows = newStats.tableHitsTotal + newStats.throwsMissedTotal;
        if (totalThrows > 0) {
          newStats.tableHitPct = (newStats.tableHitsTotal / totalThrows) * 100;
        }

        statsMap.set(gameStat.playerId, newStats);
      });
    }

    return statsMap;
  }, [playerGameStats, playerSeasonStats]);

  const getLeaders = (category: 'points' | 'tableHitPct' | 'dinks' | 'sinks') => {
    const leaders: Array<{ playerId: string; value: number }> = [];
    playerStatsMap.forEach((stats, playerId) => {
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
          value = 0;
      }
      leaders.push({ playerId, value });
    });

    leaders.sort((a, b) => b.value - a.value);
    return limit ? leaders.slice(0, limit) : leaders;
  };

  const categories = [
    { key: 'points' as const, label: 'Points' },
    { key: 'tableHitPct' as const, label: 'Table Hit %' },
    { key: 'dinks' as const, label: 'Dinks' },
    { key: 'sinks' as const, label: 'Sinks' }
  ];

  return (
    <div className="league-leaders-card-container">
      <h3 className="league-leaders-card-title">League Leaders</h3>
      <div className="league-leaders-card-separator"></div>
      <div className="league-leaders-content">
        {categories.map(category => {
          const leaders = getLeaders(category.key);
          return (
            <div key={category.key} className="league-leaders-category">
              <h4 className="league-leaders-category-title">{category.label}</h4>
              <div className="league-leaders-list">
                {leaders.length === 0 ? (
                  <div className="league-leaders-empty">No data available</div>
                ) : (
                  leaders.map((leader, index) => {
                    const player = players.find(p => p.id === leader.playerId);
                    if (!player) return null;

                    return (
                      <div key={player.id} className="league-leaders-item">
                        <span className="league-leaders-rank">{index + 1}.</span>
                        <div className="league-leaders-player-info">
                          <span className="league-leaders-player-name">{getPlayerFullName(player)}</span>
                        </div>
                        <span className="league-leaders-value tabular-nums">
                          {category.key === 'tableHitPct' 
                            ? `${leader.value.toFixed(1)}%`
                            : leader.value.toFixed(0)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div className="league-leaders-card-footer">
        <Link to="/stats" className="league-leaders-view-full-link">
          View All Stats
        </Link>
      </div>
    </div>
  );
};

export default CompactStatsLeaders;

