import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('sweety_token'));
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('sweety_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Logout helper
  const logout = useCallback(() => {
    localStorage.removeItem('sweety_token');
    localStorage.removeItem('sweety_user');
    setToken(null);
    setUser(null);
  }, []);

  // Verify token on initial app load
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      const storedToken = localStorage.getItem('sweety_token');
      if (!storedToken) {
        if (isMounted) {
          setLoading(false);
          setUser(null);
          setToken(null);
        }
        return;
      }

      try {
        const response = await api.get('/api/auth/me');
        if (isMounted && response.data && response.data.user) {
          setUser(response.data.user);
          localStorage.setItem('sweety_user', JSON.stringify(response.data.user));
          setToken(storedToken);
        }
      } catch (error) {
        if (isMounted) {
          const status = error.response ? error.response.status : null;
          // If token is invalid/expired (401) or user was deleted (404), clean up
          if (status === 401 || status === 404) {
            logout();
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyToken();

    // Listen for global auth expired events from Axios interceptor
    const handleAuthExpired = () => {
      if (isMounted) {
        logout();
      }
    };

    window.addEventListener('sweety_auth_expired', handleAuthExpired);

    return () => {
      isMounted = false;
      window.removeEventListener('sweety_auth_expired', handleAuthExpired);
    };
  }, [logout]);

  // Login handler
  const login = async (email, password) => {
    const response = await api.post('/api/auth/login', {
      email: email.trim().toLowerCase(),
      password,
    });

    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('sweety_token', receivedToken);
    localStorage.setItem('sweety_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return response.data;
  };

  // Register handler
  const register = async (name, email, password) => {
    const response = await api.post('/api/auth/register', {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    });

    const { token: receivedToken, user: receivedUser } = response.data;

    localStorage.setItem('sweety_token', receivedToken);
    localStorage.setItem('sweety_user', JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return response.data;
  };

  // Update user profile in state and localStorage
  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sweety_user', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    token,
    loading,
    isAuthenticated: Boolean(token && user),
    login,
    register,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
