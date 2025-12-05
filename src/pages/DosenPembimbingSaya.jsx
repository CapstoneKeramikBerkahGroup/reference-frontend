import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  User,
  Mail,
  BookOpen,
  Phone,
  Building,
  Calendar,
  CheckCircle2,
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import api from '@/services/api';

const DosenPembimbingSaya = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [dosenPembimbing, setDosenPembimbing] = useState(null);
  const [acceptedRequest, setAcceptedRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (user.role !== 'mahasiswa') {
      setError('Halaman ini hanya untuk mahasiswa');
      return;
    }
    
    fetchDosenPembimbing();
  }, [user]);

  const fetchDosenPembimbing = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get my requests to find accepted one
      const requestsRes = await api.get('/pembimbing/my-requests');
      const accepted = requestsRes.data.find(r => r.status === 'accepted');
      
      if (!accepted) {
        setError('Anda belum memiliki dosen pembimbing');
        return;
      }
      
      setAcceptedRequest(accepted);
      
      // Get dosen details
      const dosenRes = await api.get('/dosen/available-dosen');
      const dosen = dosenRes.data.find(d => d.id === accepted.dosen_id);
      
      if (dosen) {
        setDosenPembimbing(dosen);
      }
      
    } catch (err) {
      console.error('Error fetching dosen pembimbing:', err);
      setError('Gagal memuat data dosen pembimbing');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Memuat data...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dosen Pembimbing Saya
          </h1>
          <p className="text-gray-600">
            Informasi detail dosen pembimbing Anda
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 border-cyan-200 bg-cyan-50">
            <AlertCircle className="h-4 w-4 text-cyan-600" />
            <AlertDescription className="text-cyan-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* No Dosen Pembimbing */}
        {!error && !dosenPembimbing && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <User className="h-16 w-16 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Belum Memiliki Dosen Pembimbing
              </h3>
              <p className="text-gray-600 text-center mb-6">
                Anda belum memiliki dosen pembimbing yang diterima. 
                Silakan ajukan request terlebih dahulu.
              </p>
              <Button
                onClick={() => navigate('/mahasiswa/dosen-selection')}
                className="bg-cyan-600 hover:bg-cyan-700"
              >
                Pilih Dosen Pembimbing
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Dosen Pembimbing Info */}
        {dosenPembimbing && acceptedRequest && (
          <div className="space-y-6">
            {/* Status Card */}
            <Card className="border-green-200 bg-green-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">
                      Dosen Pembimbing Sudah Ditetapkan
                    </p>
                    <p className="text-sm text-green-700">
                      Diterima pada: {formatDate(acceptedRequest.updated_at)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dosen Detail Card */}
            <Card>
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                <CardTitle className="text-2xl">Informasi Dosen Pembimbing</CardTitle>
                <CardDescription className="text-cyan-100">
                  Detail lengkap dosen pembimbing Anda
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                {/* Nama & Email */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">Nama Lengkap</span>
                    </div>
                    <p className="text-lg font-semibold text-gray-900 ml-7">
                      {dosenPembimbing.nama}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-5 w-5" />
                      <span className="text-sm font-medium">Email</span>
                    </div>
                    <p className="text-gray-900 ml-7">
                      {dosenPembimbing.email || '-'}
                    </p>
                  </div>
                </div>

                {/* NIP & Jabatan */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Badge variant="outline" className="text-xs">NIP</Badge>
                    </div>
                    <p className="text-lg font-semibold text-gray-900">
                      {dosenPembimbing.nip}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Building className="h-5 w-5" />
                      <span className="text-sm font-medium">Jabatan</span>
                    </div>
                    <p className="text-gray-900 ml-7">
                      {dosenPembimbing.jabatan || '-'}
                    </p>
                  </div>
                </div>

                {/* Bidang Keahlian & Jumlah Bimbingan */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="h-5 w-5" />
                      <span className="text-sm font-medium">Bidang Keahlian</span>
                    </div>
                    <p className="text-gray-900 ml-7">
                      {dosenPembimbing.bidang_keahlian || '-'}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-gray-600">
                      <User className="h-5 w-5" />
                      <span className="text-sm font-medium">Jumlah Mahasiswa Bimbingan</span>
                    </div>
                    <p className="text-gray-900 ml-7">
                      {dosenPembimbing.jumlah_bimbingan} mahasiswa
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Request History Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Riwayat Request
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tanggal Request</p>
                      <p className="text-gray-900">{formatDate(acceptedRequest.created_at)}</p>
                    </div>
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      Diterima
                    </Badge>
                  </div>
                  
                  {acceptedRequest.pesan_mahasiswa && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pesan Anda:</p>
                      <p className="text-gray-900 bg-white p-3 rounded border">
                        {acceptedRequest.pesan_mahasiswa}
                      </p>
                    </div>
                  )}
                  
                  {acceptedRequest.pesan_dosen && (
                    <div>
                      <p className="text-sm font-medium text-gray-600 mb-1">Pesan dari Dosen:</p>
                      <p className="text-gray-900 bg-white p-3 rounded border">
                        {acceptedRequest.pesan_dosen}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => navigate('/mahasiswa/dashboard')}
                variant="outline"
                className="flex-1"
              >
                Kembali ke Dashboard
              </Button>
              <Button
                onClick={() => navigate('/dashboard')}
                className="flex-1 bg-cyan-600 hover:bg-cyan-700"
              >
                Lihat Dokumen Bimbingan
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DosenPembimbingSaya;
