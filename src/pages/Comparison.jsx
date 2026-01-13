import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input'; 
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { toast } from 'sonner';

// --- Import Komponen ---
import Navbar from '../components/Navbar';
import GapAnalysisTable from '../components/GapAnalysisTable';
import { useLanguage } from '../contexts/LanguageContext';

// --- Icons ---
import { 
  ArrowLeft, Scale, Sparkles, AlertCircle, CheckCircle2, History, Clock, Search, FileText 
} from 'lucide-react';

import { documentsAPI } from '../services/api';

const Comparison = () => {
  const navigate = useNavigate();
  const { language } = useLanguage(); 
  
  // --- State ---
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]); 
  const [historyList, setHistoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState(''); // State untuk Search Bar
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- Dictionary Bahasa ---
  const t = {
    id: {
      back: "Kembali ke Dashboard",
      headerTitle: "Matriks Analisis Gap",
      pageTitle: "Perbandingan Multi-Dokumen",
      description: "Pilih 2-5 dokumen untuk analisis otomatis.",
      available: "Pustaka Dokumen",
      selected: "Terpilih",
      searchPlaceholder: "Cari judul dokumen...",
      btnHistory: "Riwayat Analisis",
      btnAnalyzing: "Menganalisis",
      btnGenerate: "Mulai Analisis Gap",
      papers: "Dokumen",
      alertMin: "Pilih minimal 2 dokumen.",
      alertMax: "Maksimal 5 dokumen.",
      successMsg: "Analisis selesai!",
      errorMsg: "Gagal membuat analisis.",
      historyTitle: "Arsip Analisis",
      historyDesc: "Klik untuk memuat ulang hasil analisis sebelumnya.",
      historyEmpty: "Belum ada riwayat.",
      historyRestored: "Data berhasil dimuat ulang!",
      historyLoadError: "Gagal memuat data."
    },
    en: {
      back: "Back to Dashboard",
      headerTitle: "Gap Analysis Matrix",
      pageTitle: "Multi-Document Comparison",
      description: "Select 2-5 papers for automatic analysis.",
      available: "Document Library",
      selected: "Selected",
      searchPlaceholder: "Search document title...",
      btnHistory: "Analysis History",
      btnAnalyzing: "Analyzing",
      btnGenerate: "Start Gap Analysis",
      papers: "Papers",
      alertMin: "Please select at least 2 documents.",
      alertMax: "Maximum 5 documents allowed.",
      successMsg: "Analysis completed!",
      errorMsg: "Analysis failed.",
      historyTitle: "Analysis Archive",
      historyDesc: "Click to reload previous analysis results.",
      historyEmpty: "No history found.",
      historyRestored: "Data restored successfully!",
      historyLoadError: "Failed to load data."
    }
  };

  const text = t[language] || t.en;

  // --- 1. Load Data ---
  useEffect(() => {
    const initData = async () => {
      await fetchDocs();
      await fetchHistory();
    };
    initData();
  }, []);

  const fetchDocs = async () => {
    try {
      const response = await documentsAPI.getAll();
      const completedDocs = response.data.filter(d => d.status_analisis === 'completed');
      setDocuments(completedDocs);
    } catch (err) {
      toast.error("Failed to load documents");
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await axios.get('/api/gap-analysis/list', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      setHistoryList(res.data);
    } catch (err) {
      console.error("History load error", err);
    }
  };

  // --- 2. Restore History ---
  const loadHistoryItem = async (id) => {
    try {
        const res = await axios.get(`/api/gap-analysis/${id}`, {
            headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const analysisData = res.data.result_data || res.data; 
        setResult(analysisData); 
        
        setTimeout(() => {
            document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
        
        toast.success(text.historyRestored);
    } catch (err) {
        toast.error(text.historyLoadError);
    }
  };

  // --- 3. Interaction Logic ---
  const toggleSelection = (docId) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(prev => prev.filter(id => id !== docId));
    } else {
      if (selectedDocIds.length >= 5) {
        toast.warning(text.alertMax);
        return;
      }
      setSelectedDocIds(prev => [...prev, docId]);
    }
  };

  // --- Filter Dokumen Berdasarkan Search ---
  const filteredDocuments = documents.filter(doc => 
    doc.judul.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAnalyze = async () => {
    if (selectedDocIds.length < 2) {
      toast.warning(text.alertMin);
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/api/nlp/analyze-gap-matrix', {
        doc_ids: selectedDocIds,
        language: language 
      }, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });

      setResult(response.data);
      toast.success(text.successMsg);
      
      // Auto-save logic
      try {
          const firstDoc = documents.find(d => d.id === selectedDocIds[0]);
          const docTitle = firstDoc ? firstDoc.judul.substring(0, 30) : "Analisis";
          const saveTitle = `${docTitle}... (+${selectedDocIds.length - 1})`;
          
          await axios.post('/api/gap-analysis/save', {
              title: saveTitle,
              result: response.data
          }, { 
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` } 
          });
          fetchHistory();
      } catch (saveErr) { console.error(saveErr); }
      
      setTimeout(() => {
        document.getElementById('analysis-result')?.scrollIntoView({ behavior: 'smooth' });
      }, 500);

    } catch (err) {
      const msg = err.response?.data?.detail || text.errorMsg;
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      <Navbar /> 

      {/* Header Kecil dengan tombol kembali */}
      <div className="bg-white border-b py-3 sticky top-[64px] z-30 shadow-sm">
        <div className="container mx-auto px-4 flex items-center justify-between">
           <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/dashboard')} 
                className="gap-2 text-slate-500 hover:text-slate-900"
            >
                <ArrowLeft className="w-4 h-4" /> 
                {text.back}
            </Button>
            <div className="flex items-center gap-2 font-serif text-slate-800 font-bold">
                <Scale className="w-5 h-5 text-blue-600" />
                <span className="hidden sm:inline">{text.headerTitle}</span>
            </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        
        {/* --- 1. Section: Document Selection Panel --- */}
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            {/* Header Panel: Search & History Toolbar */}
            <div className="p-4 sm:p-6 border-b bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Judul & Counter */}
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                        <FileText className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="font-bold text-slate-800 text-lg leading-tight">{text.available}</h2>
                        <p className="text-xs text-slate-500">{documents.length} papers available</p>
                    </div>
                    <Badge variant={selectedDocIds.length >= 2 ? "default" : "secondary"} className="ml-2 h-7 px-3">
                        {selectedDocIds.length} / 5 {text.selected}
                    </Badge>
                </div>

                {/* Toolbar Kanan: Search & History */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    {/* Search Bar */}
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder={text.searchPlaceholder} 
                            className="pl-9 bg-white"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Tombol History (Dipindah kesini agar terlihat) */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="gap-2 text-slate-600 hover:text-blue-600 border-slate-200 hover:border-blue-200 bg-white">
                                <History className="w-4 h-4" />
                                <span className="hidden sm:inline">{text.btnHistory}</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent>
                            <SheetHeader>
                                <SheetTitle className="flex items-center gap-2">
                                    <History className="w-5 h-5" />
                                    {text.historyTitle}
                                </SheetTitle>
                                <SheetDescription>
                                    {text.historyDesc}
                                </SheetDescription>
                            </SheetHeader>
                            <div className="mt-6 space-y-3 max-h-[70vh] overflow-y-auto pr-2">
                                {historyList.length === 0 ? (
                                    <div className="text-center py-8 text-slate-400 border-2 border-dashed rounded-lg">
                                        <p className="text-sm">{text.historyEmpty}</p>
                                    </div>
                                ) : (
                                    historyList.map((item) => (
                                        <div 
                                            key={item.id} 
                                            onClick={() => loadHistoryItem(item.id)}
                                            className="group p-3 border rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                                        >
                                            <h5 className="font-medium text-sm text-slate-700 line-clamp-2 group-hover:text-blue-700">
                                                {item.title}
                                            </h5>
                                            <div className="flex items-center justify-between mt-2">
                                                <span className="text-[10px] text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>

            {/* Grid Dokumen (Scrollable agar tidak memanjang ke bawah) */}
            <div className="p-4 sm:p-6 bg-slate-50/30">
                {filteredDocuments.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                        <Search className="w-10 h-10 mx-auto mb-2 opacity-20" />
                        <p>Tidak ada dokumen yang cocok dengan "{searchTerm}"</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                        {filteredDocuments.map(doc => {
                            const isSelected = selectedDocIds.includes(doc.id);
                            return (
                                <div 
                                    key={doc.id}
                                    onClick={() => toggleSelection(doc.id)}
                                    className={`
                                        group relative p-4 rounded-xl border cursor-pointer transition-all duration-200
                                        ${isSelected 
                                            ? 'border-blue-500 bg-blue-50/60 ring-1 ring-blue-500 shadow-sm' 
                                            : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md'}
                                    `}
                                >
                                    <div className="flex items-start gap-3">
                                        <Checkbox 
                                            checked={isSelected}
                                            className={`mt-1 shrink-0 ${isSelected ? 'data-[state=checked]:bg-blue-600 border-blue-600' : ''}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            {/* JUDUL dengan line-clamp agar tidak keluar */}
                                            <h4 className={`font-semibold text-sm leading-snug line-clamp-3 ${isSelected ? 'text-blue-800' : 'text-slate-700'}`}>
                                                {doc.judul}
                                            </h4>
                                        </div>
                                    </div>
                                    {isSelected && (
                                        <div className="absolute top-3 right-3 text-blue-600 bg-white rounded-full">
                                            <CheckCircle2 className="w-5 h-5" />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Action Bar (Sticky Bottom Effect) */}
                <div className="mt-6 pt-4 border-t flex justify-end">
                    <Button 
                        size="lg" 
                        onClick={handleAnalyze} 
                        disabled={analyzing || selectedDocIds.length < 2}
                        className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200/50 transition-all w-full md:w-auto font-semibold"
                    >
                        {analyzing ? (
                            <>
                                <Sparkles className="w-4 h-4 mr-2 animate-spin" /> 
                                {text.btnAnalyzing}...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4 mr-2" /> {text.btnGenerate}
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>

        {/* --- Error Alert --- */}
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2 border-red-200 bg-red-50 text-red-800">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* --- 2. Section: Result Area --- */}
        <div id="analysis-result" className="scroll-mt-24">
            {result && (
                <GapAnalysisTable 
                    data={result.matrix} 
                    synthesis={result.synthesis} 
                />
            )}
        </div>

      </main>
    </div>
  );
};

export default Comparison;