import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ODDS_API_KEY = Deno.env.get('ODDS_API_KEY');
const ODDS_API_BASE_URL = 'https://api.the-odds-api.com/v4';

interface OddsAPIResponse {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: Array<{
    key: string;
    title: string;
    markets: Array<{
      key: string;
      outcomes: Array<{
        name: string;
        price: number;
      }>;
    }>;
  }>;
}

interface MarketData {
  sport: string;
  marketName: string;
  match: string;
  buyPrice: number;
  sellPrice: number;
  matchTime: string;
  homeTeam: string;
  awayTeam: string;
  odds: {
    home: number;
    away: number;
    draw?: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sport } = await req.json();

    if (!ODDS_API_KEY) {
      console.log('No ODDS_API_KEY found, returning mock data');
      return new Response(JSON.stringify(getMockData(sport)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Map sport names to OddsAPI sport keys
    const sportMapping: Record<string, string> = {
      'cricket': 'cricket_test_match',
      'football': 'soccer_epl', // English Premier League
      'soccer': 'soccer_epl',
      'kabaddi': 'cricket_test_match', // Fallback to cricket for kabaddi
      'tennis': 'tennis_wta',
      'basketball': 'basketball_nba'
    };

    const oddsApiSport = sportMapping[sport] || 'soccer_epl';

    console.log(`Fetching odds for sport: ${sport} (API: ${oddsApiSport})`);

    const response = await fetch(
      `${ODDS_API_BASE_URL}/sports/${oddsApiSport}/odds/?apiKey=${ODDS_API_KEY}&regions=us&markets=h2h&oddsFormat=decimal&dateFormat=iso`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      console.error(`OddsAPI error: ${response.status} ${response.statusText}`);
      return new Response(JSON.stringify(getMockData(sport)), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const oddsData: OddsAPIResponse[] = await response.json();
    
    // Transform OddsAPI data to our format
    const transformedData = oddsData.slice(0, 5).map((match, index) => {
      const homeOdds = match.bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === match.home_team)?.price || 2.0;
      const awayOdds = match.bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === match.away_team)?.price || 2.0;
      const drawOdds = match.bookmakers[0]?.markets[0]?.outcomes.find(o => o.name === 'Draw')?.price;

      return {
        sport: sport,
        marketName: `${match.sport_title} Match`,
        match: `${match.home_team} vs ${match.away_team}`,
        buyPrice: homeOdds,
        sellPrice: awayOdds,
        matchTime: match.commence_time,
        homeTeam: match.home_team,
        awayTeam: match.away_team,
        odds: {
          home: homeOdds,
          away: awayOdds,
          ...(drawOdds && { draw: drawOdds })
        }
      };
    });

    console.log(`Successfully fetched ${transformedData.length} matches for ${sport}`);

    return new Response(JSON.stringify(transformedData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in odds-api function:', error);
    
    // Fallback to mock data on error
    const { sport } = await req.json().catch(() => ({ sport: 'football' }));
    return new Response(JSON.stringify(getMockData(sport)), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function getMockData(sport: string): MarketData[] {
  const mockData: Record<string, MarketData[]> = {
    cricket: [
      {
        sport: 'cricket',
        marketName: 'Cricket Test Match',
        match: 'Bangladesh vs India',
        buyPrice: 2.5,
        sellPrice: 2.2,
        matchTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Bangladesh',
        awayTeam: 'India',
        odds: { home: 2.5, away: 2.2 }
      },
      {
        sport: 'cricket',
        marketName: 'Cricket ODI',
        match: 'Pakistan vs Sri Lanka',
        buyPrice: 1.8,
        sellPrice: 2.1,
        matchTime: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Pakistan',
        awayTeam: 'Sri Lanka',
        odds: { home: 1.8, away: 2.1 }
      }
    ],
    football: [
      {
        sport: 'football',
        marketName: 'Premier League',
        match: 'Manchester United vs Liverpool',
        buyPrice: 2.3,
        sellPrice: 1.9,
        matchTime: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Manchester United',
        awayTeam: 'Liverpool',
        odds: { home: 2.3, away: 1.9, draw: 3.2 }
      },
      {
        sport: 'football',
        marketName: 'Premier League',
        match: 'Arsenal vs Chelsea',
        buyPrice: 2.1,
        sellPrice: 2.0,
        matchTime: new Date(Date.now() + 36 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Arsenal',
        awayTeam: 'Chelsea',
        odds: { home: 2.1, away: 2.0, draw: 3.1 }
      }
    ],
    kabaddi: [
      {
        sport: 'kabaddi',
        marketName: 'Pro Kabaddi League',
        match: 'Bengal Warriors vs Patna Pirates',
        buyPrice: 1.9,
        sellPrice: 2.0,
        matchTime: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        homeTeam: 'Bengal Warriors',
        awayTeam: 'Patna Pirates',
        odds: { home: 1.9, away: 2.0 }
      }
    ]
  };

  return mockData[sport] || mockData.football;
}