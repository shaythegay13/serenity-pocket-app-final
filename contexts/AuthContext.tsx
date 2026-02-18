"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import { supabase } from "@/lib/supabase"
import type { Session, User } from "@supabase/supabase-js"

interface AuthContextType {
  session: Session | null
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Quick sync check for cached session (avoids network roundtrip on mount)
function getCachedSession(): { hasCache: boolean; isValid: boolean } {
  if (typeof window === 'undefined') return { hasCache: false, isValid: false };
  try {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (keys.length > 0) {
      const stored = localStorage.getItem(keys[0]);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check if token exists and is not expired (with 60s buffer)
        const isValid = parsed?.expires_at && parsed.expires_at * 1000 > Date.now() + 60000;
        return { hasCache: true, isValid };
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { hasCache: false, isValid: false };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const cached = getCachedSession();

  // Initialize optimistically from cache to prevent loading flash
  const [session, setSession] = useState<Session | null>(null)
  const [isLoading, setIsLoading] = useState(!cached.isValid)
  const [initialCheckDone, setInitialCheckDone] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
    } catch (error) {
      console.error('Auth refresh failed:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const { hasCache, isValid } = getCachedSession();

      // If we have a valid cache, we can skip the loading state
      // and just refresh in the background
      if (isValid) {
        setIsLoading(false);
      }

      try {
        // Set up timeout only if no valid cache
        let timeoutId: NodeJS.Timeout | null = null;

        if (!isValid) {
          timeoutId = setTimeout(() => {
            if (isMounted && !initialCheckDone) {
              console.warn('Auth check timed out');
              setIsLoading(false);
              setInitialCheckDone(true);
            }
          }, 5000);
        }

        const { data } = await supabase.auth.getSession();

        if (isMounted) {
          setSession(data.session);
          setIsLoading(false);
          setInitialCheckDone(true);
        }

        if (timeoutId) clearTimeout(timeoutId);
      } catch (error) {
        console.error('Auth init failed:', error);
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
          setInitialCheckDone(true);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (isMounted) {
          setSession(session);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    session,
    user: session?.user ?? null,
    isLoading,
    isAuthenticated: !!session,
    refresh,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
