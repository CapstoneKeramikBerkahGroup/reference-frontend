import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// --- 1. Import Komponen UI Modern (Shadcn) ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- 2. Import Icons & Context ---
import { BookOpen, AlertCircle, CheckCircle2, GraduationCap, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// --- 3. Specialization Options (Lab-lab di SI Telkom) ---
const SPECIALIZATIONS = [
  { value: 'EISD', label: 'EISD - Enterprise Information System Development' },
  { value: 'EDM', label: 'EDM - Enterprise Digital Management' },
  { value: 'EIM', label: 'EIM - Enterprise Information Management' },
  { value: 'ERP', label: 'ERP - Enterprise Resource Planning' },
  { value: 'SAG', label: 'SAG - System Analysis and Governance' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  
  // State Management (Sama seperti logika lama Anda)
  const [role, setRole] = useState('mahasiswa');
  const [formData, setFormData] = useState({
    // User data
    email: '',
    nama: '',
    password: '',
    confirmPassword: '',
    // Mahasiswa specific
    nim: '',
    program_studi: '',
    angkatan: new Date().getFullYear(),
    bidang_keahlian: '', // Added for mahasiswa too
    // Dosen specific
    nip: '',
    jabatan: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validasi dasar
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      // Persiapkan payload sesuai spesifikasi backend Anda
      const userData = {
        user: {
          email: formData.email,
          nama: formData.nama,
          password: formData.password,
          role: role,
        },
      };

      if (role === 'mahasiswa') {
        // Validate specialization is selected
        if (!formData.bidang_keahlian) {
          setError('Please select your specialization');
          setLoading(false);
          return;
        }
        
        userData.nim = formData.nim;
        userData.program_studi = formData.program_studi;
        userData.angkatan = parseInt(formData.angkatan);
        userData.bidang_keahlian = formData.bidang_keahlian;
      } else {
        // Validate specialization is selected for dosen
        if (!formData.bidang_keahlian) {
          setError('Please select your specialization');
          setLoading(false);
          return;
        }
        
        userData.nip = formData.nip;
        userData.jabatan = formData.jabatan;
        userData.bidang_keahlian = formData.bidang_keahlian;
      }

      // Panggil fungsi register dari AuthContext
      await register(userData, role);
      
      setSuccess('Registration successful! Redirecting to login...');
      
      // Redirect setelah 2 detik
      setTimeout(() => {
        navigate('/login', { state: { message: 'Registration successful! Please login.' } });
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      // Tampilkan pesan error dari backend jika ada
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-xl">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          {/* University Logos */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img 
              src="/images/logo fakultas rekayasa industri.webp" 
              alt="Fakultas Rekayasa Industri" 
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
            <img 
              src="/images/logo sistem informasi.png" 
              alt="Sistem Informasi" 
              className="h-20 w-auto object-contain drop-shadow-lg"
            />
          </div>
          
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Refero</h1>
          <p className="text-muted-foreground">Your AI Research Companion</p>
          <p className="text-sm text-muted-foreground mt-1">Telkom University - S1 Sistem Informasi</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif">Create Account</CardTitle>
            <CardDescription>Choose your role to get started</CardDescription>
          </CardHeader>
          
          <CardContent>
            {/* Alerts */}
            {success && (
              <Alert className="mb-6 border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection Tabs */}
            <Tabs value={role} onValueChange={setRole} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="mahasiswa" className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4" />
                  Student
                </TabsTrigger>
                <TabsTrigger value="dosen" className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Lecturer
                </TabsTrigger>
              </TabsList>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nama">Full Name</Label>
                    <Input
                      id="nama"
                      name="nama"
                      placeholder="John Doe"
                      value={formData.nama}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="john@university.ac.id"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Role Specific Fields */}
                <TabsContent value="mahasiswa" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="nim">Student ID (NIM)</Label>
                    <Input
                      id="nim"
                      name="nim"
                      placeholder="120222..."
                      value={formData.nim}
                      onChange={handleChange}
                      required={role === 'mahasiswa'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="program_studi">Study Program</Label>
                      <Input
                        id="program_studi"
                        name="program_studi"
                        placeholder="Information Systems"
                        value={formData.program_studi}
                        onChange={handleChange}
                        required={role === 'mahasiswa'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="angkatan">Year (Angkatan)</Label>
                      <Input
                        id="angkatan"
                        name="angkatan"
                        type="number"
                        placeholder="2024"
                        value={formData.angkatan}
                        onChange={handleChange}
                        required={role === 'mahasiswa'}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bidang_keahlian">
                      Specialization <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.bidang_keahlian}
                      onValueChange={(value) => setFormData({ ...formData, bidang_keahlian: value })}
                      required
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select your specialization" />
                      </SelectTrigger>
                      <SelectContent>
                        {SPECIALIZATIONS.map((spec) => (
                          <SelectItem key={spec.value} value={spec.value}>
                            {spec.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      You can only choose advisor with the same specialization
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="dosen" className="space-y-4 mt-0">
                  <div className="space-y-2">
                    <Label htmlFor="nip">Lecturer ID (NIP)</Label>
                    <Input
                      id="nip"
                      name="nip"
                      placeholder="1985..."
                      value={formData.nip}
                      onChange={handleChange}
                      required={role === 'dosen'}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="jabatan">Position</Label>
                      <Input
                        id="jabatan"
                        name="jabatan"
                        placeholder="Lecturer"
                        value={formData.jabatan}
                        onChange={handleChange}
                        required={role === 'dosen'}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="bidang_keahlian">
                        Specialization <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.bidang_keahlian}
                        onValueChange={(value) => setFormData({ ...formData, bidang_keahlian: value })}
                        required
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select your specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec.value} value={spec.value}>
                              {spec.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        You can only accept students with the same specialization
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Creating Account...
                    </div>
                  ) : (
                    'Register'
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-8">
          © 2025 Refero. Telkom University Capstone Project. Keramik Berkah Group.
        </p>
      </div>
    </div>
  );
};

export default Register;