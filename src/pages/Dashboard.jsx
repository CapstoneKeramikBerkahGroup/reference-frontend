import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- 1. Import Komponen Shadcn (Pengganti MUI) ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner'; 

// --- 2. Import Icons & Context ---
import { 
  Download, Trash2, Eye, FileText, FolderOpen, Clock 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { documentsAPI } from '../services/api';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  // --- 3. State Management (Dari Kode Lama Anda) ---
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- 4. Logika Backend (Dipertahankan & Disesuaikan) ---

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
    } catch (err) {
      toast.error('Failed to load documents');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm(t('documentDetail.deleteConfirm'))) return;
    
    try {
      await documentsAPI.delete(id);
      toast.success(t('messages.success.deleted'));
      await loadDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(t('messages.error.deleteFailed'));
    }
  };

  const handleDownload = async (id, filename) => {
    try {
      const response = await documentsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(t('messages.success.downloadStarted'));
    } catch (err) {
      toast.error(t('messages.error.downloadFailed'));
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // --- 5. Helper UI (Dari Lovable) ---
  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{t('documentDetail.status.completed')}</Badge>;
      case 'processing':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">{t('documentDetail.status.processing')}</Badge>;
      default:
        return <Badge variant="outline">{t('documentDetail.status.pending')}</Badge>;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // --- 6. Render Tampilan (Menggunakan JSX dari Lovable) ---
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-cyan-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('dashboard.totalDocuments')}</p>
                  <p className="text-3xl font-bold text-gray-900">{documents.length}</p>
                </div>
                <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('dashboard.processed')}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {documents.filter(d => d.status_analisis === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{t('dashboard.processing')}</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {documents.filter(d => d.status_analisis === 'processing').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Documents - Quick Access */}
        <div className="mb-6">
          <div className="mb-6">
            <h2 className="text-2xl font-serif font-bold text-gray-900">{t('dashboard.recentDocuments')}</h2>
            <p className="text-sm text-gray-600">{t('dashboard.quickAccess')}</p>
          </div>
        </div>

        {/* Document List */}
        {documents.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-cyan-200">
            <FileText className="w-16 h-16 mx-auto mb-4 text-cyan-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.noDocuments')}</h3>
            <p className="text-gray-600 mb-6">{t('dashboard.uploadFirst')}</p>
          </div>
        ) : (
          <>
            {/* Horizontal Card Layout - Compact for Quick Access */}
            <div className="space-y-3">
              {documents.slice(0, 6).map((doc) => (
                <Card 
                  key={doc.id} 
                  className="border-cyan-200 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group border-l-4 border-l-cyan-500"
                  onClick={() => navigate(`/documents/${doc.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      {/* Icon */}
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <FileText className="w-6 h-6 text-cyan-600" />
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-cyan-600 transition-colors break-words min-w-0 flex-1" title={doc.judul}>
                            {doc.judul}
                          </h3>
                          <div className="flex-shrink-0">
                            {getStatusBadge(doc.status_analisis)}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600 flex-wrap">
                          <span className="truncate flex items-center min-w-0 max-w-xs" title={doc.nama_file}>
                            <FileText className="w-3.5 h-3.5 mr-1.5 flex-shrink-0" />
                            {doc.nama_file}
                          </span>
                          <span className="flex items-center flex-shrink-0 whitespace-nowrap">
                            <Clock className="w-3.5 h-3.5 mr-1.5" />
                            {format(new Date(doc.tanggal_unggah), 'MMM dd, yyyy')}
                          </span>
                          <span className="flex-shrink-0 whitespace-nowrap">{formatFileSize(doc.ukuran_kb * 1024)}</span>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2 flex-shrink-0">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/documents/${doc.id}`);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" /> {t('common.view')}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="border-gray-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(doc.id, doc.nama_file);
                          }}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          
          {/* View All Button - Only show if more than 6 documents */}
          {documents.length > 6 && (
            <div className="mt-8 text-center">
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/documents')}
                className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
              >
                <FolderOpen className="w-4 h-4 mr-2" />
                {t('dashboard.viewAll')}
              </Button>
            </div>
          )}
        </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;