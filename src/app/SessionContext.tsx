import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ContributorRole } from '@domain';
import { generateId } from '@lib';

export const SESSION_STORAGE_KEY = 'wl:session';

export interface Session {
  contributorId: string;
  workspaceId: string;
  role: ContributorRole;
  name: string;
  email: string;
  sessionId: string;
}

interface SessionContextType {
  session: Session | null;
  loading: boolean;
  login: (session: Omit<Session, 'sessionId'>) => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (
          parsed &&
          parsed.contributorId &&
          parsed.workspaceId &&
          parsed.role &&
          parsed.name &&
          parsed.email
        ) {
          let sessId = sessionStorage.getItem('wl:session_id') || '';
          if (!sessId) {
            sessId = parsed.sessionId || generateId();
            sessionStorage.setItem('wl:session_id', sessId);
          }
          setSession({
            ...parsed,
            sessionId: sessId,
          });
        } else {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      } catch (e) {
        console.error('[SessionContext] Failed to parse session:', e);
        localStorage.removeItem(SESSION_STORAGE_KEY);
      }
    }
    setLoading(false);
  }, []);

  const login = (newSession: Omit<Session, 'sessionId'>) => {
    let sessId = sessionStorage.getItem('wl:session_id');
    if (!sessId) {
      sessId = generateId();
      sessionStorage.setItem('wl:session_id', sessId);
    }
    const sessionObj: Session = {
      ...newSession,
      sessionId: sessId,
    };
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionObj));
    setSession(sessionObj);
  };

  const logout = () => {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    sessionStorage.removeItem('wl:session_id');
    setSession(null);
  };

  return (
    <SessionContext.Provider value={{ session, loading, login, logout }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
