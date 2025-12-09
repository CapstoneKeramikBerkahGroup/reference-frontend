import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dosenAPI, usersAPI, mahasiswaAPI } from '@/services/api';
import Navbar from '@/components/Navbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { UserPlus, UserMinus, Check, AlertCircle, Users, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';

/**
 * DosenMahasiswaManagement Component
 * Allows dosen to assign/remove mahasiswa from their bimbingan
 */
const DosenMahasiswaManagement = () => {
  const { user } = useAuth();
  const [mahasiswaBimbingan, setMahasiswaBimbingan] = useState([]);
  const [allMahasiswa, setAllMahasiswa] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedMahasiswa, setSelectedMahasiswa] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bimbinganRes, allMahasiswaRes] = await Promise.all([
        dosenAPI.getMahasiswaBimbingan(),
        usersAPI.getMahasiswa()
      ]);
      
      setMahasiswaBimbingan(bimbinganRes.data);
      setAllMahasiswa(allMahasiswaRes.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load mahasiswa data');
    } finally {
      setLoading(false);
    }
  };

  const availableMahasiswa = allMahasiswa.filter(
    mhs => !mahasiswaBimbingan.some(bimbingan => bimbingan.id === mhs.id)
  );

  const handleAssignMahasiswa = async (mahasiswaId) => {
    setActionLoading(true);
    try {
      await dosenAPI.assignMahasiswa(mahasiswaId);
      toast.success('Mahasiswa berhasil ditambahkan ke bimbingan');
      setAssignDialogOpen(false);
      fetchData();
    } catch (err) {
      console.error('Error assigning mahasiswa:', err);
      toast.error(err.response?.data?.detail || 'Failed to assign mahasiswa');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMahasiswa = async (mahasiswaId, mahasiswaNama) => {
    if (!confirm(`Yakin ingin menghapus ${mahasiswaNama} dari bimbingan?`)) {
      return;
    }

    setActionLoading(true);
    try {
      await dosenAPI.removeMahasiswa(mahasiswaId);
      toast.success('Mahasiswa berhasil dihapus dari bimbingan');
      fetchData();
    } catch (err) {
      console.error('Error removing mahasiswa:', err);
      toast.error(err.response?.data?.detail || 'Failed to remove mahasiswa');
    } finally {
      setActionLoading(false);
    }
  };

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
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Kelola Mahasiswa Bimbingan</h1>
          <p className="text-muted-foreground mt-1">
            Tambah atau hapus mahasiswa dari bimbingan Anda
          </p>
        </div>
        
        <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Tambah Mahasiswa
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[600px] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Tambah Mahasiswa Bimbingan</DialogTitle>
              <DialogDescription>
                Pilih mahasiswa yang ingin ditambahkan ke bimbingan Anda
              </DialogDescription>
            </DialogHeader>
            
            {availableMahasiswa.length === 0 ? (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Semua mahasiswa sudah masuk dalam bimbingan
                </AlertDescription>
              </Alert>
            ) : (
              <div className="space-y-2">
                {availableMahasiswa.map((mhs) => (
                  <div 
                    key={mhs.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                  >
                    <div>
                      <p className="font-semibold">{mhs.user.nama}</p>
                      <p className="text-sm text-muted-foreground">
                        {mhs.nim} • {mhs.program_studi} • Angkatan {mhs.angkatan}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignMahasiswa(mhs.id)}
                      disabled={actionLoading}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      Tambah
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Bimbingan
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mahasiswaBimbingan.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Mahasiswa Tersedia
            </CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableMahasiswa.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Mahasiswa
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{allMahasiswa.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Mahasiswa Bimbingan Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mahasiswa Bimbingan Saat Ini</CardTitle>
          <CardDescription>
            Daftar mahasiswa yang berada di bawah bimbingan Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mahasiswaBimbingan.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Belum ada mahasiswa bimbingan. Klik tombol "Tambah Mahasiswa" untuk menambahkan.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NIM</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Program Studi</TableHead>
                  <TableHead>Angkatan</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mahasiswaBimbingan.map((mhs) => (
                  <TableRow key={mhs.id}>
                    <TableCell className="font-mono">{mhs.nim}</TableCell>
                    <TableCell className="font-medium">{mhs.nama}</TableCell>
                    <TableCell>{mhs.program_studi}</TableCell>
                    <TableCell>{mhs.angkatan}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMahasiswa(mhs.id, mhs.nama)}
                        disabled={actionLoading}
                      >
                        <UserMinus className="mr-2 h-4 w-4" />
                        Hapus
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
};

export default DosenMahasiswaManagement;
