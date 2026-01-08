import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import PDFViewer from '@/components/PDFViewer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
// --- PERBAIKAN DI SINI: Menambahkan FileText ke dalam import ---
import { 
  Upload, MessageSquare, Download, Send, Quote, Reply, X, Trash2, Eye, AlertCircle, FileText 
} from 'lucide-react';
import { toast } from 'sonner';
import api, { draftsAPI } from '../services/api';
import { useAuth } from '@/contexts/AuthContext';

const Drafting = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // State Data
  const [drafts, setDrafts] = useState([]);
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [comments, setComments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [fileToUpload, setFileToUpload] = useState(null);
  const [hasSupervisor, setHasSupervisor] = useState(null); // Null = loading check

  // State Interaksi Komentar
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState(null); 
  const [quotedText, setQuotedText] = useState(null); 
  const [quotedPage, setQuotedPage] = useState(null); 
  const [activeHighlight, setActiveHighlight] = useState(null); 

  useEffect(() => {
    checkPrerequisites();
  }, []);

  const checkPrerequisites = async () => {
    try {
      // 1. Cek Status Pembimbing
      const meRes = await api.get('/auth/me');
      const profile = meRes.data.mahasiswa_profile;

      if (!profile || !profile.dosen_pembimbing_id) {
        setHasSupervisor(false);
        // Toast notifikasi tambahan
        toast.warning("Perhatian", {
            description: "Anda harus memilih Dosen Pembimbing sebelum menggunakan fitur drafting.",
            duration: 5000
        });
        return; 
      }

      setHasSupervisor(true);
      
      // 2. Jika lolos, ambil data draft
      fetchInitialData();

    } catch (err) {
      console.error(err);
      toast.error("Gagal memverifikasi status mahasiswa.");
    }
  };

  const fetchInitialData = async () => {
    try {
      const draftsRes = await draftsAPI.getMyDrafts();
      setDrafts(draftsRes.data);
      if (draftsRes.data.length > 0) handleSelectDraft(draftsRes.data[0]);
    } catch (err) { console.error(err); }
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

  const handleUploadSubmit = async () => {
    if (!fileToUpload) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('title', `Draft Versi ${drafts.length + 1}`);
      formData.append('version', drafts.length + 1);
      const res = await api.post('/drafts/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Draft berhasil diupload!');
      setFileToUpload(null);
      const newDraft = res.data; 
      setDrafts([newDraft, ...drafts]); 
      handleSelectDraft(newDraft);
    } catch (err) { toast.error('Gagal upload.'); } finally { setUploading(false); }
  };

  const onPDFTextSelect = (text, page) => {
    setQuotedText(text);
    setQuotedPage(page);
    setReplyTo(null);
    toast.info(`Mengutip teks dari hal ${page}. Tulis komentar Anda.`);
  };

  const handleSendComment = async () => {
    if (!newComment.trim() && !quotedText) return; 
    
    if (!newComment.trim() && !quotedText) {
        toast.warning("Tulis komentar Anda.");
        return;
    }

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
        toast.warning("Komentar ini tidak memiliki referensi halaman.");
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

  // --- RENDERING: EXCEPTION HANDLING ---

  // 1. Loading Check
  if (hasSupervisor === null) {
      return <div className="h-screen flex items-center justify-center text-slate-500">Memeriksa status...</div>;
  }

  // 2. EXCEPTION: Tidak Punya Pembimbing
  if (hasSupervisor === false) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-2xl border border-red-100 text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
              <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">Akses Dibatasi</h2>
            <p className="text-slate-500 mb-8 leading-relaxed">
              Anda belum dapat menggunakan fitur Drafting Skripsi karena belum memiliki <b>Dosen Pembimbing</b>.
            </p>
            <Button 
              onClick={() => navigate('/mahasiswa/dosen-selection')}
              className="w-full bg-red-600 hover:bg-red-700 py-6 text-base shadow-lg rounded-xl transition-all hover:scale-[1.02]"
            >
              Pilih Dosen Sekarang
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. NORMAL RENDER
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col h-screen overflow-hidden">
      <div className="shrink-0"><Navbar /></div>

      <div className="flex-1 container mx-auto px-4 py-4 max-w-[1800px] h-[calc(100vh-80px)] min-h-0">
        <div className="grid grid-cols-12 gap-4 h-full">
          
          {/* LEFT: LIST & UPLOAD */}
          <div className="col-span-3 flex flex-col gap-4 h-full overflow-hidden">
             <Card className="shrink-0 border-blue-200 bg-white shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                   <div className="relative border-2 border-dashed border-blue-200 rounded-xl p-4 text-center hover:bg-blue-50 cursor-pointer transition-colors group">
                      <Input type="file" accept=".pdf" className="absolute inset-0 opacity-0 cursor-pointer" 
                         onChange={(e) => setFileToUpload(e.target.files[0])} />
                      {fileToUpload ? (
                        <div className="text-blue-700 text-sm font-medium truncate flex items-center justify-center gap-2">
                            <FileText className="w-4 h-4"/> {fileToUpload.name}
                        </div>
                      ) : (
                        <div className="text-slate-400 text-xs flex flex-col items-center gap-2 group-hover:text-blue-500">
                           <Upload className="w-6 h-6 mb-1" /> 
                           <span className="font-medium">Upload Draft PDF Baru</span>
                        </div>
                      )}
                   </div>
                   {fileToUpload && (
                     <Button size="sm" className="w-full mt-3 bg-blue-600 hover:bg-blue-700 rounded-lg" onClick={handleUploadSubmit} disabled={uploading}>
                        {uploading ? 'Mengupload...' : 'Upload Sekarang'}
                     </Button>
                   )}
                </CardContent>
             </Card>

             <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-sm">
                <CardHeader className="pb-3 py-3 border-b bg-white">
                   <CardTitle className="text-sm font-bold text-slate-700">Riwayat Draft</CardTitle>
                </CardHeader>
                <ScrollArea className="flex-1 bg-slate-50/50">
                   <div className="p-2 space-y-2">
                      {drafts.length === 0 ? (
                          <div className="text-center py-8 text-xs text-slate-400">Belum ada draft.</div>
                      ) : (
                          drafts.map(draft => (
                             <div key={draft.id} onClick={() => handleSelectDraft(draft)}
                                className={`p-3 rounded-lg cursor-pointer text-sm transition-all duration-200
                                    ${selectedDraft?.id === draft.id 
                                        ? 'bg-blue-600 text-white shadow-md transform scale-[1.02]' 
                                        : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'}`}
                             >
                                <div className="font-semibold">{draft.title}</div>
                                <div className={`flex justify-between mt-1 text-xs ${selectedDraft?.id === draft.id ? 'text-blue-100' : 'text-slate-500'}`}>
                                   <span className="bg-white/20 px-1.5 rounded">v{draft.version}</span>
                                   <span>{new Date(draft.created_at).toLocaleDateString()}</span>
                                </div>
                             </div>
                          ))
                      )}
                   </div>
                </ScrollArea>
             </Card>
          </div>

          {/* MIDDLE: PDF VIEWER */}
          <div className="col-span-6 h-full flex flex-col min-h-0">
            <Card className="flex-1 flex flex-col overflow-hidden border-slate-200 shadow-lg h-full animate-in zoom-in-95 duration-300">
               <div className="bg-slate-800 text-white px-4 py-2 flex justify-between items-center shrink-0">
                  <span className="text-sm font-medium truncate max-w-[300px]">{selectedDraft?.title || 'Preview'}</span>
                  {selectedDraft && (
                    <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white h-7"
                      onClick={() => window.open(selectedDraft.file_url, '_blank')}>
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                  )}
               </div>
               <div className="flex-1 bg-slate-100 relative overflow-hidden">
                  {selectedDraft ? (
                     <PDFViewer 
                        fileUrl={selectedDraft.file_url} 
                        onTextSelect={onPDFTextSelect} 
                        activeHighlight={activeHighlight} 
                     />
                  ) : (
                     <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                            <FileText className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                            <p>Pilih Draft untuk mulai.</p>
                        </div>
                     </div>
                  )}
               </div>
            </Card>
          </div>

          {/* RIGHT: COMMENTS */}
          <div className="col-span-3 flex flex-col h-full overflow-hidden">
             <Card className="flex-1 flex flex-col border-slate-200 shadow-sm h-full animate-in slide-in-from-right-4 duration-500">
                <CardHeader className="py-3 border-b bg-slate-50">
                   <CardTitle className="text-sm flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" /> Diskusi & Revisi
                   </CardTitle>
                </CardHeader>
                
                <ScrollArea className="flex-1 p-3 bg-slate-50/30">
                   {getCommentTree().length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
                            <MessageSquare className="w-8 h-8 mb-2 opacity-20" />
                            <p className="text-xs">Belum ada diskusi.</p>
                        </div>
                   ) : (
                        getCommentTree().map(comment => (
                          <div key={comment.id} className="mb-4">
                             <div className={`border rounded-lg p-3 shadow-sm bg-white ${activeHighlight?.id === comment.id ? 'ring-2 ring-yellow-400' : 'border-slate-200'}`}>
                                <div className="flex justify-between items-start mb-1">
                                   <span className={`text-xs font-bold ${comment.user_role === 'dosen' ? 'text-amber-600' : 'text-blue-600'}`}>
                                      {comment.user_name} {comment.user_role === 'dosen' && '(Dosen)'}
                                   </span>
                                   
                                   {/* User bisa hapus komentarnya sendiri */}
                                   {(comment.user_name === user.nama) && (
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
                             
                             {/* Replies */}
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

                {/* Input Area */}
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
                         placeholder="Tulis komentar..." 
                         className="min-h-[40px] max-h-[100px] text-xs resize-none py-3"
                         value={newComment}
                         onChange={(e) => setNewComment(e.target.value)}
                      />
                      <Button size="icon" className="shrink-0 h-10 w-10 bg-blue-600 hover:bg-blue-700 shadow-sm" onClick={() => handleSendComment()} disabled={!newComment.trim() && !quotedText}>
                         <Send className="w-4 h-4" />
                      </Button>
                   </div>
                </div>
             </Card>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Drafting;