import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, updateActiveWallet } from './api';

const SessionContext = createContext(null);

function normalizeSession(value) {
  return {
    isAuthenticated: value?.is_authenticated ?? value?.isAuthenticated ?? false,
    user: value?.user ?? null,
  };
}

export function SessionProvider({ initialSession, children }) {
  const [session, setSession] = useState(() => normalizeSession(initialSession));
  const [isLoading, setIsLoading] = useState(true);
  const [isChangingWallet, setIsChangingWallet] = useState(false);
  const [error, setError] = useState(null);
  const [walletDataVersion, setWalletDataVersion] = useState(0);

  const refreshSession = useCallback(async () => {
    setError(null);
    setIsLoading(true);
    try {
      const nextSession = normalizeSession(await getSession());
      setSession(nextSession);
      return nextSession;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshSession().catch(() => undefined);
  }, [refreshSession]);

  const invalidateWalletData = useCallback(() => {
    setWalletDataVersion((version) => version + 1);
  }, []);

  const selectWallet = useCallback(async (walletId) => {
    setError(null);
    setIsChangingWallet(true);
    try {
      await updateActiveWallet(walletId);
      const nextSession = await refreshSession();
      invalidateWalletData();
      return nextSession;
    } catch (nextError) {
      setError(nextError);
      throw nextError;
    } finally {
      setIsChangingWallet(false);
    }
  }, [invalidateWalletData, refreshSession]);

  const value = useMemo(() => ({
    ...session,
    isLoading,
    isChangingWallet,
    error,
    refreshSession,
    selectWallet,
    invalidateWalletData,
    walletDataVersion,
  }), [error, invalidateWalletData, isChangingWallet, isLoading, refreshSession, selectWallet, session, walletDataVersion]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession must be used within SessionProvider.');
  return session;
}
