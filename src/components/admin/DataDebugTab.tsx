import React from 'react';
import { Database, Users, Calendar, Trophy } from 'lucide-react';
import { useData } from '../../state';

const DataDebugTab: React.FC = () => {
  const { teams, players, games, playoffs, loading } = useData();

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Data Debug Information</h2>
        <p>Debug information about the current data state</p>
      </div>

      <div className="debug-info">
        <div className="debug-section">
          <h3>Loading State</h3>
          <p>Loading: {loading ? 'Yes' : 'No'}</p>
        </div>

        <div className="debug-section">
          <h3>Data Counts</h3>
          <div className="debug-grid">
            <div className="debug-item">
              <Users size={24} />
              <span>Teams: {teams.length}</span>
            </div>
            <div className="debug-item">
              <Users size={24} />
              <span>Players: {players.length}</span>
            </div>
            <div className="debug-item">
              <Calendar size={24} />
              <span>Games: {games.length}</span>
            </div>
            <div className="debug-item">
              <Trophy size={24} />
              <span>Playoffs: {playoffs.length}</span>
            </div>
          </div>
        </div>

        <div className="debug-section">
          <h3>LocalStorage Keys</h3>
          <div className="debug-list">
            <p>bbdl-teams: {localStorage.getItem('bbdl-teams') ? 'Present' : 'Missing'}</p>
            <p>bbdl-players: {localStorage.getItem('bbdl-players') ? 'Present' : 'Missing'}</p>
            <p>bbdl-games: {localStorage.getItem('bbdl-games') ? 'Present' : 'Missing'}</p>
            <p>bbdl-playoffs: {localStorage.getItem('bbdl-playoffs') ? 'Present' : 'Missing'}</p>
            <p>bbdl-announcements: {localStorage.getItem('bbdl-announcements') ? 'Present' : 'Missing'}</p>
          </div>
        </div>

        <div className="debug-section">
          <h3>Sample Data</h3>
          {teams.length > 0 && (
            <div>
              <h4>First Team:</h4>
              <pre>{JSON.stringify(teams[0], null, 2)}</pre>
            </div>
          )}
          {players.length > 0 && (
            <div>
              <h4>First Player:</h4>
              <pre>{JSON.stringify(players[0], null, 2)}</pre>
            </div>
          )}
        </div>

        <div className="debug-section">
          <h3>Actions</h3>
          <button 
            className="btn btn-secondary"
            onClick={() => {
              console.log('Current state:', { teams, players, games, playoffs });
              console.log('LocalStorage contents:', {
                teams: localStorage.getItem('bbdl-teams'),
                players: localStorage.getItem('bbdl-players'),
                games: localStorage.getItem('bbdl-games'),
                playoffs: localStorage.getItem('bbdl-playoffs'),
                announcements: localStorage.getItem('bbdl-announcements')
              });
            }}
          >
            <Database size={16} />
            Log Debug Info to Console
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataDebugTab;
