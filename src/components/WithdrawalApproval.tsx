
import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { notifyWithdrawalApproval, notifyWithdrawalRejection } from '@/services/notificationService';

interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number;
  walletAddress: string;
  timestamp: string;
}

interface WithdrawalApprovalProps {
  withdrawalRequests: WithdrawalRequest[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

const WithdrawalApproval: React.FC<WithdrawalApprovalProps> = ({ 
  withdrawalRequests,
  onApprove,
  onReject 
}) => {
  const [processing, setProcessing] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApprove = async (request: WithdrawalRequest) => {
    setProcessing(request.id);
    try {
      // In a real app, call an API to approve the withdrawal
      // For demo purposes, we'll simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifyWithdrawalApproval(request.userId, request.amount);
      onApprove(request.id);
      
      toast({
        title: "Withdrawal Approved",
        description: `You've approved withdrawal of ${request.amount} USDC to ${request.walletAddress}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (request: WithdrawalRequest) => {
    setProcessing(request.id);
    try {
      // In a real app, call an API to reject the withdrawal
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      notifyWithdrawalRejection(request.userId, request.amount);
      onReject(request.id);
      
      toast({
        title: "Withdrawal Rejected",
        description: `You've rejected withdrawal of ${request.amount} USDC`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject withdrawal",
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  if (withdrawalRequests.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">No pending withdrawals</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {withdrawalRequests.map(request => (
        <Card key={request.id}>
          <CardHeader>
            <CardTitle className="text-lg">Withdrawal Request</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Amount:</strong> {request.amount} USDC</p>
            <p><strong>Wallet:</strong> {request.walletAddress}</p>
            <p><strong>Date:</strong> {new Date(request.timestamp).toLocaleString()}</p>
          </CardContent>
          <CardFooter className="flex justify-end space-x-2">
            <Button 
              variant="destructive" 
              onClick={() => handleReject(request)}
              disabled={!!processing}
            >
              {processing === request.id ? 'Rejecting...' : 'Reject'}
            </Button>
            <Button 
              variant="default" 
              onClick={() => handleApprove(request)}
              disabled={!!processing}
            >
              {processing === request.id ? 'Approving...' : 'Approve'}
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default WithdrawalApproval;
