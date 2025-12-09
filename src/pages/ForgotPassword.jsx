import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [expiresIn, setExpiresIn] = useState(15);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await authAPI.forgotPassword(email);
      
      setSuccess(true);
      setExpiresIn(response.data.expires_in_minutes || 15);
      
      toast.success('Verification code sent!');
      
      // Redirect to verify code page after 2 seconds
      setTimeout(() => {
        navigate('/reset-password', { 
          state: { email } 
        });
      }, 2000);
      
    } catch (err) {
      console.error('Forgot password error:', err);
      
      if (err.response?.status === 429) {
        // Rate limit exceeded
        const retryAfter = err.response?.data?.retry_after || 60;
        setError(`Too many requests. Please try again in ${Math.ceil(retryAfter / 60)} minutes.`);
      } else {
        setError(err.response?.data?.detail || 'Failed to send verification code. Please try again.');
      }
      
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent to-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
            <Mail className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-muted-foreground">
            No worries! Enter your email and we'll send you a verification code.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Enter the email address associated with your account
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!success ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Error Alert */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@university.ac.id"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    disabled={loading}
                    className="h-11"
                  />
                </div>

                {/* Submit Button */}
                <Button 
                  type="submit" 
                  className="w-full h-11"
                  disabled={loading || !email}
                >
                  {loading ? (
                    <>
                      <Clock className="w-4 h-4 mr-2 animate-spin" />
                      Sending Code...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Send Verification Code
                    </>
                  )}
                </Button>

                {/* Back to Login */}
                <div className="text-center pt-4">
                  <Link 
                    to="/login"
                    className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="w-4 h-4" />
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
                  <h3 className="text-xl font-semibold">Code Sent!</h3>
                  <p className="text-muted-foreground">
                    We've sent a 6-digit verification code to:
                  </p>
                  <p className="font-medium text-primary">{email}</p>
                </div>

                <Alert>
                  <Clock className="h-4 w-4" />
                  <AlertDescription>
                    The code will expire in <strong>{expiresIn} minutes</strong>. 
                    Please check your inbox and spam folder.
                  </AlertDescription>
                </Alert>

                <Button 
                  onClick={() => navigate('/reset-password', { state: { email } })}
                  className="w-full"
                >
                  Continue to Verification
                </Button>

                <Link 
                  to="/login"
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <div className="text-center mt-6">
          <p className="text-xs text-muted-foreground">
            Didn't receive the code? Check your spam folder or try again after a few minutes.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
