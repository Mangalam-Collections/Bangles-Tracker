import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  hasPin: boolean;
  setPin: (pin: string) => void;
  verifyPin: (pin: string) => boolean;
  lock: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const PIN_KEY = 'ledger_pin';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPin, setHasPin] = useState(false);

  useEffect(() => {
    setHasPin(!!localStorage.getItem(PIN_KEY));
  }, []);

  const setPin = useCallback((pin: string) => {
    localStorage.setItem(PIN_KEY, pin);
    setHasPin(true);
    setIsAuthenticated(true);
  }, []);

  const verifyPin = useCallback((pin: string) => {
    const stored = localStorage.getItem(PIN_KEY);
    if (stored === pin) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  }, []);

  const lock = useCallback(() => setIsAuthenticated(false), []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, hasPin, setPin, verifyPin, lock }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
