
import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { BarChart3, LineChart as LineChartIcon, Download } from 'lucide-react';

interface ExposureDataPoint {
  date: string;
  totalExposure: number;
  markets: {
    [key: string]: number;
  };
}

const HistoricalExposure: React.FC = () => {
  const [exposureData, setExposureData] = useState<ExposureDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('7d');
  
  useEffect(() => {
    const fetchHistoricalData = async () => {
      try {
        // In a real implementation, this would call an actual API
        // const response = await fetch(`/api/historical-exposure?range=${timeRange}`);
        // const data = await response.json();
        
        // For this demo, we'll simulate the data
        const mockData: ExposureDataPoint[] = [];
        
        // Generate data points based on the time range
        let dataPoints = 0;
        let interval = '';
        
        switch (timeRange) {
          case '24h':
            dataPoints = 24;
            interval = 'hour';
            break;
          case '7d':
            dataPoints = 7;
            interval = 'day';
            break;
          case '30d':
            dataPoints = 30;
            interval = 'day';
            break;
        }
        
        const marketNames = [
          'Total Goals',
          'Total Corners',
          'Match Winner',
          'Asian Handicap',
          'First Goalscorer'
        ];
        
        // Generate random data points
        for (let i = 0; i < dataPoints; i++) {
          const date = new Date();
          
          if (interval === 'hour') {
            date.setHours(date.getHours() - (dataPoints - i - 1));
          } else {
            date.setDate(date.getDate() - (dataPoints - i - 1));
          }
          
          const markets: {[key: string]: number} = {};
          let totalExposure = 0;
          
          // Generate random data for each market
          marketNames.forEach(market => {
            // Base value + random component + trend that increases over time
            const baseValue = 30000 + Math.random() * 20000;
            const trend = 500 * i; // Exposure tends to increase over time
            const randomComponent = Math.random() * 15000 - 7500;
            
            const value = Math.floor(baseValue + trend + randomComponent);
            markets[market] = value;
            totalExposure += value;
          });
          
          mockData.push({
            date: interval === 'hour' 
              ? date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : date.toLocaleDateString(),
            totalExposure,
            markets
          });
        }
        
        setExposureData(mockData);
        setLoading(false);
      } catch (error) {
        console.error('Failed to fetch historical exposure data:', error);
        toast({
          title: "Error",
          description: "Failed to load historical exposure data",
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    fetchHistoricalData();
  }, [timeRange]);
  
  // Transform the data for the stacked bar chart
  const getBarChartData = () => {
    return exposureData.map(dataPoint => {
      const result: any = { date: dataPoint.date };
      
      Object.keys(dataPoint.markets).forEach(market => {
        result[market] = dataPoint.markets[market];
      });
      
      return result;
    });
  };
  
  // Transform the data for the line chart (total exposure)
  const getLineChartData = () => {
    return exposureData.map(dataPoint => ({
      date: dataPoint.date,
      Total: dataPoint.totalExposure
    }));
  };
  
  // List all market names in the dataset
  const getMarketNames = () => {
    if (exposureData.length === 0) return [];
    return Object.keys(exposureData[0].markets);
  };
  
  // Generate random colors for the chart
  const getChartColors = () => {
    return [
      '#FF6384', // Pink
      '#36A2EB', // Blue
      '#FFCE56', // Yellow
      '#4BC0C0', // Teal
      '#9966FF', // Purple
      '#FF9F40'  // Orange
    ];
  };
  
  const handleExportData = () => {
    try {
      const csvContent = 'data:text/csv;charset=utf-8,' + 
        'Date,' + getMarketNames().join(',') + ',Total\n' +
        exposureData.map(dataPoint => {
          const marketValues = getMarketNames()
            .map(market => dataPoint.markets[market])
            .join(',');
          return `${dataPoint.date},${marketValues},${dataPoint.totalExposure}`;
        }).join('\n');
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `exposure-data-${timeRange}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: "Data exported successfully",
      });
    } catch (error) {
      console.error('Failed to export data:', error);
      toast({
        title: "Error",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };
  
  if (loading) {
    return <div className="p-6 text-center">Loading historical exposure data...</div>;
  }
  
  return (
    <div className="p-6 rounded-lg glass">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Historical Market Exposure</h2>
        <div className="flex items-center gap-2">
          <div className="flex border border-white/20 rounded-md overflow-hidden">
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${timeRange === '24h' ? 'bg-white/10' : ''}`}
              onClick={() => setTimeRange('24h')}
            >
              24h
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${timeRange === '7d' ? 'bg-white/10' : ''}`}
              onClick={() => setTimeRange('7d')}
            >
              7d
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className={`${timeRange === '30d' ? 'bg-white/10' : ''}`}
              onClick={() => setTimeRange('30d')}
            >
              30d
            </Button>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExportData}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="line">
        <TabsList className="mb-6">
          <TabsTrigger value="line">
            <LineChartIcon className="h-4 w-4 mr-2" />
            Line Chart
          </TabsTrigger>
          <TabsTrigger value="bar">
            <BarChart3 className="h-4 w-4 mr-2" />
            Bar Chart
          </TabsTrigger>
          <TabsTrigger value="table">
            Table View
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="line" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={getLineChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}
                labelStyle={{ color: 'white' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`, 'Total Exposure']}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#FF6384" 
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="bar" className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={getBarChartData()} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)" 
                tick={{ fill: 'rgba(255,255,255,0.7)' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', borderColor: 'rgba(255,255,255,0.1)' }}
                labelStyle={{ color: 'white' }}
                formatter={(value: any) => [`$${value.toLocaleString()}`]}
              />
              <Legend />
              {getMarketNames().map((market, index) => (
                <Bar 
                  key={market} 
                  dataKey={market} 
                  stackId="a" 
                  fill={getChartColors()[index % getChartColors().length]} 
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </TabsContent>
        
        <TabsContent value="table">
          <div className="max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  {getMarketNames().map(market => (
                    <TableHead key={market} className="text-right">{market}</TableHead>
                  ))}
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exposureData.map((dataPoint, index) => (
                  <TableRow key={index}>
                    <TableCell>{dataPoint.date}</TableCell>
                    {getMarketNames().map(market => (
                      <TableCell key={market} className="text-right">
                        ${dataPoint.markets[market].toLocaleString()}
                      </TableCell>
                    ))}
                    <TableCell className="text-right font-medium">
                      ${dataPoint.totalExposure.toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default HistoricalExposure;
