import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, BarChart3, Trophy, Settings, Mail, Menu, X, List } from 'lucide-react';
import { getConfig } from '../../core/config/appConfig';
import VersionBanner from '../common/VersionBanner';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const config = getConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Standings', href: '/standings', icon: List },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Tournament', href: '/tournament', icon: Trophy },
    { name: 'Admin', href: '/admin', icon: Settings },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const isActive = (href: string) => location.pathname === href;

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

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
          
          {/* Mobile Menu Toggle */}
          <button 
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
          
          {/* Navigation Links - Desktop */}
          <nav className={`nav-links ${mobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={18} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Mobile Menu Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="mobile-menu-backdrop" 
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Main Content */}
      <main className="main-content-top-nav">
        {children}
      </main>

      {/* Version Banner */}
      <VersionBanner />
    </div>
  );
};

export default Layout;
