import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Settings, Trophy, Calendar, Clock, DollarSign, Users, Target } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Contest {
  id: string;
  title: string;
  description: string;
  sport_type: string;
  start_time: string;
  end_time: string;
  entry_fee: number;
  prize_pool: number;
  max_participants: number;
  status: string;
  created_at: string;
}

interface Market {
  id: string;
  name: string;
  type: string;
  odds: number;
  isActive: boolean;
}

export default function AdminMarketManager() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { toast } = useToast();

  const [newContest, setNewContest] = useState({
    title: '',
    description: '',
    sport_type: 'football',
    start_time: '',
    end_time: '',
    entry_fee: 0,
    prize_pool: 0,
    max_participants: 100
  });

  const [gradingForm, setGradingForm] = useState({
    contestId: '',
    result: '',
    winnerIds: []
  });

  useEffect(() => {
    loadContests();
  }, []);

  const loadContests = async () => {
    try {
      const { data, error } = await supabase
        .from('contests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContests(data || []);
    } catch (error) {
      console.error('Error loading contests:', error);
      toast({
        title: "Error",
        description: "Failed to load contests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const createContest = async () => {
    if (!newContest.title || !newContest.start_time || !newContest.end_time) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('contests')
        .insert([{
          ...newContest,
          status: 'upcoming'
        }]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contest created successfully"
      });

      loadContests();
      setShowCreateForm(false);
      setNewContest({
        title: '',
        description: '',
        sport_type: 'football',
        start_time: '',
        end_time: '',
        entry_fee: 0,
        prize_pool: 0,
        max_participants: 100
      });
    } catch (error) {
      console.error('Error creating contest:', error);
      toast({
        title: "Error",
        description: "Failed to create contest",
        variant: "destructive"
      });
    }
  };

  const updateContestStatus = async (contestId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('contests')
        .update({ status })
        .eq('id', contestId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Contest ${status} successfully`
      });

      loadContests();
    } catch (error) {
      console.error('Error updating contest:', error);
      toast({
        title: "Error",
        description: "Failed to update contest status",
        variant: "destructive"
      });
    }
  };

  const gradeContest = async () => {
    if (!gradingForm.contestId || !gradingForm.result) {
      toast({
        title: "Validation Error",
        description: "Please select contest and enter result",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase.functions.invoke('grade-contest', {
        body: {
          contestId: gradingForm.contestId,
          result: gradingForm.result
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Contest graded and payouts processed"
      });

      loadContests();
      setGradingForm({ contestId: '', result: '', winnerIds: [] });
    } catch (error) {
      console.error('Error grading contest:', error);
      toast({
        title: "Error",
        description: "Failed to grade contest",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              Market & Contest Management
            </CardTitle>
            <Button onClick={() => setShowCreateForm(!showCreateForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Contest
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="contests" className="space-y-4">
            <TabsList>
              <TabsTrigger value="contests">Contests</TabsTrigger>
              <TabsTrigger value="create">Create New</TabsTrigger>
              <TabsTrigger value="grading">Grade Results</TabsTrigger>
            </TabsList>

            <TabsContent value="contests" className="space-y-4">
              <div className="grid gap-4">
                {contests.length === 0 ? (
                  <Alert>
                    <AlertDescription>
                      No contests found. Create your first contest to get started.
                    </AlertDescription>
                  </Alert>
                ) : (
                  contests.map((contest) => (
                    <Card key={contest.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{contest.title}</h3>
                              <Badge className={getStatusColor(contest.status)}>
                                {contest.status.toUpperCase()}
                              </Badge>
                              <Badge variant="outline">
                                {contest.sport_type.toUpperCase()}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{contest.description}</p>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  <p className="font-medium">Start</p>
                                  <p className="text-muted-foreground">
                                    {new Date(contest.start_time).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  <p className="font-medium">Entry Fee</p>
                                  <p className="text-muted-foreground">৳{contest.entry_fee}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  <p className="font-medium">Prize Pool</p>
                                  <p className="text-muted-foreground">৳{contest.prize_pool}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <div className="text-sm">
                                  <p className="font-medium">Max Players</p>
                                  <p className="text-muted-foreground">{contest.max_participants}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
                            {contest.status === 'upcoming' && (
                              <>
                                <Button 
                                  size="sm" 
                                  onClick={() => updateContestStatus(contest.id, 'active')}
                                >
                                  Start
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => updateContestStatus(contest.id, 'cancelled')}
                                >
                                  Cancel
                                </Button>
                              </>
                            )}
                            {contest.status === 'active' && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => updateContestStatus(contest.id, 'completed')}
                              >
                                End Contest
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="create" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Create New Contest</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="title">Contest Title</Label>
                      <Input
                        id="title"
                        value={newContest.title}
                        onChange={(e) => setNewContest({ ...newContest, title: e.target.value })}
                        placeholder="Premier League Match Predictor"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="sport_type">Sport Type</Label>
                      <Select 
                        value={newContest.sport_type}
                        onValueChange={(value) => setNewContest({ ...newContest, sport_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="football">Football</SelectItem>
                          <SelectItem value="cricket">Cricket</SelectItem>
                          <SelectItem value="kabaddi">Kabaddi</SelectItem>
                          <SelectItem value="basketball">Basketball</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={newContest.description}
                      onChange={(e) => setNewContest({ ...newContest, description: e.target.value })}
                      placeholder="Predict the outcome of exciting matches..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="start_time">Start Time</Label>
                      <Input
                        id="start_time"
                        type="datetime-local"
                        value={newContest.start_time}
                        onChange={(e) => setNewContest({ ...newContest, start_time: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="end_time">End Time</Label>
                      <Input
                        id="end_time"
                        type="datetime-local"
                        value={newContest.end_time}
                        onChange={(e) => setNewContest({ ...newContest, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="entry_fee">Entry Fee (BDT)</Label>
                      <Input
                        id="entry_fee"
                        type="number"
                        value={newContest.entry_fee}
                        onChange={(e) => setNewContest({ ...newContest, entry_fee: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="prize_pool">Prize Pool (BDT)</Label>
                      <Input
                        id="prize_pool"
                        type="number"
                        value={newContest.prize_pool}
                        onChange={(e) => setNewContest({ ...newContest, prize_pool: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="max_participants">Max Participants</Label>
                      <Input
                        id="max_participants"
                        type="number"
                        value={newContest.max_participants}
                        onChange={(e) => setNewContest({ ...newContest, max_participants: parseInt(e.target.value) || 100 })}
                      />
                    </div>
                  </div>

                  <Button onClick={createContest} className="w-full">
                    Create Contest
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Grade Contest Results</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="contest_select">Select Contest</Label>
                    <Select 
                      value={gradingForm.contestId}
                      onValueChange={(value) => setGradingForm({ ...gradingForm, contestId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a contest to grade" />
                      </SelectTrigger>
                      <SelectContent>
                        {contests.filter(c => c.status === 'completed').map((contest) => (
                          <SelectItem key={contest.id} value={contest.id}>
                            {contest.title} - {new Date(contest.start_time).toLocaleDateString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="result">Contest Result</Label>
                    <Textarea
                      id="result"
                      value={gradingForm.result}
                      onChange={(e) => setGradingForm({ ...gradingForm, result: e.target.value })}
                      placeholder="Enter the final result (e.g., Liverpool 2-1 Chelsea)"
                    />
                  </div>

                  <Button onClick={gradeContest} className="w-full">
                    <Target className="h-4 w-4 mr-2" />
                    Grade Contest & Process Payouts
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}