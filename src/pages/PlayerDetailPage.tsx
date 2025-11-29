import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { format } from 'date-fns';
import {
  ArrowLeft,
  Trophy,
  Target,
  Flame,
  TrendingUp,
  Users,
  Calendar,
  ChevronDown,
  Award,
  Percent,
} from 'lucide-react';
import { useData } from '../state';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ProfilePicture from '../components/common/ProfilePicture';
import {
  computePlayerSeasonStats,
  getPlayerGameLog,
  computePartnerChemistry,
  getFullName,
  ComputedPlayerStats,
  PlayerGameLog,
  PartnerChemistry,
} from '../core/utils/statsHelpers';

// Type for navigation state
interface LocationState {
  from?: string;
  fromLabel?: string;
  scrollY?: number;
}

const PlayerDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const {
    players,
    teams,
    games,
    playerTeams,
    playerGameStats,
    seasons,
    activeSeason,
    loading,
  } = useData();

  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');

  // Get the source page from location state, default to Stats
  const locationState = location.state as LocationState | null;
  const backPath = locationState?.from || '/stats';
  const backLabel = locationState?.fromLabel || 'Stats';
  const savedScrollY = locationState?.scrollY ?? 0;

  // Scroll to top when navigating to this page (new player)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // Handle back navigation with scroll restoration
  const handleBack = () => {
    navigate(backPath, { state: { restoreScrollY: savedScrollY } });
  };

  // Find player by slug
  const player = useMemo(() => {
    return players.find(p => p.slug === slug);
  }, [players, slug]);

  // Set default season when data loads
  React.useEffect(() => {
    if (!selectedSeasonId && activeSeason) {
      setSelectedSeasonId(activeSeason.id);
    } else if (!selectedSeasonId && seasons.length > 0) {
      const sorted = [...seasons].sort((a, b) => b.year - a.year);
      setSelectedSeasonId(sorted[0].id);
    }
  }, [activeSeason, seasons, selectedSeasonId]);

  // Get player's team(s) for the selected season
  const playerTeamEntries = useMemo(() => {
    if (!player || !selectedSeasonId) return [];
    return playerTeams.filter(
      pt => pt.playerId === player.id && pt.seasonId === selectedSeasonId && pt.status === 'active'
    );
  }, [player, selectedSeasonId, playerTeams]);

  const playerTeamsDisplay = useMemo(() => {
    return playerTeamEntries
      .map(pt => teams.find(t => t.id === pt.teamId))
      .filter(Boolean);
  }, [playerTeamEntries, teams]);

  // Compute player stats for selected season
  const playerStats: ComputedPlayerStats | null = useMemo(() => {
    if (!player || !selectedSeasonId) return null;
    return computePlayerSeasonStats(
      player.id,
      selectedSeasonId,
      games,
      playerGameStats,
      playerTeams,
      players,
      teams
    );
  }, [player, selectedSeasonId, games, playerGameStats, playerTeams, players, teams]);

  // Get game log
  const gameLog: PlayerGameLog[] = useMemo(() => {
    if (!player || !selectedSeasonId) return [];
    return getPlayerGameLog(
      player.id,
      selectedSeasonId,
      games,
      playerGameStats,
      playerTeams,
      players,
      teams
    );
  }, [player, selectedSeasonId, games, playerGameStats, playerTeams, players, teams]);

  // Get partner chemistry
  const partnerChemistry: PartnerChemistry[] = useMemo(() => {
    if (!player || !selectedSeasonId) return [];
    return computePartnerChemistry(
      player.id,
      selectedSeasonId,
      games,
      playerGameStats,
      playerTeams,
      players
    );
  }, [player, selectedSeasonId, games, playerGameStats, playerTeams, players]);

  // Format date
  const formatDate = (date: Date | null) => {
    if (!date) return 'TBD';
    return format(new Date(date), 'MMM d, yyyy');
  };

  // Format streak
  const formatStreak = (streak: { type: 'W' | 'L' | null; length: number }) => {
    if (!streak.type || streak.length === 0) return '-';
    return `${streak.type}${streak.length}`;
  };

  if (loading) {
    return <LoadingSpinner message="Loading player details..." />;
  }

  if (!player) {
    return (
      <div className="page-container">
        <div className="player-detail-not-found">
          <h2>Player Not Found</h2>
          <p>The player you're looking for doesn't exist or has been removed.</p>
          <button className="btn btn-primary" onClick={() => navigate('/stats')}>
            <ArrowLeft size={16} />
            Back to Stats
          </button>
        </div>
      </div>
    );
  }

  const selectedSeason = seasons.find(s => s.id === selectedSeasonId);

  return (
    <div className="page-container player-detail-page">
      {/* Back Navigation */}
      <button className="player-detail-back" onClick={handleBack}>
        <ArrowLeft size={18} />
        <span>Back to {backLabel}</span>
      </button>

      {/* Player Header */}
      <header className="player-detail-header">
        <div className="player-detail-avatar">
          <ProfilePicture
            imageUrl={player.avatarUrl}
            fallbackImage="player"
            alt={getFullName(player)}
            size={120}
          />
        </div>
        
        <div className="player-detail-info">
          <h1 className="player-detail-name">{getFullName(player)}</h1>
          
          {player.nickname && (
            <span className="player-detail-nickname">"{player.nickname}"</span>
          )}
          
          <div className="player-detail-meta">
            {playerTeamsDisplay.length > 0 && (
              <div className="player-detail-teams">
                {playerTeamsDisplay.map((team) => (
                  <Link
                    key={team!.id}
                    to={`/team/${team!.id}`}
                    state={{ 
                      from: `/players/${slug}`, 
                      fromLabel: `${player?.firstName} ${player?.lastName}`,
                      scrollY: window.scrollY 
                    }}
                    className="player-detail-team-badge"
                  >
                    <ProfilePicture
                      imageUrl={team!.logoUrl}
                      fallbackImage="team"
                      alt={team!.name}
                      size={24}
                    />
                    <span>{team!.name}</span>
                  </Link>
                ))}
              </div>
            )}
            
            {player.hometownCity && player.hometownState && (
              <span className="player-detail-hometown">
                {player.hometownCity}, {player.hometownState}
              </span>
            )}
            
            {player.dominantHand && (
              <span className="player-detail-hand">
                {player.dominantHand}-handed
              </span>
            )}
          </div>
        </div>

        {/* Season Selector */}
        <div className="player-detail-season-selector">
          <label htmlFor="player-season-select">Season</label>
          <div className="player-season-select-wrapper">
            <select
              id="player-season-select"
              value={selectedSeasonId}
              onChange={(e) => setSelectedSeasonId(e.target.value)}
            >
              {seasons
                .sort((a, b) => b.year - a.year)
                .map(season => (
                  <option key={season.id} value={season.id}>
                    {season.name}
                  </option>
                ))}
            </select>
            <ChevronDown size={18} />
          </div>
        </div>
      </header>

      {/* Summary Stats Cards */}
      <section className="player-detail-summary">
        <h2 className="player-detail-section-title">
          <TrendingUp size={20} />
          Season Summary
        </h2>

        {playerStats && playerStats.gamesPlayed > 0 ? (
          <div className="player-summary-cards">
            <div className="player-summary-card">
              <div className="player-summary-icon">
                <Calendar size={20} />
              </div>
              <div className="player-summary-value">{playerStats.gamesPlayed}</div>
              <div className="player-summary-label">Games Played</div>
            </div>

            <div className="player-summary-card">
              <div className="player-summary-icon win">
                <Trophy size={20} />
              </div>
              <div className="player-summary-value">{playerStats.wins}</div>
              <div className="player-summary-label">Wins</div>
            </div>

            <div className="player-summary-card">
              <div className="player-summary-icon">
                <Percent size={20} />
              </div>
              <div className="player-summary-value">{playerStats.winPct.toFixed(1)}%</div>
              <div className="player-summary-label">Win Rate</div>
            </div>

            <div className="player-summary-card">
              <div className="player-summary-icon cups">
                <Award size={20} />
              </div>
              <div className="player-summary-value">{playerStats.totalCups}</div>
              <div className="player-summary-label">Total Cups</div>
            </div>

            <div className="player-summary-card">
              <div className="player-summary-icon">
                <Target size={20} />
              </div>
              <div className="player-summary-value">{playerStats.cupsPerGame.toFixed(1)}</div>
              <div className="player-summary-label">Cups/Game</div>
            </div>

            <div className="player-summary-card">
              <div className="player-summary-icon accuracy">
                <Target size={20} />
              </div>
              <div className="player-summary-value">
                {playerStats.totalThrows > 0 ? `${playerStats.accuracy.toFixed(1)}%` : '-'}
              </div>
              <div className="player-summary-label">Accuracy</div>
            </div>

            <div className="player-summary-card">
              <div className={`player-summary-icon ${playerStats.currentStreak.type === 'W' ? 'streak-w' : playerStats.currentStreak.type === 'L' ? 'streak-l' : ''}`}>
                <TrendingUp size={20} />
              </div>
              <div className="player-summary-value">{formatStreak(playerStats.currentStreak)}</div>
              <div className="player-summary-label">Current Streak</div>
            </div>

            <div className="player-summary-card">
              <div className={`player-summary-icon ${playerStats.heat >= 5 ? 'heat-hot' : playerStats.heat >= 3 ? 'heat-warm' : ''}`}>
                <Flame size={20} />
              </div>
              <div className="player-summary-value">{playerStats.heat.toFixed(1)}</div>
              <div className="player-summary-label">Heat (Last 5)</div>
            </div>
          </div>
        ) : (
          <div className="player-detail-empty">
            <p>No stats available for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>

      {/* Game Log */}
      <section className="player-detail-gamelog">
        <h2 className="player-detail-section-title">
          <Calendar size={20} />
          Game Log
        </h2>

        {gameLog.length > 0 ? (
          <div className="player-gamelog-table-container">
            <table className="player-gamelog-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Opponent</th>
                  <th>Partner</th>
                  <th>Result</th>
                  <th>Score</th>
                  <th>Cups</th>
                  <th>Throws</th>
                  <th>Acc%</th>
                </tr>
              </thead>
              <tbody>
                {gameLog.map((game) => (
                  <tr key={game.gameId}>
                    <td className="gamelog-date">{formatDate(game.date)}</td>
                    <td className="gamelog-opponent">{game.opponentName}</td>
                    <td className="gamelog-partner">
                      {game.partnerName ? (
                        <Link 
                          to={`/players/${players.find(p => p.id === game.partnerId)?.slug || ''}`}
                          state={{ from: `/players/${player?.slug}`, fromLabel: player ? getFullName(player) : 'Player' }}
                          className="gamelog-partner-link"
                        >
                          {game.partnerName}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className={`gamelog-result ${game.result === 'W' ? 'result-win' : 'result-loss'}`}>
                      {game.result}
                    </td>
                    <td className="gamelog-score">{game.score}</td>
                    <td className="gamelog-cups">{game.cupsHit}</td>
                    <td className="gamelog-throws">{game.throws}</td>
                    <td className="gamelog-accuracy">
                      {game.throws > 0 ? `${game.accuracy.toFixed(1)}%` : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="player-detail-empty">
            <p>No games recorded for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>

      {/* Partner Chemistry */}
      <section className="player-detail-chemistry">
        <h2 className="player-detail-section-title">
          <Users size={20} />
          Partner Chemistry
        </h2>

        {partnerChemistry.length > 0 ? (
          <div className="partner-chemistry-grid">
            {partnerChemistry.map((partner) => (
              <Link
                key={partner.partnerId}
                to={`/players/${partner.partnerSlug}`}
                state={{ from: `/players/${player?.slug}`, fromLabel: player ? getFullName(player) : 'Player' }}
                className="partner-chemistry-card"
              >
                <div className="partner-chemistry-avatar">
                  <ProfilePicture
                    imageUrl={partner.avatarUrl}
                    fallbackImage="player"
                    alt={partner.partnerName}
                    size={48}
                  />
                </div>
                <div className="partner-chemistry-info">
                  <span className="partner-chemistry-name">{partner.partnerName}</span>
                  <div className="partner-chemistry-stats">
                    <span className="partner-stat">
                      <strong>{partner.gamesPlayed}</strong> games
                    </span>
                    <span className="partner-stat partner-record">
                      <strong>{partner.wins}-{partner.losses}</strong>
                    </span>
                    <span className="partner-stat">
                      <strong>{partner.winPct.toFixed(0)}%</strong> win
                    </span>
                    <span className="partner-stat partner-cups">
                      <strong>{partner.avgCupsPerGame.toFixed(1)}</strong> cups/g
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="player-detail-empty">
            <p>No partner data available for {selectedSeason?.name || 'this season'}.</p>
          </div>
        )}
      </section>
    </div>
  );
};

export default PlayerDetailPage;

