
import React, { useEffect, useState } from 'react';
import { AlertTriangle, Bell, BellOff } from 'lucide-react';
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface RiskAlert {
  id: string;
  marketId: string;
  marketName: string;
  exposureAmount: number;
  timestamp: string;
  acknowledged: boolean;
}

const AdminRiskAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<RiskAlert[]>([]);
  const [silenced, setSilenced] = useState(false);
  
  useEffect(() => {
    // In a real application, this would connect to a WebSocket
    // const ws = new WebSocket("wss://your-server.com:8080");
    
    // For this demo, we'll simulate receiving alerts
    const simulateAlert = () => {
      if (Math.random() > 0.5 && !silenced) { // 50% chance of getting an alert if not silenced
        const markets = [
          "Total Goals (Liverpool vs Chelsea)",
          "Total Corners (Man City vs Arsenal)",
          "Player Props (Kane - Tottenham)",
          "Match Winner (Bayern vs Dortmund)",
          "Asian Handicap (AC Milan vs Inter)"
        ];
        
        const randomMarket = markets[Math.floor(Math.random() * markets.length)];
        const randomExposure = Math.floor(Math.random() * 50000) + 50000; // Between 50k and 100k
        
        const newAlert: RiskAlert = {
          id: Date.now().toString(),
          marketId: Math.floor(Math.random() * 100).toString(),
          marketName: randomMarket,
          exposureAmount: randomExposure,
          timestamp: new Date().toISOString(),
          acknowledged: false
        };
        
        setAlerts(prev => [newAlert, ...prev].slice(0, 10)); // Keep only the 10 most recent alerts
        
        if (!silenced) {
          toast({
            title: "High Exposure Alert",
            description: `${randomMarket} has reached $${randomExposure.toLocaleString()} exposure`,
            variant: "destructive",
          });
        }
      }
    };
    
    // Simulate an initial alert
    setTimeout(simulateAlert, 2000);
    
    // Simulate periodic alerts every 20 seconds
    const intervalId = setInterval(simulateAlert, 20000);
    
    return () => clearInterval(intervalId);
  }, [silenced]);
  
  const handleAcknowledge = (id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  };
  
  const toggleAlertSilence = () => {
    setSilenced(!silenced);
    toast({
      title: silenced ? "Alerts Enabled" : "Alerts Silenced",
      description: silenced 
        ? "You will now receive risk alerts" 
        : "Alert notifications have been silenced",
      variant: silenced ? "default" : "secondary",
    });
  };
  
  return (
    <div className="p-6 rounded-lg glass">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Risk Exposure Alerts</h2>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={toggleAlertSilence}
          className={`${silenced ? 'text-muted-foreground' : 'text-yellow-500'}`}
        >
          {silenced ? <BellOff className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
          {silenced ? 'Alerts Silenced' : 'Alerts Active'}
        </Button>
      </div>
      
      {alerts.length === 0 ? (
        <div className="text-center p-12 text-muted-foreground">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>No risk alerts at this time.</p>
          <p className="text-sm mt-2">Alerts will appear here when market exposure exceeds risk thresholds.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {alerts.map(alert => (
            <div 
              key={alert.id} 
              className={`p-4 rounded-lg border ${
                alert.acknowledged 
                  ? 'border-muted-foreground/20 bg-white/5' 
                  : 'border-red-500/20 bg-red-500/5'
              }`}
            >
              <div className="flex justify-between">
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${alert.acknowledged ? 'text-muted-foreground' : 'text-red-500'}`} />
                  <div>
                    <h3 className={`font-medium ${alert.acknowledged ? 'text-muted-foreground' : 'text-red-400'}`}>
                      {alert.marketName}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Exposure: <span className={`font-medium ${alert.acknowledged ? 'text-muted-foreground' : 'text-red-500'}`}>
                        ${alert.exposureAmount.toLocaleString()}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      {new Date(alert.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                
                {!alert.acknowledged && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleAcknowledge(alert.id)}
                  >
                    Acknowledge
                  </Button>
                )}
              </div>
              
              {!alert.acknowledged && (
                <div className="mt-3 p-2 bg-red-500/10 rounded text-xs text-red-300">
                  <p className="font-medium">Recommended action:</p>
                  <p>Increase spread for this market by 50% or temporarily limit new positions.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRiskAlerts;
