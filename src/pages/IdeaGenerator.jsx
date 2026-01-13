import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Navbar from '../components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { documentsAPI, nlpAPI } from '../services/api';
import { 
  Sparkles, Search, BookOpen, Target, Lightbulb, 
  Save, Trash2, ArrowRight, BrainCircuit, History, Languages
} from 'lucide-react';

const IdeaGenerator = () => {
  const { t } = useTranslation();
  const [documents, setDocuments] = useState([]);
  const [filteredDocs, setFilteredDocs] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [outputLanguage, setOutputLanguage] = useState('id'); // 'id' or 'en'
  
  const [ideas, setIdeas] = useState([]);
  const [savedIdeas, setSavedIdeas] = useState([]);

  // Load Data Awal
  useEffect(() => {
    loadDocuments();
    loadSavedIdeas();
  }, []);

  // Filter Search
  useEffect(() => {
    if (!searchQuery) {
        setFilteredDocs(documents);
    } else {
        const lower = searchQuery.toLowerCase();
        setFilteredDocs(documents.filter(d => 
            d.judul.toLowerCase().includes(lower) || 
            d.nama_file.toLowerCase().includes(lower)
        ));
    }
  }, [searchQuery, documents]);

  const loadDocuments = async () => {
    try {
      const res = await documentsAPI.getAll();
      const docs = res.data.filter(d => d.status_analisis === 'completed');
      setDocuments(docs);
      setFilteredDocs(docs);
    } catch (err) {
      console.error(err);
    }
  };

  const loadSavedIdeas = async () => {
    try {
      const res = await nlpAPI.getIdeaHistory();
      console.log("Loaded Saved Ideas:", res.data);
      setSavedIdeas(res.data);
    } catch (err) {
      console.error("Error loading idea history:", err);
      console.log("Belum ada history ide.");
    }
  };

  const toggleSelection = (id) => {
    if (selectedDocIds.includes(id)) {
      setSelectedDocIds(prev => prev.filter(d => d !== id));
    } else {
      if (selectedDocIds.length >= 5) {
        toast.warning(t('ideaSynthesizer.maxWarning'));
        return;
      }
      setSelectedDocIds(prev => [...prev, id]);
    }
  };

  const handleGenerate = async () => {
    if (selectedDocIds.length < 2) {
      toast.warning(t('ideaSynthesizer.minWarning'));
      return;
    }
    setLoading(true);
    setIdeas([]);
    try {
      const res = await nlpAPI.generateIdeas({ 
        doc_ids: selectedDocIds,
        language: outputLanguage // Pass selected language
      });
      console.log("Generate Ideas Response:", res.data);
      const generatedIdeas = res.data.ideas || [];
      
      if (generatedIdeas.length === 0) {
        toast.error(t('ideaSynthesizer.noIdeasGenerated'));
      } else {
        setIdeas(generatedIdeas);
        toast.success(`${generatedIdeas.length} ${t('ideaSynthesizer.ideaGenerated')}`);
      }
    } catch (err) {
      console.error("Generate Ideas Error:", err);
      toast.error(t('ideaSynthesizer.generateFailed') + ": " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = async (idea) => {
    try {
        await nlpAPI.saveIdea({
            title: idea.title,
            content: idea // Simpan seluruh objek ide
        });
        toast.success(t('ideaSynthesizer.ideaSaved'));
        loadSavedIdeas();
    } catch (err) {
        toast.error(t('ideaSynthesizer.saveFailed'));
    }
  };

  // Komponen Kartu Ide (Diperbaiki CSS-nya)
  const IdeaCard = ({ idea, isSaved = false }) => {
      // Handle struktur data yang mungkin beda antara generated vs saved
      let content, title;
      
      if (isSaved) {
          // Dari database: content_json sudah otomatis parsed oleh axios
          title = idea.title;
          content = idea.content_json || {};
          
          // Safety check jika content_json masih string (edge case)
          if (typeof content === 'string') {
              try {
                  content = JSON.parse(content);
              } catch (e) {
                  console.error("Failed to parse content_json:", e);
                  content = {};
              }
          }
      } else {
          // Dari generate: langsung objek
          title = idea.title;
          content = idea;
      }
      
      // Safety checks untuk semua field
      const ideaType = content.type || t('ideaSynthesizer.researchIdea');
      const background = content.background || t('ideaSynthesizer.notAvailable');
      const problem = content.problem_statement || t('ideaSynthesizer.notAvailable');
      const method = content.proposed_method || t('ideaSynthesizer.notAvailable');
      const novelty = content.novelty || t('ideaSynthesizer.notAvailable');

      return (
        <Card className="border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-all mb-4 bg-white overflow-hidden">
          <CardHeader className="pb-2 bg-slate-50/50 border-b border-slate-100">
              <div className="flex justify-between items-start gap-3">
                  <div className="flex-1">
                      <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-200 mb-2">
                          {ideaType}
                      </Badge>
                      <CardTitle className="text-lg text-slate-900 leading-snug">
                          {title}
                      </CardTitle>
                  </div>
                  {!isSaved && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" onClick={() => handleSaveIdea(idea)} title={t('ideaSynthesizer.saveIdea')}>
                          <Save className="w-5 h-5" />
                      </Button>
                  )}
              </div>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                      <strong className="text-slate-600 block mb-1 flex items-center gap-1 uppercase text-xs font-bold tracking-wide">
                          <BookOpen className="w-3 h-3" /> {t('ideaSynthesizer.background')}
                      </strong>
                      <p className="text-slate-700 leading-relaxed text-xs md:text-sm">{background}</p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm">
                      <strong className="text-slate-600 block mb-1 flex items-center gap-1 uppercase text-xs font-bold tracking-wide">
                          <Target className="w-3 h-3" /> {t('ideaSynthesizer.problemStatement')}
                      </strong>
                      <p className="text-slate-700 leading-relaxed text-xs md:text-sm">{problem}</p>
                  </div>
              </div>
              
              <div className="bg-yellow-50/50 p-3 rounded-lg border border-yellow-100 text-sm">
                  <strong className="block text-yellow-800 mb-2 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" /> {t('ideaSynthesizer.methodNovelty')}
                  </strong>
                  <div className="space-y-2 pl-1">
                      <div>
                          <span className="font-semibold text-slate-800 text-xs uppercase">{t('ideaSynthesizer.proposedMethod')}</span>
                          <p className="text-slate-700 mt-1">{method}</p>
                      </div>
                      <div>
                          <span className="font-semibold text-slate-800 text-xs uppercase">{t('ideaSynthesizer.noveltyValue')}</span>
                          <p className="text-slate-700 italic mt-1">"{novelty}"</p>
                      </div>
                  </div>
              </div>
          </CardContent>
        </Card>
      );
  };

  return (
    <div className="h-screen flex flex-col bg-slate-50 overflow-hidden">
      {/* Navbar Fixed */}
      <div className="shrink-0 z-50">
        <Navbar />
      </div>

      <main className="flex-1 container mx-auto px-4 py-4 max-w-7xl h-[calc(100vh-80px)] min-h-0">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
          
          {/* PANEL KIRI: Dokumen (Lebar 4/12) */}
          <div className="lg:col-span-4 flex flex-col h-full min-h-0">
            <Card className="flex flex-col h-full border-slate-200 shadow-sm overflow-hidden bg-white">
                <CardHeader className="pb-3 px-4 pt-4 shrink-0 border-b border-slate-100">
                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                        <BrainCircuit className="w-5 h-5 text-blue-600" /> {t('ideaSynthesizer.sourceInspiration')}
                    </CardTitle>
                    <div className="relative mt-3">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                        <Input 
                            placeholder={t('ideaSynthesizer.searchPapers')}
                            className="pl-9 h-9 text-xs bg-slate-50" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-between items-center mt-3 text-xs font-medium text-slate-500">
                        <span>{selectedDocIds.length} {t('ideaSynthesizer.selected')}</span>
                        {selectedDocIds.length > 0 && (
                            <button className="text-blue-600 hover:underline" onClick={() => setSelectedDocIds([])}>
                                {t('ideaSynthesizer.reset')}
                            </button>
                        )}
                    </div>
                </CardHeader>
                
                <CardContent className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                    {filteredDocs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 text-slate-400 text-center">
                            <Search className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-xs">{t('ideaSynthesizer.noDocuments')}</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredDocs.map(doc => (
                                <div 
                                    key={doc.id}
                                    onClick={() => toggleSelection(doc.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 group relative ${
                                        selectedDocIds.includes(doc.id) 
                                        ? 'border-blue-500 bg-blue-50/60 shadow-sm' 
                                        : 'border-slate-100 hover:border-blue-300 hover:bg-white'
                                    }`}
                                >
                                    <Checkbox 
                                        checked={selectedDocIds.includes(doc.id)} 
                                        className="mt-0.5 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 pointer-events-none"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-xs font-semibold leading-snug mb-1 line-clamp-2 ${selectedDocIds.includes(doc.id) ? 'text-blue-800' : 'text-slate-700'}`}>
                                            {doc.judul}
                                        </p>
                                        <span className="text-[10px] text-slate-400 block truncate">
                                            {doc.nama_file}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                <div className="p-4 border-t border-slate-100 bg-slate-50 shrink-0 space-y-3">
                    {/* Language Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-slate-600 flex items-center gap-1">
                            <Languages className="w-3.5 h-3.5" />
                            {t('ideaSynthesizer.outputLanguage')}
                        </label>
                        <Select value={outputLanguage} onValueChange={setOutputLanguage}>
                            <SelectTrigger className="h-9 text-xs bg-white">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="id" className="text-xs">{t('ideaSynthesizer.indonesian')}</SelectItem>
                                <SelectItem value="en" className="text-xs">{t('ideaSynthesizer.english')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    
                    <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700 h-10 text-sm font-medium shadow-md transition-all active:scale-[0.98]"
                        disabled={loading || selectedDocIds.length < 2}
                        onClick={handleGenerate}
                    >
                        {loading ? (
                            <><span className="animate-spin mr-2">⏳</span> {t('ideaSynthesizer.generating')}</>
                        ) : (
                            <><Sparkles className="w-4 h-4 mr-2" /> {t('ideaSynthesizer.generateButton')}</>
                        )}
                    </Button>
                </div>
            </Card>
          </div>

          {/* PANEL KANAN: Hasil & History (Lebar 8/12) */}
          <div className="lg:col-span-8 h-full flex flex-col min-h-0">
            <Tabs defaultValue="generate" className="w-full h-full flex flex-col">
                <div className="flex items-center justify-between mb-4 shrink-0 px-1">
                    <TabsList className="bg-white border border-slate-200 shadow-sm p-1 h-10">
                        <TabsTrigger value="generate" className="text-xs px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                            {t('ideaSynthesizer.resultsTab')}
                        </TabsTrigger>
                        <TabsTrigger value="history" className="text-xs px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                            {t('ideaSynthesizer.historyTab')} ({savedIdeas.length})
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar pb-20">
                    <TabsContent value="generate" className="mt-0 space-y-6 h-full">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4 animate-in fade-in zoom-in duration-500">
                                <div className="relative">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full animate-ping absolute inset-0"></div>
                                    <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center relative z-10 text-white shadow-lg">
                                        <BrainCircuit className="w-8 h-8 animate-pulse" />
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-lg font-semibold text-slate-700">{t('ideaSynthesizer.aiThinking')}</h3>
                                    <p className="text-sm text-slate-500 max-w-xs mx-auto mt-1">
                                        {t('ideaSynthesizer.analyzingText')}
                                    </p>
                                </div>
                            </div>
                        ) : ideas.length > 0 ? (
                            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                                {ideas.map((idea, idx) => (
                                    <IdeaCard key={idx} idea={idea} />
                                ))}
                                <div className="h-10"></div> {/* Spacer bawah */}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                                <div className="bg-slate-50 p-4 rounded-full mb-3">
                                    <Sparkles className="w-8 h-8 text-blue-300" />
                                </div>
                                <h3 className="text-base font-semibold text-slate-600">{t('ideaSynthesizer.startSearch')}</h3>
                                <p className="text-sm text-slate-400 max-w-sm text-center mt-1">
                                    {t('ideaSynthesizer.selectInstructions')}
                                </p>
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="history" className="mt-0 space-y-6 h-full">
                        {savedIdeas.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                                <History className="w-10 h-10 mb-2 opacity-20" />
                                <p className="text-sm">{t('ideaSynthesizer.noSavedIdeas')}</p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {savedIdeas.map((history) => (
                                    <IdeaCard key={history.id} idea={history} isSaved={true} />
                                ))}
                                <div className="h-10"></div>
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>
          </div>

        </div>
      </main>
    </div>
  );
};

export default IdeaGenerator;