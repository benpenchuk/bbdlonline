import React from 'react';
import { getTeamIcon } from '../../core/config/teamIcons';

interface TeamIconProps {
  iconId: string;
  color: string;
  size?: number;
  className?: string;
  showBackground?: boolean;
}

const TeamIcon: React.FC<TeamIconProps> = ({ 
  iconId, 
  color, 
  size = 24, 
  className = '',
  showBackground = true 
}) => {
  const Icon = getTeamIcon(iconId);
  
  if (showBackground) {
    return (
      <div 
        className={`team-icon-container ${className}`}
        style={{ 
          backgroundColor: color,
          width: size + 8,
          height: size + 8,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon 
          size={size} 
          color="white"
          strokeWidth={2.5}
        />
      </div>
    );
  }
  
  return (
    <Icon 
      size={size} 
      color={color}
      strokeWidth={2.5}
      className={className}
    />
  );
};

export default TeamIcon;

