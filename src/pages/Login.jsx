import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// --- 1. Import Komponen UI Modern (Shadcn) ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// --- 2. Import Icons & Context ---
import { BookOpen, AlertCircle, CheckCircle2, GraduationCap, UserCheck, Languages } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CaptchaInput from '@/components/CaptchaInput';
import CampusSlideshow from '@/components/CampusSlideshow';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCaptcha } = useAuth();
  const { t, i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  // --- 3. State Management ---
  const [role, setRole] = useState('mahasiswa'); // Default to mahasiswa
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // CAPTCHA state
  const [captchaText, setCaptchaText] = useState('');
  const [captchaSessionId, setCaptchaSessionId] = useState('');

  useEffect(() => {
    // Cek pesan sukses dari halaman registrasi
    if (location.state?.message) {
      setSuccess(location.state.message);
      // Clear the state to prevent message showing again
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear success message when user starts typing
    if (success) setSuccess('');
    if (error) setError('');
  };

  const handleCaptchaChange = (text, sessionId) => {
    setCaptchaText(text);
    setCaptchaSessionId(sessionId);
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // Clear previous success messages
    
    // Validate CAPTCHA
    if (!captchaText || captchaText.length !== 6) {
      setError(t('auth.enterCaptcha'));
      return;
    }
    
    if (!captchaSessionId) {
      setError(t('auth.captchaExpired'));
      return;
    }
    
    setLoading(true);

    try {
      console.log(`🔐 Attempting login as ${role} with CAPTCHA:`, formData.email);
      const userData = await loginWithCaptcha({
        email: formData.email,
        password: formData.password,
        captcha_text: captchaText,
        session_id: captchaSessionId
      });
      console.log('✅ Login successful! User data:', userData);
      
      // Validate role matches selection
      if (userData.role !== role) {
        setError(`This account is registered as ${userData.role}, not ${role}. Please select the correct role tab.`);
        setLoading(false);
        return;
      }
      
      // Redirect based on role
      if (userData.role === 'dosen') {
        console.log('👨‍🏫 Redirecting to dosen dashboard...');
        navigate('/dosen/dashboard', { replace: true });
      } else {
        console.log('👨‍🎓 Redirecting to mahasiswa dashboard...');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      console.error('❌ Login error:', err);
      
      // Handle specific error cases
      if (err.response?.status === 429) {
        setError(t('auth.tooManyAttempts'));
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError(t('auth.loginFailed'));
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-blue-50 flex items-center justify-center p-4 overflow-hidden">
      <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-6 items-center h-full max-h-[95vh]">
        {/* Slideshow - Hidden on mobile */}
        <div className="hidden lg:flex h-full items-center justify-center">
          <div className="w-full h-[85vh] max-h-[650px]">
            <CampusSlideshow />
          </div>
        </div>

        {/* Login Form */}
        <div className="w-full max-w-md mx-auto h-full flex flex-col justify-center">
        {/* Logo & Header */}
        <div className="text-center mb-3">
          {/* University Logos */}
          <div className="flex items-center justify-center gap-3 mb-2">
            <img 
              src="/images/logo fakultas rekayasa industri.webp" 
              alt="Fakultas Rekayasa Industri" 
              className="h-10 w-auto object-contain drop-shadow-lg"
            />
            <img 
              src="/images/logo sistem informasi.png" 
              alt="Sistem Informasi" 
              className="h-10 w-auto object-contain drop-shadow-lg"
            />
          </div>
          
          <div className="flex items-center justify-center gap-2 mb-1">
            <h1 className="text-2xl font-serif font-bold text-foreground">Refero</h1>
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
          <p className="text-[10px] text-muted-foreground">{t('auth.aiResearchCompanion')}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{t('auth.telkomUniversity')}</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 text-center pb-3 pt-4">
            <CardTitle className="text-lg font-serif">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription className="text-xs">{t('auth.chooseRole')}</CardDescription>
          </CardHeader>
          
          <CardContent className="pt-0">
            {/* Alerts */}
            {success && (
              <Alert className="mb-3 border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-sm">{success}</AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            {/* Role Selection Tabs */}
            <Tabs value={role} onValueChange={setRole} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-3 h-11 p-1 bg-gray-100/80 backdrop-blur-sm">
                <TabsTrigger 
                  value="mahasiswa" 
                  className="flex items-center justify-center gap-2 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-500/50 hover:bg-gray-200/50"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span className="font-semibold">{t('auth.student')}</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="dosen" 
                  className="flex items-center justify-center gap-2 rounded-md transition-all duration-300 data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-green-500/50 hover:bg-gray-200/50"
                >
                  <UserCheck className="w-5 h-5" />
                  <span className="font-semibold">{t('auth.lecturer')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Text with enhanced styling */}
              <div className="mb-3 text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300"
                     style={{
                       background: role === 'mahasiswa' 
                         ? 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.15) 100%)'
                         : 'linear-gradient(135deg, rgba(34, 197, 94, 0.1) 0%, rgba(22, 163, 74, 0.15) 100%)',
                       border: role === 'mahasiswa' ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(34, 197, 94, 0.3)'
                     }}>
                  {role === 'mahasiswa' ? (
                    <>
                      <span className="text-2xl">👨‍🎓</span>
                      <span className="text-sm">
                        {t('auth.loggingInAs')} <span className="font-bold text-blue-600">{t('auth.student')}</span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">👨‍🏫</span>
                      <span className="text-sm">
                        {t('auth.loggingInAs')} <span className="font-bold text-green-600">{t('auth.lecturer')}</span>
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-2.5">
                <TabsContent value="mahasiswa" className="mt-0 space-y-2.5">
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">{t('auth.studentEmail')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={`student${t('auth.emailPlaceholder')}`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoFocus={role === 'mahasiswa'}
                      className="h-9"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password" className="text-sm">{t('auth.password')}</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t('auth.forgotPassword')}
                      </Link>
                    </div>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-9"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dosen" className="mt-0 space-y-2.5">
                  <div className="space-y-2">
                    <Label htmlFor="email-dosen">{t('auth.lecturerEmail')}</Label>
                    <Input
                      id="email-dosen"
                      name="email"
                      type="email"
                      placeholder={`lecturer${t('auth.emailPlaceholder')}`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoFocus={role === 'dosen'}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-dosen">{t('auth.password')}</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        {t('auth.forgotPassword')}
                      </Link>
                    </div>
                    <Input
                      id="password-dosen"
                      name="password"
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="h-11"
                    />
                  </div>
                </TabsContent>

                {/* CAPTCHA Component - Shared for both roles */}
                <div className="pt-1">
                  <CaptchaInput onCaptchaChange={handleCaptchaChange} />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-9 text-sm font-medium mt-2.5"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      {t('auth.loggingInAs')} {role === 'dosen' ? t('auth.lecturer') : t('auth.student')}...
                    </div>
                  ) : (
                    `${t('auth.signIn')}`
                  )}
                </Button>
              </form>
            </Tabs>

            {/* Register Link */}
            <div className="mt-3 text-center">
              <p className="text-xs text-muted-foreground">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                  {t('auth.signUp')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground/60 mt-3">
          © 2025 Refero. Telkom University Capstone Project. Keramik Berkah Group.
        </p>
        </div>
      </div>
    </div>
  );
};

export default Login;