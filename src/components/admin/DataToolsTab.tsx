import React, { useState } from 'react';
import { Download, Upload, RotateCcw, AlertTriangle, CheckCircle, Database, Calculator } from 'lucide-react';
import { dataApi } from '../../core/services/api';
import { useData } from '../../state';

interface DataToolsTabProps {
  onDataChange: () => void;
}

const DataToolsTab: React.FC<DataToolsTabProps> = ({ onDataChange }) => {
  const { recalculateStats } = useData();
  const [status, setStatus] = useState<{
    type: 'idle' | 'success' | 'error';
    message: string;
  }>({ type: 'idle', message: '' });
  const [loading, setLoading] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const response = await dataApi.exportAll();
      
      if (response.success) {
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bbdl-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        setStatus({
          type: 'success',
          message: 'Data exported successfully!'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to export data. Please try again.'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await dataApi.importAll(data);
      
      if (response.success) {
        setStatus({
          type: 'success',
          message: 'Data imported successfully!'
        });
        onDataChange();
      } else {
        setStatus({
          type: 'error',
          message: response.message || 'Failed to import data'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Invalid file format. Please select a valid JSON file.'
      });
    } finally {
      setLoading(false);
      event.target.value = ''; // Reset file input
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  const handleReset = async () => {
    try {
      setLoading(true);
      const response = await dataApi.resetAll();
      
      if (response.success) {
        setStatus({
          type: 'success',
          message: 'All data has been reset to defaults!'
        });
        onDataChange();
        setShowResetConfirm(false);
      } else {
        setStatus({
          type: 'error',
          message: response.message || 'Failed to reset data'
        });
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to reset data. Please try again.'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  const handleRecalculateStats = async () => {
    try {
      setLoading(true);
      await recalculateStats();
      setStatus({
        type: 'success',
        message: 'All league statistics have been recalculated!'
      });
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to recalculate statistics. Please try again.'
      });
    } finally {
      setLoading(false);
      setTimeout(() => setStatus({ type: 'idle', message: '' }), 5000);
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>Data Management Tools</h2>
        <Database size={24} />
      </div>

      {status.type !== 'idle' && (
        <div className={`alert alert-${status.type}`}>
          {status.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {status.message}
        </div>
      )}

      <div className="data-tools-grid">
        {/* Export Data */}
        <div className="data-tool-card">
          <div className="tool-header">
            <Download size={24} />
            <h3>Export Data</h3>
          </div>
          <p>
            Download all league data as a JSON file. This includes teams, players, 
            games, tournaments, and settings.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner small" />
            ) : (
              <Download size={16} />
            )}
            Export All Data
          </button>
        </div>

        {/* Import Data */}
        <div className="data-tool-card">
          <div className="tool-header">
            <Upload size={24} />
            <h3>Import Data</h3>
          </div>
          <p>
            Upload a previously exported JSON file to restore league data. 
            This will replace all current data.
          </p>
          <label className="btn btn-outline file-input-label">
            <Upload size={16} />
            Choose File to Import
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              className="file-input-hidden"
            />
          </label>
        </div>

        {/* Recalculate Stats */}
        <div className="data-tool-card">
          <div className="tool-header">
            <Calculator size={24} />
            <h3>Recalculate Statistics</h3>
          </div>
          <p>
            Manually recalculate all league statistics including wins, losses, 
            averages, streaks, and leaderboards. Stats are normally updated automatically.
          </p>
          <button 
            className="btn btn-primary"
            onClick={handleRecalculateStats}
            disabled={loading}
          >
            {loading ? (
              <div className="loading-spinner small" />
            ) : (
              <Calculator size={16} />
            )}
            Recalculate All Stats
          </button>
        </div>

        {/* Reset Data */}
        <div className="data-tool-card danger">
          <div className="tool-header">
            <RotateCcw size={24} />
            <h3>Reset All Data</h3>
          </div>
          <p>
            Reset all data to default values. This will delete all teams, players, 
            games, and tournaments. This action cannot be undone.
          </p>
          
          {!showResetConfirm ? (
            <button 
              className="btn btn-danger"
              onClick={() => setShowResetConfirm(true)}
              disabled={loading}
            >
              <RotateCcw size={16} />
              Reset All Data
            </button>
          ) : (
            <div className="reset-confirmation">
              <div className="confirmation-message">
                <AlertTriangle size={20} />
                <strong>Are you absolutely sure?</strong>
                <p>This will permanently delete all data and cannot be undone.</p>
              </div>
              <div className="confirmation-actions">
                <button 
                  className="btn btn-danger"
                  onClick={handleReset}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="loading-spinner small" />
                  ) : (
                    <RotateCcw size={16} />
                  )}
                  Yes, Reset Everything
                </button>
                <button 
                  className="btn btn-outline"
                  onClick={() => setShowResetConfirm(false)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Data Information */}
      <div className="data-info">
        <h3>Data Storage Information</h3>
        <div className="info-grid">
          <div className="info-item">
            <strong>Storage Type:</strong>
            <span>Local Storage (Browser)</span>
          </div>
          <div className="info-item">
            <strong>Backup Recommendation:</strong>
            <span>Export data regularly as backup</span>
          </div>
          <div className="info-item">
            <strong>Data Persistence:</strong>
            <span>Data persists until browser storage is cleared</span>
          </div>
          <div className="info-item">
            <strong>Future Migration:</strong>
            <span>Export format compatible with future backend integration</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataToolsTab;
