import React, { useState, useEffect } from 'react';
import { BarChart3, Trophy, Target, Zap, Award, Users, Swords } from 'lucide-react';
import { playersApi, teamsApi, gamesApi } from '../services/api';
import { Player, Team, Game } from '../types';
import { calculateSeasonStats, generateLeaderboard, calculateHeadToHead } from '../utils/statsCalculations';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/common/StatCard';
import LeaderboardTable from '../components/stats/LeaderboardTable';
import TeamStatsPanel from '../components/stats/TeamStatsPanel';
import HeadToHeadComparison from '../components/stats/HeadToHeadComparison';
import NotableRecords from '../components/stats/NotableRecords';

const StatsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [games, setGames] = useState<Game[]>([]);
  
  // Active tabs and selections
  const [activeLeaderboard, setActiveLeaderboard] = useState<'wins' | 'average' | 'shutouts' | 'blowouts' | 'clutch' | 'streak'>('wins');
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  const [h2hTeam1, setH2hTeam1] = useState<string>('');
  const [h2hTeam2, setH2hTeam2] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [playersRes, teamsRes, gamesRes] = await Promise.all([
          playersApi.getAll(),
          teamsApi.getAll(),
          gamesApi.getAll()
        ]);

        if (playersRes.success) setPlayers(playersRes.data);
        if (teamsRes.success) setTeams(teamsRes.data);
        if (gamesRes.success) setGames(gamesRes.data);
      } catch (error) {
        console.error('Failed to load stats data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading statistics..." />;
  }

  const seasonStats = calculateSeasonStats(games);
  const leaderboards = {
    wins: generateLeaderboard(players, games, 'wins'),
    average: generateLeaderboard(players, games, 'average'),
    shutouts: generateLeaderboard(players, games, 'shutouts'),
    blowouts: generateLeaderboard(players, games, 'blowouts'),
    clutch: generateLeaderboard(players, games, 'clutch'),
    streak: generateLeaderboard(players, games, 'streak')
  };

  const headToHeadData = h2hTeam1 && h2hTeam2 && h2hTeam1 !== h2hTeam2 
    ? calculateHeadToHead(h2hTeam1, h2hTeam2, games)
    : null;

  const leaderboardTabs = [
    { key: 'wins', label: 'Most Wins', icon: Trophy },
    { key: 'average', label: 'Highest Average', icon: Target },
    { key: 'shutouts', label: 'Most Shutouts', icon: Award },
    { key: 'blowouts', label: 'Most Blowouts', icon: Zap },
    { key: 'clutch', label: 'Most Clutch Wins', icon: Users },
    { key: 'streak', label: 'Longest Win Streak', icon: BarChart3 }
  ] as const;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <h1>League Statistics</h1>
          <p>Comprehensive analytics and player rankings</p>
        </div>
      </div>

      <div className="stats-layout">
        {/* Season Overview */}
        <section className="stats-section">
          <h2 className="section-title">Season Overview</h2>
          <div className="stat-cards-grid">
            <StatCard
              title="Total Games"
              value={seasonStats.totalGames}
              icon={BarChart3}
              color="blue"
            />
            <StatCard
              title="Completed Games"
              value={seasonStats.completedGames}
              icon={Trophy}
              color="green"
            />
            <StatCard
              title="Average Score"
              value={seasonStats.averageScore.toFixed(1)}
              icon={Target}
              color="purple"
            />
            <StatCard
              title="Highest Score"
              value={seasonStats.highestScore}
              icon={Zap}
              color="orange"
            />
            <StatCard
              title="Shutout Games"
              value={seasonStats.shutouts}
              icon={Award}
              color="red"
            />
            <StatCard
              title="Blowout Games"
              value={seasonStats.blowouts}
              icon={Users}
              color="gray"
            />
          </div>
        </section>

        {/* Leaderboards */}
        <section className="stats-section">
          <h2 className="section-title">Player Leaderboards</h2>
          
          <div className="leaderboard-tabs">
            {leaderboardTabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  className={`tab-btn ${activeLeaderboard === tab.key ? 'tab-btn-active' : ''}`}
                  onClick={() => setActiveLeaderboard(tab.key)}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <LeaderboardTable
            entries={leaderboards[activeLeaderboard]}
            players={players}
            teams={teams}
            category={activeLeaderboard}
          />
        </section>

        {/* Team Stats */}
        <section className="stats-section">
          <h2 className="section-title">Team Performance</h2>
          
          <div className="team-selector">
            <select
              value={selectedTeam}
              onChange={(e) => setSelectedTeam(e.target.value)}
              className="team-select"
            >
              <option value="">Select a team...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {selectedTeam && (
            <TeamStatsPanel
              teamId={selectedTeam}
              teams={teams}
              games={games}
              players={players}
            />
          )}
        </section>

        {/* Head-to-Head Comparison */}
        <section className="stats-section">
          <div className="section-header">
            <h2 className="section-title">Head-to-Head Comparison</h2>
            <Swords className="section-icon" size={20} />
          </div>
          
          <div className="h2h-selectors">
            <select
              value={h2hTeam1}
              onChange={(e) => setH2hTeam1(e.target.value)}
              className="h2h-select"
            >
              <option value="">Select Team 1...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === h2hTeam2}>
                  {team.name}
                </option>
              ))}
            </select>

            <div className="vs-indicator">VS</div>

            <select
              value={h2hTeam2}
              onChange={(e) => setH2hTeam2(e.target.value)}
              className="h2h-select"
            >
              <option value="">Select Team 2...</option>
              {teams.map(team => (
                <option key={team.id} value={team.id} disabled={team.id === h2hTeam1}>
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          {headToHeadData && (
            <HeadToHeadComparison
              comparison={headToHeadData}
              teams={teams}
            />
          )}
        </section>

        {/* Notable Records */}
        <section className="stats-section">
          <h2 className="section-title">Notable Records & Achievements</h2>
          <NotableRecords
            players={players}
            teams={teams}
            games={games}
          />
        </section>
      </div>
    </div>
  );
};

export default StatsPage;
