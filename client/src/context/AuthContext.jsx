import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/authApi.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const acceptSession = useCallback(({ user: nextUser, accessToken: nextToken }) => {
    setUser(nextUser);
    setAccessToken(nextToken);
  }, []);

  const refreshAccessToken = useCallback(async () => {
    try {
      const session = await authApi.refresh();
      acceptSession(session);
      return session.accessToken;
    } catch (error) {
      setUser(null);
      setAccessToken(null);
      throw error;
    }
  }, [acceptSession]);

  useEffect(() => {
    let active = true;
    authApi.refresh().then(session => {
      if (active) acceptSession(session);
    }).catch(() => {
      if (active) { setUser(null); setAccessToken(null); }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [acceptSession]);

  useEffect(() => {
    if (!accessToken) return undefined;
    const timer = window.setTimeout(() => { refreshAccessToken().catch(() => {}); }, 12 * 60 * 1000);
    return () => window.clearTimeout(timer);
  }, [accessToken, refreshAccessToken]);

  const login = useCallback(async credentials => acceptSession(await authApi.login(credentials)), [acceptSession]);
  const register = useCallback(async details => acceptSession(await authApi.register(details)), [acceptSession]);
  const updateUser = useCallback(nextUser => setUser(nextUser), []);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); setAccessToken(null); }
  }, []);

  const value = useMemo(() => ({ user, accessToken, loading, login, register, logout, refreshAccessToken, updateUser }), [user, accessToken, loading, login, register, logout, refreshAccessToken, updateUser]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
