import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  User, 
  Mail, 
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  AlertCircle,
  UserCheck,
  Users,
  BookOpen
} from 'lucide-react';
import api from '@/services/api';

const DosenRequestBimbingan = () => {
  const { user, refreshUser } = useAuth();
  
  const [requests, setRequests] = useState([]);
  const [myBimbingan, setMyBimbingan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showResponseDialog, setShowResponseDialog] = useState(false);
  const [responseType, setResponseType] = useState(''); // 'accepted' or 'rejected'
  const [pesanDosen, setPesanDosen] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    // Auto-refresh user data if bidang_keahlian is missing
    if (user && !user.bidang_keahlian) {
      refreshUser().then(() => {
        fetchData();
      });
    } else {
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Get incoming requests
      const requestsRes = await api.get('/pembimbing/incoming-requests');
      
      // Filter requests by matching specialization
      const userSpecialization = user?.bidang_keahlian;
      const matchingRequests = requestsRes.data.filter(
        request => request.mahasiswa_bidang_keahlian === userSpecialization
      );
      console.log('Matching requests with specialization:', userSpecialization, matchingRequests);
      setRequests(matchingRequests);
      
      // Get my bimbingan students
      const bimbinganRes = await api.get('/pembimbing/my-bimbingan');
      setMyBimbingan(bimbinganRes.data);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Gagal memuat data');
    } finally {
      setLoading(false);
    }
  };

  const handleResponseClick = (request, type) => {
    setSelectedRequest(request);
    setResponseType(type);
    setShowResponseDialog(true);
    setPesanDosen('');
    setError('');
  };

  const handleSubmitResponse = async () => {
    if (!selectedRequest || !responseType) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      await api.put(`/pembimbing/request/${selectedRequest.id}/respond`, {
        status: responseType,
        pesan_dosen: pesanDosen
      });
      
      setSuccess(
        responseType === 'accepted' 
          ? `Request dari ${selectedRequest.mahasiswa_nama} berhasil diterima` 
          : `Request dari ${selectedRequest.mahasiswa_nama} ditolak`
      );
      setShowResponseDialog(false);
      
      // Refresh data
      await fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error responding to request:', err);
      setError(err.response?.data?.detail || 'Gagal merespon request');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-300">
          <Clock className="h-3 w-3 mr-1" />
          Menunggu
        </Badge>;
      case 'accepted':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Diterima
        </Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300">
          <XCircle className="h-3 w-3 mr-1" />
          Ditolak
        </Badge>;
      default:
        return null;
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending');
  const processedRequests = requests.filter(r => r.status !== 'pending');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Memuat data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Header */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
              <UserCheck className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">Request Pembimbingan</h1>
              <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                Kelola request bimbingan dari mahasiswa S1 Sistem Informasi
              </p>
            </div>
          </div>
          
          {success && (
            <Alert className="bg-green-50 border-green-200 mb-4">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">{success}</AlertDescription>
            </Alert>
          )}
          
          {error && (
            <Alert className="bg-red-50 border-red-200 mb-4">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4 sm:mb-6 h-auto">
            <TabsTrigger value="pending" className="relative text-[10px] sm:text-sm px-1.5 sm:px-4 py-2 sm:py-2.5 whitespace-normal leading-tight">
              <span className="hidden sm:inline">Request Pending</span>
              <span className="sm:hidden">Request Pending</span>
              {pendingRequests.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-red-600 text-[8px] sm:text-xs px-1 sm:px-2 py-0 h-4 sm:h-5">{pendingRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="processed" className="text-[10px] sm:text-sm px-1.5 sm:px-4 py-2 sm:py-2.5 whitespace-normal leading-tight">
              <span className="hidden sm:inline">Riwayat Request</span>
              <span className="sm:hidden">Riwayat Request Mahasiswa Bimbingan</span>
            </TabsTrigger>
            <TabsTrigger value="bimbingan" className="relative text-[10px] sm:text-sm px-1.5 sm:px-4 py-2 sm:py-2.5 whitespace-normal leading-tight">
              <span className="hidden sm:inline">Mahasiswa Bimbingan</span>
              <span className="sm:hidden">Mahasiswa Bimbingan</span>
              {myBimbingan.length > 0 && (
                <Badge className="ml-1 sm:ml-2 bg-blue-600 text-[8px] sm:text-xs px-1 sm:px-2 py-0 h-4 sm:h-5">{myBimbingan.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pending Requests Tab */}
          <TabsContent value="pending">
            <Alert className="bg-blue-50 border-blue-200 mb-4">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-sm">
                Hanya menampilkan request dari mahasiswa dengan peminatan: <span className="font-semibold">{user?.bidang_keahlian}</span>
              </AlertDescription>
            </Alert>
            
            <div className="space-y-4">
              {pendingRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <p className="text-gray-900 font-medium mb-2">Tidak ada request pending</p>
                    <p className="text-gray-500 text-sm">
                      Belum ada mahasiswa dengan peminatan <span className="font-semibold text-red-600">{user?.bidang_keahlian}</span> yang mengirim request bimbingan.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                pendingRequests.map((request) => (
                  <Card key={request.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 w-full sm:w-auto">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg mb-1">{request.mahasiswa_nama}</CardTitle>
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-300 text-[9px] sm:text-xs mb-1.5 sm:mb-0 sm:hidden">
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                              {request.mahasiswa_bidang_keahlian}
                            </Badge>
                            <CardDescription className="flex items-center text-[11px] sm:text-sm">
                              <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                              <span className="truncate">NIM: {request.mahasiswa_nim}</span>
                            </CardDescription>
                            <CardDescription className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                              Dikirim {new Date(request.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {request.pesan_mahasiswa && (
                        <div className="mb-3 sm:mb-4 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Pesan Mahasiswa:</p>
                          <p className="text-[11px] sm:text-sm text-gray-600 italic line-clamp-3 sm:line-clamp-none">&quot;{request.pesan_mahasiswa}&quot;</p>
                        </div>
                      )}
                      
                      <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                        <Button
                          onClick={() => handleResponseClick(request, 'accepted')}
                          className="flex-1 bg-green-600 hover:bg-green-700 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          <CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Terima
                        </Button>
                        <Button
                          onClick={() => handleResponseClick(request, 'rejected')}
                          variant="outline"
                          className="flex-1 text-red-600 hover:bg-red-50 h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          <XCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                          Tolak
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Processed Requests Tab */}
          <TabsContent value="processed">
            <div className="space-y-4">
              {processedRequests.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Belum ada request yang diproses</p>
                  </CardContent>
                </Card>
              ) : (
                processedRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-3 sm:pb-6">
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        <div className="flex items-start space-x-3 w-full sm:w-auto">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-gray-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg mb-1">{request.mahasiswa_nama}</CardTitle>
                            <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-300 text-[9px] sm:text-xs mb-1.5 sm:mb-0 sm:hidden">
                              <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                              {request.mahasiswa_bidang_keahlian}
                            </Badge>
                            <CardDescription className="text-[11px] sm:text-sm">
                              NIM: {request.mahasiswa_nim}
                            </CardDescription>
                            <CardDescription className="text-[10px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1">
                              Diproses {new Date(request.updated_at || request.created_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {request.pesan_mahasiswa && (
                        <div className="mb-2 sm:mb-3 p-2 sm:p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm font-medium text-gray-700 mb-0.5 sm:mb-1">Pesan Mahasiswa:</p>
                          <p className="text-[11px] sm:text-sm text-gray-600 italic line-clamp-2 sm:line-clamp-none">&quot;{request.pesan_mahasiswa}&quot;</p>
                        </div>
                      )}
                      
                      {request.pesan_dosen && (
                        <div className="p-2 sm:p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-xs sm:text-sm font-medium text-blue-800 mb-0.5 sm:mb-1">Respon Anda:</p>
                          <p className="text-[11px] sm:text-sm text-blue-700 italic line-clamp-2 sm:line-clamp-none">&quot;{request.pesan_dosen}&quot;</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Mahasiswa Bimbingan Tab */}
          <TabsContent value="bimbingan">
            <div className="space-y-4">
              {myBimbingan.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Belum ada mahasiswa bimbingan</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                  {myBimbingan.map((mhs) => (
                    <Card key={mhs.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3 sm:pb-6">
                        <div className="flex items-center space-x-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <User className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-sm sm:text-lg truncate">{mhs.nama}</CardTitle>
                            <CardDescription className="text-[11px] sm:text-sm">NIM: {mhs.nim}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                          <div className="flex items-center text-gray-600">
                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            <span className="truncate">{mhs.email}</span>
                          </div>
                          <div className="flex items-center text-gray-600">
                            <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                            {mhs.program_studi || 'Sistem Informasi'}
                          </div>
                          {mhs.angkatan && (
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 flex-shrink-0" />
                              Angkatan {mhs.angkatan}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Response Dialog */}
      <Dialog open={showResponseDialog} onOpenChange={setShowResponseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {responseType === 'accepted' ? 'Terima Request' : 'Tolak Request'}
            </DialogTitle>
            <DialogDescription>
              {responseType === 'accepted' 
                ? `Terima request bimbingan dari ${selectedRequest?.mahasiswa_nama}?`
                : `Tolak request bimbingan dari ${selectedRequest?.mahasiswa_nama}?`
              }
            </DialogDescription>
          </DialogHeader>
          
          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="pesan">Pesan untuk Mahasiswa (opsional)</Label>
              <Textarea
                id="pesan"
                value={pesanDosen}
                onChange={(e) => setPesanDosen(e.target.value)}
                placeholder={
                  responseType === 'accepted' 
                    ? "Contoh: Selamat datang sebagai mahasiswa bimbingan saya..."
                    : "Contoh: Mohon maaf, saat ini kuota bimbingan sudah penuh..."
                }
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowResponseDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitResponse}
              disabled={submitting}
              className={responseType === 'accepted' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Memproses...
                </>
              ) : (
                <>
                  {responseType === 'accepted' ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Terima Request
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4 mr-2" />
                      Tolak Request
                    </>
                  )}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DosenRequestBimbingan;
