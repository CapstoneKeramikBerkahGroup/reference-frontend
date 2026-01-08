import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Mail, Lock, Save, AlertCircle, CheckCircle2, Edit2, Shield, Trash2, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

// --- OPTIONS PEMINATAN ---
const SPECIALIZATIONS = [
  { value: 'EISD', label: 'EISD - Enterprise Information System Development' },
  { value: 'EDM', label: 'EDM - Enterprise Data Management' },
  { value: 'EIM', label: 'EIM - Enterprise Information Management' },
  { value: 'ERP', label: 'ERP - Enterprise Resource Planning' },
  { value: 'SAG', label: 'SAG - System Analysis and Governance' },
];

const Profile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // User data
  const [user, setUser] = useState(null);
  const [profileData, setProfileData] = useState(null);
  
  // Edit mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nama: '',
    email: '',
    bidang_keahlian: '' 
  });
  
  // Change password
  const [passwordDialog, setPasswordDialog] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Delete Account State
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(currentUser);
      
      const response = await api.get('/auth/me');
      setProfileData(response.data);
      
      // LOGIKA PENGAMBILAN DATA (Sudah Benar disini)
      const userSpecialization = 
        response.data.dosen?.bidang_keahlian || 
        response.data.mahasiswa?.bidang_keahlian || 
        response.data.bidang_keahlian || 
        '';

      setEditForm({
        nama: response.data.nama || '',
        email: response.data.email || '',
        bidang_keahlian: userSpecialization
      });
    } catch (err) {
      console.error('Failed to fetch user data:', err);
      setError('Failed to load profile data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // --- HELPER: Mengambil Label Peminatan ---
  const getSpecializationLabel = (code) => {
    if (!code) return '-';
    const spec = SPECIALIZATIONS.find(s => s.value === code);
    return spec ? spec.label : code; // Jika match return label, jika tidak return kode aslinya
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Reset form jika batal
      const userSpecialization = 
        profileData.dosen?.bidang_keahlian || 
        profileData.mahasiswa?.bidang_keahlian || 
        profileData.bidang_keahlian || 
        '';

      setEditForm({
        nama: profileData.nama || '',
        email: profileData.email || '',
        bidang_keahlian: userSpecialization
      });
    }
    setIsEditing(!isEditing);
    setError('');
    setSuccess('');
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      
      if (!editForm.nama.trim()) {
        setError('Name is required');
        return;
      }
      if (!editForm.email.trim()) {
        setError('Email is required');
        return;
      }
      
      const updateData = {
        nama: editForm.nama.trim(),
        email: editForm.email.trim()
      };
      
      // Update bidang keahlian untuk Dosen DAN Mahasiswa
      if (editForm.bidang_keahlian) {
        updateData.bidang_keahlian = editForm.bidang_keahlian;
      }
      
      const response = await api.put('/auth/profile', updateData);
      
      setProfileData(response.data);
      
      // Update local storage
      const userSpecialization = 
        response.data.dosen?.bidang_keahlian || 
        response.data.mahasiswa?.bidang_keahlian || 
        response.data.bidang_keahlian;

      const updatedUser = { 
        ...user, 
        nama: response.data.nama, 
        email: response.data.email,
        bidang_keahlian: userSpecialization
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      setIsEditing(false);
      setSuccess('Profile updated successfully!');
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile. Please try again.');
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    // ... (Kode sama seperti sebelumnya)
    try {
        setSaving(true);
        setError('');
        
        if (!passwordForm.currentPassword) {
          setError('Current password is required');
          return;
        }
        if (!passwordForm.newPassword) {
          setError('New password is required');
          return;
        }
        if (passwordForm.newPassword.length < 6) {
          setError('New password must be at least 6 characters');
          return;
        }
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
          setError('Passwords do not match');
          return;
        }
        
        await api.put('/auth/change-password', {
          current_password: passwordForm.currentPassword,
          new_password: passwordForm.newPassword
        });
        
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setPasswordDialog(false);
        toast.success('Password changed successfully!');
      } catch (err) {
        console.error('Failed to change password:', err);
        setError(err.response?.data?.detail || 'Failed to change password. Please check your current password.');
        toast.error('Failed to change password');
      } finally {
        setSaving(false);
      }
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleting(true);
      await api.delete('/auth/delete-account'); 
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.success('Akun berhasil dihapus');
      navigate('/login');
    } catch (err) {
      console.error('Gagal menghapus akun:', err);
      toast.error(err.response?.data?.detail || 'Gagal menghapus akun. Silakan coba lagi.');
      setDeleteDialog(false);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading profile...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper untuk mengambil value peminatan saat ini (untuk display)
  const currentSpecializationCode = 
    profileData?.dosen?.bidang_keahlian || 
    profileData?.mahasiswa?.bidang_keahlian || 
    profileData?.bidang_keahlian;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-lg flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Profil Saya</h1>
              <p className="text-gray-600">Kelola pengaturan akun Anda</p>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        {/* Profile Information Card */}
        <Card className="mb-6 border-cyan-200">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">Informasi Profil</CardTitle>
                <CardDescription>Detail akun pribadi Anda</CardDescription>
              </div>
              <Button
                variant={isEditing ? 'outline' : 'default'}
                size="sm"
                onClick={handleEditToggle}
                className={isEditing ? 'border-gray-300' : 'bg-cyan-600 hover:bg-cyan-700'}
              >
                {isEditing ? (
                  <>Batal</>
                ) : (
                  <>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profil
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-6">
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="nama" className="text-sm font-medium text-gray-700">
                  Nama Lengkap
                </Label>
                {isEditing ? (
                  <Input
                    id="nama"
                    value={editForm.nama}
                    onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                    className="border-cyan-200 focus:border-cyan-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{profileData?.nama || '-'}</span>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  Alamat Email
                </Label>
                {isEditing ? (
                  <Input
                    id="email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="border-cyan-200 focus:border-cyan-500"
                  />
                ) : (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <Mail className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900">{profileData?.email || '-'}</span>
                  </div>
                )}
              </div>

              {/* Field Bidang Keahlian / Peminatan */}
              {/* Ini akan muncul untuk Dosen MAUPUN Mahasiswa */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Bidang Keahlian / Peminatan</Label>
                {isEditing ? (
                  <Select 
                    value={editForm.bidang_keahlian} 
                    onValueChange={(value) => setEditForm({ ...editForm, bidang_keahlian: value })}
                  >
                    <SelectTrigger className="border-cyan-200 focus:border-cyan-500">
                      <SelectValue placeholder="Pilih peminatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((spec) => (
                        <SelectItem key={spec.value} value={spec.value}>
                          {spec.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-gray-900 font-medium">
                        {/* MENGGUNAKAN HELPER AGAR TAMPIL NAMA LENGKAP PEMINATAN */}
                        {getSpecializationLabel(currentSpecializationCode)}
                    </span>
                  </div>
                )}
              </div>

              <Separator />

              {/* Role Badge */}
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Peran Akun</Label>
                <div className="flex items-center gap-2">
                  <Badge className="bg-cyan-100 text-cyan-700 hover:bg-cyan-100 px-3 py-1">
                    <Shield className="w-3 h-3 mr-1" />
                    {user?.role?.toUpperCase() || 'USER'}
                  </Badge>
                </div>
              </div>

              {/* Additional Info based on role */}
              {profileData?.mahasiswa && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">NIM</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-900">{profileData.mahasiswa.nim || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Program Studi</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-900">{profileData.mahasiswa.program_studi || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Angkatan</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-900">{profileData.mahasiswa.angkatan || '-'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {profileData?.dosen && (
                <>
                  <Separator />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">NIP</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-900">{profileData.dosen.nip || '-'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-gray-700">Jabatan</Label>
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <span className="text-gray-900">{profileData.dosen.jabatan || '-'}</span>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Save Button */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security Card & Danger Zone (Sama seperti sebelumnya) */}
        <Card className="border-cyan-200 mb-6">
          <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50">
            <CardTitle className="text-xl">Pengaturan Keamanan</CardTitle>
            <CardDescription>Kelola kata sandi dan keamanan akun Anda</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-cyan-100 rounded-lg flex items-center justify-center">
                    <Lock className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Kata Sandi</h3>
                    <p className="text-sm text-gray-600">Terakhir diubah: Tidak tersedia</p>
                  </div>
                </div>
                
                <Dialog open={passwordDialog} onOpenChange={setPasswordDialog}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-cyan-300 text-cyan-700 hover:bg-cyan-50">
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Ubah Kata Sandi</DialogTitle>
                      <DialogDescription>
                        Masukkan kata sandi saat ini dan pilih kata sandi baru
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="currentPassword">Kata Sandi Saat Ini</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                          className="border-cyan-200"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="newPassword">Kata Sandi Baru</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                          className="border-cyan-200"
                        />
                        <p className="text-xs text-gray-500">Minimal 6 karakter</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi Baru</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                          className="border-cyan-200"
                        />
                      </div>
                    </div>
                    
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setPasswordDialog(false);
                          setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                          setError('');
                        }}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleChangePassword}
                        disabled={saving}
                        className="bg-cyan-600 hover:bg-cyan-700"
                      >
                        {saving ? 'Changing...' : 'Change Password'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- DANGER ZONE (HAPUS AKUN) --- */}
        <Card className="border-red-200 overflow-hidden">
          <CardHeader className="bg-red-50">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <CardTitle className="text-xl text-red-800">Danger Zone</CardTitle>
            </div>
            <CardDescription className="text-red-600">
              Tindakan di sini bersifat permanen dan tidak dapat dibatalkan.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-900">Hapus Akun</h3>
                <p className="text-sm text-gray-600">
                  Menghapus akun Anda secara permanen beserta semua data yang terkait.
                </p>
              </div>
              
              <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
                <DialogTrigger asChild>
                  <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Akun
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-red-600">
                      <AlertTriangle className="w-5 h-5" />
                      Konfirmasi Hapus Akun
                    </DialogTitle>
                    <DialogDescription>
                      Apakah Anda yakin ingin menghapus akun ini secara permanen? 
                      Tindakan ini <strong>tidak dapat dibatalkan</strong> dan semua data Anda akan hilang.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deleting}>
                      Batal
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount} 
                      disabled={deleting}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {deleting ? 'Menghapus...' : 'Ya, Hapus Akun Saya'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default Profile;