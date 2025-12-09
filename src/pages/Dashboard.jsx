import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// --- Icons ---
import { 
  Search, Upload, Download, Trash2, Eye, LogOut, 
  FileText, TrendingUp, Plus, FolderOpen, Clock, User, BookOpen, Scale, 
  Link as LinkIcon, Book, LayoutGrid, Sparkles 
} from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { documentsAPI, integrationAPI } from '../services/api'; // Pastikan integrationAPI sudah ada 'analyzeZotero'
import { format } from 'date-fns';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // --- State Management ---
  const [activeTab, setActiveTab] = useState('uploads');
  
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  
  const [references, setReferences] = useState([]);
  const [filteredReferences, setFilteredReferences] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingRef, setLoadingRef] = useState(false);

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
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.delete(id);
      toast.success('Document deleted');
      loadDocuments();
    } catch (err) {
      toast.error('Failed to delete document');
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
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200">Processed</Badge>;
      case 'processing': return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-yellow-200">Processing</Badge>;
      default: return <Badge variant="outline">Pending</Badge>;
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
          <p className="text-muted-foreground">Loading your research...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background">
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-serif font-bold text-foreground">Refero</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">Your Research Companion</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" onClick={() => navigate('/visualization')} className="hidden md:flex">
                <TrendingUp className="w-4 h-4 mr-2" /> Visualization
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/comparison')} className="hidden md:flex">
                <Scale className="w-4 h-4 mr-2" /> Gap Analysis
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate('/draft')} className="hidden md:flex">
                <FileText className="w-4 h-4 mr-2" /> Draft TA
              </Button>
              
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/50">
                <User className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium hidden sm:block">{user?.nama}</span>
              </div>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Documents</p>
                  <p className="text-3xl font-bold text-foreground">{documents.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <FileText className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Processed</p>
                  <p className="text-3xl font-bold text-foreground">
                    {documents.filter(d => d.status_analisis === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <FolderOpen className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Zotero Items</p>
                  <p className="text-3xl font-bold text-foreground">{references.length}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <Book className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* SEARCH & ACTIONS */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder={activeTab === 'uploads' ? "Search uploaded documents..." : "Search Zotero library..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-11 bg-card border-border/50"
            />
          </div>

          <div className="flex gap-2">
            {activeTab === 'uploads' && (
                <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                    <Button size="lg" className="h-11">
                        <Plus className="w-4 h-4 mr-2" /> Upload Document
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="font-serif">Upload Research Papers</DialogTitle>
                        <DialogDescription>Upload PDF or DOCX files for AI analysis</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                        <Label htmlFor="title">Title (Optional)</Label>
                        <Input id="title" placeholder="Document title" value={uploadTitle} onChange={(e) => setUploadTitle(e.target.value)} />
                        </div>
                        <div className="space-y-2">
                        <Label htmlFor="files">Select Files</Label>
                        <div className="flex items-center justify-center w-full">
                            <label htmlFor="dropzone-file" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 border-gray-300">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <Upload className="w-8 h-8 mb-2 text-gray-500" />
                                    <p className="text-sm text-gray-500"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                    <p className="text-xs text-gray-500">PDF or DOCX</p>
                                </div>
                                <input id="dropzone-file" type="file" className="hidden" multiple accept=".pdf,.doc,.docx" onChange={(e) => setUploadFiles(Array.from(e.target.files || []))} />
                            </label>
                        </div>
                        {uploadFiles.length > 0 && <p className="text-sm text-green-600 font-medium mt-2">{uploadFiles.length} file(s) selected</p>}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleUpload} disabled={uploading || uploadFiles.length === 0} className="w-full">
                        {uploading ? 'Uploading...' : 'Start Upload'}
                        </Button>
                    </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            <Button size="lg" variant="outline" className="h-11" onClick={() => navigate('/settings')}>
                <LinkIcon className="w-4 h-4 mr-2" /> Zotero Connect
            </Button>
          </div>
        </div>

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