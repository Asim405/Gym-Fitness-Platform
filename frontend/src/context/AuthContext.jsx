import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('gym_user') : null;
    if (stored) setUser(JSON.parse(stored));
    setLoading(false);
  }, []);

  function persist(userData, token) {
    localStorage.setItem('gym_token', token);
    localStorage.setItem('gym_user', JSON.stringify(userData));
    setUser(userData);
  }

  async function login(email, password) {
    const { data } = await api.post('/auth/login', { email, password });
    persist(data.user, data.token);
    return data.user;
  }

  async function register(fullName, email, password) {
    const { data } = await api.post('/auth/register', { fullName, email, password });
    persist(data.user, data.token);
    return data.user;
  }

  function logout() {
    localStorage.removeItem('gym_token');
    localStorage.removeItem('gym_user');
    setUser(null);
    router.push('/login');
  }

  function homeForRole(role) {
    if (role === 'admin') return '/admin/dashboard';
    if (role === 'trainer') return '/trainer/dashboard';
    return '/member/dashboard';
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, homeForRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
