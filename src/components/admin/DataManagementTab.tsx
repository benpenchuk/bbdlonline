import React, { useState } from 'react';
import { Download, Upload, RotateCcw, AlertCircle, CheckCircle, FileText, Shield } from 'lucide-react';
import { useData, useAuth } from '../../state';

const DataManagementTab: React.FC = () => {
  const { exportData, importData, resetToDemo } = useData();
  const { demoMode } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleExport = async () => {
    try {
      setLoading(true);
      setMessage(null);
      
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `bbdl-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      setMessage(null);
      
      const text = await file.text();
      const data = JSON.parse(text);
      
      // Basic validation
      if (!data.teams && !data.players && !data.games) {
        throw new Error('Invalid data format');
      }
      
      const success = await importData(data);
      if (success) {
        setMessage({ type: 'success', text: 'Data imported successfully! The page will refresh automatically.' });
        // Refresh the page to ensure all components update
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error('Import failed');
      }
    } catch (error) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: 'Failed to import data. Please check the file format and try again.' });
    } finally {
      setLoading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleReset = async () => {
    const confirmMessage = demoMode 
      ? 'Are you sure you want to reset all data to demo data? This will permanently delete all current data.\n\n⚠️ DEMO MODE: This action is irreversible!'
      : 'Are you sure you want to reset all data to demo data? This will permanently delete all current data.';
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    // Extra confirmation in demo mode
    if (demoMode) {
      if (!window.confirm('🛡️ DEMO MODE PROTECTION: Are you absolutely certain you want to proceed? Type "RESET" to confirm.')) {
        return;
      }
    }

    try {
      setLoading(true);
      setMessage(null);
      
      const success = await resetToDemo();
      if (success) {
        setMessage({ type: 'success', text: 'Data reset to demo successfully! The page will refresh automatically.' });
        // Refresh the page to ensure all components update
        setTimeout(() => window.location.reload(), 2000);
      } else {
        throw new Error('Reset failed');
      }
    } catch (error) {
      console.error('Reset failed:', error);
      setMessage({ type: 'error', text: 'Failed to reset data. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="data-management-tab">
      <div className="tab-header">
        <div className="tab-title-row">
          <h2>Data Management</h2>
          {demoMode && (
            <div className="demo-mode-badge">
              <Shield size={14} />
              <span>Demo Mode Active</span>
            </div>
          )}
        </div>
        <p>Export, import, or reset your league data</p>
      </div>

      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' && <CheckCircle size={16} />}
          {message.type === 'error' && <AlertCircle size={16} />}
          {message.type === 'info' && <FileText size={16} />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="data-actions">
        {/* Export Data */}
        <div className="data-action-card">
          <div className="action-header">
            <Download size={24} />
            <div>
              <h3>Export Data</h3>
              <p>Download all your league data as a JSON file</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? (
              <div className="loading-spinner small" />
            ) : (
              <>
                <Download size={16} />
                Export Data
              </>
            )}
          </button>
        </div>

        {/* Import Data */}
        <div className="data-action-card">
          <div className="action-header">
            <Upload size={24} />
            <div>
              <h3>Import Data</h3>
              <p>Upload a previously exported JSON file to restore data</p>
            </div>
          </div>
          <label className={`btn btn-secondary ${loading ? 'disabled' : ''}`}>
            {loading ? (
              <div className="loading-spinner small" />
            ) : (
              <>
                <Upload size={16} />
                Import Data
              </>
            )}
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              disabled={loading}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        {/* Reset to Demo */}
        <div className="data-action-card">
          <div className="action-header">
            <RotateCcw size={24} />
            <div>
              <h3>Reset to Demo</h3>
              <p>Clear all data and restore the original demo dataset</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={loading}
            className="btn btn-warning"
          >
            {loading ? (
              <div className="loading-spinner small" />
            ) : (
              <>
                <RotateCcw size={16} />
                Reset Demo Data
              </>
            )}
          </button>
        </div>
      </div>

      <div className="data-info">
        <h4>Data Format Information</h4>
        <ul>
          <li>Exported files contain teams, players, games, playoffs, and announcements</li>
          <li>Files are in JSON format and can be opened in any text editor</li>
          <li>Import will replace all current data with the uploaded data</li>
          <li>Reset will restore the original demo teams and sample games</li>
        </ul>
      </div>
    </div>
  );
};

export default DataManagementTab;
