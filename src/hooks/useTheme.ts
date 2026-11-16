import { useCallback } from 'react';

export type ThemeMode = 'light';
export type ResolvedTheme = 'light';

export function useTheme() {
  const setTheme = useCallback((_mode: ThemeMode) => {}, []);
  const toggleTheme = useCallback(() => {}, []);

  return {
    theme: 'light' as const,
    resolvedTheme: 'light' as const,
    isDark: false,
    setTheme,
    toggleTheme,
  };
}
