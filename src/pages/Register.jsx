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
import { BookOpen, AlertCircle, CheckCircle2, GraduationCap, UserCheck, Languages } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import CampusSlideshow from '@/components/CampusSlideshow';

// --- 3. Specialization Options (Lab-lab di SI Telkom) ---
const SPECIALIZATIONS = [
  { value: 'EISD', label: 'EISD - Enterprise Information System Development' },
  { value: 'EDM', label: 'EDM - Enterprise Data Management' },
  { value: 'EIM', label: 'EIM - Enterprise Information Management' },
  { value: 'ERP', label: 'ERP - Enterprise Resource Planning' },
  { value: 'SAG', label: 'SAG - System Analysis and Governance' },
];

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t, i18n } = useTranslation();
  
  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };
  
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
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (formData.password.length < 6) {
      setError(t('auth.passwordTooShort'));
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
          setError(t('auth.selectSpecialization'));
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
          setError(t('auth.selectSpecialization'));
          setLoading(false);
          return;
        }
        
        userData.nip = formData.nip;
        userData.jabatan = formData.jabatan;
        userData.bidang_keahlian = formData.bidang_keahlian;
      }

      // Panggil fungsi register dari AuthContext
      await register(userData, role);
      
      setSuccess(t('auth.registrationSuccess'));
      
      // Redirect setelah 2 detik
      setTimeout(() => {
        navigate('/login', { state: { message: t('auth.registrationSuccess') } });
      }, 2000);
      
    } catch (err) {
      console.error('Registration error:', err);
      // Tampilkan pesan error dari backend jika ada
      setError(err.response?.data?.detail || t('auth.registrationFailed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-center h-full max-h-[95vh]">
        {/* Slideshow - Hidden on mobile */}
        <div className="hidden lg:flex h-full items-center justify-center">
          <div className="w-full h-[85vh] max-h-[700px]">
            <CampusSlideshow />
          </div>
        </div>

        {/* Register Form */}
        <div className="w-full max-w-xl mx-auto h-full flex flex-col justify-center overflow-y-auto py-4">
        {/* Logo & Header */}
        <div className="text-center mb-1.5">
          {/* University Logos */}
          <div className="flex items-center justify-center gap-2 mb-1">
            <img 
              src="/images/logo fakultas rekayasa industri.webp" 
              alt="Fakultas Rekayasa Industri" 
              className="h-14 w-auto object-contain drop-shadow-lg"
            />
            <img 
              src="/images/logo sistem informasi.png" 
              alt="Sistem Informasi" 
              className="h-14 w-auto object-contain drop-shadow-lg"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-0">
            <h1 className="text-lg font-serif font-bold text-foreground">Refero</h1>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="text-gray-700 hover:text-cyan-600 h-7 px-2"
              title={i18n.language === 'en' ? 'Switch to Indonesian' : 'Ganti ke Bahasa Inggris'}
            >
              <Languages className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs font-semibold">
                {i18n.language === 'en' ? 'EN' : 'ID'}
              </span>
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground">{t('auth.telkomUniversity')}</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-0.5 text-center pb-1.5 pt-2">
            <CardTitle className="text-lg font-serif">{t('auth.createAccount')}</CardTitle>
            <CardDescription className="text-xs">{t('auth.chooseRoleRegister')}</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Alerts */}
            {success && (
              <Alert className="mb-2 border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection Tabs */}
            <Tabs value={role} onValueChange={setRole} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-1.5 h-9 p-0.5 bg-gray-100/80 backdrop-blur-sm">
                <TabsTrigger 
                  value="mahasiswa" 
                  className="flex items-center justify-center gap-1.5 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 hover:bg-gray-200/50"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-semibold text-sm">{t('auth.student')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dosen" 
                  className="flex items-center justify-center gap-1.5 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 hover:bg-gray-200/50"
                >
                  <UserCheck className="w-4 h-4" />
                  <span className="font-semibold text-sm">{t('auth.lecturer')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Badge with enhanced styling */}
              <div className="mb-1.5 text-center">
                <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full transition-all duration-300"
                     style={{
                       background: role === 'mahasiswa' 
                         ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)'
                         : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.15) 100%)',
                       border: role === 'mahasiswa' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
                     }}>
                  {role === 'mahasiswa' ? (
                    <>
                      <span className="text-lg">👨‍🎓</span>
                      <span className="text-xs">
                        Registering as <span className="font-bold text-blue-600">{t('auth.student')}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-lg">👨‍🏫</span>
                      <span className="text-xs">
                        Registering as <span className="font-bold text-green-600">{t('auth.lecturer')}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-1.5">
                {/* Common Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                  <div className="space-y-0.5">
                    <Label htmlFor="nama" className="text-sm">{t('auth.fullName')}</Label>
                    <Input
                      id="nama"
                      name="nama"
                      placeholder={t('auth.fullNamePlaceholder')}
                      value={formData.nama}
                      onChange={handleChange}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="email" className="text-sm">{t('auth.emailAddress')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t('auth.emailAddressPlaceholder')}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                {/* Role Specific Fields */}
                <TabsContent value="mahasiswa" className="space-y-1.5 mt-0">
                  <div className="space-y-0.5">
                    <Label htmlFor="nim" className="text-sm">{t('auth.studentId')}</Label>
                    <Input
                      id="nim"
                      name="nim"
                      placeholder={t('auth.studentIdPlaceholder')}
                      value={formData.nim}
                      onChange={handleChange}
                      required={role === 'mahasiswa'}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="program_studi" className="text-sm">{t('auth.studyProgram')}</Label>
                      <Input
                        id="program_studi"
                        name="program_studi"
                        placeholder={t('auth.studyProgramPlaceholder')}
                        value={formData.program_studi}
                        onChange={handleChange}
                        required={role === 'mahasiswa'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="angkatan" className="text-sm">{t('auth.year')}</Label>
                      <Input
                        id="angkatan"
                        name="angkatan"
                        type="number"
                        placeholder={t('auth.yearPlaceholder')}
                        value={formData.angkatan}
                        onChange={handleChange}
                        required={role === 'mahasiswa'}
                        className="h-8 text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="bidang_keahlian" className="text-sm">
                      {t('auth.specialization')} <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={formData.bidang_keahlian}
                      onValueChange={(value) => setFormData({ ...formData, bidang_keahlian: value })}
                      required
                    >
                      <SelectTrigger className="w-full h-8 text-sm">
                        <SelectValue placeholder={t('auth.specializationPlaceholder')} />
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
                      {t('auth.specializationNote')}
                    </p>
                  </div>
                </TabsContent>

                <TabsContent value="dosen" className="space-y-1.5 mt-0">
                  <div className="space-y-0.5">
                    <Label htmlFor="nip" className="text-sm">{t('auth.lecturerId')}</Label>
                    <Input
                      id="nip"
                      name="nip"
                      placeholder={t('auth.lecturerIdPlaceholder')}
                      value={formData.nip}
                      onChange={handleChange}
                      required={role === 'dosen'}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="space-y-0.5">
                      <Label htmlFor="jabatan" className="text-sm">{t('auth.position')}</Label>
                      <Input
                        id="jabatan"
                        name="jabatan"
                        placeholder={t('auth.positionPlaceholder')}
                        value={formData.jabatan}
                        onChange={handleChange}
                        required={role === 'dosen'}
                        className="h-8 text-sm"
                      />
                    </div>
                    <div className="space-y-0.5">
                      <Label htmlFor="bidang_keahlian" className="text-sm">
                        {t('auth.specialization')} <span className="text-red-500">*</span>
                      </Label>
                      <Select
                        value={formData.bidang_keahlian}
                        onValueChange={(value) => setFormData({ ...formData, bidang_keahlian: value })}
                        required
                      >
                        <SelectTrigger className="w-full h-8 text-sm">
                          <SelectValue placeholder={t('auth.specializationPlaceholder')} />
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
                        {t('auth.specializationNoteLecturer')}
                      </p>
                    </div>
                  </div>
                </TabsContent>

                {/* Password Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5 pt-0">
                  <div className="space-y-0.5">
                    <Label htmlFor="password" className="text-sm">{t('auth.password')}</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor="confirmPassword" className="text-sm">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      className="h-8 text-sm"
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-8 text-sm font-medium mt-1.5"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {t('auth.creatingAccount')}
                    </div>
                  ) : (
                    t('auth.registerButton')
                  )}
                </Button>
              </form>
            </Tabs>

            <div className="mt-1.5 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.alreadyHaveAccount')}{' '}
                <Link to="/login" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                  {t('auth.signInHere')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-1.5">
          © 2025 Refero. Telkom University Capstone Project. Keramik Berkah Group.
        </p>
        </div>
      </div>
    </div>
  );
};

export default Register;