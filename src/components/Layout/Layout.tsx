import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, Users, BarChart3, Menu, X, List, Sun, Moon, Lock } from 'lucide-react';
import VersionBanner from '../common/VersionBanner';
import { useTheme } from '../../state/ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
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
          
          {/* Mobile Menu Toggle - only show when menu is closed */}
          {!mobileMenuOpen && (
            <button
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
            >
              <Menu size={24} />
            </button>
          )}
          
          {/* Navigation Links - Desktop */}
          <nav className={`nav-links ${mobileMenuOpen ? 'nav-links-mobile-open' : ''}`}>
            {/* Mobile Menu Header */}
            <div className="mobile-menu-header">
              <img
                src="/images/BBDL Logo.png"
                alt="BBDL Logo"
                className="mobile-menu-logo"
              />
              <button
                className="mobile-menu-close"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X size={28} />
              </button>
            </div>

            {/* Mobile Menu Navigation */}
            <div className="mobile-menu-nav">
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
            </div>

            {/* Mobile Menu Footer */}
            <div className="mobile-menu-footer">
              <button
                className="theme-toggle-button"
                onClick={toggleTheme}
                aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                <span>{theme === 'light' ? 'Dark' : 'Light'} Mode</span>
              </button>
            </div>
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
