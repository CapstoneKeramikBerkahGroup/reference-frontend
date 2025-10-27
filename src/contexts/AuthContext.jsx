import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await authAPI.login(formData);
    const { access_token } = response.data;
    
    localStorage.setItem('token', access_token);
    
    // Get user info
    const userResponse = await authAPI.getMe();
    setUser(userResponse.data);
    localStorage.setItem('user', JSON.stringify(userResponse.data));
    
    return userResponse.data;
  };

  const register = async (userData, role) => {
    if (role === 'mahasiswa') {
      await authAPI.registerMahasiswa(userData);
    } else {
      await authAPI.registerDosen(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isMahasiswa: user?.role === 'mahasiswa',
    isDosen: user?.role === 'dosen',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
