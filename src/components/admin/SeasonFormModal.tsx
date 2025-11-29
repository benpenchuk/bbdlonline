import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle } from 'lucide-react';
import { Season, SeasonStatus } from '../../core/types';
import { useData } from '../../state';
import { generateSeasonSlug, ensureUniqueSlug } from '../../core/utils/slugHelpers';

interface SeasonFormModalProps {
  season?: Season | null; // null for create, Season object for edit
  onClose: () => void;
  onSave: () => void;
}

const SeasonFormModal: React.FC<SeasonFormModalProps> = ({ season, onClose, onSave }) => {
  const { createSeason, updateSeason, seasons } = useData();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState(season?.name || '');
  const [year, setYear] = useState(season?.year?.toString() || new Date().getFullYear().toString());
  const [startDate, setStartDate] = useState(
    season?.startDate ? new Date(season.startDate).toISOString().split('T')[0] : ''
  );
  const [endDate, setEndDate] = useState(
    season?.endDate ? new Date(season.endDate).toISOString().split('T')[0] : ''
  );
  const [status, setStatus] = useState<SeasonStatus>(season?.status || 'upcoming');

  const isEditing = !!season;
  const title = isEditing ? 'Edit Season' : 'Add New Season';

  // Initialize form data
  useEffect(() => {
    if (season) {
      setName(season.name);
      setYear(season.year.toString());
      setStartDate(new Date(season.startDate).toISOString().split('T')[0]);
      setEndDate(new Date(season.endDate).toISOString().split('T')[0]);
      setStatus(season.status);
    } else {
      // Reset form for new season
      const currentYear = new Date().getFullYear();
      setName('');
      setYear(currentYear.toString());
      setStartDate('');
      setEndDate('');
      setStatus('upcoming');
    }
  }, [season]);

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!name.trim()) errors.push('Season name is required');
    if (!year.trim()) errors.push('Year is required');
    const yearNum = parseInt(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > 2100) {
      errors.push('Year must be a valid number between 2000 and 2100');
    }
    if (!startDate) errors.push('Start date is required');
    if (!endDate) errors.push('End date is required');

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        errors.push('End date must be after start date');
      }
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If setting status to 'active', ensure only one active season
      if (status === 'active') {
        const activeSeasons = seasons.filter(s => s.status === 'active' && s.id !== season?.id);
        if (activeSeasons.length > 0) {
          // Set all other active seasons to 'completed'
          const updatePromises = activeSeasons.map(s => 
            updateSeason(s.id, { status: 'completed' as const })
          );
          await Promise.all(updatePromises);
        }
      }

      // Generate slug
      const yearNum = parseInt(year);
      const baseSlug = generateSeasonSlug(name, yearNum);
      const existingSlugs = seasons.map(s => s.slug);
      const slug = isEditing && season
        ? season.slug // Keep existing slug when editing
        : ensureUniqueSlug(baseSlug, existingSlugs);

      const seasonData: Omit<Season, 'id' | 'createdAt' | 'updatedAt'> = {
        slug,
        name: name.trim(),
        year: yearNum,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      };

      if (isEditing && season) {
        await updateSeason(season.id, seasonData);
      } else {
        await createSeason(seasonData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save season:', error);
      setError(error.message || 'Failed to save season. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Calendar size={20} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="alert alert-error">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-grid">
            {/* Season Name */}
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Season Name *
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="form-input"
                required
                disabled={loading}
                placeholder="Fall 2025"
              />
            </div>

            {/* Year */}
            <div className="form-group">
              <label htmlFor="year" className="form-label">
                Year *
              </label>
              <input
                type="number"
                id="year"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="form-input"
                required
                disabled={loading}
                min="2000"
                max="2100"
                placeholder="2025"
              />
            </div>

            {/* Start Date */}
            <div className="form-group">
              <label htmlFor="startDate" className="form-label">
                Start Date *
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="form-input"
                required
                disabled={loading}
              />
            </div>

            {/* End Date */}
            <div className="form-group">
              <label htmlFor="endDate" className="form-label">
                End Date *
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="form-input"
                required
                disabled={loading}
                min={startDate || undefined}
              />
            </div>

            {/* Status */}
            <div className="form-group">
              <label htmlFor="status" className="form-label">
                Status *
              </label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value as SeasonStatus)}
                className="form-input"
                required
                disabled={loading}
              >
                <option value="upcoming">Upcoming</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <Calendar size={16} />
                  {isEditing ? 'Update Season' : 'Create Season'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SeasonFormModal;

