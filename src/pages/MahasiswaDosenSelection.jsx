import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { dosenAPI, mahasiswaAPI } from '@/services/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from '@/components/ui/dialog';
import { UserCheck, GraduationCap, Briefcase, BookOpen, Check, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

/**
 * MahasiswaDosenSelection Component
 * Allows mahasiswa to choose their dosen pembimbing
 */
const MahasiswaDosenSelection = () => {
  const { user } = useAuth();
  const [availableDosen, setAvailableDosen] = useState([]);
  const [currentDosen, setCurrentDosen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [selectedDosen, setSelectedDosen] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchDosen();
    fetchRequests();
  }, []);

  const fetchDosen = async () => {
    setLoading(true);
    try {
      const response = await dosenAPI.getAvailableDosen();
      setAvailableDosen(response.data);
      
      // Check if user has mahasiswa profile with dosen_pembimbing
      if (user?.mahasiswa_profile?.dosen_pembimbing) {
        setCurrentDosen(user.mahasiswa_profile.dosen_pembimbing);
      }
    } catch (err) {
      console.error('Error fetching dosen:', err);
      toast.error('Failed to load dosen list');
    } finally {
      setLoading(false);
    }
  };

  const handleChooseDosen = async (dosenId) => {
    if (!selectedDosen) return;

    setActionLoading(true);
    try {
      const response = await mahasiswaAPI.chooseDosen(dosenId);
      toast.success(response.data.message || 'Dosen pembimbing berhasil dipilih');
      setSelectDialogOpen(false);
      
      // Refresh user data or dosen list
      window.location.reload(); // Simple approach
    } catch (err) {
      console.error('Error choosing dosen:', err);
      toast.error(err.response?.data?.detail || 'Failed to choose dosen pembimbing');
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
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Pilih Dosen Pembimbing</h1>
        <p className="text-muted-foreground mt-1">
          Pilih dosen pembimbing untuk membimbing penelitian Anda
        </p>
      </div>

      {/* Current Dosen Status */}
      {currentDosen ? (
        <Alert className="border-green-200 bg-green-50">
          <Check className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-green-900">Dosen Pembimbing Anda:</p>
                <p className="text-green-800 mt-1">
                  {currentDosen.user.nama} • {currentDosen.nip}
                </p>
                {currentDosen.bidang_keahlian && (
                  <p className="text-sm text-green-700 mt-1">
                    Bidang Keahlian: {currentDosen.bidang_keahlian}
                  </p>
                )}
              </div>
              <Button
                variant="outline"
                onClick={() => setSelectDialogOpen(true)}
              >
                Ganti Dosen
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Anda belum memilih dosen pembimbing. Silakan pilih dari daftar di bawah.
          </AlertDescription>
        </Alert>
      )}

      {/* Dosen List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {availableDosen.map((dosen) => (
          <Card 
            key={dosen.id}
            className={`hover:shadow-lg transition-shadow ${
              currentDosen?.id === dosen.id ? 'border-primary ring-2 ring-primary/20' : ''
            }`}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <GraduationCap className="h-6 w-6 text-primary" />
                  </div>
                  {currentDosen?.id === dosen.id && (
                    <Badge variant="default" className="ml-2">
                      <Check className="h-3 w-3 mr-1" />
                      Current
                    </Badge>
                  )}
                </div>
              </div>
              <CardTitle className="mt-4">{dosen.nama}</CardTitle>
              <CardDescription>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center text-sm">
                    <Briefcase className="h-3 w-3 mr-2" />
                    NIP: {dosen.nip}
                  </div>
                  {dosen.jabatan && (
                    <div className="flex items-center text-sm">
                      <UserCheck className="h-3 w-3 mr-2" />
                      {dosen.jabatan}
                    </div>
                  )}
                  {dosen.bidang_keahlian && (
                    <div className="flex items-center text-sm">
                      <BookOpen className="h-3 w-3 mr-2" />
                      {dosen.bidang_keahlian}
                    </div>
                  )}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  {dosen.jumlah_bimbingan} mahasiswa bimbingan
                </div>
                <Dialog open={selectDialogOpen && selectedDosen?.id === dosen.id} onOpenChange={setSelectDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant={currentDosen?.id === dosen.id ? 'outline' : 'default'}
                      onClick={() => setSelectedDosen(dosen)}
                      disabled={currentDosen?.id === dosen.id}
                    >
                      {currentDosen?.id === dosen.id ? 'Terpilih' : 'Pilih'}
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Konfirmasi Pilihan Dosen</DialogTitle>
                      <DialogDescription>
                        Apakah Anda yakin ingin memilih dosen ini sebagai pembimbing Anda?
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedDosen && (
                      <div className="py-4">
                        <div className="flex items-center gap-4 p-4 bg-accent/50 rounded-lg">
                          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <GraduationCap className="h-8 w-8 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-lg">{selectedDosen.nama}</p>
                            <p className="text-sm text-muted-foreground">NIP: {selectedDosen.nip}</p>
                            {selectedDosen.bidang_keahlian && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {selectedDosen.bidang_keahlian}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setSelectDialogOpen(false)}
                        disabled={actionLoading}
                      >
                        Batal
                      </Button>
                      <Button
                        onClick={() => handleChooseDosen(selectedDosen.id)}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Memproses...' : 'Ya, Pilih Dosen'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {availableDosen.length === 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Belum ada dosen yang tersedia saat ini.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default MahasiswaDosenSelection;
