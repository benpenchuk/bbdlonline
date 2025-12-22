import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Calendar, Star } from 'lucide-react';
import { useData } from '../../state';
import { Season } from '../../core/types';
import { format } from 'date-fns';
import SeasonFormModal from './SeasonFormModal';

const SeasonsTab: React.FC = () => {
  const {
    seasons,
    activeSeason,
    updateSeason,
    deleteSeason,
    refreshData,
  } = useData();

  const [showModal, setShowModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);

  const sortedSeasons = useMemo(() => {
    return [...seasons].sort((a, b) => {
      // Active season first, then by year descending
      if (a.id === activeSeason?.id) return -1;
      if (b.id === activeSeason?.id) return 1;
      return b.year - a.year;
    });
  }, [seasons, activeSeason]);

  const handleOpenModal = (season?: Season) => {
    if (season) {
      setEditingSeason(season);
    } else {
      setEditingSeason(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingSeason(null);
  };

  const handleSave = async () => {
    await refreshData();
    handleCloseModal();
  };

  const handleDelete = async (id: string) => {
    const season = seasons.find(s => s.id === id);
    const seasonName = season?.name || 'this season';

    if (!window.confirm(`Are you sure you want to delete "${seasonName}"?`)) {
      return;
    }

    try {
      await deleteSeason(id);
      await refreshData();
    } catch (error) {
      console.error('Failed to delete season:', error);
      alert('Failed to delete season. Please try again.');
    }
  };

  const handleSetActive = async (id: string) => {
    try {
      // Set all seasons to not active first
      const updatePromises = seasons
        .filter(s => s.status === 'active')
        .map(s => updateSeason(s.id, { status: 'completed' as const }));

      await Promise.all(updatePromises);

      // Set selected season to active
      await updateSeason(id, { status: 'active' });
      await refreshData();
    } catch (error) {
      console.error('Failed to set active season:', error);
      alert('Failed to set active season. Please try again.');
    }
  };

  const getStatusBadge = (season: Season) => {
    const isActive = season.id === activeSeason?.id;
    
    if (isActive) {
      return (
        <span className="status-badge status-success">
          <Star size={14} />
          Active
        </span>
      );
    }

    switch (season.status) {
      case 'upcoming':
        return (
          <span className="status-badge status-info">
            <Calendar size={14} />
            Upcoming
          </span>
        );
      case 'active':
        return (
          <span className="status-badge status-success">
            <CheckCircle size={14} />
            Active
          </span>
        );
      case 'completed':
        return (
          <span className="status-badge status-inactive">
            <CheckCircle size={14} />
            Completed
          </span>
        );
      case 'archived':
        return (
          <span className="status-badge status-inactive">
            <XCircle size={14} />
            Archived
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <div>
          <h2>Seasons Management</h2>
          <p>Manage league seasons and set the active season</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={16} />
          <span>New Season</span>
        </button>
      </div>

      <div className="admin-table-container">
        {sortedSeasons.length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <h3>No seasons yet</h3>
            <p>Create your first season to get started</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={16} />
              <span>Create Season</span>
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Year</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedSeasons.map(season => {
                const isActive = season.id === activeSeason?.id;
                return (
                  <tr key={season.id} className={isActive ? 'row-active' : ''}>
                    <td>
                      <div className="table-cell-main">
                        {season.name}
                        {isActive && (
                          <span title="Active Season">
                            <Star size={14} className="inline-icon" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{season.year}</td>
                    <td>{format(new Date(season.startDate), 'MMM d, yyyy')}</td>
                    <td>{format(new Date(season.endDate), 'MMM d, yyyy')}</td>
                    <td>{getStatusBadge(season)}</td>
                    <td>
                      <div className="table-actions">
                        {!isActive && (
                          <button
                            className="btn-icon"
                            onClick={() => handleSetActive(season.id)}
                            title="Set as active season"
                          >
                            <Star size={16} />
                          </button>
                        )}
                        <button
                          className="btn-icon"
                          onClick={() => handleOpenModal(season)}
                          title="Edit season"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn-icon btn-icon-danger"
                          onClick={() => handleDelete(season.id)}
                          title="Delete season"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Season Form Modal */}
      {showModal && (
        <SeasonFormModal
          season={editingSeason}
          onClose={handleCloseModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
};

export default SeasonsTab;

