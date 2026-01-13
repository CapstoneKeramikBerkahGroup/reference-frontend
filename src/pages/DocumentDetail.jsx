import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

// Components & UI
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; 
import { toast } from 'sonner';

// Icons
import { 
  ArrowLeft, Download, Trash2, Brain, FileText, 
  Tag, Plus, Clock, CheckCircle2, AlertCircle,
  Sparkles, BookOpen, X, ListChecks, RefreshCw
} from 'lucide-react';
import { format } from 'date-fns';

// Context & API
import { documentsAPI, nlpAPI, tagsAPI } from '../services/api';
import { useLanguage } from '@/contexts/LanguageContext'; 

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { language } = useLanguage(); 
  
  // State
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');
  
  // Tags & Outline
  const [allTags, setAllTags] = useState([]);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [outline, setOutline] = useState(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [outlineType, setOutlineType] = useState('thesis'); // 'thesis' or 'paper'

  // Active Tab State
  const [activeTab, setActiveTab] = useState("summary");

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
    } catch (err) { console.error(err); }
  };

  // --- PROCESSING LOGIC WITH LANGUAGE ---
  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessingProgress(0);
    setProcessingStep(language === 'en' ? 'Starting AI Analysis...' : 'Memulai Analisis AI...');
    setError('');
    
    let pollInterval = null;
    
    try {
      // API call harus support parameter language
      await nlpAPI.processDocument(id, language); 
      
      toast.info(language === 'en' ? 'Analysis started...' : 'Analisis dimulai...');
      
      pollInterval = setInterval(async () => {
        try {
          const statusResponse = await nlpAPI.getStatus(id);
          const status = statusResponse.data.status;
          const progress = statusResponse.data.progress || 0;
          
          setProcessingProgress(progress);
          
          if (status === 'completed') {
            clearInterval(pollInterval);
            await loadDocument();
            setProcessing(false);
            setProcessingProgress(100);
            toast.success(language === 'en' ? 'Analysis Completed!' : 'Analisis Selesai!');
          } else if (status === 'failed') {
            clearInterval(pollInterval);
            setError('Processing failed');
            setProcessing(false);
            toast.error('Processing failed');
          }
        } catch (err) { console.error(err); }
      }, 1000); 
      
    } catch (err) {
      if (pollInterval) clearInterval(pollInterval);
      setProcessing(false);
      toast.error('Failed to start process');
    }
  };

  // --- OUTLINE GENERATOR WITH LANGUAGE & TYPE ---
  const handleGenerateOutline = async () => {
    if (!document?.judul) return;
    setOutlineLoading(true);
    try {
      const res = await nlpAPI.generateOutline({ 
        title: document.judul,
        language: language,
        outline_type: outlineType, // 'thesis' or 'paper'
        dokumen_id: outlineType === 'paper' ? parseInt(id) : undefined // Send dokumen_id for paper outline
      });
      setOutline(res.data.data);
      const successMsg = outlineType === 'paper' 
        ? (language === 'en' ? 'Paper outline generated!' : 'Kerangka paper berhasil dibuat!')
        : (language === 'en' ? 'Thesis outline generated!' : 'Kerangka skripsi berhasil dibuat!');
      toast.success(successMsg);
    } catch (err) {
      toast.error('Failed to generate outline');
    } finally {
      setOutlineLoading(false);
    }
  };

  // --- DOWNLOAD & DELETE & TAGS ---
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

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      // Backend akan get-or-create tag berdasarkan nama
      await tagsAPI.addToDocument(id, newTagName.trim());
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

  // --- RENDER HELPERS (CORE REVISION) ---
  
  // Fungsi ini direvisi untuk memparsing JSON dari backend dan menampilkan dalam kotak warna-warni
  const renderSummaryContent = () => {
    // 1. Jika belum ada ringkasan
    if (!document.ringkasan) {
      return (
        <div className="text-center py-12 bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
          <Brain className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 mb-4">
            {language === 'en' ? 'No summary generated yet.' : 'Belum ada ringkasan.'}
          </p>
          <Button onClick={handleProcessDocument} disabled={processing} className="bg-cyan-600 hover:bg-cyan-700">
            <Sparkles className="w-4 h-4 mr-2" /> 
            {language === 'en' ? 'Generate with AI' : 'Buat Ringkasan AI'}
          </Button>
        </div>
      );
    }

    // 2. Coba Parsing JSON (Format Baru)
    let parsedSummary = null;
    try {
      parsedSummary = JSON.parse(document.ringkasan);
    } catch (e) {
      // Fallback ke Teks Biasa (Format Lama/Markdown) jika gagal parse
      return (
        <div 
          className="prose prose-sm max-w-none text-slate-700 leading-relaxed animate-in fade-in duration-500"
          dangerouslySetInnerHTML={{ __html: document.ringkasan.replace(/\n/g, "<br/>") }}
        />
      );
    }

    // 3. Render Format Cantik (JSON Valid) - SEPERTI GAMBAR image_d0afa2.jpg
    if (parsedSummary && parsedSummary.context_problem) {
      return (
        <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-500">
          
          {/* SECTION 1: KONTEKS & MASALAH (BIRU) */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-bold text-blue-800 flex items-center gap-2 mb-3 uppercase tracking-wide">
              <BookOpen className="w-4 h-4" /> 
              {language === 'en' ? 'Context & Problem' : 'Konteks & Masalah'}
            </h4>
            <ul className="space-y-2">
              {parsedSummary.context_problem.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-blue-400 rounded-full flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 2: IMPLEMENTASI TEKNIS (UNGU) */}
          <div className="bg-purple-50/50 border border-purple-100 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-bold text-purple-800 flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Brain className="w-4 h-4" />
              {language === 'en' ? 'Technical Implementation' : 'Implementasi Teknis'}
            </h4>
            <ul className="space-y-2">
              {parsedSummary.technical_implementation.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-purple-400 rounded-full flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* SECTION 3: TEMUAN KRITIS (HIJAU/TEAL) */}
          <div className="bg-teal-50/50 border border-teal-100 rounded-lg p-4 shadow-sm">
            <h4 className="text-sm font-bold text-teal-800 flex items-center gap-2 mb-3 uppercase tracking-wide">
              <Sparkles className="w-4 h-4" />
              {language === 'en' ? 'Critical Findings & Insights' : 'Temuan Kritis & Insight'}
            </h4>
            <ul className="space-y-2">
              {parsedSummary.critical_findings.map((point, idx) => (
                <li key={idx} className="text-sm text-slate-700 flex items-start gap-2 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 bg-teal-400 rounded-full flex-shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      );
    }

    // Fallback terakhir jika JSON valid tapi struktur beda
    return <div>Format data tidak dikenali.</div>;
  };

  if (loading) return <div className="h-screen flex items-center justify-center">Loading...</div>;
  if (!document) return <div>Document not found</div>;

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-sm">
        <div className="container mx-auto px-4 lg:px-8 h-16 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/documents')} className="gap-2 text-slate-600">
            <ArrowLeft className="w-4 h-4" /> {language === 'en' ? 'Back' : 'Kembali'}
          </Button>
          <div className="flex gap-2">
             <Button variant="outline" size="sm" onClick={handleDownload} className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
               <Download className="w-4 h-4 mr-2" /> {language === 'en' ? 'Download' : 'Unduh'}
             </Button>
             <Button variant="destructive" size="sm" onClick={handleDelete}>
               <Trash2 className="w-4 h-4 mr-2" /> {language === 'en' ? 'Delete' : 'Hapus'}
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 lg:px-8 py-8 max-w-7xl">
        
        {/* Title Section */}
        <div className="mb-8">
           <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 font-serif leading-tight">{document.judul}</h1>
           <div className="flex items-center gap-4 text-sm text-slate-500">
              <span className="flex items-center bg-white px-2 py-1 rounded border border-slate-200">
                 <FileText className="w-3 h-3 mr-2" /> {document.nama_file}
              </span>
              <span className="flex items-center">
                 <Clock className="w-3 h-3 mr-1" /> {format(new Date(document.tanggal_unggah), 'dd MMM yyyy')}
              </span>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: TABS (SUMMARY & OUTLINE) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Processing Alert */}
            {(processing || document.status_analisis === 'processing') && (
               <Card className="border-cyan-200 bg-cyan-50/50 mb-4 animate-pulse">
                 <CardContent className="pt-6">
                   <div className="flex justify-between text-sm mb-2 text-cyan-700 font-medium">
                     <span>{processingStep}</span>
                     <span>{processingProgress}%</span>
                   </div>
                   <Progress value={processingProgress} className="h-2 bg-cyan-200" />
                 </CardContent>
               </Card>
            )}

            {/* MAIN TABS UI */}
            <Tabs defaultValue="summary" value={activeTab} onValueChange={setActiveTab} className="w-full">
              <div className="flex items-center justify-between mb-4">
                 <TabsList className="bg-white border border-slate-200 p-1 rounded-lg h-auto shadow-sm">
                    <TabsTrigger value="summary" className="px-4 py-2 data-[state=active]:bg-cyan-50 data-[state=active]:text-cyan-700 data-[state=active]:shadow-none rounded-md transition-all gap-2">
                       <BookOpen className="w-4 h-4"/> 
                       {language === 'en' ? 'Document Summary' : 'Ringkasan Dokumen'}
                    </TabsTrigger>
                    <TabsTrigger value="outline" className="px-4 py-2 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700 data-[state=active]:shadow-none rounded-md transition-all gap-2">
                       <Brain className="w-4 h-4"/> 
                       {language === 'en' ? 'Thesis Idea Outline' : 'Inspirasi Kerangka'}
                    </TabsTrigger>
                 </TabsList>
              </div>

              {/* TAB CONTENT: RINGKASAN */}
              <TabsContent value="summary" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white min-h-[500px]">
                   <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4">
                      <CardTitle className="text-base text-cyan-800 flex items-center gap-2">
                         <Sparkles className="w-4 h-4"/>
                         {language === 'en' ? 'Deep Dive Summary (English)' : 'Ringkasan Mendalam (Indonesia)'}
                      </CardTitle>
                   </CardHeader>
                   <CardContent className="pt-6">
                      {renderSummaryContent()}
                   </CardContent>
                </Card>
              </TabsContent>

              {/* TAB CONTENT: OUTLINE */}
              <TabsContent value="outline" className="mt-0">
                <Card className="border-slate-200 shadow-sm bg-white min-h-[500px]">
                   <CardHeader className="border-b border-slate-100 bg-slate-50/50 py-4 flex flex-row items-center justify-between">
                      <CardTitle className="text-base text-purple-800 flex items-center gap-2">
                         <ListChecks className="w-4 h-4"/>
                         {outline ? (
                            outlineType === 'paper' 
                              ? (language === 'en' ? 'Paper Outline (IMRaD)' : 'Kerangka Paper (IMRaD)')
                              : (language === 'en' ? 'Thesis Outline (Chapters 1-3)' : 'Kerangka Skripsi (Bab 1-3)')
                         ) : (
                            language === 'en' ? 'Smart Outline Generator' : 'Generator Kerangka Cerdas'
                         )}
                      </CardTitle>
                      
                      {outline && (
                         <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => setOutline(null)} className="h-8 text-slate-600 hover:bg-slate-50 border-slate-300">
                               <ArrowLeft className="w-3 h-3 mr-2"/>
                               {language === 'en' ? 'Change Type' : 'Ganti Tipe'}
                            </Button>
                            <Button size="sm" variant="ghost" onClick={handleGenerateOutline} disabled={outlineLoading} className="h-8 text-purple-600 hover:bg-purple-50">
                               <RefreshCw className={`w-3 h-3 mr-2 ${outlineLoading ? 'animate-spin' : ''}`}/>
                               {language === 'en' ? 'Regenerate' : 'Generate Ulang'}
                            </Button>
                         </div>
                      )}
                   </CardHeader>
                   <CardContent className="pt-6">
                      {!outline ? (
                         <div className="text-center py-12">
                            <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Brain className="w-8 h-8 text-purple-300"/>
                            </div>
                            <p className="text-slate-500 mb-4 max-w-sm mx-auto">
                               {language === 'en' 
                                  ? 'Generate a standardized outline based on this document.' 
                                  : 'Buat kerangka standar akademik berdasarkan konten dokumen ini.'}
                            </p>
                            
                            {/* Outline Type Selector */}
                            <div className="flex justify-center gap-3 mb-6">
                               <Button
                                  variant={outlineType === 'thesis' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setOutlineType('thesis')}
                                  className={outlineType === 'thesis' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}
                               >
                                  📘 {language === 'en' ? 'Thesis (Chapters 1-3)' : 'Skripsi (Bab 1-3)'}
                               </Button>
                               <Button
                                  variant={outlineType === 'paper' ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setOutlineType('paper')}
                                  className={outlineType === 'paper' ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'border-purple-300 text-purple-700 hover:bg-purple-50'}
                               >
                                  📄 {language === 'en' ? 'Research Paper' : 'Paper Penelitian'}
                               </Button>
                            </div>
                            
                            <Button onClick={handleGenerateOutline} disabled={outlineLoading} className="bg-purple-600 hover:bg-purple-700">
                               {outlineLoading ? 'Generating...' : (language === 'en' ? 'Generate Outline' : 'Buat Kerangka')}
                            </Button>
                         </div>
                      ) : (
                         <div className="space-y-6 animate-in fade-in duration-500">
                            {/* Type Indicator Badge */}
                            <div className="flex items-center justify-center gap-2 pb-2">
                               <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-300 text-xs">
                                  {outlineType === 'paper' 
                                    ? (language === 'en' ? '📄 Research Paper Structure' : '📄 Struktur Paper Penelitian')
                                    : (language === 'en' ? '📘 Thesis Structure (Chapters 1-3)' : '📘 Struktur Skripsi (Bab 1-3)')}
                               </Badge>
                            </div>
                            
                            {/* Render outline secara rapi */}
                            {Object.entries(outline).map(([bab, items], idx) => (
                               <div key={idx} className="border border-slate-100 rounded-lg overflow-hidden">
                                  <div className="bg-slate-50 px-4 py-2 font-bold text-slate-700 text-sm border-b border-slate-100 uppercase tracking-wide">
                                     {bab}
                                  </div>
                                  <div className="p-4 bg-white space-y-4">
                                     {items.map((item, subIdx) => (
                                        <div key={subIdx} className="text-sm border-b border-dashed border-slate-100 last:border-0 pb-2 last:pb-0">
                                           <span className="font-bold text-purple-700 block mb-1">{item.sub}</span>
                                           <p className="text-slate-600 leading-relaxed bg-purple-50/50 p-2 rounded text-xs">{item.guide}</p>
                                        </div>
                                     ))}
                                  </div>
                               </div>
                            ))}
                         </div>
                      )}
                   </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* RIGHT COLUMN: ACTIONS & KEYWORDS */}
          <div className="lg:col-span-4 space-y-6">
             
             {/* 1. Quick Action Card */}
             <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3">
                   <CardTitle className="text-sm font-bold text-slate-700">
                      {language === 'en' ? 'Quick Actions' : 'Aksi Cepat'}
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   <Button 
                      className="w-full justify-start bg-cyan-600 hover:bg-cyan-700 shadow-sm"
                      onClick={handleProcessDocument}
                      disabled={processing || document.status_analisis === 'processing'}
                   >
                      <Sparkles className="w-4 h-4 mr-2 text-white" />
                      {document.status_analisis === 'completed' 
                         ? (language === 'en' ? 'Re-Process Document' : 'Proses Ulang Dokumen') 
                         : (language === 'en' ? 'Start Analysis' : 'Mulai Analisis')}
                   </Button>
                   <Button variant="outline" className="w-full justify-start text-slate-600" onClick={handleDownload}>
                      <Download className="w-4 h-4 mr-2" /> 
                      {language === 'en' ? 'Download Original' : 'Unduh Asli'}
                   </Button>
                </CardContent>
             </Card>

             {/* 2. Keywords Card */}
             <Card className="border-amber-200 bg-amber-50/30 shadow-sm">
                <CardHeader className="pb-3">
                   <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      {language === 'en' ? 'AI Keywords' : 'Kata Kunci AI'}
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   {document.kata_kunci && document.kata_kunci.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                         {document.kata_kunci.map((kw, i) => (
                            <Badge key={i} variant="secondary" className="bg-white text-amber-700 border border-amber-200 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-default px-3 py-1 shadow-sm">
                               {kw.kata || kw}
                            </Badge>
                         ))}
                      </div>
                   ) : (
                      <div className="text-center py-4 text-xs text-amber-600/60 italic">
                         {language === 'en' ? 'No keywords yet.' : 'Kata kunci belum tersedia.'}
                      </div>
                   )}
                </CardContent>
             </Card>

             {/* 3. Tags Card */}
             <Card className="border-slate-200 shadow-sm">
                <CardHeader className="pb-3 flex flex-row items-center justify-between">
                   <CardTitle className="text-sm font-bold text-slate-700 flex items-center gap-2">
                      <Tag className="w-4 h-4" /> Tags
                   </CardTitle>
                   <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setTagDialogOpen(true)}>
                      <Plus className="w-4 h-4" />
                   </Button>
                </CardHeader>
                <CardContent>
                   {document.tags && document.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                         {document.tags.map(tag => (
                            <Badge key={tag.id} variant="outline" className="bg-slate-100 text-slate-600 border-slate-200">
                               {tag.nama_tag}
                               <X className="w-3 h-3 ml-1 cursor-pointer hover:text-red-500" onClick={() => handleRemoveTag(tag.id)}/>
                            </Badge>
                         ))}
                      </div>
                   ) : (
                      <span className="text-xs text-slate-400 italic">
                         {language === 'en' ? 'No tags added.' : 'Tidak ada tag.'}
                      </span>
                   )}
                </CardContent>
             </Card>

          </div>
        </div>
      </main>

      {/* Dialog Tag */}
      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Kelola Tag</DialogTitle>
            <DialogDescription>Tambahkan tag untuk mengatur dokumen Anda.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex gap-2">
              <Input placeholder="Nama tag..." value={newTagName} onChange={(e) => setNewTagName(e.target.value)} />
              <Button onClick={handleAddTag} className="bg-cyan-600 hover:bg-cyan-700">Add</Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
                {allTags.map(tag => (
                  <Badge key={tag.id} variant="outline" className="cursor-pointer hover:bg-cyan-50 border-cyan-200" onClick={() => setNewTagName(tag.nama_tag)}>
                    {tag.nama_tag}
                  </Badge>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DocumentDetail;