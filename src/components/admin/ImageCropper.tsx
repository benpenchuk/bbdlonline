import React, { useState, useRef, useEffect } from 'react';
import { X, Move, ZoomIn, ZoomOut, Check } from 'lucide-react';

interface ImageCropperProps {
  imageFile: File;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
  size?: number; // Output size in pixels
  circular?: boolean; // Whether to crop to circle
}

const ImageCropper: React.FC<ImageCropperProps> = ({
  imageFile,
  onCrop,
  onCancel,
  size = 200,
  circular = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      setImageDimensions({ width: img.width, height: img.height });
      // Center the image initially
      const initialScale = Math.min(size / img.width, size / img.height) * 1.2;
      setScale(initialScale);
      setPosition({ x: 0, y: 0 });
    };
    const url = URL.createObjectURL(imageFile);
    img.src = url;
    setImageSrc(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageFile, size]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev * 1.1, 3));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev * 0.9, 0.5));
  };

  const handleCrop = () => {
    const canvas = canvasRef.current;
    if (!canvas || !imageSrc || !imageLoaded) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      canvas.width = size;
      canvas.height = size;

      // Calculate the crop area
      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      const centerX = containerRect.width / 2;
      const centerY = containerRect.height / 2;
      const cropSize = size / scale;

      // Create circular clipping if needed
      if (circular) {
        ctx.beginPath();
        ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
        ctx.clip();
      }

      // Calculate source coordinates
      const sourceX = (centerX - cropSize / 2 - position.x) / scale;
      const sourceY = (centerY - cropSize / 2 - position.y) / scale;

      // Draw the cropped image
      ctx.drawImage(
        img,
        sourceX,
        sourceY,
        cropSize,
        cropSize,
        0,
        0,
        size,
        size
      );

      canvas.toBlob((blob) => {
        if (blob) {
          onCrop(blob);
        }
      }, 'image/png');
    };
    img.src = imageSrc;
  };

  if (!imageLoaded) {
    return (
      <div className="image-cropper-loading">
        <div className="spinner-small" />
        <span>Loading image...</span>
      </div>
    );
  }

  return (
    <div className="image-cropper-container">
      <div className="image-cropper-header">
        <h3>Position Your Logo</h3>
        <button
          type="button"
          onClick={onCancel}
          className="btn-icon btn-icon-small"
        >
          <X size={16} />
        </button>
      </div>

      <div className="image-cropper-preview">
        <div
          ref={containerRef}
          className="image-cropper-viewport"
          style={{
            width: size,
            height: size,
            borderRadius: circular ? '50%' : '0',
            overflow: 'hidden',
            position: 'relative',
            margin: '0 auto',
            border: '2px solid var(--color-border)',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            src={imageSrc}
            alt="Crop preview"
            style={{
              width: `${imageDimensions.width * scale}px`,
              height: `${imageDimensions.height * scale}px`,
              transform: `translate(${position.x}px, ${position.y}px)`,
              userSelect: 'none',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      <div className="image-cropper-controls">
        <div className="cropper-control-group">
          <button
            type="button"
            onClick={handleZoomOut}
            className="btn-icon"
            title="Zoom Out"
          >
            <ZoomOut size={18} />
          </button>
          <span className="zoom-level">{Math.round(scale * 100)}%</span>
          <button
            type="button"
            onClick={handleZoomIn}
            className="btn-icon"
            title="Zoom In"
          >
            <ZoomIn size={18} />
          </button>
        </div>

        <div className="cropper-control-group">
          <span className="cropper-hint">
            <Move size={16} />
            Drag to position
          </span>
        </div>
      </div>

      <div className="image-cropper-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCrop}
          className="btn btn-primary"
        >
          <Check size={16} />
          Apply Crop
        </button>
      </div>

      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  );
};

export default ImageCropper;

