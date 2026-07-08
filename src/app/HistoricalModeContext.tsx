import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from './SessionContext';
import { ContributorRole } from '@domain';

interface HistoricalModeContextType {
  historicalMode: boolean;
  setHistoricalMode: (on: boolean) => void;
}

const HistoricalModeContext = createContext<HistoricalModeContextType | null>(null);

export function HistoricalModeProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [historicalMode, setHistoricalModeInternal] = useState<boolean>(() => {
    if (typeof sessionStorage !== 'undefined') {
      return sessionStorage.getItem('wl:historical_mode') === 'true';
    }
    return false;
  });

  // Persist to sessionStorage on changes
  const setHistoricalMode = (on: boolean) => {
    setHistoricalModeInternal(on);
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.setItem('wl:historical_mode', on ? 'true' : 'false');
    }
  };

  // Reset to false if user is not Owner
  useEffect(() => {
    if (!session || session.role !== ContributorRole.Owner) {
      setHistoricalMode(false);
    }
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <HistoricalModeContext.Provider value={{ historicalMode, setHistoricalMode }}>
      {children}
    </HistoricalModeContext.Provider>
  );
}

export function useHistoricalMode() {
  const context = useContext(HistoricalModeContext);
  if (!context) {
    throw new Error('useHistoricalMode must be used within a HistoricalModeProvider');
  }
  return context;
}
