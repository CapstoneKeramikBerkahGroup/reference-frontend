import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RefreshCw } from 'lucide-react';
import { authAPI } from '@/services/api';
import { toast } from 'sonner';

/**
 * CAPTCHA Component
 * - Fetches CAPTCHA image from backend
 * - Displays image with refresh button
 * - Provides input field for user entry
 * - Validates user input
 */
const CaptchaInput = ({ onCaptchaChange, required = false }) => {
  const [captchaImage, setCaptchaImage] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [captchaText, setCaptchaText] = useState('');
  const [loading, setLoading] = useState(false);

  // Fetch CAPTCHA on mount
  useEffect(() => {
    fetchCaptcha();
  }, []);

  const fetchCaptcha = async () => {
    setLoading(true);
    try {
      const response = await authAPI.getCaptcha();
      setCaptchaImage(response.data.captcha_image);
      setSessionId(response.data.session_id);
      setCaptchaText(''); // Clear previous input
      
      // Notify parent component
      if (onCaptchaChange) {
        onCaptchaChange('', response.data.session_id);
      }
    } catch (error) {
      console.error('Failed to fetch CAPTCHA:', error);
      toast.error('Failed to load CAPTCHA. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaInput = (value) => {
    setCaptchaText(value);
    
    // Notify parent component with both text and session ID
    if (onCaptchaChange) {
      onCaptchaChange(value, sessionId);
    }
  };

  return (
    <div className="space-y-3">
      <Label htmlFor="captcha">
        Verification Code {required && <span className="text-destructive">*</span>}
      </Label>
      
      {/* CAPTCHA Image Display */}
      <div className="flex items-center gap-3">
        <div className="flex-1 border-2 border-border rounded-lg p-3 bg-muted/30 min-h-[100px] flex items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading CAPTCHA...</span>
            </div>
          ) : captchaImage ? (
            <img 
              src={captchaImage} 
              alt="CAPTCHA" 
              className="max-w-full h-auto"
            />
          ) : (
            <span className="text-muted-foreground">CAPTCHA not loaded</span>
          )}
        </div>
        
        {/* Refresh Button */}
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={fetchCaptcha}
          disabled={loading}
          title="Refresh CAPTCHA"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Input Field */}
      <Input
        id="captcha"
        type="text"
        placeholder="Enter the code shown above"
        value={captchaText}
        onChange={(e) => handleCaptchaInput(e.target.value.toUpperCase())}
        required={required}
        autoComplete="off"
        className="uppercase tracking-wider font-mono text-lg"
        maxLength={6}
      />
      
      <p className="text-xs text-muted-foreground">
        Enter the verification code shown in the image above. Click the refresh icon if you can't read it.
      </p>
    </div>
  );
};

export default CaptchaInput;
