import React from 'react';

export type ViewMode = 'player' | 'team';

interface ViewToggleProps {
  activeView: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

const ViewToggle: React.FC<ViewToggleProps> = ({ activeView, onViewChange }) => {
  return (
    <div className="bbdl-view-toggle" role="tablist" aria-label="View mode">
      <button
        role="tab"
        aria-selected={activeView === 'player'}
        aria-controls="players-content"
        className={`bbdl-view-toggle-btn ${activeView === 'player' ? 'active' : ''}`}
        onClick={() => onViewChange('player')}
      >
        By Player
      </button>
      <button
        role="tab"
        aria-selected={activeView === 'team'}
        aria-controls="players-content"
        className={`bbdl-view-toggle-btn ${activeView === 'team' ? 'active' : ''}`}
        onClick={() => onViewChange('team')}
      >
        By Team
      </button>
      <div 
        className="bbdl-view-toggle-indicator" 
        data-active={activeView}
      />
    </div>
  );
};

export default ViewToggle;

