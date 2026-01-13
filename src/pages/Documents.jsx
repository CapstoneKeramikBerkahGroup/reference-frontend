import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Search, Download, Trash2, Eye, FileText, Clock, 
  CheckCircle2, Filter, SortAsc, SortDesc, Plus, Upload, Sparkles 
} from 'lucide-react';
import { documentsAPI, integrationAPI } from '../services/api';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useLanguage } from '../contexts/LanguageContext';

const Documents = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('desc'); // desc = newest first
  const [filterStatus, setFilterStatus] = useState('all'); // all, completed, processing, pending
  const [filterSource, setFilterSource] = useState('all'); // all, manual, mendeley, zotero
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  // Zotero references state
  const [zoteroReferences, setZoteroReferences] = useState([]);
  const [analyzingIds, setAnalyzingIds] = useState([]);

  useEffect(() => {
    loadDocuments();
    loadZoteroReferences();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [searchQuery, documents, sortOrder, filterStatus, filterSource]);

  const loadDocuments = async () => {
    try {
      console.log('🔍 Loading documents...');
      const response = await documentsAPI.getAll();
      console.log('✅ Documents loaded:', response.data);
      console.log('📊 Total documents:', response.data.length);
      
      // Debug: check zotero files
      const zoteroFiles = response.data.filter(doc => doc.nama_file && doc.nama_file.startsWith('zotero_'));
      console.log('📚 Zotero documents:', zoteroFiles.length);
      console.log('Zotero files:', zoteroFiles);
      
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } catch (err) {
      console.error('❌ Failed to load documents:', err);
      console.error('Error response:', err.response);
      console.error('Error status:', err.response?.status);
      console.error('Error data:', err.response?.data);
      toast.error(t('messages.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const loadZoteroReferences = async () => {
    try {
      const response = await integrationAPI.getReferences();
      setZoteroReferences(response.data || []);
    } catch (err) {
      // Silently fail - user might not have Zotero configured
      console.log('Zotero not configured or no references');
    }
  };

  const handleAnalyzeZotero = async (refId) => {
    setAnalyzingIds(prev => [...prev, refId]);
    
    try {
        await integrationAPI.analyzeZotero(refId);
        toast.success(
          t('messages.success.analyzed') || 'Document downloaded! Processing...'
        );
        
        // Reload documents and references
        await loadDocuments();
        await loadZoteroReferences();
        setAnalyzingIds(prev => prev.filter(id => id !== refId));
        
    } catch (err) {
        toast.error(err.response?.data?.detail || 'Failed to process Zotero item. PDF might be missing.');
        setAnalyzingIds(prev => prev.filter(id => id !== refId));
    }
  };

  const filterAndSortDocuments = () => {
    let filtered = [...documents];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter((doc) =>
        doc.judul.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doc.nama_file.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter((doc) => doc.status_analisis === filterStatus);
    }

    // Filter by source
    if (filterSource !== 'all') {
      if (filterSource === 'mendeley') {
        filtered = filtered.filter((doc) => doc.nama_file && doc.nama_file.startsWith('mendeley_'));
      } else if (filterSource === 'zotero') {
        filtered = filtered.filter((doc) => doc.nama_file && doc.nama_file.startsWith('zotero_'));
      } else if (filterSource === 'manual') {
        filtered = filtered.filter((doc) => {
          const fileName = doc.nama_file || '';
          return !fileName.startsWith('mendeley_') && !fileName.startsWith('zotero_');
        });
      }
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.tanggal_unggah);
      const dateB = new Date(b.tanggal_unggah);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredDocuments(filtered);
  };

  // Helper functions to count documents by source
  const getManualCount = () => {
    return documents.filter(doc => {
      const fileName = doc.nama_file || '';
      return !fileName.startsWith('mendeley_') && !fileName.startsWith('zotero_');
    }).length;
  };

  const getMendeleyCount = () => {
    return documents.filter(doc => doc.nama_file && doc.nama_file.startsWith('mendeley_')).length;
  };

  const getZoteroCount = () => {
    return documents.filter(doc => doc.nama_file && doc.nama_file.startsWith('zotero_')).length;
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

  const handleDelete = async (id) => {
    if (!confirm(t('documentDetail.deleteConfirm'))) return;
    
    try {
      await documentsAPI.delete(id);
      toast.success(t('messages.success.deleted'));
      await loadDocuments();
    } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.response?.data?.detail || t('messages.error.deleteFailed'));
    }
  };

  const handleUpload = async () => {
    if (uploadFiles.length === 0) {
      toast.warning(t('documents.selectFile'));
      return;
    }

    setUploading(true);
    try {
      // Upload sequential
      for (let i = 0; i < uploadFiles.length; i++) {
        const file = uploadFiles[i];
        const formData = new FormData();
        formData.append('file', file);
        const titleToSend = uploadTitle || file.name.replace(/\.[^/.]+$/, '');
        formData.append('judul', titleToSend);

        await documentsAPI.upload(formData);
      }

      toast.success(t('messages.success.uploaded'));
      setUploadDialogOpen(false);
      setUploadFiles([]);
      setUploadTitle('');
      loadDocuments();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('messages.error.uploadFailed'));
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{t('documentDetail.status.completed')}</Badge>;
      case 'processing':
        return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-cyan-200">{t('documentDetail.status.processing')}</Badge>;
      case 'failed':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-red-200">{t('documentDetail.status.failed')}</Badge>;
      case 'pending':
        return <Badge variant="outline">{t('documentDetail.status.pending')}</Badge>;
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
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{t('common.loading')}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900">{t('documents.title')}</h1>
              <p className="text-sm sm:text-base text-gray-600">
                {filteredDocuments.length} {t('documents.documentsFound')}
              </p>
            </div>
          </div>
        </div>

        {/* Search & Actions Bar */}
        <div className="mb-6 space-y-4">
          {/* Search Bar with Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder={t('documents.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-11 bg-white border-cyan-200"
              />
            </div>

            {/* Upload Document Button */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-11 bg-cyan-600 hover:bg-cyan-700 whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('documents.uploadDocument')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-w-[95vw] overflow-hidden">
                <DialogHeader>
                  <DialogTitle className="font-serif">{t('documents.uploadTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('documents.uploadDescription')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4 overflow-x-hidden">
                  <div className="space-y-2">
                    <Label htmlFor="title">{t('documents.titleOptional')}</Label>
                    <Input
                      id="title"
                      placeholder={t('documents.titlePlaceholder')}
                      value={uploadTitle}
                      onChange={(e) => setUploadTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dropzone-file">{t('documents.selectFiles')}</Label>
                    <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-500 text-center px-2">
                          <span className="font-semibold">{t('documents.clickToUpload')}</span> {t('documents.orDragDrop')}
                        </p>
                        <p className="text-xs text-gray-500">{t('documents.fileTypes')}</p>
                      </div>
                      <input 
                        id="dropzone-file" 
                        type="file" 
                        className="hidden" 
                        multiple
                        accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          console.log('Files selected:', files);
                          setUploadFiles(files);
                        }}
                      />
                    </label>
                    
                    {/* Alternative: Direct Button to Trigger File Input */}
                    <div className="flex justify-center mt-2">
                      <Button 
                        type="button"
                        variant="outline" 
                        size="sm"
                        onClick={() => document.getElementById('dropzone-file')?.click()}
                        className="border-cyan-300 text-cyan-700 hover:bg-cyan-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {t('documents.browseFiles') || 'Browse Files'}
                      </Button>
                    </div>
                    
                    {uploadFiles.length > 0 && (
                      <div className="mt-3 space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          {uploadFiles.length} {t('documents.filesSelected')}:
                        </p>
                        <div className="space-y-1 max-h-32 overflow-y-auto">
                          {uploadFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center gap-2 bg-cyan-50 px-3 py-2 rounded text-xs min-w-0">
                              <span className="truncate flex-1 min-w-0">{file.name}</span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setUploadFiles(prev => prev.filter((_, i) => i !== idx))}
                                className="h-6 w-6 p-0 flex-shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                              >
                                ×
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || uploadFiles.length === 0}
                    className="w-full bg-cyan-600 hover:bg-cyan-700"
                  >
                    {uploading ? t('documents.uploading') : t('documents.startUpload')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter & Sort Bar */}
          <div className="flex flex-col gap-3">
            {/* Source Filter */}
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterSource === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('all')}
                className={`text-xs sm:text-sm ${filterSource === 'all' ? 'bg-gray-600 hover:bg-gray-700' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
              >
                {t('documents.allSources')} ({documents.length})
              </Button>
              <Button
                variant={filterSource === 'manual' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('manual')}
                className={filterSource === 'manual' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}
              >
                {t('documents.myUploads')} ({getManualCount()})
              </Button>
              <Button
                variant={filterSource === 'mendeley' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('mendeley')}
                className={filterSource === 'mendeley' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}
              >
                {t('documents.mendeley')} ({getMendeleyCount()})
              </Button>
              <Button
                variant={filterSource === 'zotero' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSource('zotero')}
                className={filterSource === 'zotero' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-300 text-blue-700 hover:bg-blue-50'}
              >
                {t('documents.zotero')} ({getZoteroCount()})
              </Button>
            </div>

            {/* Sort Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc')}
              className="border-cyan-300 text-cyan-700 hover:bg-cyan-50 sm:ml-auto"
            >
              {sortOrder === 'desc' ? (
                <>
                  <SortDesc className="w-4 h-4 mr-2" />
                  {t('documents.newest')}
                </>
              ) : (
                <>
                  <SortAsc className="w-4 h-4 mr-2" />
                  {t('documents.oldest')}
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Document List - Analyzed Papers (Show First) */}
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-16">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('documents.noDocumentsFound')}</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery || filterStatus !== 'all' 
                ? t('documents.tryAdjusting')
                : t('documents.uploadFirstDoc')}
            </p>
            {!searchQuery && filterStatus === 'all' && (
              <Button onClick={() => navigate('/dashboard')} className="bg-cyan-600 hover:bg-cyan-700">
                {t('documents.goToDashboard')}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {filteredDocuments.map((doc) => (
              <Card 
                key={doc.id} 
                className="border-cyan-200 bg-white shadow-sm hover:shadow-lg transition-all hover:-translate-y-1 cursor-pointer group border-t-4 border-t-cyan-500 overflow-hidden flex flex-col"
                onClick={() => navigate(`/documents/${doc.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-md">
                      <FileText className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-shrink-0">
                      {getStatusBadge(doc.status_analisis)}
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold line-clamp-2 group-hover:text-cyan-600 transition-colors leading-tight break-words">
                    {doc.judul}
                  </CardTitle>
                </CardHeader>

                <CardContent className="space-y-2.5 pb-4 flex-1">
                  <div className="flex items-center gap-2 text-sm text-gray-600 min-w-0">
                    <FileText className="w-4 h-4 flex-shrink-0 text-cyan-600" />
                    <span className="truncate font-medium" title={doc.nama_file}>
                      {doc.nama_file}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Clock className="w-4 h-4 flex-shrink-0 text-gray-400" />
                    <span className="truncate">{format(new Date(doc.tanggal_unggah), 'MMM dd, yyyy')}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <span className="text-sm font-semibold text-cyan-700 truncate">
                      {formatFileSize(doc.ukuran_kb * 1024)}
                    </span>
                    {doc.status_analisis === 'completed' && (
                      <span className="text-xs text-green-600 font-medium flex items-center flex-shrink-0">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                        {t('documents.ready')}
                      </span>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex gap-2 pt-4 border-t bg-gray-50/50">
                  <Button size="sm" variant="outline" className="flex-1 border-cyan-300 text-cyan-700 hover:bg-cyan-50" onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/documents/${doc.id}`);
                  }}>
                    <Eye className="w-4 h-4 mr-1" /> {t('common.view')}
                  </Button>
                  <Button size="sm" variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50" onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(doc.id, doc.nama_file);
                  }}>
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50 border-red-300" onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(doc.id);
                  }}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Zotero References Section - Only show when Zotero filter is active */}
        {filterSource === 'zotero' && zoteroReferences.length > 0 && (
          <Card className="mb-6 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">
                  {t('language') === 'id' ? 'Siap untuk Dianalisis' : 'Ready to Analyze'}
                </CardTitle>
                <Badge variant="secondary" className="bg-blue-100 text-blue-700">{zoteroReferences.length}</Badge>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                {t('language') === 'id' 
                  ? 'Klik "Analisis AI" untuk download dan analyze paper ke sistem' 
                  : 'Click "AI Analyze" to download and analyze paper into system'}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {zoteroReferences.map((ref) => (
                  <Card 
                    key={ref.id} 
                    className="border-blue-200 bg-white shadow-sm hover:shadow-md transition-all group"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700 text-xs">Zotero</Badge>
                      </div>
                      <CardTitle className="text-base font-serif line-clamp-2 group-hover:text-blue-600 transition-colors" title={ref.title}>
                        {ref.title}
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent className="space-y-2 pb-3">
                      <div className="text-sm space-y-1">
                        <p className="line-clamp-1 font-medium text-gray-700">{ref.authors}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="w-3 h-3" /> 
                          {t('language') === 'id' ? 'Tahun' : 'Year'}: {ref.year}
                        </div>
                      </div>
                      {ref.abstract && (
                        <p className="text-xs text-gray-500 line-clamp-2 italic bg-gray-50 p-2 rounded">
                          "{ref.abstract}"
                        </p>
                      )}
                    </CardContent>
                    
                    <CardFooter className="flex gap-2 pt-2">
                      <Button 
                        size="sm" 
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => handleAnalyzeZotero(ref.id)}
                        disabled={analyzingIds.includes(ref.id)}
                      >
                        {analyzingIds.includes(ref.id) ? (
                          <>
                            <span className="animate-spin mr-2">⌛</span> 
                            {t('language') === 'id' ? 'Memproses...' : 'Processing...'}
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" /> 
                            {t('language') === 'id' ? 'Analisis AI' : 'AI Analyze'}
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default Documents;
