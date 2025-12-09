import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  const [selectedDocument, setSelectedDocument] = useState(null);

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
    if (status === 'all') {
      return references;
    }
    return references.filter(ref => ref.status_validasi === status);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: {
        variant: 'secondary',
        icon: Clock,
        label: 'Menunggu Review',
        className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      },
      validated: {
        variant: 'default',
        icon: CheckCircle2,
        label: 'Tervalidasi',
        className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      },
      rejected: {
        variant: 'destructive',
        icon: XCircle,
        label: 'Ditolak',
        className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const ReferenceCard = ({ reference }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="h-4 w-4 text-primary flex-shrink-0" />
              <CardTitle className="text-base truncate">
                {reference.dokumen_judul}
              </CardTitle>
            </div>
            <CardDescription className="text-sm">
              Referensi #{reference.nomor}
            </CardDescription>
          </div>
          <div>
            {getStatusBadge(reference.status_validasi)}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Reference Text */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground line-clamp-3">
            {reference.teks_referensi}
          </p>
        </div>

        {/* Reference Details */}
        <div className="grid grid-cols-2 gap-3 text-sm">
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
        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-xs text-muted-foreground">
            {reference.updated_at && format(new Date(reference.updated_at), 'dd MMM yyyy, HH:mm')}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/dashboard/documents/${reference.dokumen_id}`)}
          >
            <Eye className="h-3 w-3 mr-2" />
            Lihat Dokumen
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto p-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Memuat referensi...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const filteredRefs = filterReferences(activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Referensi Saya</h1>
          <p className="text-muted-foreground text-lg">
            Lihat status validasi referensi dari dosen pembimbing
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referensi</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.total}</div>
              <p className="text-xs text-muted-foreground">
                {summary.documents_with_references} dokumen
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tervalidasi</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{summary.validated}</div>
              <p className="text-xs text-muted-foreground">
                {summary.total > 0 ? Math.round((summary.validated / summary.total) * 100) : 0}% dari total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Menunggu</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{summary.pending}</div>
              <p className="text-xs text-muted-foreground">
                Sedang direview
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ditolak</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{summary.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Perlu diperbaiki
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">
              Semua ({summary.total})
            </TabsTrigger>
            <TabsTrigger value="pending">
              <Clock className="h-4 w-4 mr-2" />
              Menunggu ({summary.pending})
            </TabsTrigger>
            <TabsTrigger value="validated">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Tervalidasi ({summary.validated})
            </TabsTrigger>
            <TabsTrigger value="rejected">
              <XCircle className="h-4 w-4 mr-2" />
              Ditolak ({summary.rejected})
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredRefs.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Filter className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Tidak ada referensi</h3>
                  <p className="text-muted-foreground text-center">
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
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRefs.map((ref) => (
                  <ReferenceCard key={ref.id} reference={ref} />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MahasiswaReferensi;
