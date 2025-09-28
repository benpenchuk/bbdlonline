import React, { useState } from 'react';
import { Save, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import { getConfig, saveConfig, AppConfig } from '../../core/config/appConfig';

const SettingsTab: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(getConfig());
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSave = () => {
    // Validate config
    const newErrors: Record<string, string> = {};
    
    if (!config.league.name.trim()) {
      newErrors.leagueName = 'League name is required';
    }
    
    if (!config.league.season.trim()) {
      newErrors.season = 'Season is required';
    }
    
    if (config.league.pointLimit < 1 || config.league.pointLimit > 50) {
      newErrors.pointLimit = 'Point limit must be between 1 and 50';
    }
    
    if (!config.admin.password.trim()) {
      newErrors.password = 'Admin password is required';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setSaveStatus('error');
      return;
    }

    try {
      setSaveStatus('saving');
      saveConfig(config);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    const newConfig = { ...config };
    let current: any = newConfig;
    
    for (let i = 0; i < keys.length - 1; i++) {
      current = current[keys[i]];
    }
    
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
    
    // Clear error for this field
    if (errors[path]) {
      setErrors({ ...errors, [path]: '' });
    }
  };

  const handleSectionToggle = (section: keyof typeof config.homepage.sections) => {
    handleInputChange(`homepage.sections.${section}`, !config.homepage.sections[section]);
  };

  return (
    <div className="admin-tab-content">
      <div className="tab-header">
        <h2>League Settings</h2>
        <button 
          className="btn btn-primary"
          onClick={handleSave}
          disabled={saveStatus === 'saving'}
        >
          {saveStatus === 'saving' ? (
            <div className="loading-spinner small" />
          ) : (
            <Save size={16} />
          )}
          Save Changes
        </button>
      </div>

      {saveStatus === 'success' && (
        <div className="alert alert-success">
          <CheckCircle size={16} />
          Settings saved successfully!
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="alert alert-error">
          <AlertCircle size={16} />
          Please fix the errors below and try again.
        </div>
      )}

      <div className="settings-form">
        {/* League Information */}
        <div className="settings-section">
          <h3>League Information</h3>
          
          <div className="form-group">
            <label htmlFor="league-name">League Name</label>
            <input
              id="league-name"
              type="text"
              value={config.league.name}
              onChange={(e) => handleInputChange('league.name', e.target.value)}
              className={`form-input ${errors.leagueName ? 'input-error' : ''}`}
            />
            {errors.leagueName && <span className="error-text">{errors.leagueName}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="season">Season</label>
            <input
              id="season"
              type="text"
              value={config.league.season}
              onChange={(e) => handleInputChange('league.season', e.target.value)}
              className={`form-input ${errors.season ? 'input-error' : ''}`}
            />
            {errors.season && <span className="error-text">{errors.season}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="point-limit">Point Limit</label>
            <input
              id="point-limit"
              type="number"
              min="1"
              max="50"
              value={config.league.pointLimit}
              onChange={(e) => handleInputChange('league.pointLimit', parseInt(e.target.value))}
              className={`form-input ${errors.pointLimit ? 'input-error' : ''}`}
            />
            {errors.pointLimit && <span className="error-text">{errors.pointLimit}</span>}
          </div>
        </div>

        {/* Contact Information */}
        <div className="settings-section">
          <h3>Contact Information</h3>
          
          <div className="form-group">
            <label htmlFor="contact-email">Contact Email</label>
            <input
              id="contact-email"
              type="email"
              value={config.league.contactEmail}
              onChange={(e) => handleInputChange('league.contactEmail', e.target.value)}
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label htmlFor="contact-phone">Contact Phone</label>
            <input
              id="contact-phone"
              type="text"
              value={config.league.contactPhone}
              onChange={(e) => handleInputChange('league.contactPhone', e.target.value)}
              className="form-input"
            />
          </div>
        </div>

        {/* Homepage Sections */}
        <div className="settings-section">
          <h3>Homepage Sections</h3>
          <p className="section-description">
            Control which sections are displayed on the homepage
          </p>
          
          <div className="checkbox-grid">
            {Object.entries(config.homepage.sections).map(([key, enabled]) => (
              <label key={key} className="checkbox-item">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={() => handleSectionToggle(key as keyof typeof config.homepage.sections)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">
                  {config.homepage.sectionTitles[key as keyof typeof config.homepage.sectionTitles]}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Admin Settings */}
        <div className="settings-section">
          <h3>Admin Settings</h3>
          
          <div className="form-group">
            <label htmlFor="admin-password">Admin Password</label>
            <input
              id="admin-password"
              type="password"
              value={config.admin.password}
              onChange={(e) => handleInputChange('admin.password', e.target.value)}
              className={`form-input ${errors.password ? 'input-error' : ''}`}
            />
            {errors.password && <span className="error-text">{errors.password}</span>}
            <small className="form-help">
              Change the password required to access the admin panel
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsTab;
