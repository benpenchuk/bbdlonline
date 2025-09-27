import React, { useState, useEffect } from 'react';
import { Lock, Users, UserPlus, Calendar, Settings, Database, Download, Upload, RotateCcw } from 'lucide-react';
import { getConfig, saveConfig, resetConfig } from '../config/appConfig';
import { teamsApi, playersApi, gamesApi, dataApi } from '../services/api';
import { Team, Player, Game } from '../types';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLogin from '../components/admin/AdminLogin';
import TeamsTab from '../components/admin/TeamsTab';
import PlayersTab from '../components/admin/PlayersTab';
import GamesTab from '../components/admin/GamesTab';
import SettingsTab from '../components/admin/SettingsTab';
import DataToolsTab from '../components/admin/DataToolsTab';

type AdminTab = 'teams' | 'players' | 'games' | 'settings' | 'data';

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  const [teams, setTeams] = useState<Team[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [games, setGames] = useState<Game[]>([]);

  const config = getConfig();

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teamsRes, playersRes, gamesRes] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        gamesApi.getAll()
      ]);

      if (teamsRes.success) setTeams(teamsRes.data);
      if (playersRes.success) setPlayers(playersRes.data);
      if (gamesRes.success) setGames(gamesRes.data);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (password: string) => {
    if (password === config.admin.password) {
      setIsAuthenticated(true);
    } else {
      throw new Error('Incorrect password');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setActiveTab('teams');
  };

  if (!isAuthenticated) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading admin data..." />;
  }

  const adminTabs = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'players', label: 'Players', icon: UserPlus },
    { id: 'games', label: 'Games', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'data', label: 'Data Tools', icon: Database }
  ] as const;

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-section">
          <div className="admin-header">
            <Lock size={24} />
            <h1>Admin Panel</h1>
          </div>
          <p>Manage teams, players, games, and league settings</p>
        </div>
        
        <div className="page-actions">
          <button className="btn btn-outline" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="admin-tabs">
        {adminTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`admin-tab ${activeTab === tab.id ? 'admin-tab-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="admin-content">
        {activeTab === 'teams' && (
          <TeamsTab 
            teams={teams} 
            players={players}
            onDataChange={loadData}
          />
        )}
        
        {activeTab === 'players' && (
          <PlayersTab 
            players={players} 
            teams={teams}
            onDataChange={loadData}
          />
        )}
        
        {activeTab === 'games' && (
          <GamesTab 
            games={games} 
            teams={teams}
            onDataChange={loadData}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
        
        {activeTab === 'data' && (
          <DataToolsTab 
            onDataChange={loadData}
          />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
