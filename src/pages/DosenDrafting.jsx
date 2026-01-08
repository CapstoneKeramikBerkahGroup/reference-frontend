import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import PDFViewer from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, Download, Send, Users, ChevronRight, 
  FileText, Search, UserX, Quote, Reply, X, Trash2, Eye
} from 'lucide-react';
import { toast } from 'sonner';
import api, { dosenAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';

const DosenDrafting = () => {
  const { user } = useAuth();
  
  // State Data
  const [mahasiswaList, setMahasiswaList] = useState([]);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState(null);
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);

  // State Interaksi Komentar
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); 
  const [quotedText, setQuotedText] = useState(null); 
  const [quotedPage, setQuotedPage] = useState(null); 
  const [activeHighlight, setActiveHighlight] = useState(null); 

  useEffect(() => {
    fetchMahasiswaBimbingan();
  }, []);

  const fetchMahasiswaBimbingan = async () => {
    setLoading(true);
    try {
      const res = await dosenAPI.getMahasiswaBimbingan();
      setMahasiswaList(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat data mahasiswa");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMahasiswa = async (mhs) => {
    setSelectedMahasiswa(mhs);
    setSelectedDraft(null);
    setComments([]);
    setDrafts([]); 
    
    try {
      const res = await api.get(`/drafts/student/${mhs.id}`);
      setDrafts(res.data);
      toast.info(`Memuat draft untuk ${mhs.nama}`);
    } catch (err) {
      console.error(err);
      toast.error("Gagal memuat draft mahasiswa");
    }
  };

  const handleSelectDraft = async (draft) => {
    setSelectedDraft(draft);
    setQuotedText(null);
    setReplyTo(null);
    try {
      const res = await api.get(`/drafts/${draft.id}/comments`);
      setComments(res.data);
    } catch (err) { console.error(err); }
  };

  const onPDFTextSelect = (text, page) => {
    setQuotedText(text);
    setQuotedPage(page);
    setReplyTo(null);
    toast.info(`Mengutip teks hal ${page}.`);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && !quotedText) return;
    try {
      const payload = {
        content: newComment,
        parent_id: replyTo,
        quoted_text: quotedText,
        page_number: quotedPage
      };
      await api.post(`/drafts/${selectedDraft.id}/comments`, payload);
      const res = await api.get(`/drafts/${selectedDraft.id}/comments`);
      setComments(res.data);
      setNewComment('');
      setQuotedText(null);
      setQuotedPage(null);
      setReplyTo(null);
      toast.success("Komentar terkirim!");
    } catch (err) { toast.error('Gagal mengirim komentar'); }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm("Hapus komentar ini?")) return;
    try {
      await api.delete(`/drafts/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId && c.parent_id !== commentId));
      toast.success("Komentar dihapus.");
    } catch (err) { toast.error("Gagal menghapus."); }
  };

  const handleJumpToPdf = (comment) => {
    if (comment.page_number) {
      setActiveHighlight(comment); 
      toast.info(`Melompat ke halaman ${comment.page_number}...`);
    } else {
        toast.warning("Tidak ada referensi halaman.");
    }
  };

  const getCommentTree = () => {
    const map = {};
    const roots = [];
    comments.forEach(c => { map[c.id] = { ...c, children: [] }; });
    comments.forEach(c => {
      if (c.parent_id && map[c.parent_id]) {
        map[c.parent_id].children.push(map[c.id]);
      } else {
        roots.push(map[c.id]);
      }
    });
    return roots;
  };

  // --- EXCEPTION HANDLING & RENDERING ---

  if (loading) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Memuat data...</div>;
  }

  // EXCEPTION 1: Dosen belum punya mahasiswa
  if (!loading && mahasiswaList.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-300">
          <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <UserX className="w-12 h-12 text-slate-400" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-3">Belum Ada Mahasiswa Bimbingan</h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Anda belum memiliki mahasiswa bimbingan yang aktif. Silakan tinjau dan setujui permintaan bimbingan terlebih dahulu.
          </p>
          <Button 
            onClick={() => window.location.href = '/dosen/request-bimbingan'}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg px-8 py-6 text-base rounded-full"
          >
            Cek Request Bimbingan
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <div className="shrink-0"><Navbar /></div>

      <div className="flex-1 container mx-auto px-4 py-4 max-w-[1800px] h-[calc(100vh-80px)] min-h-0">
        <div className="grid grid-cols-12 gap-4 h-full">
          
          {/* PANEL KIRI: LIST MAHASISWA & DRAFT */}
          <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
             
             {/* List Mahasiswa */}
             <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="pb-3 py-3 border-b bg-white sticky top-0 z-10">
                   <CardTitle className="text-sm flex items-center gap-2">
                     <Users className="w-4 h-4"/> Pilih Mahasiswa ({mahasiswaList.length})
                   </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 bg-slate-50/50">
                   <div className="p-2 space-y-1">
                      {mahasiswaList.map(mhs => (
                         <div key={mhs.id} onClick={() => handleSelectMahasiswa(mhs)}
                            className={`p-3 rounded-lg cursor-pointer text-sm flex justify-between items-center transition-all duration-200 group
                                ${selectedMahasiswa?.id === mhs.id 
                                    ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
                         >
                            <div>
                                <div className="font-semibold">{mhs.nama}</div>
                                <div className={`text-xs ${selectedMahasiswa?.id === mhs.id ? 'text-blue-100' : 'text-slate-500'}`}>{mhs.nim}</div>
                            </div>
                            {selectedMahasiswa?.id === mhs.id && <ChevronRight className="w-4 h-4 text-white"/>}
                         </div>
                      ))}
                   </div>
                </ScrollArea>
             </Card>

             {/* List Draft (Hanya muncul/aktif jika Mahasiswa Dipilih) */}
             <Card className={`flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm transition-all duration-500 ${selectedMahasiswa ? 'opacity-100 translate-y-0' : 'opacity-60 translate-y-4 grayscale'}`}>
                <CardHeader className="pb-2 py-3 border-b bg-white">
                   <CardTitle className="text-sm flex items-center gap-2">
                      <FileText className="w-4 h-4"/> 
                      {selectedMahasiswa ? `Draft: ${selectedMahasiswa.nama.split(' ')[0]}` : 'Draft Mahasiswa'}
                   </CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 bg-slate-50/50">
                   <div className="p-2 space-y-2">
                      {!selectedMahasiswa ? (
                          <div className="text-center py-10 text-xs text-slate-400 italic">
                             <div className="mb-2">👈</div>
                             Pilih mahasiswa di atas<br/>untuk melihat draft.
                          </div>
                      ) : drafts.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400">
                             Mahasiswa ini belum<br/>mengupload draft.
                          </div>
                      ) : (
                          drafts.map(draft => (
                             <div key={draft.id} onClick={() => handleSelectDraft(draft)}
                                className={`p-3 rounded-md border cursor-pointer text-sm transition-all
                                    ${selectedDraft?.id === draft.id 
                                        ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-200 shadow-sm' 
                                        : 'bg-white hover:bg-slate-50 border-slate-200'}`}
                             >
                                <div className="font-semibold text-slate-800">{draft.title}</div>
                                <div className="flex justify-between mt-1 text-xs text-slate-500">
                                   <span>v{draft.version}</span>
                                   <span>{new Date(draft.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                          ))
                      )}
                   </div>
                </ScrollArea>
             </Card>
          </div>

          {/* PANEL TENGAH & KANAN (CONDITIONAL RENDERING) */}
          {/* EXCEPTION 3: Tampilan Placeholder jika belum pilih draft */}
          {!selectedDraft ? (
            <div className="col-span-9 h-full flex flex-col items-center justify-center bg-slate-100 rounded-xl border-2 border-slate-200 border-dashed text-slate-400 p-8 text-center animate-in fade-in duration-500">
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <Search className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-xl font-bold text-slate-600 mb-2">Area Review Draft</h3>
                <p className="text-sm max-w-md">
                    {!selectedMahasiswa 
                        ? "Langkah 1: Silakan pilih Mahasiswa dari panel sebelah kiri atas." 
                        : "Langkah 2: Sekarang pilih Draft File dari panel kiri bawah untuk mulai mereview."}
                </p>
            </div>
          ) : (
            // Workspace Review (PDF & Comments)
            <>
              {/* TENGAH: PDF VIEWER */}
              <div className="col-span-6 h-full flex flex-col min-h-0">
                <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-lg h-full animate-in zoom-in-95 duration-300">
                   <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center shrink-0">
                      <span className="text-sm font-medium truncate max-w-[300px]">
                         {selectedDraft.title} - {selectedMahasiswa?.nama}
                      </span>
                      <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-7"
                        onClick={() => window.open(selectedDraft.file_url, '_blank')}>
                        <Download className="w-4 h-4 mr-2" /> Download
                      </Button>
                   </div>
                   <div className="flex-1 bg-slate-100 relative overflow-hidden">
                      <PDFViewer 
                        fileUrl={selectedDraft.file_url} 
                        onTextSelect={onPDFTextSelect} 
                        activeHighlight={activeHighlight} 
                      />
                   </div>
                </Card>
              </div>

              {/* KANAN: KOMENTAR */}
              <div className="col-span-3 flex flex-col h-full overflow-hidden">
                 <Card className="flex-1 flex flex-col border-slate-200 shadow-sm h-full animate-in slide-in-from-right-4 duration-500">
                    <CardHeader className="py-3 border-b bg-slate-50">
                       <CardTitle className="text-sm flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" /> Review & Revisi
                       </CardTitle>
                    </CardHeader>
                    
                    <ScrollArea className="flex-1 p-3 bg-slate-50/30">
                       {getCommentTree().length === 0 ? (
                           <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
                               <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                               <p className="text-xs">Belum ada komentar.</p>
                           </div>
                       ) : (
                           getCommentTree().map(comment => (
                              <div key={comment.id} className="mb-4">
                                 <div className={`border rounded-lg p-3 shadow-sm bg-white ${activeHighlight?.id === comment.id ? 'ring-2 ring-yellow-400' : 'border-slate-200'}`}>
                                    <div className="flex justify-between items-start mb-1">
                                       <span className={`text-xs font-bold ${comment.user_role === 'dosen' ? 'text-amber-600' : 'text-blue-600'}`}>
                                          {comment.user_name} {comment.user_role === 'dosen' && '(Dosen)'}
                                       </span>
                                       {(comment.user_role === 'dosen' && comment.user_name === user.nama) && (
                                           <button onClick={() => handleDeleteComment(comment.id)} className="text-slate-400 hover:text-red-500">
                                              <Trash2 className="w-3 h-3" />
                                           </button>
                                       )}
                                    </div>

                                    {comment.quoted_text && (
                                       <div 
                                          className="mb-2 pl-2 border-l-2 border-amber-400 bg-amber-50 p-1.5 rounded text-xs italic text-slate-600 cursor-pointer hover:bg-amber-100 transition-colors group"
                                          onClick={() => handleJumpToPdf(comment)}
                                       >
                                          <div className="flex items-center gap-1 text-amber-600 font-bold mb-0.5">
                                             <Quote className="w-3 h-3" /> 
                                             <span>Hal {comment.page_number}</span>
                                          </div>
                                          "{comment.quoted_text.substring(0, 80)}..."
                                       </div>
                                    )}
                                    
                                    <p className="text-sm text-slate-800">{comment.content}</p>
                                    <div className="mt-2 text-right">
                                       <button className="text-[10px] text-slate-500 hover:text-blue-600 font-medium flex items-center gap-1 ml-auto"
                                          onClick={() => setReplyTo(comment.id)}>
                                          <Reply className="w-3 h-3" /> Balas
                                       </button>
                                    </div>
                                 </div>
                                 
                                 <div className="ml-4 mt-2 space-y-2 border-l-2 border-slate-200 pl-2">
                                    {comment.children.map(reply => (
                                       <div key={reply.id} className="bg-slate-100/50 rounded p-2 text-xs">
                                          <div className={`font-bold mb-1 ${reply.user_role === 'dosen' ? 'text-amber-600' : 'text-blue-600'}`}>
                                              {reply.user_name}
                                          </div>
                                          <p className="text-slate-700">{reply.content}</p>
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           ))
                       )}
                    </ScrollArea>

                    <div className="p-3 border-t bg-white">
                       {(replyTo || quotedText) && (
                          <div className="mb-2 p-2 bg-blue-50 rounded text-xs flex justify-between items-center text-blue-700 border border-blue-100">
                             <span className="truncate max-w-[200px] font-medium">
                                {replyTo ? 'Membalas komentar...' : `Mengutip Hal ${quotedPage}`}
                             </span>
                             <button onClick={() => { setReplyTo(null); setQuotedText(null); }}><X className="w-3 h-3" /></button>
                          </div>
                       )}
                       <div className="flex gap-2 items-end">
                          <Textarea 
                             placeholder="Tulis review/saran..." 
                             className="min-h-[40px] max-h-[100px] text-xs resize-none py-3"
                             value={newComment}
                             onChange={(e) => setNewComment(e.target.value)}
                          />
                          <Button size="icon" className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700" onClick={() => handleSendComment()} disabled={!newComment.trim()}>
                             <Send className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>
                 </Card>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default DosenDrafting;