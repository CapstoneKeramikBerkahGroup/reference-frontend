import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Lock, ArrowLeft, CheckCircle2, AlertCircle, 
  Eye, EyeOff, ShieldCheck, AlertTriangle 
} from 'lucide-react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

const ResetPassword = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [codeError, setCodeError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [remainingAttempts, setRemainingAttempts] = useState(5);
  const [codeVerified, setCodeVerified] = useState(false);

  // Get email from navigation state
  useEffect(() => {
    if (location.state?.email) {
      setEmail(location.state.email);
    }
  }, [location.state]);

  // Verify code in real-time (debounced)
  useEffect(() => {
    if (code.length === 6 && email) {
      verifyCodeRealtime();
    }
  }, [code]);

  const verifyCodeRealtime = async () => {
    if (codeVerified) return; // Already verified
    
    setVerifying(true);
    setCodeError('');
    
    try {
      await authAPI.verifyCode(email, code);
      setCodeVerified(true);
      setCodeError('');
      toast.success('Code verified!');
    } catch (err) {
      setCodeVerified(false);
      
      if (err.response?.status === 400) {
        const detail = err.response?.data?.detail || '';
        
        // Extract remaining attempts from error message
        const match = detail.match(/(\d+) attempts remaining/);
        if (match) {
          setRemainingAttempts(parseInt(match[1]));
        }
        
        setCodeError(detail);
      }
    } finally {
      setVerifying(false);
    }
  };

  const validatePassword = (password) => {
    if (password.length < 6) {
      return 'Password must be at least 6 characters';
    }
    return '';
  };

  const handlePasswordChange = (value) => {
    setNewPassword(value);
    const error = validatePassword(value);
    setPasswordError(error);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setPasswordError('');
    
    // Validate password
    const passwordValidation = validatePassword(newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }
    
    // Check password match
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    
    // Check code length
    if (code.length !== 6) {
      setCodeError('Verification code must be 6 digits');
      return;
    }
    
    setLoading(true);

    try {
      await authAPI.resetPassword({
        email,
        code,
        new_password: newPassword
      });
      
      setSuccess(true);
      toast.success('Password reset successfully!');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login', { 
          state: { 
            message: 'Password reset successfully! You can now login with your new password.' 
          }
        });
      }, 3000);
      
    } catch (err) {
      console.error('Reset password error:', err);
      
      if (err.response?.status === 400) {
        const detail = err.response?.data?.detail || '';
        
        if (detail.includes('attempts remaining')) {
          setCodeError(detail);
        } else if (detail.includes('expired')) {
          setError('Verification code expired. Please request a new one.');
        } else {
          setError(detail);
        }
      } else {
        setError('Failed to reset password. Please try again.');
      }
      
      setLoading(false);
    }
  };

  // If no email, redirect to forgot password
  useEffect(() => {
    if (!email && !location.state?.email) {
      toast.error('Please enter your email first');
      navigate('/forgot-password');
    }
  }, [email, location.state, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Reset Password</h1>
          <p className="text-muted-foreground">
            Enter the verification code and your new password
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Set New Password</CardTitle>
            <CardDescription>
              {email ? `Reset password for ${email}` : 'Enter your email and verification code'}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* General Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Input (if not from navigation) */}
                {!location.state?.email && (
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@university.ac.id"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={loading}
                      className="h-11"
                    />
                  </div>
                )}

                {/* Verification Code Input */}
                <div className="space-y-2">
                  <Label htmlFor="code">
                    Verification Code
                    {remainingAttempts < 5 && (
                      <span className="text-destructive text-xs ml-2">
                        ({remainingAttempts} attempts remaining)
                      </span>
                    )}
                  </Label>
                  <div className="relative">
                    <Input
                      id="code"
                      type="text"
                      placeholder="Enter 6-digit code"
                      value={code}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                        setCode(value);
                        setCodeError('');
                        setCodeVerified(false);
                      }}
                      required
                      disabled={loading}
                      className={`h-11 font-mono text-lg tracking-widest pr-10 ${
                        codeError ? 'border-destructive' : 
                        codeVerified ? 'border-green-500' : ''
                      }`}
                      maxLength={6}
                    />
                    {verifying && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                      </div>
                    )}
                    {codeVerified && !verifying && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-500" />
                    )}
                  </div>
                  {codeError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {codeError}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Check your email for the 6-digit verification code
                  </p>
                </div>

                {/* New Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      required
                      disabled={loading}
                      className={`h-11 pr-10 ${passwordError ? 'border-destructive' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-10"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Must be at least 6 characters
                  </p>
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setPasswordError('');
                      }}
                      required
                      disabled={loading}
                      className={`h-11 pr-10 ${passwordError ? 'border-destructive' : ''}`}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-11 w-10"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {passwordError && (
                    <p className="text-xs text-destructive flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      {passwordError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11"
                  disabled={loading || !codeVerified || code.length !== 6}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Resetting Password...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Reset Password
                    </>
                  )}
                </Button>

                {/* Back Links */}
                <div className="flex items-center justify-between pt-4 text-sm">
                  <Link 
                    to="/forgot-password"
                    className="text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Request new code
                  </Link>
                  <Link 
                    to="/login"
                    className="text-muted-foreground hover:text-primary transition-colors"
                  >
                    Back to Login
                  </Link>
                </div>
              </form>
            ) : (
              /* Success Message */
              <div className="space-y-6 text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Password Reset Successfully!</h3>
                  <p className="text-muted-foreground">
                    Your password has been changed successfully.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Redirecting to login page...
                  </p>
                </div>

                <Button 
                  onClick={() => navigate('/login')}
                  className="w-full"
                >
                  Go to Login
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Need help? Contact support if you're having trouble resetting your password.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
