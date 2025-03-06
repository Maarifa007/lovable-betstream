
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export interface TwoFactorSecret {
  secret: string;
  qrCodeUrl?: string;
}

export const generateSecret = async (serviceName: string = 'Betting Platform'): Promise<TwoFactorSecret> => {
  const secret = speakeasy.generateSecret({ name: `${serviceName} Admin` });
  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');
  
  return {
    secret: secret.base32,
    qrCodeUrl
  };
};

export const verifyToken = (secret: string, token: string): boolean => {
  return speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token
  });
};
