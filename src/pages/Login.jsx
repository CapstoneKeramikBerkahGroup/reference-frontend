import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';

// --- 1. Import Komponen UI Modern (Shadcn) ---
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// --- 2. Import Icons & Context ---
import { BookOpen, AlertCircle, CheckCircle2, GraduationCap, UserCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CaptchaInput from '@/components/CaptchaInput';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loginWithCaptcha } = useAuth();
  const { t } = useLanguage();

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
      setError('Please enter the CAPTCHA code');
      return;
    }
    
    if (!captchaSessionId) {
      setError('CAPTCHA session expired. Please refresh.');
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
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
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
          <p className="text-muted-foreground">{t('auth.aiResearchCompanion')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('auth.telkomUniversity')}</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif">{t('auth.welcomeBack')}</CardTitle>
            <CardDescription>{t('auth.chooseRole')}</CardDescription>
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
              <TabsList className="grid w-full grid-cols-2 mb-6 h-12">
                <TabsTrigger value="mahasiswa" className="flex items-center gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white">
                  <GraduationCap className="w-4 h-4" />
                  <span className="font-medium">{t('auth.student')}</span>
                </TabsTrigger>
                <TabsTrigger value="dosen" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">{t('auth.lecturer')}</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Text */}
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {role === 'mahasiswa' ? (
                    <>👨‍🎓 {t('auth.loggingInAs')} <span className="font-semibold text-blue-600">{t('auth.student')}</span></>
                  ) : (
                    <>👨‍🏫 {t('auth.loggingInAs')} <span className="font-semibold text-green-600">{t('auth.lecturer')}</span></>
                  )}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="mahasiswa" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">{t('auth.studentEmail')}</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={`student${t('auth.emailPlaceholder')}`}
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoFocus={role === 'mahasiswa'}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">{t('auth.password')}</Label>
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
                      className="h-11"
                    />
                  </div>
                </TabsContent>

                <TabsContent value="dosen" className="mt-0 space-y-4">
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
                      <Label htmlFor="password-dosen">Password</Label>
                      <Link 
                        to="/forgot-password" 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                      >
                        Forgot password?
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
                <div className="pt-2">
                  <CaptchaInput onCaptchaChange={handleCaptchaChange} />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium mt-6"
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
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {t('auth.dontHaveAccount')}{' '}
                <Link to="/register" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                  {t('auth.signUp')}
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

export default Login;