import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, BarChart3, Trophy, Settings, Mail } from 'lucide-react';
import { getConfig } from '../../config/appConfig';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const config = getConfig();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Tournament', href: '/tournament', icon: Trophy },
    { name: 'Admin', href: '/admin', icon: Settings },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <div className="layout-top-nav">
      {/* Top Navigation Bar */}
      <header className="top-navigation">
        <div className="nav-container">
          {/* Logo/Brand */}
          <div className="nav-brand">
            <Trophy color="var(--color-accent)" size={32} />
            <div className="brand-text">
              <h1 className="brand-title">{config.league.name}</h1>
              <p className="brand-subtitle">{config.league.season}</p>
            </div>
          </div>
          
          {/* Navigation Links */}
          <nav className="nav-links">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content-top-nav">
        {children}
      </main>
    </div>
  );
};

export default Layout;
