
import React, { createContext, useContext, useState, useEffect } from 'react';
import { authenticateUser } from '@/lib/database';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/components/ui/sonner';

type User = {
  id: number;
  username: string;
  role: string;
} | null;

type AuthContextType = {
  user: User;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAdmin: () => boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>(null);
  const navigate = useNavigate();
  
  // On mount, check local storage for user
  useEffect(() => {
    const storedUser = localStorage.getItem('tileTracker_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to parse stored user data:', error);
        localStorage.removeItem('tileTracker_user');
      }
    }
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const userData = await authenticateUser(username, password);
      
      if (userData) {
        setUser(userData);
        localStorage.setItem('tileTracker_user', JSON.stringify(userData));
        toast.success(`Welcome back, ${userData.username}!`);
        return true;
      } else {
        toast.error('Invalid username or password');
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('tileTracker_user');
    toast.info('You have been logged out');
    navigate('/login');
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
