import React from 'react';
import { X } from 'lucide-react';
import { GameStatus, Team } from '../../core/types';

interface FilterPanelProps {
  statusFilter: GameStatus[];
  setStatusFilter: (statuses: GameStatus[]) => void;
  teamFilter: string;
  setTeamFilter: (teamId: string) => void;
  teams: Team[];
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  statusFilter,
  setStatusFilter,
  teamFilter,
  setTeamFilter,
  teams
}) => {
  const handleStatusChange = (status: GameStatus) => {
    if (statusFilter.includes(status)) {
      setStatusFilter(statusFilter.filter(s => s !== status));
    } else {
      setStatusFilter([...statusFilter, status]);
    }
  };

  const clearAllFilters = () => {
    setStatusFilter([]);
    setTeamFilter('');
  };

  const hasActiveFilters = statusFilter.length > 0 || teamFilter;

  return (
    <div className="filter-panel">
      <div className="filter-header">
        <h3>Filters</h3>
        {hasActiveFilters && (
          <button className="clear-filters-btn" onClick={clearAllFilters}>
            <X size={16} />
            Clear All
          </button>
        )}
      </div>

      <div className="filter-sections">
        {/* Status Filter */}
        <div className="filter-section">
          <h4>Status</h4>
          <div className="filter-options">
            {(['scheduled', 'completed', 'cancelled'] as GameStatus[]).map(status => (
              <label key={status} className="filter-checkbox">
                <input
                  type="checkbox"
                  checked={statusFilter.includes(status)}
                  onChange={() => handleStatusChange(status)}
                />
                <span className="checkmark"></span>
                <span className="filter-label">
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Team Filter */}
        <div className="filter-section">
          <h4>Team</h4>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="filter-select"
          >
            <option value="">All Teams</option>
            {teams.map(team => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterPanel;
