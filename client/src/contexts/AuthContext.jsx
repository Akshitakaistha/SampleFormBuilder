
import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<any>;
  register: (username: string, email: string, password: string) => Promise<any>;
  logout: () => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

// Create the context
const AuthContext = createContext<AuthContextType | null>(null);

// Auth provider component
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          // Validate token by fetching user profile
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Invalid token, remove it
            localStorage.removeItem('token');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  // Login function
  const login = async (username: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      // Redirect to dashboard
      setLocation('/');
      
      toast({
        title: 'Success',
        description: 'You have successfully logged in.',
      });
      
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (username: string, email: string, password: string) => {
    try {
      setLoading(true);
      const response = await apiRequest('POST', '/api/auth/register', { 
        username, 
        email, 
        password,
        role: 'admin' // Default role for self-registration
      });
      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.token);
      setUser(data.user);
      
      // Redirect to dashboard
      setLocation('/');
      
      toast({
        title: 'Success',
        description: 'Account created successfully!',
      });
      
      return data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setLocation('/login');
    
    toast({
      title: 'Logged out',
      description: 'You have been successfully logged out.',
    });
  };
  
  // Context value
  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading: loading,
    login,
    register,
    logout
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
