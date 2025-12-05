import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { dosenAPI } from '@/services/api';
import Navbar from '@/components/Navbar';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  ThumbsDown,
  BookOpen,
  Filter,
  Check,
  X
} from 'lucide-react';
import { toast } from 'sonner';

const DosenDokumenDetail = () => {
  const { dokumenId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [dokumen, setDokumen] = useState(null);
  const [catatan, setCatatan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Tab state - default to 'references' if coming from pending page
  const [activeTab, setActiveTab] = useState(
    location.state?.openReferences ? 'references' : 'references'
  );
  
  // Form states
  const [newCatatan, setNewCatatan] = useState({ isi_catatan: '', halaman: '' });
  const [editingCatatan, setEditingCatatan] = useState(null);
  const [addingCatatan, setAddingCatatan] = useState(false);
  
  // Validation dialog
  const [validatingRef, setValidatingRef] = useState(null);
  const [validationNote, setValidationNote] = useState('');
  
  // Referensi tab states
  const [selectedReferensi, setSelectedReferensi] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending'); // Default to pending filter
  const [batchValidating, setBatchValidating] = useState(false);
  const [batchDialogOpen, setBatchDialogOpen] = useState(false);
  const [batchAction, setBatchAction] = useState(null); // 'validate' or 'reject'
  const [batchNote, setBatchNote] = useState('');

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
        status_validasi: isValid ? 'validated' : 'rejected',
        catatan_validasi: validationNote || null
      });
      
      toast.success(`Reference ${isValid ? 'validated' : 'rejected'}`);
      setValidatingRef(null);
      setValidationNote('');
      fetchDokumenDetail();
    } catch (err) {
      console.error('Error validating referensi:', err);
      toast.error('Failed to validate reference');
    }
  };

  // Batch validation functions
  const handleSelectReferensi = (refId, checked) => {
    if (checked) {
      setSelectedReferensi([...selectedReferensi, refId]);
    } else {
      setSelectedReferensi(selectedReferensi.filter(id => id !== refId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      const pendingRefs = filteredReferensi
        .filter(ref => ref.status_validasi === 'pending')
        .map(ref => ref.id);
      setSelectedReferensi(pendingRefs);
    } else {
      setSelectedReferensi([]);
    }
  };

  const handleOpenBatchDialog = (action) => {
    if (selectedReferensi.length === 0) {
      toast.error('Please select at least one reference');
      return;
    }
    setBatchAction(action);
    setBatchDialogOpen(true);
  };

  const handleBatchValidation = async () => {
    if (batchAction === 'reject' && !batchNote.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }

    setBatchValidating(true);
    try {
      const promises = selectedReferensi.map(refId =>
        dosenAPI.validateReferensi(refId, {
          status_validasi: batchAction === 'validate' ? 'validated' : 'rejected',
          catatan_validasi: batchNote || null
        })
      );
      
      await Promise.all(promises);
      
      toast.success(`${selectedReferensi.length} references ${batchAction === 'validate' ? 'validated' : 'rejected'}`);
      setSelectedReferensi([]);
      setBatchNote('');
      setBatchDialogOpen(false);
      fetchDokumenDetail();
    } catch (err) {
      console.error('Error batch validating:', err);
      toast.error('Failed to validate references');
    } finally {
      setBatchValidating(false);
    }
  };

  // Filter referensi
  const filteredReferensi = dokumen?.referensi?.filter(ref => {
    if (statusFilter === 'all') return true;
    return ref.status_validasi === statusFilter;
  }) || [];

  const pendingCount = dokumen?.referensi?.filter(ref => ref.status_validasi === 'pending').length || 0;
  const validatedCount = dokumen?.referensi?.filter(ref => ref.status_validasi === 'validated').length || 0;
  const rejectedCount = dokumen?.referensi?.filter(ref => ref.status_validasi === 'rejected').length || 0;

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

        {/* Tabs for References and Comments */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="references" className="relative">
              <BookOpen className="w-4 h-4 mr-2" />
              References
              {pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                  {pendingCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="comments">
              <MessageSquare className="w-4 h-4 mr-2" />
              Comments
            </TabsTrigger>
          </TabsList>

          {/* References Tab */}
          <TabsContent value="references" className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Pending</p>
                      <p className="text-2xl font-bold">{pendingCount}</p>
                    </div>
                    <AlertCircle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Validated</p>
                      <p className="text-2xl font-bold">{validatedCount}</p>
                    </div>
                    <CheckCircle2 className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Rejected</p>
                      <p className="text-2xl font-bold">{rejectedCount}</p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filter & Batch Actions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Reference List</CardTitle>
                    <CardDescription>
                      Select references to validate or reject in batch
                    </CardDescription>
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All ({dokumen?.referensi?.length || 0})</SelectItem>
                      <SelectItem value="pending">Pending ({pendingCount})</SelectItem>
                      <SelectItem value="validated">Validated ({validatedCount})</SelectItem>
                      <SelectItem value="rejected">Rejected ({rejectedCount})</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                {selectedReferensi.length > 0 && (
                  <div className="mb-4 p-3 bg-accent/50 rounded-lg flex items-center justify-between">
                    <p className="text-sm font-medium">
                      {selectedReferensi.length} reference{selectedReferensi.length > 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBatchDialog('validate')}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Validate Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenBatchDialog('reject')}
                        className="text-destructive"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject Selected
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedReferensi([])}
                      >
                        Clear
                      </Button>
                    </div>
                  </div>
                )}

                {filteredReferensi.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          {statusFilter !== 'validated' && statusFilter !== 'rejected' && (
                            <Checkbox
                              checked={selectedReferensi.length === filteredReferensi.filter(r => r.status_validasi === 'pending').length && filteredReferensi.filter(r => r.status_validasi === 'pending').length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                          )}
                        </TableHead>
                        <TableHead className="w-12">#</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead className="text-center">Year</TableHead>
                        <TableHead className="text-center">Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredReferensi.map((ref, index) => (
                        <TableRow key={ref.id}>
                          <TableCell>
                            {ref.status_validasi === 'pending' && (
                              <Checkbox
                                checked={selectedReferensi.includes(ref.id)}
                                onCheckedChange={(checked) => handleSelectReferensi(ref.id, checked)}
                              />
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{index + 1}</TableCell>
                          <TableCell className="max-w-md">
                            <p className="text-sm line-clamp-2">{ref.teks_referensi}</p>
                            {ref.catatan_validasi && (
                              <p className="text-xs text-muted-foreground italic mt-1">
                                Note: {ref.catatan_validasi}
                              </p>
                            )}
                          </TableCell>
                          <TableCell>{ref.penulis || '-'}</TableCell>
                          <TableCell className="text-center">{ref.tahun || '-'}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={
                              ref.status_validasi === 'rejected' ? 'destructive' :
                              ref.status_validasi === 'pending' ? 'secondary' : 'default'
                            }>
                              {ref.status_validasi === 'rejected' ? 'Rejected' :
                               ref.status_validasi === 'pending' ? 'Pending' : 'Validated'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {ref.status_validasi === 'pending' && (
                              <div className="flex items-center justify-end gap-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-green-600">
                                      <ThumbsUp className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Validate Reference</DialogTitle>
                                      <DialogDescription>
                                        Add an optional note for this validation
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                      <Label>Reference</Label>
                                      <p className="text-sm text-muted-foreground">{ref.teks_referensi}</p>
                                    </div>
                                    <Textarea
                                      placeholder="Optional validation note..."
                                      value={validationNote}
                                      onChange={(e) => setValidationNote(e.target.value)}
                                    />
                                    <DialogFooter>
                                      <Button onClick={() => handleValidateReferensi(ref, true)}>
                                        <Check className="w-4 h-4 mr-2" />
                                        Validate
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                                
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button size="sm" variant="outline" className="text-red-600">
                                      <ThumbsDown className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent>
                                    <DialogHeader>
                                      <DialogTitle>Reject Reference</DialogTitle>
                                      <DialogDescription>
                                        Please provide a reason for rejection
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-2">
                                      <Label>Reference</Label>
                                      <p className="text-sm text-muted-foreground">{ref.teks_referensi}</p>
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="rejection-note">
                                        Reason <span className="text-red-500">*</span>
                                      </Label>
                                      <Textarea
                                        id="rejection-note"
                                        placeholder="Explain why this reference is rejected..."
                                        value={validationNote}
                                        onChange={(e) => setValidationNote(e.target.value)}
                                        required
                                      />
                                    </div>
                                    <DialogFooter>
                                      <Button 
                                        variant="destructive" 
                                        onClick={() => handleValidateReferensi(ref, false)}
                                        disabled={!validationNote.trim()}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {statusFilter === 'all' 
                        ? 'No references found in this document'
                        : `No ${statusFilter} references`
                      }
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent value="comments">
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
          </TabsContent>
        </Tabs>

        {/* Batch Validation Dialog */}
        <Dialog open={batchDialogOpen} onOpenChange={setBatchDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {batchAction === 'validate' ? 'Validate' : 'Reject'} {selectedReferensi.length} Reference{selectedReferensi.length > 1 ? 's' : ''}
              </DialogTitle>
              <DialogDescription>
                {batchAction === 'validate' 
                  ? 'Add an optional note for this batch validation'
                  : 'Please provide a reason for rejecting these references'
                }
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="batch-note">
                {batchAction === 'validate' ? 'Note (Optional)' : 'Reason'}
                {batchAction === 'reject' && <span className="text-red-500"> *</span>}
              </Label>
              <Textarea
                id="batch-note"
                placeholder={batchAction === 'validate' 
                  ? 'Optional note for validation...'
                  : 'Explain why these references are rejected...'
                }
                value={batchNote}
                onChange={(e) => setBatchNote(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBatchDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={batchAction === 'validate' ? 'default' : 'destructive'}
                onClick={handleBatchValidation}
                disabled={batchValidating || (batchAction === 'reject' && !batchNote.trim())}
              >
                {batchValidating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {batchAction === 'validate' ? (
                      <><Check className="w-4 h-4 mr-2" />Validate</>
                    ) : (
                      <><X className="w-4 h-4 mr-2" />Reject</>
                    )}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default DosenDokumenDetail;
