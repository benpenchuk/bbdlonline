import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Camera } from 'lucide-react';
import { Photo } from '../../core/types';

interface PhotoCarouselProps {
  photos: Photo[];
  featuredPhoto?: Photo | null;
}

const PhotoCarousel: React.FC<PhotoCarouselProps> = ({ photos, featuredPhoto }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayPhotos, setDisplayPhotos] = useState<Photo[]>([]);

  useEffect(() => {
    // If there's a featured photo, put it first, then add other photos
    if (featuredPhoto) {
      const otherPhotos = photos.filter(p => p.id !== featuredPhoto.id);
      setDisplayPhotos([featuredPhoto, ...otherPhotos]);
    } else {
      setDisplayPhotos(photos);
    }
    setCurrentIndex(0);
  }, [photos, featuredPhoto]);

  const nextPhoto = () => {
    setCurrentIndex((prev) => (prev + 1) % displayPhotos.length);
  };

  const prevPhoto = () => {
    setCurrentIndex((prev) => (prev - 1 + displayPhotos.length) % displayPhotos.length);
  };

  const goToPhoto = (index: number) => {
    setCurrentIndex(index);
  };

  if (displayPhotos.length === 0) {
    return (
      <div className="photo-carousel-container">
        <h3 className="photo-carousel-title">Season Photos</h3>
        <div className="photo-carousel-separator"></div>
        <div className="photo-carousel-empty">
          <Camera size={48} />
          <p>No photos available</p>
          <small>Photos will appear here once uploaded</small>
        </div>
      </div>
    );
  }

  const currentPhoto = displayPhotos[currentIndex];
  const isFeatured = currentPhoto?.id === featuredPhoto?.id;

  return (
    <div className="photo-carousel-container">
      <div className="photo-carousel-header">
        <h3 className="photo-carousel-title">Season Photos</h3>
        {isFeatured && <span className="photo-featured-badge">Featured</span>}
      </div>
      <div className="photo-carousel-separator"></div>

      <div className="photo-carousel-main">
        {displayPhotos.length > 1 && (
          <button 
            className="photo-carousel-btn photo-carousel-prev" 
            onClick={prevPhoto}
            aria-label="Previous photo"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <div className="photo-carousel-display">
          <div className="photo-carousel-image-wrapper">
            <img 
              src={currentPhoto.imageUrl} 
              alt={currentPhoto.caption || 'Season photo'}
              className="photo-carousel-image"
              onError={(e) => {
                // Fallback to placeholder if image fails to load
                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCIgdmlld0JveD0iMCAwIDYwMCA0MDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSI2MDAiIGhlaWdodD0iNDAwIiBmaWxsPSIjRjRGNkY4Ii8+CjxwYXRoIGQ9Ik0yNTAgMjAwSDM1MFYyMTBIMjUwVjIwMFoiIGZpbGw9IiM3RjhDOEQiLz4KPHA+YXRoIGQ9Ik0yMzAgMjIwSDM3MFYyMzBIMjMwVjIyMFoiIGZpbGw9IiM3RjhDOEQiLz4KPC9zdmc+';
              }}
            />
          </div>
          
          {currentPhoto.caption && (
            <div className="photo-carousel-caption">
              <p>{currentPhoto.caption}</p>
            </div>
          )}
        </div>

        {displayPhotos.length > 1 && (
          <button 
            className="photo-carousel-btn photo-carousel-next" 
            onClick={nextPhoto}
            aria-label="Next photo"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {displayPhotos.length > 1 && (
        <div className="photo-carousel-indicators">
          {displayPhotos.map((_, index) => (
            <button
              key={index}
              className={`photo-indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToPhoto(index)}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      )}

      {displayPhotos.length > 0 && (
        <div className="photo-carousel-counter">
          {currentIndex + 1} of {displayPhotos.length}
        </div>
      )}
    </div>
  );
};

export default PhotoCarousel;

