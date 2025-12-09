import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { integrationAPI } from '../services/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, BookOpen, Quote, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';

const Drafting = () => {
  const navigate = useNavigate();
  const [text, setText] = useState("");
  const [references, setReferences] = useState([]);
  const [showRefModal, setShowRefModal] = useState(false);
  const [selectedRef, setSelectedRef] = useState(null); // Untuk detail popup

  // Load referensi saat halaman dibuka
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const res = await integrationAPI.getReferences();
        setReferences(res.data);
      } catch (err) {
        toast.error("Failed to load references. Please sync Zotero first.");
      }
    };
    loadRefs();
  }, []);

  // Fungsi memasukkan sitasi ke dalam teks
  const insertCitation = (ref) => {
    const citation = `(${ref.authors.split(',')[0].trim().split(' ').pop()}, ${ref.year})`; // Ambil nama belakang penulis pertama
    setText(prev => prev + " " + citation + " ");
    setShowRefModal(false);
  };

  // Render teks dengan sitasi yang bisa diklik (Highlighting Logic)
  const renderPreview = () => {
    if (!text) return <p className="text-gray-400 italic">Start typing your draft...</p>;

    // Regex sederhana untuk mendeteksi pola (Name, Year)
    const parts = text.split(/(\([a-zA-Z\s\.\-]+,\s*\d{4}\))/g);
    
    return parts.map((part, index) => {
      // Cek apakah bagian ini adalah sitasi
      const isCitation = /^\([a-zA-Z\s\.\-]+,\s*\d{4}\)$/.test(part);
      
      if (isCitation) {
        // Coba cari referensi asli yang cocok (simple matching)
        const year = part.match(/\d{4}/)[0];
        const name = part.substring(1, part.indexOf(',')).trim();
        
        const refMatch = references.find(r => 
            r.year === year && r.authors.includes(name)
        );

        return (
          <span 
            key={index} 
            className="text-blue-600 font-semibold cursor-pointer hover:underline bg-blue-50 px-1 rounded"
            onClick={() => refMatch && setSelectedRef(refMatch)}
            title={refMatch ? "Click to see details" : "Reference not found in library"}
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold">Draft Tugas Akhir</h1>
        </div>
        <div className="flex gap-2">
           <Dialog open={showRefModal} onOpenChange={setShowRefModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Quote className="w-4 h-4" /> Insert Citation
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Select Reference</DialogTitle>
              </DialogHeader>
              <div className="space-y-2 mt-4">
                {references.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        No references found. Go to Settings to sync Zotero.
                    </div>
                ) : (
                    references.map(ref => (
                    <div 
                        key={ref.id} 
                        onClick={() => insertCitation(ref)}
                        className="p-3 border rounded hover:bg-gray-50 cursor-pointer flex justify-between items-center group"
                    >
                        <div>
                        <h4 className="font-semibold text-sm group-hover:text-blue-600">{ref.title}</h4>
                        <p className="text-xs text-gray-500">{ref.authors} • {ref.year}</p>
                        </div>
                        <PlusIcon className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
                    </div>
                    ))
                )}
              </div>
            </DialogContent>
          </Dialog>
          <Button>Save Draft</Button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto w-full">
        
        {/* Editor Area */}
        <Card className="flex flex-col h-[calc(100vh-8rem)]">
          <textarea 
            className="flex-1 w-full p-6 resize-none focus:outline-none font-mono text-sm leading-relaxed"
            placeholder="Type your thesis content here... Use the 'Insert Citation' button to reference your Zotero library."
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
        </Card>

        {/* Preview & Context Area */}
        <Card className="h-[calc(100vh-8rem)] overflow-y-auto bg-white p-8 prose prose-slate max-w-none shadow-sm">
          <h3 className="text-gray-400 uppercase text-xs font-bold tracking-wider mb-4 border-b pb-2">Live Preview</h3>
          <div className="whitespace-pre-wrap font-serif text-lg leading-relaxed">
            {renderPreview()}
          </div>
        </Card>

      </div>

      {/* Detail Popup (Saat sitasi diklik) */}
      <Dialog open={!!selectedRef} onOpenChange={(open) => !open && setSelectedRef(null)}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle className="pr-8 leading-normal">{selectedRef?.title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 text-sm mt-2">
                <div className="grid grid-cols-3 gap-2">
                    <span className="text-gray-500">Authors</span>
                    <span className="col-span-2 font-medium">{selectedRef?.authors}</span>
                    
                    <span className="text-gray-500">Year</span>
                    <span className="col-span-2">{selectedRef?.year}</span>
                    
                    <span className="text-gray-500">Source</span>
                    <span className="col-span-2 capitalize badge badge-outline">{selectedRef?.source}</span>
                </div>
                
                {selectedRef?.abstract && (
                    <div className="bg-gray-50 p-3 rounded text-gray-700 italic border">
                        "{selectedRef.abstract.substring(0, 300)}..."
                    </div>
                )}
                
                {selectedRef?.url && (
                    <Button variant="link" className="px-0 text-blue-600" onClick={() => window.open(selectedRef.url, '_blank')}>
                        Open in Zotero <FileText className="w-3 h-3 ml-1"/>
                    </Button>
                )}
            </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Ikon kecil
const PlusIcon = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
)

export default Drafting;