import React from 'react';

export interface ChipProps {
  variant?: 'win' | 'loss' | 'streak' | 'seed' | 'status' | 'default';
  status?: 'completed' | 'scheduled' | 'in_progress' | 'cancelled';
  children: React.ReactNode;
  className?: string;
}

const Chip: React.FC<ChipProps> = ({
  variant = 'default',
  status,
  children,
  className = ''
}) => {
  const getVariantClass = () => {
    if (status) {
      return `chip-status chip-status-${status}`;
    }
    return `chip chip-${variant}`;
  };

  const classes = [getVariantClass(), className].filter(Boolean).join(' ');

  return (
    <span className={classes}>
      {children}
    </span>
  );
};

export default Chip;

