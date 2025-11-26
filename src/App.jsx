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
import DosenDashboard from './pages/DosenDashboard';
import DosenMahasiswaDokumen from './pages/DosenMahasiswaDokumen';
import DosenDokumenDetail from './pages/DosenDokumenDetail';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Smart Root Redirect based on user role
const RootRedirect = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  if (user.role === 'dosen') {
    return <Navigate to="/dosen/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
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

              {/* Protected Routes - Mahasiswa */}
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
              
              {/* Protected Routes - Dosen */}
              <Route 
                path="/dosen/dashboard" 
                element={
                  <PrivateRoute>
                    <DosenDashboard />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/dosen/mahasiswa/:mahasiswaId/dokumen" 
                element={
                  <PrivateRoute>
                    <DosenMahasiswaDokumen />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/dosen/dokumen/:dokumenId" 
                element={
                  <PrivateRoute>
                    <DosenDokumenDetail />
                  </PrivateRoute>
                } 
              />

              {/* Default Redirect - Smart based on role */}
              <Route path="/" element={<RootRedirect />} />
              
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