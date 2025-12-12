import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; // Kita pakai axios langsung jika belum ada di api.js

// --- UI Components ---
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';

// --- Icons ---
import { 
  ArrowLeft, Scale, FileText, Sparkles, 
  ArrowRightLeft, Lightbulb, AlertCircle, CheckCircle2 
} from 'lucide-react';

import { documentsAPI } from '../services/api';

const Comparison = () => {
  const navigate = useNavigate();
  
  // --- State ---
  const [documents, setDocuments] = useState([]);
  const [selectedDoc1, setSelectedDoc1] = useState('');
  const [selectedDoc2, setSelectedDoc2] = useState('');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  // --- Load Documents on Mount ---
  useEffect(() => {
    const fetchDocs = async () => {
      try {
        const response = await documentsAPI.getAll();
        // Filter hanya dokumen yang sudah completed agar ada teksnya
        const completedDocs = response.data.filter(d => d.status_analisis === 'completed');
        setDocuments(completedDocs);
      } catch (err) {
        toast.error("Failed to load documents");
      }
    };
    fetchDocs();
  }, []);

  // --- Handle Comparison ---
  const handleCompare = async () => {
    if (!selectedDoc1 || !selectedDoc2) {
      toast.warning("Please select two documents to compare.");
      return;
    }
    if (selectedDoc1 === selectedDoc2) {
      toast.warning("Please select two DIFFERENT documents.");
      return;
    }

    setAnalyzing(true);
    setError('');
    setResult(null);

    try {
      // Panggil endpoint baru yang kita buat di backend
      // (Asumsi base URL API Anda sudah di set di axios instance atau proxy)
      const response = await axios.post('/api/nlp/compare-gap', {
        doc_id_1: selectedDoc1,
        doc_id_2: selectedDoc2
      }, {
        headers: {
            // Pastikan token auth terkirim jika pakai interceptor
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      setResult(response.data);
      toast.success("Comparison analysis complete!");
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.detail || "Failed to analyze documents.";
      setError(msg);
      toast.error(msg);
    } finally {
      setAnalyzing(false);
    }
  };

  // Helper untuk mendapatkan judul dokumen berdasarkan ID
  const getDocTitle = (id) => documents.find(d => d.id.toString() === id.toString())?.judul || "Document";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/30 to-background pb-20">
      
      {/* --- Header (Sama seperti Dashboard) --- */}
      <header className="border-b border-border/40 bg-card/50 backdrop-blur-sm sticky top-0 z-50 h-14 sm:h-16">
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 h-full flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="gap-1 sm:gap-2 text-xs sm:text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4" /> <span className="hidden sm:inline">Back to</span> Dashboard
          </Button>
          <div className="flex items-center gap-2 font-serif font-semibold text-base sm:text-lg">
            <Scale className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
            Gap Analysis
          </div>
        </div>
      </header>

      <main className="container mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8 max-w-6xl">
        
        {/* --- 1. Selection Section --- */}
        <div className="text-center mb-6 sm:mb-8 space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold px-2">Compare & Find Research Gaps</h1>
          <p className="text-sm sm:text-base text-muted-foreground px-4">Select two papers to analyze their limitations, future works, and find potential research opportunities.</p>
        </div>

        <Card className="border-border/50 shadow-md mb-6 sm:mb-8 bg-white/50 backdrop-blur-sm">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row items-center gap-4 lg:gap-8">
              
              {/* Doc 1 Selector */}
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium ml-1">First Document (Paper A)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select 
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    value={selectedDoc1}
                    onChange={(e) => setSelectedDoc1(e.target.value)}
                  >
                    <option value="" disabled>Select a processed document...</option>
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id}>{doc.judul}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* VS Icon */}
              <div className="flex-shrink-0 pt-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <ArrowRightLeft className="w-5 h-5 text-primary" />
                </div>
              </div>

              {/* Doc 2 Selector */}
              <div className="flex-1 w-full space-y-2">
                <label className="text-sm font-medium ml-1">Second Document (Paper B)</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select 
                    className="flex h-11 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-10"
                    value={selectedDoc2}
                    onChange={(e) => setSelectedDoc2(e.target.value)}
                  >
                    <option value="" disabled>Select a processed document...</option>
                    {documents.map(doc => (
                      <option key={doc.id} value={doc.id} disabled={doc.id == selectedDoc1}>{doc.judul}</option>
                    ))}
                  </select>
                </div>
              </div>

            </div>

            <div className="mt-6 flex justify-center">
              <Button 
                size="lg" 
                onClick={handleCompare} 
                disabled={analyzing || !selectedDoc1 || !selectedDoc2}
                className="w-full md:w-auto min-w-[200px]"
              >
                {analyzing ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" /> Analyzing Gaps...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" /> Analyze Research Gap
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* --- 2. Error State --- */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* --- 3. Results Section --- */}
        {result && !analyzing && (
          <div className="space-y-8 animate-in fade-in duration-500">
            
            {/* KEYWORD OVERLAP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Unique to A */}
                <Card className="border-l-4 border-l-blue-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unique to Paper A</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-2">
                            {result.keyword_comparison.unique_to_doc1.length > 0 ? (
                                result.keyword_comparison.unique_to_doc1.map((kw, i) => (
                                    <Badge key={i} variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-100">{kw.kata || kw}</Badge>
                                ))
                            ) : <span className="text-xs italic text-muted-foreground">No unique keywords</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Intersection */}
                <Card className="border-l-4 border-l-purple-500 bg-purple-50/30">
                    <CardHeader className="pb-2 text-center">
                        <CardTitle className="text-sm font-bold text-purple-700 flex items-center justify-center gap-2">
                             <CheckCircle2 className="w-4 h-4" /> Common Topics (Intersection)
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                         <div className="flex flex-wrap gap-2 justify-center">
                            {result.keyword_comparison.common_topics.length > 0 ? (
                                result.keyword_comparison.common_topics.map((kw, i) => (
                                    <Badge key={i} className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-200">{kw.kata || kw}</Badge>
                                ))
                            ) : <span className="text-xs italic text-muted-foreground">No overlap found</span>}
                        </div>
                    </CardContent>
                </Card>

                {/* Unique to B */}
                <Card className="border-l-4 border-l-orange-500">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unique to Paper B</CardTitle>
                    </CardHeader>
                    <CardContent>
                         <div className="flex flex-wrap gap-2">
                            {result.keyword_comparison.unique_to_doc2.length > 0 ? (
                                result.keyword_comparison.unique_to_doc2.map((kw, i) => (
                                    <Badge key={i} variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-100">{kw.kata || kw}</Badge>
                                ))
                            ) : <span className="text-xs italic text-muted-foreground">No unique keywords</span>}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* GAP ANALYSIS CONTENT */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Paper A Analysis */}
                <Card className="border-border/50">
                    <CardHeader className="bg-accent/5 border-b">
                        <CardTitle className="font-serif text-lg text-primary line-clamp-1" title={getDocTitle(selectedDoc1)}>
                            Analysis: {getDocTitle(selectedDoc1)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-destructive">
                                <AlertCircle className="w-4 h-4" /> Limitations / Weaknesses
                            </h4>
                            <div className="bg-destructive/5 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed">
                                {result.gap_analysis.doc1_analysis.gap_summary || result.gap_analysis.doc1_analysis.limitations_text || "No limitation section detected."}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-600">
                                <Lightbulb className="w-4 h-4" /> Future Work Suggestions
                            </h4>
                            <p className="text-sm text-muted-foreground italic">
                                {result.gap_analysis.doc1_analysis.future_work_text || "No future work section detected."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Paper B Analysis */}
                <Card className="border-border/50">
                    <CardHeader className="bg-accent/5 border-b">
                        <CardTitle className="font-serif text-lg text-primary line-clamp-1" title={getDocTitle(selectedDoc2)}>
                            Analysis: {getDocTitle(selectedDoc2)}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-destructive">
                                <AlertCircle className="w-4 h-4" /> Limitations / Weaknesses
                            </h4>
                            <div className="bg-destructive/5 p-4 rounded-lg text-sm text-foreground/80 leading-relaxed">
                                {result.gap_analysis.doc2_analysis.gap_summary || result.gap_analysis.doc2_analysis.limitations_text || "No limitation section detected."}
                            </div>
                        </div>
                        <div>
                            <h4 className="font-semibold flex items-center gap-2 mb-2 text-green-600">
                                <Lightbulb className="w-4 h-4" /> Future Work Suggestions
                            </h4>
                            <p className="text-sm text-muted-foreground italic">
                                {result.gap_analysis.doc2_analysis.future_work_text || "No future work section detected."}
                            </p>
                        </div>
                    </CardContent>
                </Card>

            </div>

            {/* --- Insight Box --- */}
            <Card className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white border-none shadow-lg">
                <CardContent className="p-8 text-center">
                    <h3 className="text-2xl font-serif font-bold mb-4 flex items-center justify-center gap-2">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                        Research Gap Synthesis
                    </h3>
                    
                    {/* Tampilkan hasil sintesis AI langsung, bukan template manual */}
                    <div className="text-blue-50 max-w-3xl mx-auto text-lg leading-relaxed italic">
                        "{result.gap_analysis.synthesis}"
                    </div>
                    
                    <div className="mt-4 text-sm text-blue-200">
                        *This synthesis is generated by analyzing the Limitations and Future Work sections of both papers.
                    </div>
                </CardContent>
            </Card>

          </div>
        )}

      </main>
    </div>
  );
};

export default Comparison;