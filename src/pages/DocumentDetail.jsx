import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// --- Components ---
import Navbar from '@/components/Navbar';

// --- 1. Import Komponen Shadcn UI ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
// Gunakan sonner untuk notifikasi modern
import { toast } from 'sonner';

// --- 2. Import Icons & API ---
import { 
  ArrowLeft, Download, Trash2, Brain, FileText, 
  Tag, Plus, Clock, CheckCircle2, AlertCircle,
  Sparkles, BookOpen, X, Upload, HelpCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { documentsAPI, nlpAPI, tagsAPI, mendeleyAPI } from '../services/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- 3. State Management (Logika Lama Anda) ---
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  
  // Tag Management
  const [allTags, setAllTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');

  // --- 4. Effects & Data Loading ---
  useEffect(() => {
    loadDocument();
    loadTags();
  }, [id]);

  const loadDocument = async () => {
    try {
      const response = await documentsAPI.getById(id);
      setDocument(response.data);
    } catch (err) {
      setError('Failed to load document');
      toast.error('Failed to load document');
    } finally {
      setLoading(false);
    }
  };

  const loadTags = async () => {
    try {
      const response = await tagsAPI.getAll();
      setAllTags(response.data);
    } catch (err) {
      console.error('Failed to load tags:', err);
    }
  };

  // --- 5. Action Handlers (Logika Canggih Anda) ---

  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Starting AI analysis...');
    setError('');
    
    let pollInterval = null;
    
    try {
      // Start background processing
      await nlpAPI.processDocument(id);
      toast.info('Analysis started...');
      
      // Poll for status
      pollInterval = setInterval(async () => {
        try {
          const statusResponse = await nlpAPI.getStatus(id);
          const status = statusResponse.data.status;
          const progress = statusResponse.data.progress || 0;
          const step = statusResponse.data.current_step || 'Processing...';
          
          setProcessingProgress(progress);
          setProcessingStep(step);
          
          if (status === 'completed' || status === 'selesai') {
            if (pollInterval) clearInterval(pollInterval);
            await loadDocument(); // Reload data
            setProcessing(false);
            setProcessingProgress(100);
            toast.success('Document analysis completed!');
          } else if (status === 'failed') {
            if (pollInterval) clearInterval(pollInterval);
            setError(statusResponse.data.error || 'Processing failed');
            setProcessing(false);
            toast.error('Processing failed');
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 1000); 
      
    } catch (err) {
      if (pollInterval) clearInterval(pollInterval);
      const errMsg = err.response?.data?.detail || err.message;
      setError('Failed to start: ' + errMsg);
      toast.error(errMsg);
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await documentsAPI.delete(id);
      toast.success('Document deleted');
      navigate('/dashboard');
    } catch (err) {
      toast.error('Failed to delete document');
    }
  };

  const handleDownload = async () => {
    if (!document) return;
    try {
      const response = await documentsAPI.download(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', document.nama_file);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Download started');
    } catch (err) {
      toast.error('Download failed');
    }
  };

  // Tag Logic (Simplified for UI)
  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      // Logic: Cari tag existing atau buat baru (tergantung backend Anda)
      // Disini kita asumsikan backend handle by ID atau Nama
      // Simple implementation:
      let tagId = allTags.find(t => t.nama_tag.toLowerCase() === newTagName.toLowerCase())?.id;
      
      // Jika tag belum ada, harusnya ada API create tag dulu, 
      // tapi untuk simplifikasi kita coba add langsung jika backend support nama
      // Atau tampilkan error jika tag tidak ditemukan
      if (!tagId) {
          toast.error("Tag not found. Please create it in settings first (or implement create logic).");
          return;
      }

      await tagsAPI.addToDocument(id, tagId);
      await loadDocument();
      setNewTagName('');
      setTagDialogOpen(false);
      toast.success('Tag added');
    } catch (err) {
      toast.error('Failed to add tag');
    }
  };

  const handleRemoveTag = async (tagId) => {
    try {
      await tagsAPI.removeFromDocument(id, tagId);
      await loadDocument();
      toast.success('Tag removed');
    } catch (err) {
      toast.error('Failed to remove tag');
    }
  };



  // --- 6. Render UI Modern ---

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document details...</p>
        </div>
      </div>
    );
  }

  if (!document) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
          <Card className="max-w-md p-6 text-center border-cyan-200">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h3 className="text-lg font-semibold mb-2">Document Not Found</h3>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
              <ArrowLeft className="w-4 h-4 mr-2" /> Kembali ke Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header Section */}
      <header className="border-b border-cyan-200 bg-white sticky top-16 z-40">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
              <Download className="w-4 h-4 mr-2" /> Unduh
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" /> Hapus
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-6xl">
        
        {/* 1. Document Info Card */}
        <Card className="mb-8 border-cyan-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              {/* Icon */}
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-10 h-10 text-cyan-600" />
              </div>
              
              {/* Title & Meta */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <CardTitle className="text-2xl md:text-3xl font-serif leading-tight text-gray-900 break-words min-w-0">
                    {document.judul}
                  </CardTitle>
                  
                  {/* Status Badge */}
                  <div className="flex-shrink-0">
                    {document.status_analisis === 'completed' ? (
                      <Badge className="bg-green-100 text-green-700 border-green-200 px-3 py-1">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
                      </Badge>
                    ) : document.status_analisis === 'processing' || processing ? (
                      <Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 px-3 py-1 animate-pulse">
                        <Clock className="w-3 h-3 mr-1 animate-spin" /> Sedang Diproses
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="px-3 py-1">Analisis Tertunda</Badge>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
                   <span className="flex items-center bg-accent/50 px-2 py-1 rounded min-w-0 max-w-full">
                     <FileText className="w-3 h-3 mr-2 flex-shrink-0" />
                     <span className="truncate" title={document.nama_file}>{document.nama_file}</span>
                   </span>
                   <span className="flex items-center bg-accent/50 px-2 py-1 rounded">
                     <Clock className="w-3 h-3 mr-2" /> {format(new Date(document.tanggal_unggah), 'MMM dd, yyyy HH:mm')}
                   </span>
                   <span className="flex items-center bg-accent/50 px-2 py-1 rounded">
                     KB {document.ukuran_kb}
                   </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* 2. AI Processing Action Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Summary & Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Alert Error if any */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Progress Bar (Processing State) */}
            {(processing || document.status_analisis === 'processing') && (
               <Card className="border-cyan-200 bg-cyan-50/50">
                 <CardContent className="pt-6">
                   <div className="flex justify-between text-sm mb-2 font-medium text-cyan-700">
                      <span>{processingStep || 'AI is analyzing document...'}</span>
                      <span>{processingProgress}%</span>
                   </div>
                   <Progress value={processingProgress} className="h-2 w-full bg-cyan-100" />
                   <p className="text-xs text-cyan-600 mt-2">This may take a few moments depending on document length.</p>
                 </CardContent>
               </Card>
            )}

            {/* Summary Section */}
            <Card className="border-cyan-200 shadow-sm h-fit bg-white">
              <CardHeader className="border-b border-border/40 bg-accent/5">
                <CardTitle className="flex items-center gap-2 text-lg font-serif">
                  <BookOpen className="w-5 h-5 text-primary" />
                  Ringkasan
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {document.ringkasan ? (
                  <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed">
                    {document.ringkasan}
                  </div>
                ) : (
                  <div className="text-center py-12 bg-cyan-50 rounded-lg border border-dashed border-cyan-200">
                    <Brain className="w-12 h-12 mx-auto mb-3 text-cyan-300" />
                    <p className="text-gray-600 mb-4">Belum ada ringkasan yang dihasilkan.</p>
                    <Button onClick={handleProcessDocument} disabled={processing} className="bg-cyan-600 hover:bg-cyan-700">
                      <Sparkles className="w-4 h-4 mr-2" /> Buat Ringkasan dengan AI
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* References List */}
            <Card className="border-cyan-200 shadow-sm bg-white">
              <CardHeader className="border-b border-border/40 bg-accent/5">
                <CardTitle className="flex items-center gap-2 text-lg font-serif">
                  <FileText className="w-5 h-5 text-primary" />
                  Referensi yang Diekstrak
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                {document.referensi && document.referensi.length > 0 ? (
                  <ul className="space-y-4">
                    {document.referensi.map((ref, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex gap-3 p-3 rounded-lg hover:bg-accent/10 transition-colors">
                        <span className="font-mono text-xs text-primary font-bold h-6 w-6 flex items-center justify-center bg-primary/10 rounded flex-shrink-0">
                          {idx + 1}
                        </span>
                        <span>{ref.teks_referensi}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground text-sm italic">Belum ada referensi yang diekstrak.</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Metadata & Tags */}
          <div className="space-y-6">
            
            {/* Actions Card */}
            <Card className="border-cyan-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="text-base">Aksi Cepat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start bg-cyan-600 hover:bg-cyan-700" 
                  onClick={handleProcessDocument} 
                  disabled={processing || document.status_analisis === 'processing'}
                >
                  {processing ? <Clock className="w-4 h-4 mr-2 animate-spin"/> : <Sparkles className="w-4 h-4 mr-2" />}
                  {document.status_analisis === 'completed' ? 'Re-Process Document' : 'Start AI Analysis'}
                </Button>
                <Button className="w-full justify-start border-cyan-300 text-cyan-700 hover:bg-cyan-50" variant="outline" onClick={handleDownload}>
                  <Download className="w-4 h-4 mr-2" /> Unduh Asli
                </Button>
              </CardContent>
            </Card>

            {/* Keywords Card */}
            <Card className="border-cyan-200 shadow-sm bg-white">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Kata Kunci AI
                </CardTitle>
              </CardHeader>
              <CardContent>
                {document.kata_kunci && document.kata_kunci.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {document.kata_kunci.map((kw, i) => (
                      <Badge key={i} variant="secondary" className="bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200">
                        {kw.kata || kw}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Proses dokumen untuk mengekstrak kata kunci.</p>
                )}
              </CardContent>
            </Card>

            {/* Tags Card */}
            <Card className="border-cyan-200 shadow-sm bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-600" /> Tags
                </CardTitle>
                
                <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Kelola Tag</DialogTitle>
                      <DialogDescription>
                        Tambahkan tag untuk mengatur dokumen Anda dengan lebih baik.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="flex gap-2">
                        <Input 
                          placeholder="Enter tag name..." 
                          value={newTagName}
                          onChange={(e) => setNewTagName(e.target.value)}
                        />
                        <Button onClick={handleAddTag} className="bg-cyan-600 hover:bg-cyan-700">Add</Button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                         {allTags.map(tag => (
                           <Badge 
                            key={tag.id} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-cyan-50 border-cyan-200"
                            onClick={() => setNewTagName(tag.nama_tag)}
                           >
                             {tag.nama_tag}
                           </Badge>
                         ))}
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2 mt-3">
                  {document.tags && document.tags.length > 0 ? (
                    document.tags.map((tag, i) => (
                      <Badge key={i} className="pl-2 pr-1 py-1 flex items-center gap-1 bg-cyan-100 text-cyan-700 hover:bg-cyan-200">
                        {tag.nama_tag || tag}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:text-red-600" 
                          onClick={() => handleRemoveTag(tag.id)}
                        />
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Tidak ada tag yang ditetapkan</span>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>
        </div>
      </main>
    </div>
  );
};

export default DocumentDetail;