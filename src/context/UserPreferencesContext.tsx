import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';

interface UserPreferences {
  cuisineFilters: string[];
  ratingThreshold: number;
  radiusKm: number;
}

interface UserPreferencesContextValue {
  preferences: UserPreferences;
  updatePreferences: (partial: Partial<UserPreferences>) => void;
}

const defaultPreferences: UserPreferences = {
  cuisineFilters: [],
  ratingThreshold: 8.0,
  radiusKm: 5,
};

const STORAGE_KEY = 'delectable_user_preferences';

function loadFromStorage(): UserPreferences {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultPreferences, ...parsed };
    }
  } catch {
    // Ignore parse errors, fall back to defaults
  }
  return defaultPreferences;
}

function saveToStorage(prefs: UserPreferences): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Ignore storage errors (e.g. quota exceeded)
  }
}

const UserPreferencesContext = createContext<UserPreferencesContextValue | undefined>(undefined);

export function UserPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);

  // Load from localStorage on mount (client-side only)
  useEffect(() => {
    setPreferences(loadFromStorage());
  }, []);

  const updatePreferences = useCallback((partial: Partial<UserPreferences>) => {
    setPreferences((prev) => {
      const next = { ...prev, ...partial };
      saveToStorage(next);
      return next;
    });
  }, []);

  const value = useMemo<UserPreferencesContextValue>(
    () => ({ preferences, updatePreferences }),
    [preferences, updatePreferences],
  );

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}

export function usePreferences(): UserPreferencesContextValue {
  const ctx = useContext(UserPreferencesContext);
  if (ctx === undefined) {
    throw new Error('usePreferences must be used within a UserPreferencesProvider');
  }
  return ctx;
}

export default UserPreferencesContext;
