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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// --- 2. Import Icons & API ---
import { 
  ArrowLeft, Download, Trash2, Brain, FileText, 
  Tag, Plus, Clock, CheckCircle2, AlertCircle,
  Sparkles, BookOpen, X, Languages, Lightbulb, PenTool
} from 'lucide-react';
import { format } from 'date-fns';
import { documentsAPI, nlpAPI, tagsAPI } from '../services/api';

const DocumentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- 3. State Management ---
  const [document, setDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [processingStep, setProcessingStep] = useState('');
  const [error, setError] = useState('');

  // State untuk Fitur Outline (Kerangka)
  const [outline, setOutline] = useState(null);
  const [loadingOutline, setLoadingOutline] = useState(false);
  
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

  // --- 5. Action Handlers ---

  const handleProcessDocument = async () => {
    setProcessing(true);
    setProcessingProgress(0);
    setProcessingStep('Starting AI analysis...');
    setError('');
    
    let pollInterval = null;
    
    try {
      await nlpAPI.processDocument(id);
      toast.info('Analysis started...');
      
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
            await loadDocument(); 
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

  const handleAddTag = async () => {
    if (!newTagName.trim()) return;
    try {
      let tagId = allTags.find(t => t.nama_tag.toLowerCase() === newTagName.toLowerCase())?.id;
      
      if (!tagId) {
          toast.error("Tag not found. Please create it in settings first.");
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

  // Handler untuk Generate Outline (Kerangka Skripsi)
  const handleGenerateOutline = async () => {
    if (!document?.judul) {
      toast.error("Judul dokumen tidak ditemukan.");
      return;
    }

    setLoadingOutline(true);
    try {
      const response = await nlpAPI.generateOutline(document.judul);
      setOutline(response.data.data);
      toast.success("Ide kerangka berhasil dibuat!");
    } catch (err) {
      console.error(err);
      toast.error("Gagal membuat kerangka. Pastikan koneksi aman.");
    } finally {
      setLoadingOutline(false);
    }
  };

  // --- 6. Helper Functions for Summary Display ---

  const parseSummary = (text) => {
    if (!text) return { isDual: false, single: '' };
    const dualMatch = text.match(/\[English\]([\s\S]*?)\[Indonesia\]([\s\S]*)/i);
    if (dualMatch) {
      return {
        isDual: true,
        english: dualMatch[1].trim(),
        indonesian: dualMatch[2].trim()
      };
    }
    return { isDual: false, single: text };
  };

  /**
   * RENDERER BARU: Struktur Header + Bullet Points Rapi
   */
  const renderStructuredContent = (text) => {
    if (!text) return null;
    
    const lines = text.split('\n');
    const contentElements = [];
    let currentList = [];
    let keyCounter = 0;

    const flushList = () => {
      if (currentList.length > 0) {
        contentElements.push(
          <ul key={`list-${keyCounter++}`} className="list-none space-y-3 mb-6">
            {currentList}
          </ul>
        );
        currentList = [];
      }
    };

    lines.forEach((line, index) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // 1. DETEKSI HEADER (### JUDUL)
      if (trimmed.startsWith('###')) {
        flushList();
        
        const titleText = trimmed.replace(/^###\s*/, '').replace(/\*/g, '');
        
        let icon = <Lightbulb className="w-5 h-5" />;
        let colorClass = "text-gray-800";
        let bgClass = "bg-gray-100";
        let borderClass = "border-gray-200";

        const lowerTitle = titleText.toLowerCase();
        
        if (lowerTitle.includes('context') || lowerTitle.includes('konteks') || lowerTitle.includes('masalah')) {
            icon = <BookOpen className="w-5 h-5 text-blue-600" />;
            colorClass = "text-blue-900";
            bgClass = "bg-blue-50";
            borderClass = "border-blue-100";
        } else if (lowerTitle.includes('technical') || lowerTitle.includes('teknis') || lowerTitle.includes('implementasi')) {
            icon = <PenTool className="w-5 h-5 text-purple-600" />;
            colorClass = "text-purple-900";
            bgClass = "bg-purple-50";
            borderClass = "border-purple-100";
        } else if (lowerTitle.includes('finding') || lowerTitle.includes('temuan') || lowerTitle.includes('insight')) {
            icon = <Sparkles className="w-5 h-5 text-emerald-600" />;
            colorClass = "text-emerald-900";
            bgClass = "bg-emerald-50";
            borderClass = "border-emerald-100";
        }

        contentElements.push(
          <div key={`header-${index}`} className={`flex items-center gap-3 ${bgClass} border ${borderClass} p-3 rounded-lg mb-3 mt-1`}>
            {icon}
            <h3 className={`font-bold text-sm md:text-base uppercase tracking-wide ${colorClass}`}>
              {titleText}
            </h3>
          </div>
        );
      }
      
      // 2. DETEKSI BULLET POINT (*, -, •)
      else if (trimmed.startsWith('*') || trimmed.startsWith('-') || trimmed.startsWith('•')) {
        const itemText = trimmed.replace(/^[*•-]\s*/, '');
        const formattedText = itemText.split(/(\[.*?\]|\*\*.*?\*\*)/g).map((part, i) => {
            if (part.startsWith('[') || part.startsWith('**')) {
                return <span key={i} className="font-semibold text-gray-900">{part.replace(/[*\[\]]/g, '')}</span>;
            }
            return part;
        });

        currentList.push(
          <li key={`item-${index}`} className="flex gap-3 text-gray-700 text-sm leading-relaxed pl-1">
            <span className="text-gray-400 mt-1 min-w-[10px]">•</span>
            <span>{formattedText}</span>
          </li>
        );
      }
      
      // 3. TEKS BIASA
      else {
        flushList();
        contentElements.push(
            <p key={`p-${index}`} className="text-gray-600 mb-2 text-sm leading-relaxed">
                {trimmed}
            </p>
        );
      }
    });

    flushList();
    return contentElements;
  };

  // --- 7. Render UI ---

  const summaryData = parseSummary(document?.ringkasan);

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
        
        {/* Document Info Card */}
        <Card className="mb-8 border-cyan-200 shadow-sm bg-white">
          <CardHeader className="pb-4">
            <div className="flex flex-col md:flex-row md:items-start gap-6">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                <FileText className="w-10 h-10 text-cyan-600" />
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <CardTitle className="text-2xl md:text-3xl font-serif leading-tight text-gray-900 break-words min-w-0">
                    {document.judul}
                  </CardTitle>
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: TABS (Summary & Outline) */}
          <div className="lg:col-span-2">
            
            <Tabs defaultValue="summary" className="w-full">
              
              <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
                <TabsTrigger 
                  value="summary" 
                  className="data-[state=active]:bg-white data-[state=active]:text-cyan-700 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <BookOpen className="w-4 h-4 mr-2"/> Ringkasan Dokumen
                </TabsTrigger>
                <TabsTrigger 
                  value="outline" 
                  className="data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-sm font-medium transition-all"
                >
                  <Lightbulb className="w-4 h-4 mr-2"/> Inspirasi Kerangka
                </TabsTrigger>
              </TabsList>

              {/* --- TAB 1: RINGKASAN --- */}
              <TabsContent value="summary" className="space-y-8 animate-in fade-in-50 duration-300">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {(processing || document.status_analisis === 'processing') && (
                  <Card className="border-cyan-200 bg-cyan-50/50">
                    <CardContent className="pt-6">
                      <div className="flex justify-between text-sm mb-2 font-medium text-cyan-700">
                        <span>{processingStep || 'AI is analyzing document...'}</span>
                        <span>{processingProgress}%</span>
                      </div>
                      <Progress value={processingProgress} className="h-2 w-full bg-cyan-100" />
                    </CardContent>
                  </Card>
                )}

                {/* Summary Output */}
                {document.ringkasan ? (
                  <>
                    {summaryData.isDual ? (
                      <>
                        <Card className="border-cyan-200 shadow-sm h-fit bg-white overflow-hidden">
                          <CardHeader className="border-b border-border/40 bg-gradient-to-r from-blue-50 to-white pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg font-serif text-blue-900">
                              <Languages className="w-5 h-5 text-blue-600" />
                              Deep Dive Summary (English)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 px-6">
                            <div className="prose prose-sm max-w-none">
                              {renderStructuredContent(summaryData.english)}
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="border-emerald-200 shadow-sm h-fit bg-white overflow-hidden">
                          <CardHeader className="border-b border-border/40 bg-gradient-to-r from-emerald-50 to-white pb-4">
                            <CardTitle className="flex items-center gap-2 text-lg font-serif text-emerald-900">
                              <BookOpen className="w-5 h-5 text-emerald-600" />
                              Ringkasan Mendalam (Indonesia)
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6 px-6">
                            <div className="prose prose-sm max-w-none">
                              {renderStructuredContent(summaryData.indonesian)}
                            </div>
                          </CardContent>
                        </Card>
                      </>
                    ) : (
                      <Card className="border-cyan-200 shadow-sm h-fit bg-white">
                        <CardHeader className="border-b border-border/40 bg-accent/5">
                          <CardTitle className="flex items-center gap-2 text-lg font-serif">
                            <BookOpen className="w-5 h-5 text-primary" />
                            Ringkasan
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <div className="prose prose-sm max-w-none">
                            {renderStructuredContent(summaryData.single)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                ) : (
                  <Card className="border-dashed border-2 border-gray-200 bg-gray-50/50">
                    <CardContent className="py-12 flex flex-col items-center text-center">
                      <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                         <Brain className="w-8 h-8 text-gray-400" />
                      </div>
                      <p className="text-gray-500 mb-4">Belum ada ringkasan yang dihasilkan.</p>
                      <Button onClick={handleProcessDocument} disabled={processing} variant="outline" className="border-cyan-200 text-cyan-700 hover:bg-cyan-50">
                        <Sparkles className="w-4 h-4 mr-2"/> Buat Ringkasan AI
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* References List */}
                <Card className="border-cyan-200 shadow-sm bg-white">
                  <CardHeader className="border-b border-gray-100">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="w-4 h-4 text-cyan-600"/> Referensi Terdeteksi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {document.referensi && document.referensi.length > 0 ? (
                      <ul className="space-y-3">
                        {document.referensi.map((ref, idx) => (
                          <li key={idx} className="text-sm text-gray-600 flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                            <span className="font-bold text-cyan-600 bg-cyan-100 px-2 py-0.5 rounded text-xs min-w-[24px] text-center mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{ref.teks_referensi}</span>
                          </li>
                        ))}
                      </ul>
                    ) : <p className="text-sm text-muted-foreground italic">Tidak ada referensi yang diekstrak.</p>}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* --- TAB 2: INSPIRASI KERANGKA (OUTLINE) --- */}
              <TabsContent value="outline" className="space-y-6 animate-in fade-in-50 duration-300">
                <Card className="border-purple-200 bg-white shadow-sm overflow-hidden">
                  <CardHeader className="bg-purple-50/30 border-b border-purple-100 pb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <CardTitle className="text-purple-900 flex items-center gap-2 text-lg">
                          <PenTool className="w-5 h-5"/> Smart Thesis Outline
                        </CardTitle>
                        <p className="text-sm text-purple-600/80 mt-1">
                          Rekomendasi struktur Bab 1-3 berbasis AI sesuai standar akademik.
                        </p>
                      </div>
                      
                      {outline && (
                        <Button 
                          onClick={handleGenerateOutline} 
                          disabled={loadingOutline} 
                          variant="outline"
                          size="sm" 
                          className="border-purple-200 text-purple-700 hover:bg-purple-50 shrink-0"
                        >
                          {loadingOutline ? <Sparkles className="w-4 h-4 animate-spin mr-2"/> : <Lightbulb className="w-4 h-4 mr-2"/>}
                          Generate Ulang
                        </Button>
                      )}
                    </div>
                  </CardHeader>

                  <CardContent className="pt-6 min-h-[400px]">
                    {outline ? (
                      <Accordion type="single" collapsible className="w-full">
                        {Object.entries(outline).map(([babTitle, subChapters], index) => (
                          <AccordionItem key={index} value={`item-${index}`} className="border-b border-purple-100 last:border-0">
                            <AccordionTrigger className="hover:no-underline py-4 px-2 hover:bg-purple-50/50 rounded-lg transition-colors">
                              <span className="font-bold text-lg text-gray-800 flex items-center gap-3 text-left">
                                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded text-sm font-bold shadow-sm">
                                  {index + 1}
                                </span>
                                {babTitle}
                              </span>
                            </AccordionTrigger>
                            <AccordionContent className="pt-2 pb-6 space-y-4 px-4">
                              {subChapters.map((item, idx) => (
                                <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 hover:border-purple-200 hover:shadow-sm transition-all duration-200">
                                  <div className="flex gap-4">
                                    <div className="mt-1.5 min-w-[4px] w-[4px] bg-purple-400 rounded-full h-auto self-stretch"></div>
                                    <div>
                                      <h5 className="font-bold text-purple-900 text-base mb-1.5">
                                        {item.sub}
                                      </h5>
                                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                                        {item.guide}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16 text-center h-full">
                        {loadingOutline ? (
                          <div className="space-y-6 animate-pulse w-full max-w-md">
                            <div className="w-20 h-20 bg-purple-50 rounded-full mx-auto flex items-center justify-center border border-purple-100">
                              <Sparkles className="w-10 h-10 text-purple-400 animate-spin" />
                            </div>
                            <div className="space-y-2">
                              <h3 className="text-xl font-semibold text-gray-900">Sedang Merancang Ide...</h3>
                              <p className="text-gray-500">
                                AI sedang menganalisis judul <span className="text-purple-600 font-medium">"{document.judul}"</span> untuk menyusun kerangka yang logis.
                              </p>
                            </div>
                            <div className="space-y-2 pt-4">
                              <div className="h-2 bg-purple-100 rounded w-3/4 mx-auto"></div>
                              <div className="h-2 bg-purple-100 rounded w-1/2 mx-auto"></div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-6 max-w-lg mx-auto">
                            <div className="relative">
                              <div className="absolute inset-0 bg-purple-100 rounded-full blur-xl opacity-50 transform scale-150"></div>
                              <div className="relative w-24 h-24 bg-white rounded-2xl mx-auto flex items-center justify-center border-2 border-dashed border-purple-200 shadow-sm">
                                <BookOpen className="w-10 h-10 text-purple-500" />
                              </div>
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-gray-900 mb-2">Butuh Inspirasi Menulis?</h3>
                              <p className="text-gray-600 leading-relaxed">
                                Fitur ini akan menggunakan AI untuk membuat rekomendasi struktur 
                                <span className="font-semibold text-purple-700"> Bab 1, 2, dan 3 </span> 
                                yang disesuaikan spesifik dengan judul skripsi Anda.
                              </p>
                            </div>
                            <Button 
                              onClick={handleGenerateOutline} 
                              className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-6 h-auto text-base shadow-lg shadow-purple-200 transition-transform active:scale-95"
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              Mulai Generate Struktur
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

            </Tabs>
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