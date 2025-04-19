import React, { createContext, useState, useContext, useEffect } from 'react';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Create the context with default values to avoid null errors
export const AuthContext = createContext({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: () => {},
  register: () => {},
  logout: () => {}
});

// Auth provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  // Check if user is authenticated on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (token) {
          console.log('Checking auth status with token');
          // Validate token by fetching user profile
          try {
            const userData = await apiRequest({
              method: 'GET',
              url: '/api/auth/me'
            });
            
            console.log('Auth check response:', userData);
            if (userData) {
              // Handle MongoDB response format if present
              const userObject = userData._doc || userData;
              console.log('Auth check user data:', userObject);
              setUser(userObject);
            } else {
              // Invalid token, remove it
              localStorage.removeItem('token');
              setUser(null);
            }
          } catch (error) {
            console.error('Auth check request failed:', error);
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          setUser(null);
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
  const login = async (username, password) => {
    try {
      setLoading(true);
      console.log('Attempting login for:', username);
      
      const data = await apiRequest({
        method: 'POST',
        url: '/api/auth/login',
        data: { username, password }
      });
      
      console.log('Login response:', data);
      
      // Store token and user data
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        // Extract the actual user data, handling the MongoDB object
        const userData = data.user._doc || data.user;
        console.log('Setting user data:', userData);
        setUser(userData);
        
        // Redirect to dashboard
        setLocation('/');
        
        toast({
          title: 'Success',
          description: 'You have successfully logged in.',
        });
        
        return data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: 'Login Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
      throw new Error(error.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (username, email, password) => {
    try {
      setLoading(true);
      console.log('Attempting registration for:', username);
      
      const data = await apiRequest({
        method: 'POST',
        url: '/api/auth/register',
        data: { 
          username, 
          email, 
          password,
          role: 'admin' // Default role for self-registration
        }
      });
      
      console.log('Registration response:', data);
      
      // Store token and user data
      if (data && data.token) {
        localStorage.setItem('token', data.token);
        // Extract the actual user data, handling the MongoDB object
        const userData = data.user._doc || data.user;
        console.log('Setting user data:', userData);
        setUser(userData);
        
        // Redirect to dashboard
        setLocation('/');
        
        toast({
          title: 'Success',
          description: 'Account created successfully!',
        });
        
        return data;
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: 'Registration Failed',
        description: error.message || 'Please try again with different credentials.',
        variant: 'destructive',
      });
      throw new Error(error.message || 'Registration failed');
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
  const value = {
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
export function useAuth() {
  const context = useContext(AuthContext);
  // We've provided default values, so this should never be null
  // Still keeping the check for safety
  if (!context) {
    console.error('Auth context missing - this should not happen');
    return {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: () => Promise.reject(new Error('Auth provider not initialized')),
      register: () => Promise.reject(new Error('Auth provider not initialized')),
      logout: () => console.error('Auth provider not initialized')
    };
  }
  return context;
}