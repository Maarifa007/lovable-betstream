
import { toast } from '@/hooks/use-toast';

interface NotificationOptions {
  title: string;
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
}

export const showNotification = ({ title, message, type = 'info' }: NotificationOptions): void => {
  const variant = type === 'error' ? 'destructive' : 'default';
  
  toast({
    title,
    description: message,
    variant,
  });
};

export const notifyWithdrawalApproval = (userId: string, amount: number): void => {
  // In a real app, we would send this to a specific user via WebSocket
  // For this demo, we'll just show it locally
  showNotification({
    title: 'Withdrawal Approved',
    message: `Your withdrawal of ${amount} USDC has been approved.`,
    type: 'success'
  });
  
  // Log for demo purposes
  console.log(`Notification sent to user ${userId}: Withdrawal of ${amount} USDC approved`);
};

export const notifyWithdrawalRejection = (userId: string, amount: number): void => {
  showNotification({
    title: 'Withdrawal Rejected',
    message: `Your withdrawal of ${amount} USDC was rejected.`,
    type: 'error'
  });
  
  // Log for demo purposes
  console.log(`Notification sent to user ${userId}: Withdrawal of ${amount} USDC rejected`);
};
