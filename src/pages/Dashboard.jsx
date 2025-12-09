import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// --- Icons ---
import { 
  Search, Upload, Download, Trash2, Eye, LogOut, 
  FileText, TrendingUp, Plus, FolderOpen, Clock, User, BookOpen, Scale, 
  Link as LinkIcon, Book, LayoutGrid, Sparkles, CloudDownload, Link2 
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
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  
  const [references, setReferences] = useState([]);
  const [filteredReferences, setFilteredReferences] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingRef, setLoadingRef] = useState(false);
  const [mendeleyLoading, setMendeleyLoading] = useState(false);
  const [mendeleyConnected, setMendeleyConnected] = useState(false);
  const [mendeleyStatus, setMendeleyStatus] = useState(null);

  // State untuk Loading Analisis Zotero Per Item
  const [analyzingIds, setAnalyzingIds] = useState([]); 

  const [searchQuery, setSearchQuery] = useState('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);
  
  // --- Load Data ---
  useEffect(() => {
    loadDocuments();
    loadZoteroReferences();
    checkMendeleyCallback();
    checkMendeleyStatus();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, documents, references, activeTab]);


  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
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
      setReferences(response.data);
    } catch (err) {
      console.log("Zotero fetch error (User might not be connected)");
    } finally {
      setLoadingRef(false);
    }
  };

  const filterData = () => {
    const query = searchQuery.toLowerCase();
    if (activeTab === 'uploads') {
        const filtered = documents.filter((doc) =>
            doc.judul.toLowerCase().includes(query) ||
            doc.nama_file.toLowerCase().includes(query)
        );
        setFilteredDocuments(filtered);
    } else {
        const filtered = references.filter((ref) => 
            ref.title.toLowerCase().includes(query) ||
            ref.authors.toLowerCase().includes(query)
        );
        setFilteredReferences(filtered);
    }
  };

  // --- Zotero Analysis Handler ---
  const handleAnalyzeZotero = async (refId) => {
    // Tambahkan ID ke state loading
    setAnalyzingIds(prev => [...prev, refId]);
    
    try {
        // Panggil API Backend untuk download & proses
        await integrationAPI.analyzeZotero(refId);
        
        toast.success("Document downloaded & processing started!");
        
        // Refresh data setelah delay singkat (agar status updated)
        setTimeout(() => {
            loadZoteroReferences(); // Refresh list Zotero (cek local_document_id)
            loadDocuments();        // Refresh list Uploads (dokumen baru masuk)
        }, 2000);
        
    } catch (err) {
        toast.error(err.response?.data?.detail || "Failed to process Zotero item. PDF might be missing.");
    } finally {
        // Hapus ID dari state loading
        setAnalyzingIds(prev => prev.filter(id => id !== refId));
    }
  };

  // --- Handlers Lainnya ---
  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.warning('Please select at least one file');
      return;
    }
    setUploading(true);
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const titleToSend = uploadTitle || file.name.replace(/\.[^/.]+$/, '');
        formData.append('judul', titleToSend);
        await documentsAPI.upload(formData);
      }
      toast.success('Documents uploaded successfully!');
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadTitle('');
      loadDocuments();
    } catch (err) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
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
      const errorMsg = err.response?.data?.detail || t('messages.error.mendeleyRefreshFailed');
      toast.error(errorMsg);
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

  // --- 5. Helper UI ---
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

      <main className="container mx-auto px-4 lg:px-8 py-8">
        
        {/* STATS CARDS */}
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

        {/* Mendeley Integration Card */}
        <Card className="mb-8 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center">
                  <CloudDownload className="w-7 h-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {t('mendeley.title')}
                    </h3>
                    {mendeleyConnected && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✓ {t('mendeley.connected')}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
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
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    size="lg"
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
                      size="lg"
                      className="border-purple-300 text-purple-700 hover:bg-purple-50"
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
                      size="lg"
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

        {/* TAB SWITCHER */}
        <div className="mb-6 border-b border-border/40">
            <div className="flex gap-6">
                <button 
                    onClick={() => setActiveTab('uploads')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'uploads' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <LayoutGrid className="w-4 h-4" /> My Uploads
                        <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1">{documents.length}</Badge>
                    </div>
                </button>
                <button 
                    onClick={() => setActiveTab('zotero')}
                    className={`pb-3 text-sm font-medium transition-colors border-b-2 ${
                        activeTab === 'zotero' ? 'border-blue-600 text-blue-600' : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <div className="flex items-center gap-2">
                        <Book className="w-4 h-4" /> Zotero Library
                        <Badge variant="secondary" className="ml-1 text-[10px] h-5 px-1">{references.length}</Badge>
                    </div>
                </button>
            </div>
        </div>

        {/* CONTENT */}
        
        {/* TAB 1: UPLOADS */}
        {activeTab === 'uploads' && (
            <>
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No uploaded documents found matching your search.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredDocuments.map((doc) => (
                        <Card 
                            key={doc.id} 
                            className="border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                            onClick={() => navigate(`/documents/${doc.id}`)}
                        >
                            <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                <FileText className="w-5 h-5 text-primary" />
                                </div>
                                {getStatusBadge(doc.status_analisis)}
                            </div>
                            <CardTitle className="text-lg font-serif line-clamp-2 group-hover:text-primary transition-colors">
                                {doc.judul}
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                            <div className="flex items-center text-sm text-muted-foreground truncate">
                                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">{doc.nama_file}</span>
                            </div>
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                                <span>{formatFileSize(doc.ukuran_kb * 1024)}</span>
                                <span>{format(new Date(doc.tanggal_unggah), 'MMM dd, yyyy')}</span>
                            </div>
                            </CardContent>
                            <CardFooter className="flex gap-2">
                            <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); navigate(`/documents/${doc.id}`); }}>
                                <Eye className="w-4 h-4 mr-1" /> View
                            </Button>
                            <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleDownload(doc.id, doc.nama_file); }}>
                                <Download className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" className="text-destructive hover:bg-destructive/10" onClick={(e) => { e.stopPropagation(); handleDelete(doc.id); }}>
                                <Trash2 className="w-4 h-4" />
                            </Button>
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                )}
            </>
        )}

        {/* TAB 2: ZOTERO (YANG SEKARANG SUDAH ADA BUTTON ANALYZE) */}
        {activeTab === 'zotero' && (
            <>
                {loadingRef ? (
                    <div className="text-center py-12 text-muted-foreground">Loading your library...</div>
                ) : filteredReferences.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed rounded-lg bg-gray-50/50">
                        <Book className="w-12 h-12 mx-auto text-gray-300 mb-2" />
                        <p className="text-muted-foreground">No references found in Zotero library.</p>
                        <Button variant="link" onClick={() => navigate('/settings')}>Check Connection</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredReferences.map((ref) => (
                        <Card 
                            key={ref.id} 
                            className="border-border/50 bg-white hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group"
                        >
                            <CardHeader>
                            <div className="flex items-start justify-between mb-2">
                                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <Book className="w-5 h-5 text-blue-600" />
                                </div>
                                <Badge variant="secondary" className="bg-blue-100 text-blue-700">Zotero</Badge>
                            </div>
                            <CardTitle className="text-lg font-serif line-clamp-2 group-hover:text-blue-600 transition-colors" title={ref.title}>
                                {ref.title}
                            </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="text-sm text-muted-foreground space-y-1">
                                    <p className="line-clamp-1 font-medium text-foreground">{ref.authors}</p>
                                    <div className="flex items-center gap-2">
                                        <Clock className="w-3 h-3" /> Year: {ref.year}
                                    </div>
                                </div>
                                {ref.abstract && (
                                    <p className="text-xs text-gray-500 line-clamp-3 italic bg-gray-50 p-2 rounded border">
                                        "{ref.abstract}"
                                    </p>
                                )}
                            </CardContent>
                            <CardFooter className="flex gap-2 pt-2">
                                {/* JIKA SUDAH DIANALISIS -> MUNCUL TOMBOL VIEW */}
                                {ref.local_document_id ? (
                                    <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="flex-1 text-green-700 border-green-200 hover:bg-green-50"
                                        onClick={() => navigate(`/documents/${ref.local_document_id}`)}
                                    >
                                        <Eye className="w-4 h-4 mr-2" /> View Analysis
                                    </Button>
                                ) : (
                                    /* JIKA BELUM -> MUNCUL TOMBOL ANALYZE */
                                    <Button 
                                        variant="default" 
                                        size="sm" 
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                        onClick={() => handleAnalyzeZotero(ref.id)}
                                        disabled={analyzingIds.includes(ref.id)}
                                    >
                                        {analyzingIds.includes(ref.id) ? (
                                            <>
                                                <span className="animate-spin mr-2">⌛</span> Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles className="w-4 h-4 mr-2" /> Analyze AI
                                            </>
                                        )}
                                    </Button>
                                )}

                                {/* TOMBOL LINK ORIGINAL */}
                                {ref.url && (
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="text-muted-foreground hover:text-blue-600"
                                        onClick={() => window.open(ref.url, '_blank')}
                                        title="Open Source"
                                    >
                                        <LinkIcon className="w-4 h-4" />
                                    </Button>
                                )}
                            </CardFooter>
                        </Card>
                        ))}
                    </div>
                )}
            </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;