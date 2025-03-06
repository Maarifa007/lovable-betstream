
export type KycLevel = 'none' | 'basic' | 'full';

interface KycLimits {
  dailyWithdrawalLimit: number;
  canWithdraw: boolean;
}

export const getKycLimits = (kycLevel: KycLevel): KycLimits => {
  switch (kycLevel) {
    case 'none':
      return {
        dailyWithdrawalLimit: 0,
        canWithdraw: false,
      };
    case 'basic':
      return {
        dailyWithdrawalLimit: 100,
        canWithdraw: true,
      };
    case 'full':
      return {
        dailyWithdrawalLimit: Infinity,
        canWithdraw: true,
      };
    default:
      return {
        dailyWithdrawalLimit: 0,
        canWithdraw: false,
      };
  }
};

// For demo purposes, we'll store KYC status in localStorage
export const getUserKycLevel = (userId: string): KycLevel => {
  const key = `user_${userId}_kyc_level`;
  const storedLevel = localStorage.getItem(key);
  return (storedLevel as KycLevel) || 'none';
};

export const setUserKycLevel = (userId: string, level: KycLevel): void => {
  const key = `user_${userId}_kyc_level`;
  localStorage.setItem(key, level);
};

export const canUserWithdraw = (
  userId: string, 
  amount: number, 
  dailyWithdrawnAmount: number = 0
): { canWithdraw: boolean; reason?: string } => {
  const kycLevel = getUserKycLevel(userId);
  const { dailyWithdrawalLimit, canWithdraw } = getKycLimits(kycLevel);
  
  if (!canWithdraw) {
    return { 
      canWithdraw: false, 
      reason: 'KYC verification required for withdrawals' 
    };
  }
  
  if (dailyWithdrawnAmount + amount > dailyWithdrawalLimit) {
    return { 
      canWithdraw: false, 
      reason: `Daily withdrawal limit of $${dailyWithdrawalLimit} exceeded` 
    };
  }
  
  return { canWithdraw: true };
};
