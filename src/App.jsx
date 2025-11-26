import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'; // Notifikasi modern
import { TooltipProvider } from '@/components/ui/tooltip'; // Pembungkus tooltip Shadcn
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AuthProvider } from './contexts/AuthContext';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import Visualization from './pages/Visualization';

// Protected Route Component (Opsional: untuk keamanan)
// Jika user belum login, tendang ke halaman login
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token'); // Atau gunakan context jika ada
  return token ? children : <Navigate to="/login" />;
};

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toaster untuk menampilkan notifikasi (toast.success/error) di seluruh aplikasi */}
        <Toaster />
        
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected Routes (Halaman Utama) */}
              <Route 
                path="/dashboard" 
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/documents/:id" 
                element={
                  <PrivateRoute>
                    <DocumentDetail />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/visualization" 
                element={
                  <PrivateRoute>
                    <Visualization />
                  </PrivateRoute>
                } 
              />

              {/* Default Redirect */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              
              {/* 404 Catch-all */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;