import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface User {
  sub?: string;
  email?: string;
  name?: string;
  preferred_username?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  token: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  useEffect(() => {
    // Check if user is returning from authentication
    const urlParams = new URLSearchParams(window.location.search);
    const authToken = urlParams.get('token');

    if (authToken) {
      // Handle JWT token from callback
      try {
        // Decode JWT to get user info (simple decode, not validation)
        const payload = JSON.parse(atob(authToken.split('.')[1]));
        setUser(payload);
        setToken(authToken);

        // Store the token
        localStorage.setItem('auth_token', authToken);

        // Clear the token from URL
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (err) {
        console.error('Error handling auth token:', err);
      }
    } else {
      // Check for existing token
      const storedToken = localStorage.getItem('auth_token');
      if (storedToken) {
        try {
          const payload = JSON.parse(atob(storedToken.split('.')[1]));
          setUser(payload);
          setToken(storedToken);
        } catch (err) {
          localStorage.removeItem('auth_token');
          setToken(null);
        }
      }
    }

    setIsLoading(false);
  }, []);

  const login = () => {
    // Redirect to API's login endpoint
    window.location.href = `${API_BASE_URL.replace('/api', '')}/auth/login`;
  };

  const logout = () => {
    // Clear local storage and state
    localStorage.removeItem('auth_token');
    setUser(null);
    setToken(null);

    // Optional: Call API logout endpoint
    fetch(`${API_BASE_URL.replace('/api', '')}/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    }).catch(err => console.error('Logout error:', err));
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    logout,
    token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};