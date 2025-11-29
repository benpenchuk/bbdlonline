import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, BarChart3, Menu, X, List, Sun, Moon, Lock } from 'lucide-react';
import { getConfig } from '../../core/config/appConfig';
import VersionBanner from '../common/VersionBanner';
import { useTheme } from '../../state/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const config = getConfig();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Games', href: '/games', icon: Calendar },
    { name: 'Players', href: '/players', icon: Users },
    { name: 'Standings', href: '/standings', icon: List },
    { name: 'Stats', href: '/stats', icon: BarChart3 },
    { name: 'Admin', href: '/admin', icon: Lock },
    // Hidden for now: Tournament, Contact
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
          <Link to="/" className="nav-brand">
            <img 
              src="/images/BBDL Logo.png" 
              alt="BBDL Logo" 
              className="nav-logo"
            />
          </Link>
          
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
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`nav-link ${isActive(item.href) ? 'nav-link-active' : ''}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              );
            })}
            {/* Theme Toggle Button */}
            <button
              className="theme-toggle-button"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
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
