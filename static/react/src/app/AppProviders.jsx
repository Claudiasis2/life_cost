import { createContext, useContext, useEffect, useMemo } from 'react';
import { configureHttpInterceptors } from '@/shared/api';

const AppConfigContext = createContext(null);

export function AppProviders({ children }) {
  const config = useMemo(() => window.__APP_CONFIG__ ?? { isAuthenticated: false, user: null }, []);

  useEffect(() => configureHttpInterceptors({
    onUnauthorized: () => window.location.assign('/google_login'),
    onForbidden: (error) => window.dispatchEvent(new CustomEvent('http:forbidden', { detail: error })),
  }), []);

  return <AppConfigContext.Provider value={config}>{children}</AppConfigContext.Provider>;
}

export function useAppConfig() {
  const config = useContext(AppConfigContext);
  if (!config) throw new Error('useAppConfig must be used within AppProviders.');
  return config;
}
