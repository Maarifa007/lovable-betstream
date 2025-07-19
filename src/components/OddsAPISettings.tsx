import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export default function OddsAPISettings() {
  const [apiKey, setApiKey] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OddsAPI key",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      // Test API connection
      const response = await fetch(`https://api.the-odds-api.com/v4/sports/?apiKey=${apiKey}`);
      
      if (response.ok) {
        setIsConnected(true);
        toast({
          title: "Connection Successful",
          description: "OddsAPI connected successfully! Live odds will now be available.",
        });
      } else {
        setIsConnected(false);
        toast({
          title: "Connection Failed",
          description: "Invalid API key or connection error",
          variant: "destructive"
        });
      }
    } catch (error) {
      setIsConnected(false);
      toast({
        title: "Connection Error",
        description: "Unable to connect to OddsAPI",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Live Odds API Configuration
          {isConnected ? (
            <Badge className="bg-green-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Connected
            </Badge>
          ) : (
            <Badge variant="secondary">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Connected
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="odds-api-key">OddsAPI Key</Label>
          <Input
            id="odds-api-key"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter your OddsAPI key"
          />
          <p className="text-sm text-muted-foreground">
            Get your free API key from{' '}
            <a 
              href="https://the-odds-api.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              the-odds-api.com
              <ExternalLink className="h-3 w-3" />
            </a>
          </p>
        </div>

        <Button 
          onClick={testConnection} 
          disabled={isLoading || !apiKey.trim()}
          className="w-full"
        >
          {isLoading ? 'Testing Connection...' : 'Test & Connect'}
        </Button>

        {!isConnected && (
          <div className="bg-muted/50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Without OddsAPI:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Mock data will be used for betting odds</li>
              <li>• Odds will update with random variations</li>
              <li>• Real-time sports data will not be available</li>
            </ul>
          </div>
        )}

        {isConnected && (
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-medium text-green-800 mb-2">Live Data Active:</h4>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Real-time odds from major sportsbooks</li>
              <li>• Live updates every 60 seconds</li>
              <li>• Coverage for Cricket, Football, Tennis, Basketball</li>
              <li>• Professional betting market data</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}