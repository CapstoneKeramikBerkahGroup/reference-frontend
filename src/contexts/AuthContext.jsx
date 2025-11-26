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
  // Loading state penting agar UI tidak 'loncat' ke halaman login saat cek token
  const [loading, setLoading] = useState(true); 

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Verifikasi token ke backend
        const response = await authAPI.getMe();
        setUser(response.data);
      } catch (error) {
        console.error('Auth check failed:', error);
        // Jika token invalid/expired, bersihkan
        logout();
      }
    }
    setLoading(false);
  };

  const login = async (credentials) => {
    try {
      // Backend FastAPI butuh Form Data untuk login (OAuth2 standard)
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);
      
      const response = await authAPI.login(formData);
      const { access_token } = response.data;
      
      localStorage.setItem('token', access_token);
      
      // Setelah dapat token, ambil data user lengkap
      const userResponse = await authAPI.getMe();
      setUser(userResponse.data);
      localStorage.setItem('user', JSON.stringify(userResponse.data));
      
      return userResponse.data;
    } catch (error) {
      console.error("Login error:", error);
      throw error; // Lempar error agar bisa ditangkap oleh UI (tampilkan alert)
    }
  };

  const register = async (userData, role) => {
    try {
      if (role === 'mahasiswa') {
        await authAPI.registerMahasiswa(userData);
      } else if (role === 'dosen') {
        await authAPI.registerDosen(userData);
      } else {
        throw new Error("Role tidak valid");
      }
    } catch (error) {
      console.error("Register error:", error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    // Opsional: Redirect paksa ke login bisa dilakukan di komponen UI
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

  return (
    <AuthContext.Provider value={value}>
      {/* Tahan rendering anak sampai cek auth selesai agar tidak flicker */}
      {!loading && children}
    </AuthContext.Provider>
  );
};