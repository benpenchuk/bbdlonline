import React, { useState } from 'react';
import { Lock, Users, UserPlus, Calendar, Settings, Database, LogOut, Shield } from 'lucide-react';
import { getConfig } from '../core/config/appConfig';
import { useData } from '../state';
import { useAuth } from '../state';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AdminLogin from '../components/admin/AdminLogin';
import TeamsTab from '../components/admin/TeamsTab';
import PlayersTab from '../components/admin/PlayersTab';
import GamesTab from '../components/admin/GamesTab';
import SettingsTab from '../components/admin/SettingsTab';
import DataManagementTab from '../components/admin/DataManagementTab';
import DataDebugTab from '../components/admin/DataDebugTab';

type AdminTab = 'teams' | 'players' | 'games' | 'settings' | 'data' | 'debug';

const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('teams');
  
  const { teams, players, games, loading } = useData();
  const { isAuthenticated, logout, demoMode, toggleDemoMode } = useAuth();
  const config = getConfig();


  const handleLogout = () => {
    logout();
    setActiveTab('teams');
  };

  if (!isAuthenticated) {
    return <AdminLogin />;
  }

  if (loading) {
    return <LoadingSpinner message="Loading admin data..." />;
  }

  // Debug: Log data to console
  console.log('Admin Page - Teams:', teams.length, 'Players:', players.length, 'Games:', games.length);

  const adminTabs = [
    { id: 'teams', label: 'Teams', icon: Users },
    { id: 'players', label: 'Players', icon: UserPlus },
    { id: 'games', label: 'Games', icon: Calendar },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'data', label: 'Data Tools', icon: Database },
    { id: 'debug', label: 'Debug', icon: Settings }
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
          <div className="demo-mode-toggle">
            <label className="toggle-label">
              <Shield size={16} />
              <span>Demo Mode</span>
              <input
                type="checkbox"
                checked={demoMode}
                onChange={toggleDemoMode}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
            </label>
          </div>
          <button className="btn btn-outline" onClick={handleLogout}>
            <LogOut size={16} />
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
          />
        )}
        
        {activeTab === 'players' && (
          <PlayersTab 
            players={players} 
            teams={teams}
          />
        )}
        
        {activeTab === 'games' && (
          <GamesTab 
            games={games} 
            teams={teams}
          />
        )}
        
        {activeTab === 'settings' && (
          <SettingsTab />
        )}
        
        {activeTab === 'data' && (
          <DataManagementTab />
        )}
        
        {activeTab === 'debug' && (
          <DataDebugTab />
        )}
      </div>
    </div>
  );
};

export default AdminPage;
