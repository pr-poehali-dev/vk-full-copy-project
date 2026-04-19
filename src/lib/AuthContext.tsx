import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from './api';

interface User {
  id: number;
  username: string;
  display_name: string;
  email: string;
  avatar_url: string;
  bio: string;
  city: string;
  followers_count: number;
  following_count: number;
  posts_count: number;
}

interface AuthContextType {
  user: User | null;
  token: string;
  loading: boolean;
  login: (login: string, password: string) => Promise<{ error?: string }>;
  register: (data: { username: string; email: string; password: string; display_name: string }) => Promise<{ error?: string }>;
  logout: () => void;
  updateUser: (u: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState(localStorage.getItem('vspishka_token') || '');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.me().then((res) => {
        if (res.user) setUser(res.user);
        else { localStorage.removeItem('vspishka_token'); setToken(''); }
        setLoading(false);
      }).catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginVal: string, password: string) => {
    const res = await api.login(loginVal, password);
    if (res.error) return { error: res.error };
    localStorage.setItem('vspishka_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return {};
  };

  const register = async (data: { username: string; email: string; password: string; display_name: string }) => {
    const res = await api.register(data);
    if (res.error) return { error: res.error };
    localStorage.setItem('vspishka_token', res.token);
    setToken(res.token);
    setUser(res.user);
    return {};
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('vspishka_token');
    setToken('');
    setUser(null);
  };

  const updateUser = (u: Partial<User>) => setUser((prev) => prev ? { ...prev, ...u } : prev);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
