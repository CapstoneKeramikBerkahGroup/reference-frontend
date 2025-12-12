import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  AlertCircle,
  Eye,
  BookOpen,
  Filter
} from 'lucide-react';
import { mahasiswaAPI } from '@/services/api';
import { toast } from 'sonner';
import { format } from 'date-fns';

const MahasiswaReferensi = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [references, setReferences] = useState([]);
  const [summary, setSummary] = useState({
    pending: 0,
    validated: 0,
    rejected: 0,
    total: 0,
    documents_with_references: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedDocumentId, setSelectedDocumentId] = useState('all');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'mahasiswa') {
      toast.error('Halaman ini hanya untuk mahasiswa');
      navigate('/');
      return;
    }
    
    fetchData();
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [refsRes, summaryRes] = await Promise.all([
        mahasiswaAPI.getMyReferences(),
        mahasiswaAPI.getReferencesSummary()
      ]);
      
      setReferences(refsRes.data.data);
      setSummary(summaryRes.data);
    } catch (err) {
      console.error('Error fetching references:', err);
      toast.error('Gagal memuat data referensi');
    } finally {
      setLoading(false);
    }
  };

  const filterReferences = (status) => {
    let filtered = references;
    
    // Filter by status
    if (status !== 'all') {
      filtered = filtered.filter(ref => ref.status_validasi === status);
    }
    
    // Filter by document
    if (selectedDocumentId !== 'all') {
      filtered = filtered.filter(ref => ref.dokumen_id === parseInt(selectedDocumentId));
    }
    
    return filtered;
  };

  // Get unique documents from references
  const getUniqueDocuments = () => {
    const docsMap = new Map();
    references.forEach(ref => {
      if (!docsMap.has(ref.dokumen_id)) {
        docsMap.set(ref.dokumen_id, {
          id: ref.dokumen_id,
          title: ref.dokumen_judul
        });
      }
    });
    return Array.from(docsMap.values());
  };

  // Get filtered statistics based on selected document
  const getFilteredStats = () => {
    let filtered = references;
    
    if (selectedDocumentId !== 'all') {
      filtered = filtered.filter(ref => ref.dokumen_id === parseInt(selectedDocumentId));
    }
    
    const total = filtered.length;
    const validated = filtered.filter(ref => ref.status_validasi === 'validated').length;
    const pending = filtered.filter(ref => ref.status_validasi === 'pending').length;
    const rejected = filtered.filter(ref => ref.status_validasi === 'rejected').length;
    
    // Count unique documents in filtered results
    const uniqueDocs = new Set(filtered.map(ref => ref.dokumen_id)).size;
    
    return {
      total,
      validated,
      pending,
      rejected,
      documents_with_references: uniqueDocs
    };
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        label: 'Menunggu Review',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs'
      },
      validated: {
        variant: 'default',
        icon: CheckCircle2,
        label: 'Tervalidasi',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs'
      },
      rejected: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Ditolak',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-2 w-2 sm:h-3 sm:w-3 mr-1" />
        <span className="hidden sm:inline">{config.label}</span>
        <span className="sm:hidden">
          {status === 'pending' ? 'Review' : status === 'validated' ? 'Valid' : 'Tolak'}
        </span>
      </Badge>
    );
  };

  const ReferenceCard = ({ reference }) => (
    <Card className="hover:shadow-md transition-shadow hidden md:block">
      <CardHeader className="pb-3 p-3 sm:p-4">
        <div className="flex items-start justify-between gap-2 sm:gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
              <CardTitle className="text-sm sm:text-base truncate">
                {reference.dokumen_judul}
              </CardTitle>
            </div>
            <CardDescription className="text-xs sm:text-sm">
              Referensi #{reference.nomor}
            </CardDescription>
          </div>
          <div>
            {getStatusBadge(reference.status_validasi)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 sm:space-y-4 p-3 sm:p-4 pt-0">
        {/* Reference Text */}
        <div className="p-2 sm:p-3 bg-muted/50 rounded-lg">
          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
            {reference.teks_referensi}
          </p>
        </div>

        {/* Reference Details */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
          {reference.penulis && (
            <div>
              <span className="text-muted-foreground">Penulis:</span>
              <p className="font-medium truncate">{reference.penulis}</p>
            </div>
          )}
          {reference.tahun && (
            <div>
              <span className="text-muted-foreground">Tahun:</span>
              <p className="font-medium">{reference.tahun}</p>
            </div>
          )}
          {reference.judul_publikasi && (
            <div className="col-span-2">
              <span className="text-muted-foreground">Publikasi:</span>
              <p className="font-medium truncate">{reference.judul_publikasi}</p>
            </div>
          )}
        </div>

        {/* Validation Note */}
        {reference.catatan_validasi && (
          <Alert className={
            reference.status_validasi === 'validated' 
              ? 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950'
          }>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-semibold text-sm mb-1">Catatan Dosen:</p>
              <p className="text-sm">{reference.catatan_validasi}</p>
            </AlertDescription>
          </Alert>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t flex-wrap gap-2">
          <span className="text-[10px] sm:text-xs text-muted-foreground">
            {reference.updated_at && format(new Date(reference.updated_at), 'dd MMM yyyy, HH:mm')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/documents/${reference.dokumen_id}`)}
            className="text-xs"
          >
            <Eye className="h-3 w-3 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Lihat Dokumen</span>
            <span className="sm:hidden">Lihat</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // Compact list item for mobile
  const ReferenceListItem = ({ reference }) => (
    <div className="md:hidden border-b border-border last:border-0 py-2 px-3 hover:bg-muted/20 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="flex-1 min-w-0">
          <h3 className="text-[11px] font-semibold truncate leading-tight">{reference.dokumen_judul}</h3>
          <p className="text-[9px] text-muted-foreground">Ref #{reference.nomor}</p>
        </div>
        <Badge 
          variant={
            reference.status_validasi === 'validated' ? 'default' :
            reference.status_validasi === 'pending' ? 'secondary' : 'destructive'
          }
          className="text-[8px] px-1.5 py-0 h-4 flex-shrink-0"
        >
          {reference.status_validasi === 'validated' ? '✓' :
           reference.status_validasi === 'pending' ? '⏳' : '✗'}
        </Badge>
      </div>
      
      <p className="text-[10px] text-muted-foreground line-clamp-1 mb-1">
        {reference.teks_referensi}
      </p>
      
      {(reference.penulis || reference.tahun) && (
        <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1">
          {reference.penulis && (
            <span className="truncate max-w-[60%]">{reference.penulis}</span>
          )}
          {reference.tahun && (
            <span>• {reference.tahun}</span>
          )}
        </div>
      )}
      
      {reference.catatan_validasi && (
        <div className={`mb-1 py-1 px-1.5 rounded text-[9px] ${
          reference.status_validasi === 'validated' 
            ? 'bg-green-50 text-green-700' 
            : 'bg-red-50 text-red-700'
        }`}>
          <span className="font-semibold">💬 </span>
          <span className="line-clamp-1">{reference.catatan_validasi}</span>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <span className="text-[8px] text-muted-foreground">
          {reference.updated_at && format(new Date(reference.updated_at), 'dd/MM HH:mm')}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(`/dashboard/documents/${reference.dokumen_id}`)}
          className="h-6 text-[9px] px-1.5 -mr-1.5"
        >
          <Eye className="h-2.5 w-2.5 mr-0.5" />
          Lihat
        </Button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
          <div className="flex items-center justify-center min-h-[300px] sm:min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-3 sm:mt-4 text-muted-foreground text-sm sm:text-base">Memuat referensi...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRefs = filterReferences(activeTab);
  const uniqueDocuments = getUniqueDocuments();
  const filteredStats = getFilteredStats();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight">Referensi Saya</h1>
          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            Lihat status validasi referensi dari dosen pembimbing
          </p>
        </div>

        {/* Document Filter */}
        <Card>
          <CardHeader className="pb-3 p-3 sm:p-4">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filter Berdasarkan Dokumen
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <Select value={selectedDocumentId} onValueChange={setSelectedDocumentId}>
              <SelectTrigger className="w-full h-9">
                <SelectValue placeholder="Pilih dokumen..." />
              </SelectTrigger>
              <SelectContent className="max-w-[calc(100vw-2rem)] sm:max-w-full">
                <SelectItem value="all">
                  Semua Dokumen ({references.length} referensi)
                </SelectItem>
                {uniqueDocuments.map((doc) => {
                  const refCount = references.filter(ref => ref.dokumen_id === doc.id).length;
                  return (
                    <SelectItem key={doc.id} value={doc.id.toString()} className="max-w-full">
                      <div className="truncate">
                        {doc.title} ({refCount})
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Total Referensi</CardTitle>
              <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold">{filteredStats.total}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {filteredStats.documents_with_references} dokumen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Tervalidasi</CardTitle>
              <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600">{filteredStats.validated}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                {filteredStats.total > 0 ? Math.round((filteredStats.validated / filteredStats.total) * 100) : 0}% dari total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Menunggu</CardTitle>
              <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-yellow-600">{filteredStats.pending}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Sedang direview
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
              <CardTitle className="text-xs sm:text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600" />
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
              <div className="text-xl sm:text-2xl font-bold text-red-600">{filteredStats.rejected}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground">
                Perlu diperbaiki
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="-mx-3 sm:mx-0 overflow-x-auto">
            <TabsList className="inline-flex w-auto min-w-full sm:grid sm:w-full sm:grid-cols-4 mx-3 sm:mx-0">
              <TabsTrigger value="all" className="text-xs sm:text-sm px-3 sm:px-4">
                <span className="hidden sm:inline">Semua</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1">({filteredStats.total})</span>
              </TabsTrigger>
              <TabsTrigger value="pending" className="text-xs sm:text-sm px-3 sm:px-4">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Menunggu</span>
                <span className="ml-1">({filteredStats.pending})</span>
              </TabsTrigger>
              <TabsTrigger value="validated" className="text-xs sm:text-sm px-3 sm:px-4">
                <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Tervalidasi</span>
                <span className="ml-1">({filteredStats.validated})</span>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="text-xs sm:text-sm px-3 sm:px-4">
                <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                <span className="hidden md:inline">Ditolak</span>
                <span className="ml-1">({filteredStats.rejected})</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            {filteredRefs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 px-4">
                  <Filter className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mb-3 sm:mb-4" />
                  <h3 className="text-base sm:text-lg font-semibold mb-2">Tidak ada referensi</h3>
                  <p className="text-muted-foreground text-center text-sm sm:text-base">
                    {activeTab === 'all' 
                      ? 'Belum ada referensi yang terdeteksi dari dokumen Anda'
                      : `Tidak ada referensi dengan status ${
                          activeTab === 'pending' ? 'menunggu review' :
                          activeTab === 'validated' ? 'tervalidasi' : 'ditolak'
                        }`
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Mobile List View */}
                <Card className="md:hidden">
                  <CardContent className="p-0">
                    {filteredRefs.map((ref) => (
                      <ReferenceListItem key={ref.id} reference={ref} />
                    ))}
                  </CardContent>
                </Card>

                {/* Desktop Card Grid */}
                <div className="hidden md:grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRefs.map((ref) => (
                    <ReferenceCard key={ref.id} reference={ref} />
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MahasiswaReferensi;
