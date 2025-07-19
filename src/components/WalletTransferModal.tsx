import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Send, User, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WalletTransferModalProps {
  userId: string;
  currentBalance: number;
  onTransferComplete: () => void;
  children: React.ReactNode;
}

export default function WalletTransferModal({ 
  userId, 
  currentBalance, 
  onTransferComplete,
  children 
}: WalletTransferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [transferStep, setTransferStep] = useState<'input' | 'confirm' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const { toast } = useToast();

  const validateTransfer = () => {
    if (!recipientId.trim()) {
      setErrorMessage('Recipient ID is required');
      return false;
    }
    
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage('Please enter a valid amount');
      return false;
    }
    
    if (parseFloat(amount) > currentBalance) {
      setErrorMessage('Insufficient balance');
      return false;
    }
    
    if (parseFloat(amount) < 10) {
      setErrorMessage('Minimum transfer amount is ৳10');
      return false;
    }
    
    if (recipientId === userId) {
      setErrorMessage('Cannot transfer to yourself');
      return false;
    }
    
    setErrorMessage('');
    return true;
  };

  const handleNext = () => {
    if (validateTransfer()) {
      setTransferStep('confirm');
    }
  };

  const executeTransfer = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('wallet-transfer', {
        body: {
          fromUserId: userId,
          toUserId: recipientId,
          amount: parseFloat(amount),
          description: description || `Transfer to ${recipientId}`
        }
      });

      if (error) throw error;

      setTransferStep('success');
      onTransferComplete();
      
      toast({
        title: "Transfer Successful",
        description: `Successfully sent ৳${amount} to ${recipientId}`,
      });

    } catch (error: any) {
      console.error('Transfer error:', error);
      setTransferStep('error');
      setErrorMessage(error.message || 'Transfer failed. Please try again.');
      
      toast({
        title: "Transfer Failed",
        description: error.message || "Unable to complete transfer",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setRecipientId('');
    setAmount('');
    setDescription('');
    setTransferStep('input');
    setErrorMessage('');
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(resetForm, 300); // Allow dialog to close before resetting
  };

  const renderStepContent = () => {
    switch (transferStep) {
      case 'input':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Available Balance:</span>
                <p className="font-semibold text-lg">৳{currentBalance.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Transfer Fee:</span>
                <p className="font-semibold text-lg text-green-600">Free</p>
              </div>
            </div>
            
            <Separator />

            <div className="space-y-3">
              <div>
                <Label htmlFor="recipient">Recipient User ID</Label>
                <Input
                  id="recipient"
                  placeholder="Enter user ID or email"
                  value={recipientId}
                  onChange={(e) => setRecipientId(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="amount">Amount (BDT)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="10"
                  max={currentBalance}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Minimum: ৳10 • Maximum: ৳{currentBalance.toLocaleString()}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  placeholder="What's this transfer for?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  maxLength={100}
                />
              </div>
            </div>

            {errorMessage && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleNext} className="flex-1">
                <Send className="h-4 w-4 mr-2" />
                Review Transfer
              </Button>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-4">
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription>
                Please review the transfer details carefully. This action cannot be undone.
              </AlertDescription>
            </Alert>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To:</span>
                <span className="font-medium">{recipientId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold text-lg">৳{parseFloat(amount).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transfer Fee:</span>
                <span className="text-green-600 font-medium">Free</span>
              </div>
              {description && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Description:</span>
                  <span className="font-medium">{description}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg">
                <span className="font-semibold">New Balance:</span>
                <span className="font-bold">৳{(currentBalance - parseFloat(amount)).toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setTransferStep('input')} 
                className="flex-1"
                disabled={isLoading}
              >
                Back
              </Button>
              <Button 
                onClick={executeTransfer} 
                className="flex-1"
                disabled={isLoading}
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Confirm Transfer
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transfer Successful!</h3>
              <p className="text-muted-foreground">
                ৳{parseFloat(amount).toLocaleString()} has been sent to {recipientId}
              </p>
            </div>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              Transaction Complete
            </Badge>
            <Button onClick={handleClose} className="w-full">
              Close
            </Button>
          </div>
        );

      case 'error':
        return (
          <div className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Transfer Failed</h3>
              <p className="text-muted-foreground">{errorMessage}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setTransferStep('input')} className="flex-1">
                Try Again
              </Button>
              <Button onClick={handleClose} className="flex-1">
                Close
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {transferStep === 'input' && "Send Money"}
            {transferStep === 'confirm' && "Confirm Transfer"}
            {transferStep === 'success' && "Transfer Complete"}
            {transferStep === 'error' && "Transfer Failed"}
          </DialogTitle>
          <DialogDescription>
            {transferStep === 'input' && "Transfer funds to another user instantly"}
            {transferStep === 'confirm' && "Review your transfer details"}
            {transferStep === 'success' && "Your transfer was completed successfully"}
            {transferStep === 'error' && "Something went wrong with your transfer"}
          </DialogDescription>
        </DialogHeader>
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}