import React, { useState, useMemo } from 'react';
import { Plus, Edit2, Trash2, Star, Image as ImageIcon } from 'lucide-react';
import { useData } from '../../state';
import { Photo } from '../../core/types';
import { format } from 'date-fns';

const PhotosTab: React.FC = () => {
  const { photos, seasons, games, activeSeason, createPhoto, updatePhoto, deletePhoto } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingPhoto, setEditingPhoto] = useState<Photo | null>(null);
  const [formData, setFormData] = useState({
    seasonId: activeSeason?.id || '',
    gameId: '',
    imageUrl: '',
    caption: '',
    isFeatured: false
  });

  const sortedPhotos = useMemo(() => {
    return [...photos].sort((a, b) => 
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );
  }, [photos]);

  const handleOpenModal = (photo?: Photo) => {
    if (photo) {
      setEditingPhoto(photo);
      setFormData({
        seasonId: photo.seasonId,
        gameId: photo.gameId || '',
        imageUrl: photo.imageUrl,
        caption: photo.caption || '',
        isFeatured: photo.isFeatured
      });
    } else {
      setEditingPhoto(null);
      setFormData({
        seasonId: activeSeason?.id || '',
        gameId: '',
        imageUrl: '',
        caption: '',
        isFeatured: false
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingPhoto(null);
    setFormData({
      seasonId: activeSeason?.id || '',
      gameId: '',
      imageUrl: '',
      caption: '',
      isFeatured: false
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const photoData = {
        ...formData,
        gameId: formData.gameId || undefined
      };

      if (editingPhoto) {
        await updatePhoto(editingPhoto.id, photoData);
      } else {
        await createPhoto(photoData);
      }
      handleCloseModal();
    } catch (error) {
      console.error('Failed to save photo:', error);
      alert('Failed to save photo. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this photo?')) {
      try {
        await deletePhoto(id);
      } catch (error) {
        console.error('Failed to delete photo:', error);
        alert('Failed to delete photo. Please try again.');
      }
    }
  };

  const seasonGames = useMemo(() => {
    if (!formData.seasonId) return [];
    return games.filter(g => g.seasonId === formData.seasonId);
  }, [games, formData.seasonId]);

  return (
    <div className="admin-tab-content">
      <div className="admin-tab-header">
        <div>
          <h2>Photos</h2>
          <p>Manage league photos and featured images</p>
        </div>
        <button className="btn btn-primary" onClick={() => handleOpenModal()}>
          <Plus size={20} />
          New Photo
        </button>
      </div>

      <div className="admin-table-container">
        {sortedPhotos.length === 0 ? (
          <div className="empty-state">
            <ImageIcon size={48} />
            <h3>No photos yet</h3>
            <p>Upload your first photo to display in the season gallery</p>
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus size={20} />
              Upload Photo
            </button>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Photo</th>
                <th>Caption</th>
                <th>Season</th>
                <th>Game</th>
                <th>Featured</th>
                <th>Uploaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedPhotos.map(photo => {
                const season = seasons.find(s => s.id === photo.seasonId);
                const game = photo.gameId ? games.find(g => g.id === photo.gameId) : null;
                return (
                  <tr key={photo.id}>
                    <td>
                      <img 
                        src={photo.imageUrl} 
                        alt={photo.caption || 'League photo'} 
                        className="photo-thumbnail"
                        onError={(e) => {
                          e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA2MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjQwIiBmaWxsPSIjRjRGNkY4Ii8+CjxwYXRoIGQ9Ik0yNSAyMEgzNVYyMkgyNVYyMFoiIGZpbGw9IiM3RjhDOEQiLz4KPC9zdmc+';
                        }}
                      />
                    </td>
                    <td>
                      <div className="table-cell-main">
                        {photo.caption || <em className="text-muted">No caption</em>}
                      </div>
                    </td>
                    <td>{season?.name || 'Unknown'}</td>
                    <td>{game ? `vs ${game.homeTeamId}` : '-'}</td>
                    <td>
                      {photo.isFeatured && (
                        <span className="status-badge status-warning">
                          <Star size={14} />
                          Featured
                        </span>
                      )}
                    </td>
                    <td>{format(new Date(photo.uploadedAt), 'MMM d, yyyy')}</td>
                    <td>
                      <div className="table-actions">
                        <button 
                          className="btn-icon" 
                          onClick={() => handleOpenModal(photo)}
                          title="Edit photo"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          className="btn-icon btn-icon-danger" 
                          onClick={() => handleDelete(photo.id)}
                          title="Delete photo"
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

      {/* Photo Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={handleCloseModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingPhoto ? 'Edit Photo' : 'New Photo'}</h3>
              <button className="modal-close" onClick={handleCloseModal}>&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-group">
                <label htmlFor="season">Season *</label>
                <select
                  id="season"
                  value={formData.seasonId}
                  onChange={e => setFormData({ ...formData, seasonId: e.target.value, gameId: '' })}
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
                <label htmlFor="game">Game (Optional)</label>
                <select
                  id="game"
                  value={formData.gameId}
                  onChange={e => setFormData({ ...formData, gameId: e.target.value })}
                >
                  <option value="">No specific game</option>
                  {seasonGames.map(game => {
                    const homeTeam = game.homeTeamId;
                    const awayTeam = game.awayTeamId;
                    return (
                      <option key={game.id} value={game.id}>
                        {homeTeam} vs {awayTeam} - {game.gameDate ? format(new Date(game.gameDate), 'MMM d, yyyy') : 'TBD'}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="imageUrl">Image URL *</label>
                <input
                  type="url"
                  id="imageUrl"
                  value={formData.imageUrl}
                  onChange={e => setFormData({ ...formData, imageUrl: e.target.value })}
                  required
                  placeholder="https://example.com/photo.jpg"
                />
                <small className="form-help">Enter the URL of the image you want to display</small>
              </div>

              {formData.imageUrl && (
                <div className="form-group">
                  <label>Preview</label>
                  <div className="photo-preview">
                    <img 
                      src={formData.imageUrl} 
                      alt="Preview" 
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="caption">Caption</label>
                <textarea
                  id="caption"
                  value={formData.caption}
                  onChange={e => setFormData({ ...formData, caption: e.target.value })}
                  rows={3}
                  placeholder="Optional caption for the photo"
                />
              </div>

              <div className="form-group form-group-checkbox">
                <label>
                  <input
                    type="checkbox"
                    checked={formData.isFeatured}
                    onChange={e => setFormData({ ...formData, isFeatured: e.target.checked })}
                  />
                  <span>Featured (display as featured photo on home page)</span>
                </label>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-outline" onClick={handleCloseModal}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPhoto ? 'Update' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .photo-thumbnail {
          width: 60px;
          height: 40px;
          object-fit: cover;
          border-radius: 4px;
        }
        
        .photo-preview {
          width: 100%;
          max-width: 400px;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--color-border);
        }
        
        .photo-preview img {
          width: 100%;
          height: auto;
          display: block;
        }
        
        .text-muted {
          color: var(--color-text-muted);
          font-style: italic;
        }
      `}</style>
    </div>
  );
};

export default PhotosTab;

