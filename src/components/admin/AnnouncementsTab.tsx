import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { useData } from '../../state';
import { Announcement } from '../../core/types';
import { format } from 'date-fns';

const AnnouncementsTab: React.FC = () => {
  const { announcements, seasons, activeSeason, createAnnouncement, updateAnnouncement, deleteAnnouncement } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    seasonId: activeSeason?.id || '',
    title: '',
    content: '',
    active: true
  });

  const sortedAnnouncements = useMemo(() => {
    return [...announcements].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [announcements]);

  const handleOpenModal = (announcement?: Announcement) => {
    if (announcement) {
      setEditingAnnouncement(announcement);
      setFormData({
        seasonId: announcement.seasonId,
        title: announcement.title,
        content: announcement.content,
        active: announcement.active
      });
    } else {
      setEditingAnnouncement(null);
      setFormData({
        seasonId: activeSeason?.id || '',
        title: '',
        content: '',
        active: true
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAnnouncement(null);
    setFormData({
      seasonId: activeSeason?.id || '',
      title: '',
      content: '',
      active: true
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAnnouncement) {
        await updateAnnouncement(editingAnnouncement.id, formData);
      } else {
        await createAnnouncement(formData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save announcement:', error);
      alert('Failed to save announcement. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await deleteAnnouncement(id);
      } catch (error) {
        console.error('Failed to delete announcement:', error);
        alert('Failed to delete announcement. Please try again.');
      }
    }
  };

  return (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <div>
          <h2>Announcements</h2>
          <p>Manage league announcements and updates</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          New Announcement
        </button>
      </div>

      <div className="admin-table-container">
        {sortedAnnouncements.length === 0 ? (
          <div className="empty-state">
            <MessageSquare size={48} />
            <h3>No announcements yet</h3>
            <p>Create your first announcement to display on the home page</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              Create Announcement
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Season</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedAnnouncements.map(announcement => {
                const season = seasons.find(s => s.id === announcement.seasonId);
                return (
                  <tr key={announcement.id}>
                    <td>
                      <div className="table-cell-main">{announcement.title}</div>
                      <div className="table-cell-sub">{announcement.content.substring(0, 100)}{announcement.content.length > 100 ? '...' : ''}</div>
                    </td>
                    <td>{season?.name || 'Unknown'}</td>
                    <td>
                      {announcement.active ? (
                        <span className="status-badge status-success">
                          <CheckCircle size={14} />
                          Active
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">
                          <XCircle size={14} />
                          Inactive
                        </span>
                      )}
                    </td>
                    <td>{format(new Date(announcement.createdAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-icon" 
                          onClick={() => handleOpenModal(announcement)}
                          title="Edit announcement"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-danger" 
                          onClick={() => handleDelete(announcement.id)}
                          title="Delete announcement"
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

      {/* Announcement Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingAnnouncement ? 'Edit Announcement' : 'New Announcement'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="season">Season *</label>
                <select
                  id="season"
                  value={formData.seasonId}
                  onChange={e => setFormData({ ...formData, seasonId: e.target.value })}
                  required
                >
                  <option value="">Select a season</option>
                  {seasons.map(season => (
                    <option key={season.id} value={season.id}>
                      {season.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Announcement title"
                />
              </div>

              <div className="form-group">
                <label htmlFor="content">Content *</label>
                <textarea
                  id="content"
                  value={formData.content}
                  onChange={e => setFormData({ ...formData, content: e.target.value })}
                  required
                  rows={6}
                  placeholder="Announcement content..."
                />
              </div>

              <div className="form-group form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.active}
                    onChange={e => setFormData({ ...formData, active: e.target.checked })}
                  />
                  <span>Active (display on home page)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingAnnouncement ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnouncementsTab;

