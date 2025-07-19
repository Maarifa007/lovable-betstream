import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertTriangle, CheckCircle, Clock, Settings, PlayCircle, StopCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AutoGradingConfig {
  id: string;
  enabled: boolean;
  polling_interval_seconds: number;
  supported_sports: string[];
  created_at: string;
  updated_at: string;
}

interface GradingLog {
  id: string;
  event_id: string;
  sport_type: string;
  final_result: number;
  positions_graded: number;
  total_payout: number;
  grading_method: string;
  status: string;
  error_message?: string;
  processed_at: string;
}

const AdminAutoGrading: React.FC = () => {
  const [config, setConfig] = useState<AutoGradingConfig | null>(null);
  const [gradingLogs, setGradingLogs] = useState<GradingLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadConfig();
    loadGradingLogs();
  }, []);

  const loadConfig = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_grading_config')
        .select('*')
        .single();

      if (error) throw error;
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
      toast({
        title: "Error",
        description: "Failed to load auto-grading configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadGradingLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('auto_grading_logs')
        .select('*')
        .order('processed_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setGradingLogs(data || []);
    } catch (error) {
      console.error('Error loading grading logs:', error);
    }
  };

  const updateConfig = async (updates: Partial<AutoGradingConfig>) => {
    if (!config) return;

    try {
      const { error } = await supabase
        .from('auto_grading_config')
        .update(updates)
        .eq('id', config.id);

      if (error) throw error;

      setConfig({ ...config, ...updates });
      toast({
        title: "Success",
        description: "Auto-grading configuration updated",
      });
    } catch (error) {
      console.error('Error updating config:', error);
      toast({
        title: "Error",
        description: "Failed to update configuration",
        variant: "destructive",
      });
    }
  };

  const testGrading = async () => {
    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('auto-grade-events');
      
      if (error) throw error;

      toast({
        title: "Test Completed",
        description: `Processed ${data.graded_events} events`,
      });
      
      loadGradingLogs(); // Refresh logs
    } catch (error) {
      console.error('Error testing grading:', error);
      toast({
        title: "Test Failed",
        description: "Auto-grading test failed",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      success: "default",
      failed: "destructive",
      partial: "secondary"
    } as const;

    const icons = {
      success: <CheckCircle className="h-3 w-3" />,
      failed: <AlertTriangle className="h-3 w-3" />,
      partial: <Clock className="h-3 w-3" />
    };

    return (
      <Badge variant={variants[status as keyof typeof variants] || "outline"} className="flex items-center gap-1">
        {icons[status as keyof typeof icons]}
        {status}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auto-Grading System</h2>
          <p className="text-muted-foreground">
            Manage automatic bet settlement and grading configuration
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={testGrading} 
            disabled={testing}
            variant="outline"
            size="sm"
          >
            {testing ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4 mr-2" />
                Test Grading
              </>
            )}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="settings" className="w-full">
        <TabsList>
          <TabsTrigger value="settings">Settings</TabsTrigger>
          <TabsTrigger value="logs">Grading Logs</TabsTrigger>
          <TabsTrigger value="stats">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Auto-Grading Configuration
              </CardTitle>
              <CardDescription>
                Configure automatic bet grading and settlement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="auto-grading">Enable Auto-Grading</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically grade and settle bets when events complete
                  </p>
                </div>
                <Switch
                  id="auto-grading"
                  checked={config?.enabled || false}
                  onCheckedChange={(enabled) => updateConfig({ enabled })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="polling-interval">Polling Interval (seconds)</Label>
                <Input
                  id="polling-interval"
                  type="number"
                  min="30"
                  max="3600"
                  value={config?.polling_interval_seconds || 120}
                  onChange={(e) => updateConfig({ polling_interval_seconds: parseInt(e.target.value) })}
                  className="w-32"
                />
                <p className="text-sm text-muted-foreground">
                  How often to check for completed events (30-3600 seconds)
                </p>
              </div>

              <div className="space-y-2">
                <Label>Supported Sports</Label>
                <div className="flex flex-wrap gap-2">
                  {config?.supported_sports?.map((sport) => (
                    <Badge key={sport} variant="outline">
                      {sport}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  Sports that will be automatically graded
                </p>
              </div>

              <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
                {config?.enabled ? (
                  <>
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="text-green-600 font-medium">Auto-grading is enabled</span>
                  </>
                ) : (
                  <>
                    <StopCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-600 font-medium">Auto-grading is disabled</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Grading Activity</CardTitle>
              <CardDescription>
                View recent auto-grading operations and their results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event ID</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Positions</TableHead>
                    <TableHead>Total Payout</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Processed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gradingLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-sm">
                        {log.event_id.slice(0, 8)}...
                      </TableCell>
                      <TableCell>{log.sport_type}</TableCell>
                      <TableCell>{log.positions_graded}</TableCell>
                      <TableCell>৳{log.total_payout.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge variant={log.grading_method === 'auto' ? 'default' : 'secondary'}>
                          {log.grading_method}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                      <TableCell>
                        {new Date(log.processed_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Events Graded</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gradingLogs.filter(log => log.status === 'success').length}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Positions Settled</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {gradingLogs.reduce((sum, log) => sum + log.positions_graded, 0)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ৳{gradingLogs.reduce((sum, log) => sum + log.total_payout, 0).toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminAutoGrading;