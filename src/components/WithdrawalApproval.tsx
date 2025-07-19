import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, Clock, User, DollarSign } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WithdrawalRequest {
  id: string;
  user_id: string;
  amount: number;
  method: string;
  wallet_address?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  admin_notes?: string;
  profiles?: {
    display_name: string;
    email: string;
  };
}

export default function WithdrawalApproval() {
  const [requests, setRequests] = useState<WithdrawalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadWithdrawalRequests();
  }, []);

  const loadWithdrawalRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('withdrawal_requests')
        .select(`
          *,
          profiles (
            display_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setRequests((data || []).map((item: any) => ({
        ...item,
        status: item.status as 'pending' | 'approved' | 'rejected'
      })));
    } catch (error) {
      console.error('Error loading withdrawal requests:', error);
      toast({
        title: "Error",
        description: "Failed to load withdrawal requests",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processWithdrawal = async (requestId: string, action: 'approve' | 'reject') => {
    setProcessingId(requestId);
    
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      const updates: any = {
        status: action === 'approve' ? 'approved' : 'rejected',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes[requestId] || null
      };

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updates)
        .eq('id', requestId);

      if (error) throw error;

      // If approved, actually process the withdrawal
      if (action === 'approve') {
        const { error: withdrawalError } = await supabase.functions.invoke('process-withdrawal', {
          body: {
            userId: request.user_id,
            amount: request.amount
          }
        });

        if (withdrawalError) {
          // Revert the status update if withdrawal fails
          await supabase
            .from('withdrawal_requests')
            .update({ status: 'pending', processed_at: null })
            .eq('id', requestId);
          
          throw withdrawalError;
        }
      }

      toast({
        title: `Withdrawal ${action === 'approve' ? 'Approved' : 'Rejected'}`,
        description: `Request for ৳${request.amount} has been ${action}d`
      });

      // Reload requests
      loadWithdrawalRequests();
    } catch (error) {
      console.error(`Error ${action}ing withdrawal:`, error);
      toast({
        title: "Error",
        description: `Failed to ${action} withdrawal request`,
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-20 bg-muted rounded-lg"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Withdrawal Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No withdrawal requests pending</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="border rounded-lg p-4 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <span className="font-medium">
                        {request.profiles?.display_name || request.profiles?.email || 'Unknown User'}
                      </span>
                      {getStatusBadge(request.status)}
                    </div>
                    
                    <div className="flex items-center gap-2 text-lg font-bold">
                      <DollarSign className="h-5 w-5" />
                      ৳{request.amount.toLocaleString()}
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      <p>Method: {request.method}</p>
                      {request.wallet_address && (
                        <p>Address: {request.wallet_address.slice(0, 10)}...{request.wallet_address.slice(-6)}</p>
                      )}
                      <p>Requested: {new Date(request.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {request.status === 'pending' && (
                  <div className="space-y-3">
                    <Textarea
                      placeholder="Add admin notes (optional)"
                      value={adminNotes[request.id] || ''}
                      onChange={(e) => setAdminNotes(prev => ({
                        ...prev,
                        [request.id]: e.target.value
                      }))}
                      className="min-h-[60px]"
                    />
                    
                    <div className="flex gap-2">
                      <Button
                        onClick={() => processWithdrawal(request.id, 'approve')}
                        disabled={processingId === request.id}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => processWithdrawal(request.id, 'reject')}
                        disabled={processingId === request.id}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                )}

                {request.admin_notes && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-muted-foreground">
                      <strong>Admin Notes:</strong> {request.admin_notes}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}