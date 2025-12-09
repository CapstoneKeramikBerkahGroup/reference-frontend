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
  CheckCircle2, Filter, SortAsc, SortDesc, Plus, Upload 
} from 'lucide-react';
import { documentsAPI } from '../services/api';
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
  
  // Upload state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, []);

  useEffect(() => {
    filterAndSortDocuments();
  }, [searchQuery, documents, sortOrder, filterStatus]);

  const loadDocuments = async () => {
    try {
      const response = await documentsAPI.getAll();
      setDocuments(response.data);
      setFilteredDocuments(response.data);
    } catch (err) {
      toast.error(t('messages.error.loadFailed'));
      console.error(err);
    } finally {
      setLoading(false);
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

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.tanggal_unggah);
      const dateB = new Date(b.tanggal_unggah);
      return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
    });

    setFilteredDocuments(filtered);
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

  const handleDownloadCompilation = async () => {
    if (documents.length === 0) {
      toast.warning(t('documents.noDocumentsToCompile'));
      return;
    }

    try {
      toast.info(t('documents.generatingCompilation'));
      
      const response = await documentsAPI.downloadCompilation();
      
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `compilation_report_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success(t('documents.compilationSuccess'));
    } catch (err) {
      console.error('Compilation error:', err);
      toast.error(err.response?.data?.detail || err.message || t('documents.compilationFailed'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">{t('documentDetail.status.completed')}</Badge>;
      case 'processing':
        return <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 border-cyan-200">{t('documentDetail.status.processing')}</Badge>;
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
      
      <main className="container mx-auto px-4 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">{t('documents.title')}</h1>
              <p className="text-gray-600">
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

            {/* Download Compilation Button */}
            <Button
              variant="outline"
              size="lg"
              onClick={handleDownloadCompilation}
              disabled={documents.length === 0}
              className="h-11 border-cyan-300 text-cyan-700 hover:bg-cyan-50"
            >
              <FileText className="w-4 h-4 mr-2" />
              {t('documents.downloadCompilation')}
            </Button>

            {/* Upload Document Button */}
            <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="h-11 bg-cyan-600 hover:bg-cyan-700 whitespace-nowrap">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('documents.uploadDocument')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-serif">{t('documents.uploadTitle')}</DialogTitle>
                  <DialogDescription>
                    {t('documents.uploadDescription')}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
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
                    <Label htmlFor="files">{t('documents.selectFiles')}</Label>
                    <div className="flex items-center justify-center w-full">
                      <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              <Upload className="w-8 h-8 mb-2 text-gray-500" />
                              <p className="text-sm text-gray-500"><span className="font-semibold">{t('documents.clickToUpload')}</span> {t('documents.orDragDrop')}</p>
                              <p className="text-xs text-gray-500">{t('documents.fileTypes')}</p>
                          </div>
                          <input 
                              id="dropzone-file" 
                              type="file" 
                              className="hidden" 
                              multiple
                              accept=".pdf,.doc,.docx"
                              onChange={(e) => setUploadFiles(Array.from(e.target.files || []))}
                          />
                      </label>
                    </div>
                    {uploadFiles.length > 0 && (
                      <p className="text-sm text-green-600 font-medium mt-2">
                        {uploadFiles.length} {t('documents.filesSelected')}
                      </p>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    onClick={handleUpload}
                    disabled={uploading || uploadFiles.length === 0}
                    className="w-full"
                  >
                    {uploading ? t('documents.uploading') : t('documents.startUpload')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filter & Sort Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Status Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('all')}
                className={filterStatus === 'all' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}
              >
                {t('documents.all')} ({documents.length})
              </Button>
              <Button
                variant={filterStatus === 'completed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('completed')}
                className={filterStatus === 'completed' ? 'bg-green-600 hover:bg-green-700' : 'border-green-300 text-green-700 hover:bg-green-50'}
              >
                {t('documentDetail.status.completed')} ({documents.filter(d => d.status_analisis === 'completed').length})
              </Button>
              <Button
                variant={filterStatus === 'processing' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterStatus('processing')}
                className={filterStatus === 'processing' ? 'bg-cyan-600 hover:bg-cyan-700' : 'border-cyan-300 text-cyan-700 hover:bg-cyan-50'}
              >
                {t('documentDetail.status.processing')} ({documents.filter(d => d.status_analisis === 'processing').length})
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

        {/* Document List */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
      </main>
    </div>
  );
};

export default Documents;
