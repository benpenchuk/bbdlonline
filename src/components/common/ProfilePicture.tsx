import React from 'react';

interface ProfilePictureProps {
  imageUrl?: string | null;
  fallbackImage: 'player' | 'team';
  alt: string;
  size?: number;
  className?: string;
}

const ProfilePicture: React.FC<ProfilePictureProps> = ({
  imageUrl,
  fallbackImage,
  alt,
  size = 32,
  className = '',
}) => {
  const fallbackPath = '/images/Blank Profile Picture.webp';

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement;
    if (target.src !== fallbackPath && !target.src.includes('Blank Profile Picture')) {
      target.src = fallbackPath;
    }
  };

  return (
    <div
      className={`profile-picture profile-picture-${fallbackImage} ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
        backgroundColor: '#e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid rgba(0, 0, 0, 0.1)',
      }}
    >
      <img
        src={imageUrl || fallbackPath}
        alt={alt}
        onError={handleImageError}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
        }}
      />
    </div>
  );
};

export default ProfilePicture;

