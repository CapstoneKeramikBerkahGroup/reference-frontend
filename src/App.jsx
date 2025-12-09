import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner'; // Notifikasi modern
import { TooltipProvider } from '@/components/ui/tooltip'; // Pembungkus tooltip Shadcn
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Contexts
import { AuthProvider } from './contexts/AuthContext';
import { LanguageProvider } from './contexts/LanguageContext';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import DocumentDetail from './pages/DocumentDetail';
import Visualization from './pages/Visualization';
import Comparison from './pages/Comparison';
import Settings from './pages/Settings';
import Drafting from './pages/Drafting';
import DosenDashboard from './pages/DosenDashboard';
import DosenMahasiswaDokumen from './pages/DosenMahasiswaDokumen';
import DosenDokumenDetail from './pages/DosenDokumenDetail';
import DosenMahasiswaManagement from './pages/DosenMahasiswaManagement';
import MahasiswaDosenSelection from './pages/MahasiswaDosenSelection';
import PilihPembimbing from './pages/PilihPembimbing';
import DosenPembimbingSaya from './pages/DosenPembimbingSaya';
import DosenRequestBimbingan from './pages/DosenRequestBimbingan';
import DosenPendingReferensi from './pages/DosenPendingReferensi';
import MahasiswaReferensi from './pages/MahasiswaReferensi';
import Profile from './pages/Profile';
import Documents from './pages/Documents';
import Footer from '@/components/Footer';

// Protected Route Component
const PrivateRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" />;
};

// Smart Root Redirect based on user role and login status
const RootRedirect = () => {
  const token = localStorage.getItem('token');
  console.log('RootRedirect - Token:', token);
  
  // If not logged in, show home page
  if (!token) {
    console.log('No token, showing Home page');
    return <Home />;
  }
  
  // If logged in, redirect based on role
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  console.log('User role:', user.role);
  if (user.role === 'dosen') {
    return <Navigate to="/dosen/dashboard" replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

const queryClient = new QueryClient();

// Layout wrapper with conditional footer
const LayoutWrapper = ({ children }) => {
  const location = useLocation();
  const hideFooterPaths = ['/login', '/register', '/forgot-password', '/reset-password', '/', '/home'];
  const shouldHideFooter = hideFooterPaths.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="flex-1">
        {children}
      </div>
      {!shouldHideFooter && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Toaster untuk menampilkan notifikasi (toast.success/error) di seluruh aplikasi */}
        <Toaster />
        
        <BrowserRouter>
          <LanguageProvider>
            <AuthProvider>
              <LayoutWrapper>
                <Routes>
                  {/* Public Routes */}
                  <Route path="/home" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

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
                path="/documents" 
                element={
                  <PrivateRoute>
                    <Documents />
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

              <Route 
                path="/comparison" 
                element={
                  <PrivateRoute>
                    <Comparison />
                  </PrivateRoute>
                } 
              />

              <Route 
                path="/settings" 
                element={
                  <PrivateRoute>
                    <Settings />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/draft" 
                element={
                  <PrivateRoute>
                    <Drafting />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/mahasiswa/referensi" 
                element={
                  <PrivateRoute>
                    <MahasiswaReferensi />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/profile" 
                element={
                  <PrivateRoute>
                    <Profile />
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
              
              <Route 
                path="/dosen/mahasiswa-management" 
                element={
                  <PrivateRoute>
                    <DosenMahasiswaManagement />
                  </PrivateRoute>
                } 
              />
              
              {/* Mahasiswa Routes */}
              <Route 
                path="/mahasiswa/pilih-dosen" 
                element={
                  <PrivateRoute>
                    <MahasiswaDosenSelection />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/mahasiswa/dosen-selection" 
                element={
                  <PrivateRoute>
                    <PilihPembimbing />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/mahasiswa/dosen-pembimbing" 
                element={
                  <PrivateRoute>
                    <DosenPembimbingSaya />
                  </PrivateRoute>
                } 
              />
              
              {/* Dosen Routes - Request Bimbingan */}
              <Route 
                path="/dosen/request-bimbingan" 
                element={
                  <PrivateRoute>
                    <DosenRequestBimbingan />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/dosen/pending-referensi" 
                element={
                  <PrivateRoute>
                    <DosenPendingReferensi />
                  </PrivateRoute>
                } 
              />
              
              <Route 
                path="/dosen/mahasiswa" 
                element={
                  <PrivateRoute>
                    <DosenRequestBimbingan />
                  </PrivateRoute>
                } 
              />

                  {/* Default Redirect - Smart based on role */}
                  <Route path="/" element={<RootRedirect />} />
                  
                  {/* 404 Catch-all */}
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </LayoutWrapper>
            </AuthProvider>
          </LanguageProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;