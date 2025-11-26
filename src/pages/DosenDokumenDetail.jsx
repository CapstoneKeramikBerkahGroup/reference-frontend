import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { dosenAPI } from '@/services/api';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  FileText,
  MessageSquare,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  User,
  Hash,
  Trash2,
  Edit,
  Send,
  ThumbsUp,
  ThumbsDown
} from 'lucide-react';
import { toast } from 'sonner';

const DosenDokumenDetail = () => {
  const { dokumenId } = useParams();
  const navigate = useNavigate();
  
  const [dokumen, setDokumen] = useState(null);
  const [catatan, setCatatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Form states
  const [newCatatan, setNewCatatan] = useState({ isi_catatan: '', halaman: '' });
  const [editingCatatan, setEditingCatatan] = useState(null);
  const [addingCatatan, setAddingCatatan] = useState(false);
  
  // Validation dialog
  const [validatingRef, setValidatingRef] = useState(null);
  const [validationNote, setValidationNote] = useState('');

  useEffect(() => {
    fetchDokumenDetail();
  }, [dokumenId]);

  const fetchDokumenDetail = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [dokumenRes, catatanRes] = await Promise.all([
        dosenAPI.getDokumenDetail(dokumenId),
        dosenAPI.getCatatan(dokumenId)
      ]);
      
      setDokumen(dokumenRes.data);
      setCatatan(catatanRes.data);
    } catch (err) {
      console.error('Error fetching dokumen detail:', err);
      setError('Failed to load document details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCatatan = async () => {
    if (!newCatatan.isi_catatan.trim()) {
      toast.error('Please enter a comment');
      return;
    }
    
    setAddingCatatan(true);
    
    try {
      await dosenAPI.addCatatan(dokumenId, {
        isi_catatan: newCatatan.isi_catatan,
        halaman: newCatatan.halaman ? parseInt(newCatatan.halaman) : null,
        dokumen_id: parseInt(dokumenId)
      });
      
      toast.success('Comment added successfully');
      setNewCatatan({ isi_catatan: '', halaman: '' });
      fetchDokumenDetail(); // Refresh
    } catch (err) {
      console.error('Error adding catatan:', err);
      toast.error('Failed to add comment');
    } finally {
      setAddingCatatan(false);
    }
  };

  const handleDeleteCatatan = async (catatanId) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    
    try {
      await dosenAPI.deleteCatatan(catatanId);
      toast.success('Comment deleted');
      fetchDokumenDetail();
    } catch (err) {
      console.error('Error deleting catatan:', err);
      toast.error('Failed to delete comment');
    }
  };

  const handleValidateReferensi = async (referensi, isValid) => {
    setValidatingRef(referensi);
    
    try {
      await dosenAPI.validateReferensi(referensi.id, {
        is_valid: isValid,
        catatan_validasi: validationNote || null
      });
      
      toast.success(`Reference ${isValid ? 'approved' : 'rejected'}`);
      setValidatingRef(null);
      setValidationNote('');
      fetchDokumenDetail();
    } catch (err) {
      console.error('Error validating referensi:', err);
      toast.error('Failed to validate reference');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error || !dokumen) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/20 flex items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Document not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-accent/20">
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
              <div>
                <CardTitle className="text-2xl mb-2">{dokumen.judul || 'Untitled Document'}</CardTitle>
                <CardDescription>
                  <div className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      {dokumen.nama_file}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(dokumen.tanggal_unggah).toLocaleDateString()}
                    </span>
                  </div>
                </CardDescription>
              </div>
              <Badge variant={dokumen.status_analisis === 'completed' ? 'default' : 'secondary'}>
                {dokumen.status_analisis}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            {dokumen.ringkasan && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-sm text-muted-foreground">{dokumen.ringkasan}</p>
              </div>
            )}
            
            {dokumen.tags && dokumen.tags.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {dokumen.tags.map((tag) => (
                    <Badge key={tag.id} variant="outline">
                      <Hash className="w-3 h-3 mr-1" />
                      {tag.nama}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {dokumen.kata_kunci && dokumen.kata_kunci.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Keywords</h3>
                <div className="flex flex-wrap gap-2">
                  {dokumen.kata_kunci.slice(0, 10).map((kw) => (
                    <Badge key={kw.id} variant="secondary">
                      {kw.kata}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* References & Validation */}
          <Card>
            <CardHeader>
              <CardTitle>References</CardTitle>
              <CardDescription>Validate the references used in this document</CardDescription>
            </CardHeader>
            <CardContent>
              {dokumen.referensi && dokumen.referensi.length > 0 ? (
                <div className="space-y-3">
                  {dokumen.referensi.map((ref) => (
                    <div key={ref.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm flex-1">{ref.teks_referensi}</p>
                        <Badge variant={ref.is_valid ? 'default' : 'secondary'} className="ml-2">
                          {ref.is_valid ? 'Validated' : 'Pending'}
                        </Badge>
                      </div>
                      
                      {ref.catatan_validasi && (
                        <p className="text-xs text-muted-foreground italic mb-2">
                          Note: {ref.catatan_validasi}
                        </p>
                      )}
                      
                      {!ref.is_valid && (
                        <div className="flex gap-2 mt-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-green-600">
                                <ThumbsUp className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Approve Reference</DialogTitle>
                                <DialogDescription>
                                  Add an optional note for this validation
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                placeholder="Optional validation note..."
                                value={validationNote}
                                onChange={(e) => setValidationNote(e.target.value)}
                              />
                              <DialogFooter>
                                <Button onClick={() => handleValidateReferensi(ref, true)}>
                                  Approve
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                          
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button size="sm" variant="outline" className="text-red-600">
                                <ThumbsDown className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Reject Reference</DialogTitle>
                                <DialogDescription>
                                  Please provide a reason for rejection
                                </DialogDescription>
                              </DialogHeader>
                              <Textarea
                                placeholder="Reason for rejection..."
                                value={validationNote}
                                onChange={(e) => setValidationNote(e.target.value)}
                                required
                              />
                              <DialogFooter>
                                <Button 
                                  variant="destructive" 
                                  onClick={() => handleValidateReferensi(ref, false)}
                                  disabled={!validationNote.trim()}
                                >
                                  Reject
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No references found
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comments Section */}
          <Card>
            <CardHeader>
              <CardTitle>Comments & Notes</CardTitle>
              <CardDescription>Your guidance for the student</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Add Comment Form */}
              <div className="mb-4 p-3 bg-accent/20 rounded-lg">
                <Label htmlFor="catatan" className="mb-2 block">Add Comment</Label>
                <Textarea
                  id="catatan"
                  placeholder="Write your feedback or guidance..."
                  value={newCatatan.isi_catatan}
                  onChange={(e) => setNewCatatan({ ...newCatatan, isi_catatan: e.target.value })}
                  className="mb-2"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Page (optional)"
                    value={newCatatan.halaman}
                    onChange={(e) => setNewCatatan({ ...newCatatan, halaman: e.target.value })}
                    className="w-32"
                  />
                  <Button 
                    onClick={handleAddCatatan} 
                    disabled={addingCatatan || !newCatatan.isi_catatan.trim()}
                    className="ml-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send
                  </Button>
                </div>
              </div>

              <Separator className="my-4" />

              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {catatan.length > 0 ? (
                  catatan.map((cat) => (
                    <div key={cat.id} className="p-3 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-sm">{cat.isi_catatan}</p>
                          {cat.halaman && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Page {cat.halaman}
                            </p>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCatatan(cat.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {new Date(cat.created_at).toLocaleString()}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No comments yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DosenDokumenDetail;
