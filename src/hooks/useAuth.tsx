'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { ApiResponse, Language, UserPreferences } from '@/lib/types';

interface User {
  id: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  preferences: UserPreferences;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  updatePreferences: (prefs: Partial<UserPreferences>) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const defaultPreferences: UserPreferences = {
  preferredLanguage: 'en',
  prioritizeWeak: false,
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/me');
      const data: ApiResponse<AuthContextType> = await response.json();

      if (data.success && data.data!.isAuthenticated) {
        setUser(data.data!.user);
        setPreferences(data.data!.preferences || defaultPreferences);
      } else {
        setUser(null);
        // Try to get language from localStorage for guests
        const savedLang = localStorage.getItem('preferredLanguage') as Language;
        if (savedLang && ['ka', 'en', 'ru'].includes(savedLang)) {
          setPreferences((prev) => ({ ...prev, preferredLanguage: savedLang }));
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<AuthContextType> = await response.json();

      if (data.success) {
        await refreshAuth();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const signup = async (email: string, password: string) => {
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data: ApiResponse<AuthContextType> = await response.json();

      if (data.success) {
        await refreshAuth();
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Signup failed:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      setPreferences(defaultPreferences);
    }
  };

  const updatePreferences = async (prefs: Partial<UserPreferences>) => {
    // Update local state immediately
    setPreferences((prev) => ({ ...prev, ...prefs }));

    // Save language to localStorage for guests
    if (prefs.preferredLanguage) {
      localStorage.setItem('preferredLanguage', prefs.preferredLanguage);
    }

    // If authenticated, also save to server
    if (user) {
      try {
        await fetch('/api/user/preferences', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(prefs),
        });
      } catch (error) {
        console.error('Failed to save preferences:', error);
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        preferences,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        logout,
        updatePreferences,
        refreshAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
