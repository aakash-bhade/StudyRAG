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

  const login = useCallback(async credentials => acceptSession(await authApi.login(credentials)), [acceptSession]);
  const register = useCallback(async details => acceptSession(await authApi.register(details)), [acceptSession]);
  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); setAccessToken(null); }
  }, []);

  const value = useMemo(() => ({ user, accessToken, loading, login, register, logout }), [user, accessToken, loading, login, register, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
