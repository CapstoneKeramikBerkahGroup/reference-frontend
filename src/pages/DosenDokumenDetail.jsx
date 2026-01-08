import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dosenAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  Trash2,
  AlertCircle,
  Calendar,
  Eye,
  Send,
} from 'lucide-react';
import { toast } from 'sonner';

const DosenDokumenDetail = () => {
  const { dokumenId } = useParams();
  const navigate = useNavigate();
  
  const [dokumen, setDokumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Comment states
  const [comments, setComments] = useState([]);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submitingComment, setSubmitingComment] = useState(false);
  
  // Document content
  const [parsedParagraphs, setParsedParagraphs] = useState([]);

  useEffect(() => {
    fetchDokumenDetail();
  }, [dokumenId]);

  const fetchDokumenDetail = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [dokumenRes, commentsRes] = await Promise.all([
        dosenAPI.getDokumenDetail(dokumenId),
        dosenAPI.getParagraphComments(dokumenId),
      ]);
      
      setDokumen(dokumenRes.data);
      setComments(commentsRes.data);
      
      // Ekstrak konten dari dokumen (dari ringkasan atau metadata lainnya)
      if (dokumenRes.data.ringkasan) {
        parseParagraphs(dokumenRes.data.ringkasan);
      }
    } catch (err) {
      console.error('Error fetching dokumen detail:', err);
      setError('Failed to load document details.');
    } finally {
      setLoading(false);
    }
  };

  const parseParagraphs = (text) => {
    // Split teks menjadi paragraf
    const paras = text.split('\n').filter((p) => p.trim());
    setParsedParagraphs(paras);
  };

  // Handle text selection untuk komentar
  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection.toString().length > 0) {
      const range = selection.getRangeAt(0);
      setSelectedText(selection.toString());
      setSelectionRange({
        start: range.startOffset,
        end: range.endOffset,
      });
      setCommentDialogOpen(true);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmitingComment(true);
    try {
      const commentData = {
        paragraf_index: 0, // Akan disesuaikan dengan paragraf yang dipilih
        start_char: selectionRange?.start || null,
        end_char: selectionRange?.end || null,
        highlighted_text: selectedText || null,
        isi_komentar: newComment,
      };

      await dosenAPI.addParagraphComment(dokumenId, commentData);
      
      toast.success('Comment added successfully');
      setNewComment('');
      setSelectedText('');
      setSelectionRange(null);
      setCommentDialogOpen(false);
      
      // Refresh comments
      fetchDokumenDetail();
    } catch (err) {
      console.error('Error adding comment:', err);
      toast.error('Failed to add comment');
    } finally {
      setSubmitingComment(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await dosenAPI.deleteParagraphComment(commentId);
      toast.success('Comment deleted');
      setComments(comments.filter((c) => c.id !== commentId));
    } catch (err) {
      console.error('Error deleting comment:', err);
      toast.error('Failed to delete comment');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-screen">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!dokumen) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>Document not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Document Info */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-2xl mb-2">
                  {dokumen.judul || 'Untitled'}
                </CardTitle>
                <CardDescription className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {dokumen.nama_file}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(dokumen.tanggal_unggah).toLocaleDateString()}
                  </span>
                </CardDescription>
              </div>
              <Badge 
                variant={dokumen.status_analisis === 'completed' ? 'default' : 'secondary'}
              >
                {dokumen.status_analisis}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Document Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Document Preview
                </CardTitle>
                <CardDescription>
                  Highlight text to add comments (like Word comments)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {dokumen.ringkasan ? (
                  <div 
                    className="prose prose-sm max-w-none bg-white p-6 rounded-lg border"
                    onMouseUp={handleTextSelection}
                  >
                    {parsedParagraphs.map((para, idx) => (
                      <p key={idx} className="text-gray-700 leading-relaxed mb-4">
                        {para}
                      </p>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No content available</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Comments Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Comments ({comments.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    No comments yet. Highlight text to add one.
                  </p>
                ) : (
                  comments.map((comment) => (
                    <div 
                      key={comment.id} 
                      className="p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400"
                    >
                      {comment.highlighted_text && (
                        <p className="text-xs bg-yellow-100 p-2 rounded mb-2 italic text-gray-700">
                          &quot;{comment.highlighted_text}&quot;
                        </p>
                      )}
                      <p className="text-sm text-gray-900 mb-2">
                        {comment.isi_komentar}
                      </p>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={comment.status === 'resolved' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {comment.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteComment(comment.id)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Comment Dialog */}
        <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Comment</DialogTitle>
              <DialogDescription>
                Add your feedback to the selected text
              </DialogDescription>
            </DialogHeader>
            
            {selectedText && (
              <div className="bg-yellow-50 p-3 rounded-lg border-l-4 border-yellow-400">
                <p className="text-xs text-gray-600 mb-1">Selected Text:</p>
                <p className="text-sm italic text-gray-900">
                  &quot;{selectedText}&quot;
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="comment">Your Comment</Label>
              <Textarea
                id="comment"
                placeholder="Type your feedback..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-24"
              />
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setCommentDialogOpen(false);
                  setNewComment('');
                  setSelectedText('');
                  setSelectionRange(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddComment}
                disabled={submitingComment || !newComment.trim()}
              >
                <Send className="w-4 h-4 mr-2" />
                {submitingComment ? 'Adding...' : 'Add Comment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DosenDokumenDetail;
