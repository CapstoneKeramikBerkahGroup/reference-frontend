import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// --- Icons ---
import { 
  Download, Trash2, Eye, 
  FileText, FolderOpen, Clock, 
  Link as LinkIcon, Book, LayoutGrid, Sparkles, CloudDownload, Link2, CheckCircle,
  Scale, ArrowRight
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { documentsAPI, integrationAPI } from '../services/api';
import { format } from 'date-fns';
import Navbar from '@/components/Navbar';
import api from '../services/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t, language } = useLanguage();

  // --- State Management ---
  const [activeTab, setActiveTab] = useState('uploads');
  
  const [documents, setDocuments] = useState([]);
  const [mendeleyDocuments, setMendeleyDocuments] = useState([]);
  const [zoteroDocuments, setZoteroDocuments] = useState([]);
  const [references, setReferences] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingRef, setLoadingRef] = useState(false);
  const [mendeleyLoading, setMendeleyLoading] = useState(false);
  const [mendeleyConnected, setMendeleyConnected] = useState(false);
  const [mendeleyStatus, setMendeleyStatus] = useState(null);

  // State untuk Zotero
  const [zoteroLoading, setZoteroLoading] = useState(false);
  const [zoteroConnected, setZoteroConnected] = useState(false);
  const [zoteroStatus, setZoteroStatus] = useState(null);
  const [zoteroDialogOpen, setZoteroDialogOpen] = useState(false);
  const [zoteroApiKey, setZoteroApiKey] = useState('');
  const [zoteroUserId, setZoteroUserId] = useState('');

  // State untuk Loading Analisis Zotero Per Item
  const [analyzingIds, setAnalyzingIds] = useState([]);
  
  // --- Load Data ---
  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        await loadDocuments();
        await loadZoteroReferences();
        await checkMendeleyCallback();
        await checkMendeleyStatus();
        await checkZoteroStatus();
      } catch (error) {
        console.error('Dashboard initialization error:', error);
        // Set loading false even if error occurs
        setLoading(false);
      }
    };
    
    initializeDashboard();
  }, []);


  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      const allDocs = response.data;
      
      console.log('🔍 All documents:', allDocs);
      
      // Pisahkan documents berdasarkan sumber
      // Deteksi dari nama_file karena backend belum ada field sumber_impor
      const mendeleyDocs = allDocs.filter(doc => 
        doc.nama_file && doc.nama_file.startsWith('mendeley_')
      );
      const zoteroDocs = allDocs.filter(doc => 
        doc.nama_file && doc.nama_file.startsWith('zotero_')
      );
      
      console.log('📚 Zotero documents filtered:', zoteroDocs);
      console.log('📊 Zotero count:', zoteroDocs.length);
      
      // Sisanya adalah manual uploads
      const manualUploads = allDocs.filter(doc => {
        const fileName = doc.nama_file || '';
        return !fileName.startsWith('mendeley_') && !fileName.startsWith('zotero_');
      });
      
      setDocuments(manualUploads);
      setMendeleyDocuments(mendeleyDocs);
      setZoteroDocuments(zoteroDocs);
    } catch (err) {
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const loadZoteroReferences = async () => {
    setLoadingRef(true);
    try {
      const response = await integrationAPI.getReferences();
      setReferences(response.data || []);
    } catch (err) {
      console.log("Zotero fetch error (User might not be connected)");
      setReferences([]);
    } finally {
      setLoadingRef(false);
    }
  };

  const checkZoteroStatus = async () => {
    try {
      // Check if config exists first
      const configResponse = await integrationAPI.getConfig();
      const hasConfig = configResponse.data && configResponse.data.api_key && configResponse.data.user_id;
      
      if (hasConfig) {
        // Only check references if config exists
        try {
          const refsResponse = await integrationAPI.getReferences();
          setZoteroConnected(true);
          setZoteroStatus({ 
            connected: true,
            count: refsResponse.data?.length || 0 
          });
        } catch (refErr) {
          // Config exists but can't fetch references
          setZoteroConnected(true);
          setZoteroStatus({ connected: true, count: 0 });
        }
      } else {
        setZoteroConnected(false);
        setZoteroStatus(null);
      }
    } catch (err) {
      console.error('Failed to check Zotero status:', err);
      // Set false on error instead of leaving undefined
      setZoteroConnected(false);
      setZoteroStatus(null);
      // Don't throw error, just log it
    }
  };

  const handleRefreshZotero = async () => {
    try {
      setZoteroLoading(true);
      
      // Trigger sync to fetch from Zotero API
      const syncResponse = await integrationAPI.syncZotero();
      const syncedCount = syncResponse.data?.synced_count || 0;
      
      // Reload references from database
      await loadZoteroReferences();
      await checkZoteroStatus();
      
      toast.success(
        language === 'id' 
          ? `Berhasil refresh! ${syncedCount} referensi ditemukan` 
          : `Refreshed successfully! ${syncedCount} references found`
      );
    } catch (err) {
      console.error('Zotero refresh error:', err);
      
      // Check if token/config expired (401 Unauthorized)
      if (err.response?.status === 401) {
        // Config expired or invalid, auto disconnect and ask user to reconnect
        setZoteroConnected(false);
        setZoteroStatus(null);
        setReferences([]);
        toast.error(
          language === 'id' 
            ? 'Konfigurasi Zotero tidak valid atau telah berakhir. Silakan hubungkan kembali.' 
            : 'Zotero configuration is invalid or expired. Please reconnect.'
        );
      } else {
        const errorMsg = err.response?.data?.detail || 
          (language === 'id' ? 'Gagal refresh Zotero' : 'Failed to refresh Zotero');
        toast.error(errorMsg);
      }
    } finally {
      setZoteroLoading(false);
    }
  };

  const handleDisconnectZotero = async () => {
    if (!confirm(language === 'id' ? 'Yakin ingin memutuskan koneksi Zotero?' : 'Are you sure you want to disconnect Zotero?')) return;
    
    try {
      await integrationAPI.disconnect();
      setZoteroConnected(false);
      setZoteroStatus(null);
      setReferences([]);
      toast.success(language === 'id' ? 'Koneksi Zotero terputus' : 'Zotero disconnected successfully');
    } catch (err) {
      toast.error(language === 'id' ? 'Gagal memutuskan koneksi' : 'Failed to disconnect');
    }
  };

  const handleOpenZoteroDialog = async () => {
    try {
      const response = await integrationAPI.getConfig();
      setZoteroApiKey(response.data.api_key || '');
      setZoteroUserId(response.data.user_id || '');
      setZoteroDialogOpen(true);
    } catch (err) {
      setZoteroApiKey('');
      setZoteroUserId('');
      setZoteroDialogOpen(true);
    }
  };

  const handleSaveZoteroConfig = async () => {
    if (!zoteroApiKey || !zoteroUserId) {
      toast.error(language === 'id' ? 'API Key dan User ID harus diisi' : 'API Key and User ID are required');
      return;
    }

    try {
      setZoteroLoading(true);
      await integrationAPI.saveConfig({
        api_key_zotero: zoteroApiKey,
        user_id_zotero: zoteroUserId
      });
      
      toast.success(language === 'id' ? 'Konfigurasi Zotero berhasil disimpan' : 'Zotero configuration saved successfully');
      setZoteroDialogOpen(false);
      
      // Trigger sync to fetch papers from Zotero
      toast.info(language === 'id' ? 'Menyinkronkan library Zotero...' : 'Syncing Zotero library...');
      await handleRefreshZotero();
    } catch (err) {
      toast.error(err.response?.data?.detail || (language === 'id' ? 'Gagal menyimpan konfigurasi' : 'Failed to save configuration'));
    } finally {
      setZoteroLoading(false);
    }
  };

  // --- Zotero Analysis Handler ---
  const handleAnalyzeZotero = async (refId) => {
    setAnalyzingIds(prev => [...prev, refId]);
    
    try {
        await integrationAPI.analyzeZotero(refId);
        toast.success(
          language === 'id' 
            ? "Document berhasil didownload! Sedang diproses..." 
            : "Document downloaded! Processing..."
        );
        
        // Reload documents immediately to show the new document
        await loadDocuments();
        
        // Keep loading state for a bit longer to show processing
        setTimeout(async () => {
            await loadDocuments();
            await loadZoteroReferences();
            setAnalyzingIds(prev => prev.filter(id => id !== refId));
            toast.info(
              language === 'id'
                ? "Paper sudah tersedia di tab Zotero Library!"
                : "Paper is now available in Zotero Library tab!"
            );
        }, 1000);
        
    } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to process Zotero item. PDF might be missing.");
        setAnalyzingIds(prev => prev.filter(id => id !== refId));
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

  const checkMendeleyCallback = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mendeleySync = urlParams.get('mendeley_sync');
    const imported = urlParams.get('imported');
    const errorMessage = urlParams.get('message');

    if (mendeleySync === 'success') {
      const importedCount = parseInt(imported) || 0;
      if (importedCount > 0) {
        toast.success(t('mendeley.imported', { count: importedCount }).replace('{count}', importedCount));
      } else {
        toast.info(t('messages.info.allPapersExist'));
      }
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
      // Reload documents to show new ones
      loadDocuments();
      checkMendeleyStatus();
    } else if (mendeleySync === 'error') {
      toast.error(`Gagal sinkronisasi: ${errorMessage}`);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const checkMendeleyStatus = async () => {
    try {
      const response = await api.get('/mendeley/status');
      setMendeleyConnected(response.data.connected);
      setMendeleyStatus(response.data);
    } catch (err) {
      console.error('Failed to check Mendeley status:', err);
    }
  };

  const handleConnectMendeley = async () => {
    try {
      setMendeleyLoading(true);
      
      // Call authorize endpoint without dokumen_id
      const response = await api.get('/mendeley/oauth/authorize');
      
      if (response.data.authorization_url) {
        // Redirect to Mendeley authorization (will come back to this page)
        window.location.href = response.data.authorization_url;
      } else {
        toast.error('Gagal mendapatkan authorization URL');
        setMendeleyLoading(false);
      }
    } catch (err) {
      console.error('Mendeley auth error:', err);
      const errorMsg = err.response?.data?.detail || err.message || t('messages.error.mendeleyFailed');
      toast.error(errorMsg);
      setMendeleyLoading(false);
    }
  };

  const handleRefreshMendeley = async () => {
    try {
      setMendeleyLoading(true);
      const response = await api.post('/mendeley/refresh');
      
      const imported = response.data.imported || 0;
      const skipped = response.data.skipped_count || 0;
      
      if (imported > 0) {
        toast.success(t('mendeley.imported', { count: imported }).replace('{count}', imported));
      } else if (skipped > 0) {
        toast.info(t('mendeley.allExist', { count: skipped }).replace('{count}', skipped));
      } else {
        toast.info(t('mendeley.noNew'));
      }
      
      // Reload documents
      await loadDocuments();
      await checkMendeleyStatus();
    } catch (err) {
      console.error('Mendeley refresh error:', err);
      
      // Check if token expired (401 Unauthorized)
      if (err.response?.status === 401) {
        // Token expired, auto disconnect and ask user to reconnect
        setMendeleyConnected(false);
        setMendeleyStatus(null);
        toast.error(
          language === 'id' 
            ? 'Sesi Mendeley telah berakhir. Silakan hubungkan kembali.' 
            : 'Mendeley session expired. Please reconnect.'
        );
      } else {
        const errorMsg = err.response?.data?.detail || t('messages.error.mendeleyRefreshFailed');
        toast.error(errorMsg);
      }
    } finally {
      setMendeleyLoading(false);
    }
  };

  const handleDisconnectMendeley = async () => {
    if (!confirm(t('mendeley.confirmDisconnect'))) return;
    
    try {
      await api.post('/mendeley/disconnect');
      setMendeleyConnected(false);
      setMendeleyStatus(null);
      toast.success(t('messages.success.mendeleyDisconnected'));
    } catch (err) {
      toast.error(t('messages.error.mendeleyFailed'));
    }
  };

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

      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="border-cyan-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{t('dashboard.totalDocuments')}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-gray-900">{documents.length + mendeleyDocuments.length + zoteroDocuments.length}</p>
                </div>
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-cyan-100 rounded-xl flex items-center justify-center">
                  <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
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
                    {[...documents, ...mendeleyDocuments, ...zoteroDocuments].filter(d => d.status_analisis === 'completed').length}
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
                    {[...documents, ...mendeleyDocuments, ...zoteroDocuments].filter(d => d.status_analisis === 'processing').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access - Research Gap Analysis */}
        <Card 
          className="mb-6 sm:mb-8 border-2 border-purple-200 bg-gradient-to-br from-purple-50 via-purple-100/50 to-purple-50 cursor-pointer hover:shadow-xl hover:border-purple-300 transition-all duration-300 group"
          onClick={() => navigate('/comparison')}
        >
          <CardContent className="pt-4 pb-4 sm:pt-6 sm:pb-5">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-br from-purple-600 to-purple-700 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0">
                  <Scale className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {language === 'id' ? 'Analisis Research Gap' : 'Research Gap Analysis'}
                    </h3>
                    <Badge variant="secondary" className="bg-purple-600 text-white text-xs whitespace-nowrap">
                      {language === 'id' ? 'Fitur Penting' : 'Key Feature'}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600">
                    {language === 'id' 
                      ? 'Bandingkan 2 paper untuk menemukan kesenjangan penelitian dan peluang riset baru' 
                      : 'Compare 2 papers to discover research gaps and new opportunities'}
                  </p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-purple-600 hover:text-purple-700 hover:bg-purple-100 group-hover:translate-x-1 transition-transform flex-shrink-0"
              >
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Integration Cards - Mendeley & Zotero */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Mendeley Integration Card */}
          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-indigo-50">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <CloudDownload className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        {t('mendeley.title')}
                      </h3>
                      {mendeleyConnected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ {t('mendeley.connected')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {mendeleyConnected 
                        ? `${t('mendeley.lastSync')}: ${mendeleyStatus?.last_sync ? new Date(mendeleyStatus.last_sync).toLocaleString(language === 'id' ? 'id-ID' : 'en-US') : t('mendeley.neverSynced')}`
                        : t('mendeley.description')
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!mendeleyConnected ? (
                    <Button 
                      onClick={handleConnectMendeley}
                      disabled={mendeleyLoading}
                      className="bg-purple-600 hover:bg-purple-700 text-white w-full"
                    >
                      {mendeleyLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          {t('mendeley.connecting')}
                        </>
                      ) : (
                        <>
                          <Link2 className="w-4 h-4 mr-2" />
                          {t('mendeley.connect')}
                        </>
                      )}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleRefreshMendeley}
                        disabled={mendeleyLoading}
                        variant="outline"
                        className="border-purple-300 text-purple-700 hover:bg-purple-50 flex-1"
                      >
                        {mendeleyLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-700"></div>
                        ) : (
                          <>
                            <CloudDownload className="w-4 h-4 mr-2" />
                            {t('mendeley.refresh')}
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleDisconnectMendeley}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {t('mendeley.disconnect')}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zotero Integration Card */}
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardContent className="pt-6">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Book className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-semibold text-gray-900">
                        Zotero Library
                      </h3>
                      {zoteroConnected && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ {language === 'id' ? 'Terhubung' : 'Connected'}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {zoteroConnected
                        ? `${references.length} ${language === 'id' ? 'referensi tersedia' : 'references available'}`
                        : (language === 'id' 
                          ? 'Kelola dan analisis referensi dari library Zotero Anda' 
                          : 'Manage and analyze references from your Zotero library')
                      }
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {!zoteroConnected ? (
                    <Button 
                      onClick={handleOpenZoteroDialog}
                      className="bg-blue-600 hover:bg-blue-700 text-white w-full"
                    >
                      <Link2 className="w-4 h-4 mr-2" />
                      {language === 'id' ? 'Hubungkan' : 'Connect'}
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleRefreshZotero}
                        disabled={zoteroLoading}
                        variant="outline"
                        className="border-blue-300 text-blue-700 hover:bg-blue-50 flex-1"
                      >
                        {zoteroLoading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-700"></div>
                        ) : (
                          <>
                            <CloudDownload className="w-4 h-4 mr-2" />
                            {language === 'id' ? 'Refresh' : 'Refresh'}
                          </>
                        )}
                      </Button>
                      <Button 
                        onClick={handleOpenZoteroDialog}
                        variant="outline"
                        className="border-gray-300 text-gray-700 hover:bg-gray-50"
                        title={language === 'id' ? 'Kelola' : 'Manage'}
                      >
                        {language === 'id' ? 'Kelola' : 'Manage'}
                      </Button>
                      <Button 
                        onClick={handleDisconnectZotero}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                      >
                        {language === 'id' ? 'Putuskan' : 'Disconnect'}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Header with Tab Switcher */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-gray-900">
                {activeTab === 'uploads' 
                  ? t('dashboard.recentDocuments') 
                  : activeTab === 'mendeley' 
                    ? 'Mendeley Library' 
                    : 'Zotero Library'}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                {activeTab === 'uploads' 
                  ? t('dashboard.quickAccess') 
                  : activeTab === 'mendeley'
                    ? (language === 'id' ? 'Paper dari Mendeley library Anda' : 'Papers from your Mendeley library')
                    : (language === 'id' ? 'Referensi dari Zotero library Anda' : 'References from your Zotero library')}
              </p>
            </div>
          </div>

          {/* TAB SWITCHER - Scrollable on mobile */}
          <div className="border-b border-border/40 -mx-3 sm:mx-0 overflow-x-auto">
            <div className="flex gap-4 sm:gap-6 px-3 sm:px-0 min-w-max sm:min-w-0">
              <button 
                onClick={() => setActiveTab('uploads')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'uploads' ? 'border-cyan-600 text-cyan-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  {language === 'id' ? 'Upload Saya' : 'My Uploads'}
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 sm:h-5 px-1">{documents.length}</Badge>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('mendeley')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'mendeley' ? 'border-purple-600 text-purple-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <CloudDownload className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Mendeley Library</span>
                  <span className="sm:hidden">Mendeley</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 sm:h-5 px-1">{mendeleyDocuments.length}</Badge>
                </div>
              </button>
              <button 
                onClick={() => setActiveTab('zotero')}
                className={`pb-3 text-xs sm:text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${
                  activeTab === 'zotero' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Book className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
                  <span className="hidden sm:inline">Zotero Library</span>
                  <span className="sm:hidden">Zotero</span>
                  <Badge variant="secondary" className="ml-1 text-[10px] h-4 sm:h-5 px-1">{zoteroDocuments.length}</Badge>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        
        {/* TAB 1: MY UPLOADS - Horizontal Card Layout (Original Style) */}
        {activeTab === 'uploads' && (
          <>
            {documents.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-cyan-200">
                <FileText className="w-16 h-16 mx-auto mb-4 text-cyan-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('dashboard.noDocuments')}</h3>
                <p className="text-gray-600 mb-6">{t('dashboard.uploadFirst')}</p>
              </div>
            ) : (
              <>
                {/* Horizontal Compact Card List */}
                <div className="space-y-3">
                  {documents.slice(0, 6).map((doc) => (
                    <Card
                      key={doc.id}
                      className="border-cyan-200 bg-white shadow-sm hover:shadow-md transition-all group border-l-4 border-l-cyan-500"
                    >
                      <CardContent className="p-3 sm:p-4">
                        <div className="flex items-center gap-3 sm:gap-4">
                          {/* Icon */}
                          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-600" />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="text-sm sm:text-base font-semibold text-gray-900 line-clamp-1 group-hover:text-cyan-600 transition-colors break-words min-w-0 flex-1" title={doc.judul}>
                                {doc.judul}
                              </h3>
                              <div className="flex-shrink-0">
                                {getStatusBadge(doc.status_analisis)}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-gray-600 flex-wrap">
                              <span className="truncate flex items-center min-w-0 max-w-xs" title={doc.nama_file}>
                                <FileText className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5 flex-shrink-0" />
                                {doc.nama_file}
                              </span>
                              <span className="flex items-center flex-shrink-0 whitespace-nowrap">
                                <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1 sm:mr-1.5" />
                                {format(new Date(doc.tanggal_unggah), 'MMM dd, yyyy')}
                              </span>
                              <span className="flex-shrink-0 whitespace-nowrap text-xs">{formatFileSize(doc.ukuran_kb * 1024)}</span>
                            </div>
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
          </>
        )}

        {/* TAB 2: MENDELEY LIBRARY - Horizontal Card Layout */}
        {activeTab === 'mendeley' && (
          <>
            {mendeleyDocuments.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-purple-200">
                <CloudDownload className="w-16 h-16 mx-auto mb-4 text-purple-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'id' ? 'Belum ada paper dari Mendeley' : 'No papers from Mendeley'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {language === 'id' ? 'Hubungkan Mendeley untuk mengimpor paper Anda' : 'Connect Mendeley to import your papers'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {mendeleyDocuments.slice(0, 6).map((doc) => (
                    <Card
                      key={doc.id}
                      className="border-purple-200 bg-white shadow-sm hover:shadow-md transition-all group border-l-4 border-l-purple-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <CloudDownload className="w-6 h-6 text-purple-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-purple-600 transition-colors break-words min-w-0 flex-1" title={doc.judul}>
                                {doc.judul}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="secondary" className="bg-purple-100 text-purple-700 text-xs">Mendeley</Badge>
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
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {mendeleyDocuments.length > 6 && (
                  <div className="mt-8 text-center">
                    <Button
                      variant="outline" 
                      size="lg"
                      onClick={() => navigate('/documents')}
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
                    >
                      <FolderOpen className="w-4 h-4 mr-2" />
                      {t('dashboard.viewAll')}
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* TAB 3: ZOTERO LIBRARY - Show both analyzed docs and available references */}
        {activeTab === 'zotero' && (
          <>
            {zoteroDocuments.length === 0 && references.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-blue-200">
                <Book className="w-16 h-16 mx-auto mb-4 text-blue-300" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {language === 'id' ? 'Belum ada paper dari Zotero' : 'No papers from Zotero'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {language === 'id' ? 'Hubungkan Zotero dan klik Refresh untuk mengimpor paper Anda' : 'Connect Zotero and click Refresh to import your papers'}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Analyzed Papers Section - Always show if there are analyzed documents */}
                {zoteroDocuments.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      {language === 'id' ? 'Paper Teranalisis' : 'Analyzed Papers'}
                      <Badge variant="secondary" className="bg-green-100 text-green-700">{zoteroDocuments.length}</Badge>
                    </h3>
                    <div className="space-y-3">
                      {zoteroDocuments.map((doc) => (
                    <Card
                      key={doc.id}
                      className="border-blue-200 bg-white shadow-sm hover:shadow-md transition-all group border-l-4 border-l-blue-500"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Book className="w-6 h-6 text-blue-600" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 line-clamp-1 group-hover:text-blue-600 transition-colors break-words min-w-0 flex-1" title={doc.judul}>
                                {doc.judul}
                              </h3>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Zotero</Badge>
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
                        </div>
                      </CardContent>
                    </Card>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            )}
          </>
        )}
      </main>

      {/* Zotero Configuration Dialog */}
      <Dialog open={zoteroDialogOpen} onOpenChange={setZoteroDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Book className="w-5 h-5 text-blue-600" />
              {language === 'id' ? 'Konfigurasi Zotero' : 'Zotero Configuration'}
            </DialogTitle>
            <DialogDescription>
              {language === 'id' 
                ? 'Masukkan API Key dan User ID Zotero Anda untuk menghubungkan library.' 
                : 'Enter your Zotero API Key and User ID to connect your library.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="zotero-userid">
                {language === 'id' ? 'User ID Zotero' : 'Zotero User ID'}
              </Label>
              <Input
                id="zotero-userid"
                placeholder={language === 'id' ? 'Masukkan User ID Anda' : 'Enter your User ID'}
                value={zoteroUserId}
                onChange={(e) => setZoteroUserId(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {language === 'id' 
                  ? 'Temukan di Zotero Settings → Feeds/API' 
                  : 'Find it in Zotero Settings → Feeds/API'}
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="zotero-apikey">
                {language === 'id' ? 'API Key Zotero' : 'Zotero API Key'}
              </Label>
              <Input
                id="zotero-apikey"
                type="password"
                placeholder={language === 'id' ? 'Masukkan API Key Anda' : 'Enter your API Key'}
                value={zoteroApiKey}
                onChange={(e) => setZoteroApiKey(e.target.value)}
              />
              <p className="text-xs text-gray-500">
                {language === 'id' 
                  ? 'Buat API Key baru di zotero.org/settings/keys' 
                  : 'Create a new API Key at zotero.org/settings/keys'}
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs text-blue-900">
                <strong>{language === 'id' ? 'Catatan:' : 'Note:'}</strong>{' '}
                {language === 'id' 
                  ? 'API Key harus memiliki akses "Read Only" ke library Anda.' 
                  : 'API Key must have "Read Only" access to your library.'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setZoteroDialogOpen(false)}
              disabled={zoteroLoading}
            >
              {language === 'id' ? 'Batal' : 'Cancel'}
            </Button>
            <Button
              onClick={handleSaveZoteroConfig}
              disabled={zoteroLoading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {zoteroLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {language === 'id' ? 'Menyimpan...' : 'Saving...'}
                </>
              ) : (
                <>{language === 'id' ? 'Simpan & Hubungkan' : 'Save & Connect'}</>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;