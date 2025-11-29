import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, AlertCircle, Upload, XCircle, Loader } from 'lucide-react';
import { Player, PlayerStatus } from '../../core/types';
import { useData } from '../../state';
import { generatePlayerSlug, ensureUniqueSlug } from '../../core/utils/slugHelpers';
import {
  uploadPlayerAvatar,
  deleteImage,
  getImagePreview,
  revokeImagePreview,
} from '../../core/services/imageUploadService';
import { ALL_LOCATIONS } from '../../core/utils/states';

interface PlayerFormModalProps {
  player?: Player | null; // null for create, Player object for edit
  onClose: () => void;
  onSave: () => void;
}

const PlayerFormModal: React.FC<PlayerFormModalProps> = ({ player, onClose, onSave }) => {
  const { createPlayer, updatePlayer, players } = useData();
  const [loading, setLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');

  // Form state
  const [firstName, setFirstName] = useState(player?.firstName || '');
  const [lastName, setLastName] = useState(player?.lastName || '');
  const [nickname, setNickname] = useState(player?.nickname || '');
  const [avatarUrl, setAvatarUrl] = useState(player?.avatarUrl || '');
  const [hometownCity, setHometownCity] = useState(player?.hometownCity || '');
  const [hometownState, setHometownState] = useState(player?.hometownState || '');
  const [dominantHand, setDominantHand] = useState(player?.dominantHand || '');
  const [status, setStatus] = useState<PlayerStatus>(player?.status || 'active');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [oldAvatarUrl, setOldAvatarUrl] = useState<string>('');

  const isEditing = !!player;
  const title = isEditing ? 'Edit Player' : 'Add New Player';

  // Initialize form data
  useEffect(() => {
    if (player) {
      setFirstName(player.firstName);
      setLastName(player.lastName);
      setNickname(player.nickname || '');
      setAvatarUrl(player.avatarUrl || '');
      setHometownCity(player.hometownCity || '');
      setHometownState(player.hometownState || '');
      setDominantHand(player.dominantHand || '');
      setStatus(player.status);
      setOldAvatarUrl(player.avatarUrl || '');
    } else {
      // Reset form for new player
      setFirstName('');
      setLastName('');
      setNickname('');
      setAvatarUrl('');
      setHometownCity('');
      setHometownState('');
      setDominantHand('');
      setStatus('active');
      setImageFile(null);
      setPreviewUrl('');
      setOldAvatarUrl('');
    }
  }, [player]);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        revokeImagePreview(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    const preview = getImagePreview(file);
    setPreviewUrl(preview);
    setError('');
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setPreviewUrl('');
    setAvatarUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (): Promise<string | null> => {
    if (!imageFile) {
      return avatarUrl || null;
    }

    setUploadingImage(true);
    try {
      const result = await uploadPlayerAvatar(imageFile, player?.id);

      if (result.error) {
        setError(result.error);
        setUploadingImage(false);
        return null;
      }

      // Delete old image if it exists and is different
      if (oldAvatarUrl && oldAvatarUrl !== result.url) {
        await deleteImage(oldAvatarUrl, 'player-avatars').catch(err =>
          console.error('Failed to delete old image:', err)
        );
      }

      setUploadingImage(false);
      return result.url;
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
      setUploadingImage(false);
      return null;
    }
  };

  const validateForm = (): string[] => {
    const errors: string[] = [];

    if (!firstName.trim()) errors.push('First name is required');
    if (!lastName.trim()) errors.push('Last name is required');

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
      // Upload image if a new one was selected
      let finalAvatarUrl = avatarUrl;
      if (imageFile) {
        const uploadedUrl = await handleImageUpload();
        if (!uploadedUrl) {
          setLoading(false);
          return; // Error already set by handleImageUpload
        }
        finalAvatarUrl = uploadedUrl;
      }

      // Generate slug
      const baseSlug = generatePlayerSlug(firstName, lastName);
      const existingSlugs = players.map(p => p.slug);
      const slug = isEditing && player
        ? player.slug // Keep existing slug when editing
        : ensureUniqueSlug(baseSlug, existingSlugs);

      const playerData: Omit<Player, 'id' | 'createdAt' | 'updatedAt'> = {
        slug,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        nickname: nickname.trim() || undefined,
        avatarUrl: finalAvatarUrl || undefined,
        hometownCity: hometownCity.trim() || undefined,
        hometownState: hometownState.trim() || undefined,
        dominantHand: dominantHand.trim() || undefined,
        status,
      };

      if (isEditing && player) {
        await updatePlayer(player.id, playerData);
      } else {
        await createPlayer(playerData);
      }

      onSave();
      onClose();
    } catch (error: any) {
      console.error('Failed to save player:', error);
      setError(error.message || 'Failed to save player. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const displayImageUrl = previewUrl || avatarUrl;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <UserPlus size={20} />
            {title}
          </h2>
          <button
            onClick={onClose}
            className="modal-close"
            aria-label="Close modal"
            disabled={loading || uploadingImage}
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
            {/* Avatar Upload */}
            <div className="form-group form-group-full">
              <label className="form-label">Avatar</label>
              <div className="image-upload-container">
                {displayImageUrl ? (
                  <div className="image-preview-wrapper">
                    <img src={displayImageUrl} alt="Avatar preview" className="image-preview" />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="image-remove-btn"
                      disabled={loading || uploadingImage}
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ) : (
                  <div className="image-upload-placeholder">
                    <Upload size={32} />
                    <p>Click to upload avatar</p>
                    <p className="text-muted">Max 5MB, JPG/PNG/WEBP</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="image-upload-input"
                  disabled={loading || uploadingImage}
                />
              </div>
              {uploadingImage && (
                <div className="upload-progress">
                  <Loader size={16} className="spinner" />
                  <span>Uploading image...</span>
                </div>
              )}
            </div>

            {/* First Name */}
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">
                First Name *
              </label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="form-input"
                required
                disabled={loading || uploadingImage}
                placeholder="John"
              />
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">
                Last Name *
              </label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="form-input"
                required
                disabled={loading || uploadingImage}
                placeholder="Doe"
              />
            </div>

            {/* Nickname */}
            <div className="form-group">
              <label htmlFor="nickname" className="form-label">
                Nickname
              </label>
              <input
                type="text"
                id="nickname"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                className="form-input"
                disabled={loading || uploadingImage}
                placeholder="Johnny"
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
                onChange={(e) => setStatus(e.target.value as PlayerStatus)}
                className="form-input"
                required
                disabled={loading || uploadingImage}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="alumni">Alumni</option>
              </select>
            </div>

            {/* Hometown City */}
            <div className="form-group">
              <label htmlFor="hometownCity" className="form-label">
                Hometown City
              </label>
              <input
                type="text"
                id="hometownCity"
                value={hometownCity}
                onChange={(e) => setHometownCity(e.target.value)}
                className="form-input"
                disabled={loading || uploadingImage}
                placeholder="New York"
              />
            </div>

            {/* Hometown State */}
            <div className="form-group">
              <label htmlFor="hometownState" className="form-label">
                Hometown State/Country
              </label>
              <select
                id="hometownState"
                value={hometownState}
                onChange={(e) => setHometownState(e.target.value)}
                className="form-input"
                disabled={loading || uploadingImage}
              >
                <option value="">Select state/country...</option>
                {ALL_LOCATIONS.map(location => (
                  <option key={location.value} value={location.value}>
                    {location.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Dominant Hand */}
            <div className="form-group">
              <label htmlFor="dominantHand" className="form-label">
                Dominant Hand
              </label>
              <select
                id="dominantHand"
                value={dominantHand}
                onChange={(e) => setDominantHand(e.target.value)}
                className="form-input"
                disabled={loading || uploadingImage}
              >
                <option value="">Select...</option>
                <option value="Right">Right</option>
                <option value="Left">Left</option>
                <option value="Ambidextrous">Ambidextrous</option>
              </select>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline"
              disabled={loading || uploadingImage}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || uploadingImage}
            >
              {loading ? (
                <>
                  <div className="spinner-small" />
                  Saving...
                </>
              ) : (
                <>
                  <UserPlus size={16} />
                  {isEditing ? 'Update Player' : 'Create Player'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PlayerFormModal;

