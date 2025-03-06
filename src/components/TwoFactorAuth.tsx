
import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { generateSecret, verifyToken } from '@/services/twoFactorService';

interface TwoFactorAuthProps {
  onVerified: () => void;
  setupMode?: boolean;
}

const TwoFactorAuth: React.FC<TwoFactorAuthProps> = ({ onVerified, setupMode = false }) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // In setup mode, generate a new secret and QR code
    if (setupMode) {
      const initSetup = async () => {
        try {
          const { secret, qrCodeUrl } = await generateSecret();
          setSecret(secret);
          if (qrCodeUrl) {
            setQrCode(qrCodeUrl);
          }
          
          // In a real app, this secret would be saved to the database
          localStorage.setItem('demoAdminSecret', secret);
        } catch (error) {
          toast({
            title: "Setup error",
            description: "Failed to generate 2FA setup",
            variant: "destructive",
          });
        }
      };
      
      initSetup();
    } else {
      // For demo purposes, we'll use the stored secret
      const savedSecret = localStorage.getItem('demoAdminSecret');
      if (savedSecret) {
        setSecret(savedSecret);
      }
    }
  }, [setupMode, toast]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!secret) {
        throw new Error("2FA secret is missing");
      }
      
      // Verify the token against the secret
      const isValid = verifyToken(secret, token);
      
      if (isValid) {
        toast({
          title: setupMode ? "2FA Setup Complete" : "2FA Verified",
          description: setupMode ? "Your 2FA has been set up successfully" : "Successfully verified 2FA code",
        });
        
        if (setupMode) {
          // In a real app, we would mark the admin account as having 2FA enabled
          localStorage.setItem('adminHas2FA', 'true');
        } else {
          // In a real app, we would complete the login process
          localStorage.setItem('adminLoggedIn', 'true');
        }
        
        onVerified();
      } else {
        toast({
          title: "Verification failed",
          description: "Invalid 2FA code. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
      toast({
        title: "Verification error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {setupMode ? '2FA Setup' : '2FA Verification'}
        </CardTitle>
        {setupMode && (
          <CardDescription className="text-center">
            Scan the QR code with Google Authenticator or Authy
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {setupMode && qrCode && (
          <div className="flex justify-center mb-6">
            <img 
              src={qrCode} 
              alt="2FA QR Code" 
              className="border rounded-md p-2 bg-white" 
              width={200}
              height={200}
            />
          </div>
        )}
        
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="token" className="text-sm font-medium">
              {setupMode ? 'Enter the code from your authenticator app' : 'Enter your 2FA code'}
            </label>
            <Input 
              id="token"
              type="text" 
              value={token} 
              onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))} 
              maxLength={6}
              required 
              className="text-center text-xl tracking-wider"
              placeholder="000000"
            />
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TwoFactorAuth;
