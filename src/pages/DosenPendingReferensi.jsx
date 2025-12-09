import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { dosenAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { CheckCircle, XCircle, AlertCircle, BookOpen, Eye, FileText, Calendar as CalendarIcon, Search, History, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from "date-fns";
import { debounce } from 'lodash';

// Komponen Riwayat Validasi
const ReferensiHistory = ({ currentDosenId }) => {
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    date: {
      from: subDays(new Date(), 30),
      to: new Date(),
    },
  });

  const debouncedFetch = useCallback(
    debounce((newFilters) => {
      fetchHistory(newFilters);
    }, 500),
    []
  );

  useEffect(() => {
    fetchHistory(filters);
  }, []);

  const fetchHistory = async (currentFilters) => {
    setLoading(true);
    try {
      const params = {
        search: currentFilters.search || null,
        status: currentFilters.status === 'all' ? null : currentFilters.status,
        start_date: currentFilters.date?.from ? format(currentFilters.date.from, 'yyyy-MM-dd') : null,
        end_date: currentFilters.date?.to ? format(currentFilters.date.to, 'yyyy-MM-dd') : null,
      };
      const response = await dosenAPI.getReferensiHistory(params);
      setHistory(response.data);
    } catch (err) {
      console.error("Error fetching referensi history:", err);
      toast.error("Gagal memuat riwayat referensi.");
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    if (key === 'search') {
      debouncedFetch(newFilters);
    } else {
      fetchHistory(newFilters);
    }
  };

  const handleViewDokumen = (dokumenId) => {
    navigate(`/dosen/dokumen/${dokumenId}`);
  };

  return (
    <Card className="mt-8">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="h-6 w-6" />
            <div>
              <CardTitle>Riwayat Validasi Referensi</CardTitle>
              <CardDescription>Daftar referensi yang telah divalidasi</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter Controls */}
        <div className="flex flex-col md:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama mahasiswa atau judul dokumen..."
              className="pl-8"
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
          <Select
            value={filters.status}
            onValueChange={(value) => handleFilterChange('status', value)}
          >
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="validated">Disetujui</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className="w-full justify-start text-left font-normal md:w-[240px]"
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.date?.from ? (
                  filters.date.to ? (
                    <>
                      {format(filters.date.from, "LLL dd, y")} -{" "}
                      {format(filters.date.to, "LLL dd, y")}
                    </>
                  ) : (
                    format(filters.date.from, "LLL dd, y")
                  )
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={filters.date?.from}
                selected={filters.date}
                onSelect={(date) => handleFilterChange('date', date)}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* History Table */}
        {loading ? (
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Memuat riwayat...</p>
          </div>
        ) : history.length === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Tidak ada riwayat validasi yang cocok dengan filter.
            </AlertDescription>
          </Alert>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mahasiswa</TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead>Referensi</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Tgl. Validasi</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((ref) => (
                <TableRow key={ref.id}>
                  <TableCell className="font-medium">{ref.mahasiswa_nama}</TableCell>
                  <TableCell>{ref.dokumen_judul}</TableCell>
                  <TableCell className="max-w-xs truncate">{ref.teks_referensi}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={ref.status_validasi === 'validated' ? 'default' : 'destructive'}>
                      {ref.status_validasi === 'validated' ? 'Disetujui' : 'Ditolak'}
                    </Badge>
                  </TableCell>
                  <TableCell>{format(new Date(ref.validated_at), 'dd MMM yyyy')}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewDokumen(ref.dokumen_id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};


/**
 * DosenPendingReferensi Component
 * Shows list of references that need validation from dosen
 */
const DosenPendingReferensi = () => {
  const navigate = useNavigate();
  const [pendingDocuments, setPendingDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
    }
    fetchPendingDocuments();
  }, []);

  const fetchPendingDocuments = async () => {
    setLoading(true);
    try {
      const response = await dosenAPI.getPendingReferensi();
      
      // Group by document
      const grouped = response.data.reduce((acc, ref) => {
        const docKey = ref.dokumen_id;
        if (!acc[docKey]) {
          acc[docKey] = {
            dokumen_id: ref.dokumen_id,
            dokumen_judul: ref.dokumen_judul,
            mahasiswa_nama: ref.mahasiswa_nama,
            mahasiswa_id: ref.mahasiswa_id,
            tanggal_unggah: ref.tanggal_unggah,
            pending_count: 0,
            referensi: []
          };
        }
        acc[docKey].pending_count += 1;
        acc[docKey].referensi.push(ref);
        return acc;
      }, {});
      
      setPendingDocuments(Object.values(grouped));
    } catch (err) {
      console.error('Error fetching pending documents:', err);
      toast.error('Failed to load pending documents');
    } finally {
      setLoading(false);
    }
  };

  const handleViewDocument = (dokumenId) => {
    navigate(`/dosen/dokumen/${dokumenId}`, {
      state: { openReferences: true }
    });
  };

  // Filter documents by search
  const filteredDocuments = pendingDocuments.filter(doc => {
    const searchLower = searchQuery.toLowerCase();
    return (
      doc.dokumen_judul?.toLowerCase().includes(searchLower) ||
      doc.mahasiswa_nama?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">Validasi Referensi</h1>
          <p className="text-muted-foreground text-lg">
            Review dan validasi referensi dari mahasiswa bimbingan
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingDocuments.length}</div>
            <p className="text-xs text-muted-foreground">with pending references</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingDocuments.reduce((sum, doc) => sum + doc.pending_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground">references to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg per Document</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {pendingDocuments.length > 0 
                ? Math.round(pendingDocuments.reduce((sum, doc) => sum + doc.pending_count, 0) / pendingDocuments.length)
                : 0
              }
            </div>
            <p className="text-xs text-muted-foreground">references per doc</p>
          </CardContent>
        </Card>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search by document title or student name..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      {filteredDocuments.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                {searchQuery 
                  ? 'No documents found matching your search.'
                  : 'No documents with pending references at the moment.'
                }
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Documents with Pending References</CardTitle>
            <CardDescription>
              Click on a document to review and validate references
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Document Title</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead className="text-center">Pending Refs</TableHead>
                  <TableHead>Uploaded</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc, index) => (
                  <TableRow 
                    key={doc.dokumen_id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => handleViewDocument(doc.dokumen_id)}
                  >
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-primary" />
                        <span className="font-medium">{doc.dokumen_judul}</span>
                      </div>
                    </TableCell>
                    <TableCell>{doc.mahasiswa_nama}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="secondary" className="font-semibold">
                        {doc.pending_count}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <CalendarIcon className="h-3 w-3" />
                        {new Date(doc.tanggal_unggah).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDocument(doc.dokumen_id);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Review
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
        {/* History Section */}
        {user?.dosen_profile?.id && <ReferensiHistory currentDosenId={user.dosen_profile.id} />}
      </div>
    </div>
  );
};

export default DosenPendingReferensi;
