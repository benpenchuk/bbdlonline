import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface AuthState {
  isAuthenticated: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  demoMode: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  failedAttempts: number;
  lockoutUntil: number | null;
  demoMode: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  toggleDemoMode: () => void;
  isLockedOut: () => boolean;
  getRemainingLockoutTime: () => number;
}

const ADMIN_PASSWORD = 'bbdladmin2025';
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 30 * 1000; // 30 seconds in milliseconds

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    isAuthenticated: false,
    failedAttempts: 0,
    lockoutUntil: null,
    demoMode: true // Default to demo mode for safety
  });

  // Check if user is locked out
  const isLockedOut = (): boolean => {
    if (!state.lockoutUntil) return false;
    return Date.now() < state.lockoutUntil;
  };

  // Get remaining lockout time in seconds
  const getRemainingLockoutTime = (): number => {
    if (!state.lockoutUntil) return 0;
    const remaining = Math.max(0, state.lockoutUntil - Date.now());
    return Math.ceil(remaining / 1000);
  };

  // Clear lockout if time has passed
  useEffect(() => {
    if (state.lockoutUntil && Date.now() >= state.lockoutUntil) {
      setState(prev => ({
        ...prev,
        lockoutUntil: null,
        failedAttempts: 0
      }));
    }
  }, [state.lockoutUntil]);

  // Auto-refresh lockout timer
  useEffect(() => {
    if (state.lockoutUntil) {
      const interval = setInterval(() => {
        if (Date.now() >= state.lockoutUntil!) {
          setState(prev => ({
            ...prev,
            lockoutUntil: null,
            failedAttempts: 0
          }));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [state.lockoutUntil]);

  const login = async (password: string): Promise<boolean> => {
    // Check if locked out
    if (isLockedOut()) {
      throw new Error(`Too many failed attempts. Please wait ${getRemainingLockoutTime()} seconds.`);
    }

    // Simulate a small delay for security
    await new Promise(resolve => setTimeout(resolve, 500));

    if (password === ADMIN_PASSWORD) {
      setState(prev => ({
        ...prev,
        isAuthenticated: true,
        failedAttempts: 0,
        lockoutUntil: null
      }));
      return true;
    } else {
      const newFailedAttempts = state.failedAttempts + 1;
      const shouldLockout = newFailedAttempts >= MAX_ATTEMPTS;
      
      setState(prev => ({
        ...prev,
        failedAttempts: newFailedAttempts,
        lockoutUntil: shouldLockout ? Date.now() + LOCKOUT_DURATION : null
      }));

      if (shouldLockout) {
        throw new Error(`Too many failed attempts. Please wait ${LOCKOUT_DURATION / 1000} seconds.`);
      } else {
        throw new Error(`Incorrect password. ${MAX_ATTEMPTS - newFailedAttempts} attempts remaining.`);
      }
    }
  };

  const logout = () => {
    setState(prev => ({
      ...prev,
      isAuthenticated: false
    }));
  };

  const toggleDemoMode = () => {
    setState(prev => ({
      ...prev,
      demoMode: !prev.demoMode
    }));
  };

  // Logout when tab/window is closed (session-based auth)
  useEffect(() => {
    const handleBeforeUnload = () => {
      // This will clear authentication when the tab is closed
      logout();
    };

    const handleVisibilityChange = () => {
      // Optional: Also logout when tab becomes hidden for extended periods
      if (document.hidden) {
        // Could add a timeout here if desired
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const contextValue: AuthContextType = {
    isAuthenticated: state.isAuthenticated,
    failedAttempts: state.failedAttempts,
    lockoutUntil: state.lockoutUntil,
    demoMode: state.demoMode,
    login,
    logout,
    toggleDemoMode,
    isLockedOut,
    getRemainingLockoutTime
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
