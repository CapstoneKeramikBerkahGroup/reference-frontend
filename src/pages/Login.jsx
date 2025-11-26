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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  // --- 3. State Management ---
  const [role, setRole] = useState('mahasiswa'); // Default to mahasiswa
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(''); // Clear previous success messages
    setLoading(true);

    try {
      console.log(`🔐 Attempting login as ${role} with:`, formData.email);
      const userData = await login(formData);
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
      // Ambil pesan error dari backend jika ada
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg shadow-primary/20">
            <BookOpen className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Refero</h1>
          <p className="text-muted-foreground">Your AI Research Companion</p>
        </div>

        <Card className="border-border/50 shadow-xl bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-serif">Welcome Back</CardTitle>
            <CardDescription>Choose your role and sign in</CardDescription>
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
                  <span className="font-medium">Student</span>
                </TabsTrigger>
                <TabsTrigger value="dosen" className="flex items-center gap-2 data-[state=active]:bg-green-600 data-[state=active]:text-white">
                  <UserCheck className="w-4 h-4" />
                  <span className="font-medium">Lecturer</span>
                </TabsTrigger>
              </TabsList>

              {/* Info Text */}
              <div className="mb-4 text-center">
                <p className="text-sm text-muted-foreground">
                  {role === 'mahasiswa' ? (
                    <>👨‍🎓 Logging in as <span className="font-semibold text-blue-600">Student</span></>
                  ) : (
                    <>👨‍🏫 Logging in as <span className="font-semibold text-green-600">Lecturer</span></>
                  )}
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <TabsContent value="mahasiswa" className="mt-0 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Student Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="student@university.ac.id"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      autoFocus={role === 'mahasiswa'}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Password</Label>
                      <Link 
                        to="#" 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.preventDefault()}
                      >
                        Forgot password?
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
                    <Label htmlFor="email-dosen">Lecturer Email</Label>
                    <Input
                      id="email-dosen"
                      name="email"
                      type="email"
                      placeholder="lecturer@university.ac.id"
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
                        to="#" 
                        className="text-xs text-muted-foreground hover:text-primary transition-colors"
                        onClick={(e) => e.preventDefault()}
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

                <Button 
                  type="submit" 
                  className="w-full h-11 text-base font-medium mt-6"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      Signing in as {role === 'dosen' ? 'Lecturer' : 'Student'}...
                    </div>
                  ) : (
                    `Sign In as ${role === 'dosen' ? 'Lecturer' : 'Student'}`
                  )}
                </Button>
              </form>
            </Tabs>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary hover:text-primary/80 font-semibold hover:underline">
                  Register here
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