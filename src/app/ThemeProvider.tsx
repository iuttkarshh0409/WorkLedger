/**
 * ThemeProvider
 *
 * Provides theme context to the application.
 *
 * Milestone 1: Light theme only.
 * Future milestones may add dark mode, high-contrast, or user preferences.
 *
 * All token values are defined in tailwind.config.ts.
 * This provider exists as the extension point for runtime theme switching.
 */

import { createContext, useContext, type ReactNode } from 'react';

// ─── Types ───────────────────────────────────────────────────────────────────

type Theme = 'light';

interface ThemeContextValue {
  theme: Theme;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  // Milestone 1: single static theme.
  // A future milestone will derive this from user preferences or system settings.
  //
  // Future:
  // - Theme persistence (localStorage / user profile)
  // - Dark mode
  // - High-contrast accessibility mode
  // - User preferences (font size, density)
  const theme: Theme = 'light';

  return (
    <ThemeContext.Provider value={{ theme }}>
      <div data-theme={theme} className="contents">
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useTheme
 *
 * Returns the current theme context.
 * Must be used inside <ThemeProvider>.
 */
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
