import React from 'react';

export interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  className?: string;
  lines?: number;
  variant?: 'text' | 'circular' | 'rectangular';
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  width,
  height,
  className = '',
  lines = 1,
  variant = 'rectangular'
}) => {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-container ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={`skeleton skeleton-text ${index === lines - 1 ? 'skeleton-last-line' : ''}`}
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              height: height || '1rem'
            }}
          />
        ))}
      </div>
    );
  }

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === 'number' ? `${width}px` : width;
  if (height) style.height = typeof height === 'number' ? `${height}px` : height;

  const variantClass = variant === 'circular' ? 'skeleton-circular' : 'skeleton-rectangular';

  return (
    <div
      className={`skeleton ${variantClass} ${className}`}
      style={style}
    />
  );
};

export default LoadingSkeleton;

