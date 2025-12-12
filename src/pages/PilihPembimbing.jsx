import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  BookOpen, 
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  AlertCircle
} from 'lucide-react';
import api from '@/services/api';

const PilihPembimbing = () => {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  
  const [dosenList, setDosenList] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [showRequestDialog, setShowRequestDialog] = useState(false);
  const [pesan, setPesan] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [hasPembimbing, setHasPembimbing] = useState(false);

  useEffect(() => {
    console.log('Current user:', user);
    console.log('Token:', localStorage.getItem('token'));
    
    if (!user) {
      console.error('No user found, redirecting to login');
      navigate('/login');
      return;
    }
    
    if (user.role !== 'mahasiswa') {
      console.error('User is not mahasiswa:', user.role);
      setError('Halaman ini hanya untuk mahasiswa');
      return;
    }
    
    // Auto-refresh user data if bidang_keahlian is missing
    if (!user.bidang_keahlian) {
      refreshUser().then(() => {
        fetchData();
      });
    } else {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get available dosen
      const dosenRes = await api.get('/dosen/available-dosen');
      console.log('Dosen data:', dosenRes.data);
      
      // Filter dosen by matching specialization
      const userSpecialization = user?.bidang_keahlian;
      const matchingDosen = dosenRes.data.filter(
        dosen => dosen.bidang_keahlian === userSpecialization
      );
      console.log('Matching dosen with specialization:', userSpecialization, matchingDosen);
      setDosenList(matchingDosen);
      
      // Get my requests
      const requestsRes = await api.get('/pembimbing/my-requests');
      console.log('Requests data:', requestsRes.data);
      setMyRequests(requestsRes.data);
      
      // Check if already has pembimbing
      const acceptedRequest = requestsRes.data.find(r => r.status === 'accepted');
      if (acceptedRequest) {
        // Redirect to dosen pembimbing page if already accepted
        console.log('Mahasiswa sudah memiliki pembimbing, redirect ke halaman dosen pembimbing');
        navigate('/mahasiswa/dosen-pembimbing');
        return;
      }
      setHasPembimbing(!!acceptedRequest);
      
    } catch (err) {
      console.error('Error fetching data:', err);
      console.error('Error response:', err.response);
      const errorMsg = err.response?.data?.detail || err.message || 'Gagal memuat data';
      setError(`Gagal memuat data: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestClick = (dosen) => {
    setSelectedDosen(dosen);
    setShowRequestDialog(true);
    setPesan('');
    setError('');
  };

  const handleSubmitRequest = async () => {
    if (!selectedDosen) return;
    
    try {
      setSubmitting(true);
      setError('');
      
      await api.post('/pembimbing/request', {
        dosen_id: selectedDosen.id,
        pesan_mahasiswa: pesan
      });
      
      setSuccess(`Request berhasil dikirim ke ${selectedDosen.nama}`);
      setShowRequestDialog(false);
      
      // Refresh data
      await fetchData();
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err.response?.data?.detail || 'Gagal mengirim request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!confirm('Yakin ingin membatalkan request ini?')) return;
    
    try {
      await api.delete(`/pembimbing/request/${requestId}`);
      setSuccess('Request berhasil dibatalkan');
      await fetchData();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error('Error canceling request:', err);
      setError(err.response?.data?.detail || 'Gagal membatalkan request');
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

  const isPendingToDosen = (dosenId) => {
    return myRequests.some(r => r.dosen_id === dosenId && r.status === 'pending');
  };

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
        {/* Header with University Branding */}
        <div className="mb-4 sm:mb-8">
          <div className="flex items-center space-x-3 sm:space-x-4 mb-3 sm:mb-4">
            <div className="h-12 w-12 sm:h-16 sm:w-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Users className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">Pilih Dosen Pembimbing</h1>
              <p className="text-xs sm:text-base text-gray-600 hidden sm:block">
                Fakultas Rekayasa Industri - Program Studi S1 Sistem Informasi
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
          
          {hasPembimbing && (
            <Alert className="bg-blue-50 border-blue-200">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                Anda sudah memiliki dosen pembimbing. Request diterima!
              </AlertDescription>
            </Alert>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daftar Dosen */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            <div className="flex flex-col sm:flex-row items-start justify-between gap-2 mb-3 sm:mb-4">
              <h2 className="text-base sm:text-xl font-semibold text-gray-900">
                Dosen Pembimbing yang Tersedia
              </h2>
              <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300 text-[10px] sm:text-xs">
                <BookOpen className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                Peminatan: {user?.bidang_keahlian}
              </Badge>
            </div>
            <Alert className="bg-blue-50 border-blue-200 mb-3 sm:mb-4 py-2 sm:py-3">
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600" />
              <AlertDescription className="text-blue-800 text-[11px] sm:text-sm">
                Hanya menampilkan dosen dengan peminatan yang sama dengan Anda
              </AlertDescription>
            </Alert>
            
            {dosenList.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-900 font-medium mb-2">
                    Tidak ada dosen pembimbing tersedia
                  </p>
                  <p className="text-gray-500 text-sm">
                    Belum ada dosen dengan peminatan <span className="font-semibold text-cyan-600">{user?.bidang_keahlian}</span> yang tersedia saat ini.
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    Silakan hubungi admin untuk informasi lebih lanjut.
                  </p>
                </CardContent>
              </Card>
            ) : (
              dosenList.map((dosen) => (
                <Card key={dosen.id} className="hover:shadow-md transition-shadow border-l-4 border-cyan-500">
                  <CardHeader className="pb-3 sm:pb-6">
                    <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                      <div className="flex items-start space-x-3 w-full sm:w-auto">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 bg-cyan-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <User className="h-5 w-5 sm:h-6 sm:w-6 text-cyan-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-sm sm:text-lg mb-1">{dosen.nama}</CardTitle>
                          <Badge variant="outline" className="bg-cyan-50 text-cyan-700 border-cyan-300 text-[9px] sm:text-xs mb-1.5 sm:hidden">
                            <BookOpen className="h-2.5 w-2.5 mr-0.5" />
                            {dosen.bidang_keahlian}
                          </Badge>
                          <CardDescription className="flex items-center text-[11px] sm:text-sm">
                            <Mail className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{dosen.email}</span>
                          </CardDescription>
                        </div>
                      </div>
                      
                      {!hasPembimbing && (
                        <Button
                          onClick={() => handleRequestClick(dosen)}
                          disabled={isPendingToDosen(dosen.id)}
                          className="bg-cyan-600 hover:bg-cyan-700 w-full sm:w-auto h-8 sm:h-10 text-xs sm:text-sm"
                        >
                          {isPendingToDosen(dosen.id) ? (
                            <>
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Menunggu
                            </>
                          ) : (
                            <>
                              <Send className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                              Kirim Request
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-col sm:grid sm:grid-cols-3 gap-2 sm:gap-4 text-xs sm:text-sm">
                      <div className="flex items-start text-gray-600">
                        <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Bidang Keahlian</p>
                          <p className="text-[11px] sm:text-sm">{dosen.bidang_keahlian || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start text-gray-600">
                        <User className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">NIP</p>
                          <p className="text-[11px] sm:text-sm">{dosen.nip || '-'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start text-gray-600">
                        <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2 text-cyan-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-gray-900">Mahasiswa Bimbingan</p>
                          <p className="text-[11px] sm:text-sm">{dosen.jumlah_bimbingan || 0} mahasiswa</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Status Request Saya */}
          <div>
            <h2 className="text-base sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">
              Status Request Saya
            </h2>
            
            {myRequests.length === 0 ? (
              <Card>
                <CardContent className="py-6 sm:py-8 text-center text-gray-500">
                  <Send className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-2 sm:mb-3 text-gray-400" />
                  <p className="text-xs sm:text-sm">Belum ada request yang dikirim</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2 sm:space-y-3">
                {myRequests.map((request) => (
                  <Card key={request.id}>
                    <CardHeader className="pb-2 sm:pb-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-xs sm:text-sm truncate">{request.dosen_nama}</CardTitle>
                          <CardDescription className="text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                            {new Date(request.created_at).toLocaleDateString('id-ID')}
                          </CardDescription>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {request.pesan_mahasiswa && (
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2">
                          <p className="font-medium">Pesan Anda:</p>
                          <p className="italic line-clamp-2">&quot;{request.pesan_mahasiswa}&quot;</p>
                        </div>
                      )}
                      
                      {request.pesan_dosen && (
                        <div className="text-[10px] sm:text-xs text-gray-600 mb-1.5 sm:mb-2 p-1.5 sm:p-2 bg-gray-50 rounded">
                          <p className="font-medium">Respon Dosen:</p>
                          <p className="italic line-clamp-2">&quot;{request.pesan_dosen}&quot;</p>
                        </div>
                      )}
                      
                      {request.status === 'pending' && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-1.5 sm:mt-2 text-red-600 hover:bg-red-50 h-7 sm:h-9 text-[10px] sm:text-xs"
                          onClick={() => handleCancelRequest(request.id)}
                        >
                          <XCircle className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-1" />
                          Batalkan Request
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialog Request */}
      <Dialog open={showRequestDialog} onOpenChange={setShowRequestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kirim Request ke {selectedDosen?.nama}</DialogTitle>
            <DialogDescription>
              Tulis pesan singkat untuk dosen (opsional)
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
              <Label htmlFor="pesan">Pesan untuk Dosen</Label>
              <Textarea
                id="pesan"
                value={pesan}
                onChange={(e) => setPesan(e.target.value)}
                placeholder="Contoh: Saya tertarik dengan bidang keahlian Bapak/Ibu..."
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRequestDialog(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button
              onClick={handleSubmitRequest}
              disabled={submitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Mengirim...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Kirim Request
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PilihPembimbing;
