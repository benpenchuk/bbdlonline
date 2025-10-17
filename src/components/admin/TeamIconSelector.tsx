import React, { useState } from 'react';
import { TEAM_ICONS, getIconsByCategory, TeamIconOption } from '../../core/config/teamIcons';
import TeamIcon from '../common/TeamIcon';

interface TeamIconSelectorProps {
  selectedIcon: string;
  teamColor: string;
  onSelect: (iconId: string) => void;
}

const TeamIconSelector: React.FC<TeamIconSelectorProps> = ({ 
  selectedIcon, 
  teamColor,
  onSelect 
}) => {
  const [activeCategory, setActiveCategory] = useState<TeamIconOption['category']>('sports');
  
  const categories: TeamIconOption['category'][] = ['sports', 'fierce', 'nature', 'fun', 'shapes', 'other'];
  
  const iconsByCategory = getIconsByCategory(activeCategory);

  return (
    <div className="icon-selector">
      <div className="icon-selector-header">
        <h4>Select Team Icon</h4>
        <div className="selected-icon-preview">
          <TeamIcon iconId={selectedIcon} color={teamColor} size={32} />
        </div>
      </div>

      <div className="icon-categories">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${activeCategory === category ? 'category-btn-active' : ''}`}
            onClick={() => setActiveCategory(category)}
          >
            {category.charAt(0).toUpperCase() + category.slice(1)}
          </button>
        ))}
      </div>

      <div className="icon-grid">
        {iconsByCategory.map(iconOption => {
          const Icon = iconOption.icon;
          return (
            <button
              key={iconOption.id}
              className={`icon-option ${selectedIcon === iconOption.id ? 'icon-option-selected' : ''}`}
              onClick={() => onSelect(iconOption.id)}
              title={iconOption.name}
            >
              <Icon size={24} strokeWidth={2.5} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default TeamIconSelector;

