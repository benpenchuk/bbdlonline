import { 
  Trophy, Flame, Shield, Zap, Target, Crown, Skull, Rocket,
  Sword, Star, Heart, Sparkles, Snowflake, Moon, Sun, Cloud,
  Mountain, Waves, Beer, Pizza, Coffee, Music, Gamepad2, Dumbbell,
  Dribbble, Circle, Volleyball, Axe, Hammer, Wrench, Drill, Anchor,
  Plane, Car, Bike, Ship, Train, Bus, Flag, Medal, Award,
  Gem, Diamond, CircleDot, Hexagon, Triangle, Square
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface TeamIconOption {
  id: string;
  name: string;
  icon: LucideIcon;
  category: 'sports' | 'fun' | 'fierce' | 'nature' | 'shapes' | 'other';
}

export const TEAM_ICONS: TeamIconOption[] = [
  // Sports & Competition
  { id: 'trophy', name: 'Trophy', icon: Trophy, category: 'sports' },
  { id: 'medal', name: 'Medal', icon: Medal, category: 'sports' },
  { id: 'award', name: 'Award', icon: Award, category: 'sports' },
  { id: 'target', name: 'Target', icon: Target, category: 'sports' },
  { id: 'dribbble', name: 'Ball', icon: Dribbble, category: 'sports' },
  { id: 'dumbbell', name: 'Dumbbell', icon: Dumbbell, category: 'sports' },
  
  // Fierce & Power
  { id: 'flame', name: 'Flame', icon: Flame, category: 'fierce' },
  { id: 'zap', name: 'Lightning', icon: Zap, category: 'fierce' },
  { id: 'skull', name: 'Skull', icon: Skull, category: 'fierce' },
  { id: 'crown', name: 'Crown', icon: Crown, category: 'fierce' },
  { id: 'shield', name: 'Shield', icon: Shield, category: 'fierce' },
  { id: 'sword', name: 'Sword', icon: Sword, category: 'fierce' },
  { id: 'rocket', name: 'Rocket', icon: Rocket, category: 'fierce' },
  { id: 'axe', name: 'Axe', icon: Axe, category: 'fierce' },
  { id: 'hammer', name: 'Hammer', icon: Hammer, category: 'fierce' },
  
  // Nature & Elements
  { id: 'sun', name: 'Sun', icon: Sun, category: 'nature' },
  { id: 'moon', name: 'Moon', icon: Moon, category: 'nature' },
  { id: 'star', name: 'Star', icon: Star, category: 'nature' },
  { id: 'cloud', name: 'Cloud', icon: Cloud, category: 'nature' },
  { id: 'snowflake', name: 'Snowflake', icon: Snowflake, category: 'nature' },
  { id: 'mountain', name: 'Mountain', icon: Mountain, category: 'nature' },
  { id: 'waves', name: 'Waves', icon: Waves, category: 'nature' },
  
  // Fun & Casual
  { id: 'beer', name: 'Beer', icon: Beer, category: 'fun' },
  { id: 'pizza', name: 'Pizza', icon: Pizza, category: 'fun' },
  { id: 'coffee', name: 'Coffee', icon: Coffee, category: 'fun' },
  { id: 'music', name: 'Music', icon: Music, category: 'fun' },
  { id: 'gamepad', name: 'Gamepad', icon: Gamepad2, category: 'fun' },
  { id: 'heart', name: 'Heart', icon: Heart, category: 'fun' },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles, category: 'fun' },
  
  // Vehicles & Travel
  { id: 'plane', name: 'Plane', icon: Plane, category: 'other' },
  { id: 'car', name: 'Car', icon: Car, category: 'other' },
  { id: 'bike', name: 'Bike', icon: Bike, category: 'other' },
  { id: 'ship', name: 'Ship', icon: Ship, category: 'other' },
  { id: 'anchor', name: 'Anchor', icon: Anchor, category: 'other' },
  
  // Shapes & Symbols
  { id: 'circle-dot', name: 'Circle Dot', icon: CircleDot, category: 'shapes' },
  { id: 'circle', name: 'Circle', icon: Circle, category: 'shapes' },
  { id: 'triangle', name: 'Triangle', icon: Triangle, category: 'shapes' },
  { id: 'square', name: 'Square', icon: Square, category: 'shapes' },
  { id: 'hexagon', name: 'Hexagon', icon: Hexagon, category: 'shapes' },
  { id: 'diamond', name: 'Diamond', icon: Diamond, category: 'shapes' },
  { id: 'gem', name: 'Gem', icon: Gem, category: 'shapes' },
  { id: 'flag', name: 'Flag', icon: Flag, category: 'shapes' },
];

export const getTeamIcon = (iconId: string): LucideIcon => {
  const iconOption = TEAM_ICONS.find(icon => icon.id === iconId);
  return iconOption?.icon || Trophy;
};

export const getIconsByCategory = (category: TeamIconOption['category']) => {
  return TEAM_ICONS.filter(icon => icon.category === category);
};

