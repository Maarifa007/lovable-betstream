import { getUserAccount, saveUserAccount, getUserBets, saveBets } from "@/utils/betUtils";
import { closePosition, placeBet } from "@/utils/positionUtils";
import { toast } from "@/hooks/use-toast";
import marketScraper, { MatchData } from "@/services/marketScraperService";
import { teamKeywords, sportTerms } from "@/utils/teamsKeywords";

/**
 * Execute a trade via API
 * @param data Trade data
 * @returns Result with success status and details
 */
export const executeTrade = async (data: {
  matchId: string,
  matchName: string,
  action: 'buy' | 'sell',
  stake: number,
  userId: string,
  multiplier: number,
  accountType: 'cash' | 'free'
}) => {
  try {
    console.log("📝 Executing trade:", data);
    
    // Get latest price for the market from scraper service
    const sport = guessSportFromMatchName(data.matchName);
    let price = 0;
    
    try {
      // Extract home and away teams from matchName
      const [home, away] = data.matchName.split(' vs ');
      
      if (home && away) {
        // Create match data object for specific match scraping
        const matchData: MatchData = {
          home,
          away,
          sportType: sport
        };
        
        // Fetch markets specifically for this match
        const matchMarkets = await marketScraper.fetchMatchMarkets([matchData]);
        
        if (matchMarkets.length > 0) {
          // Use the first market found
          price = data.action === 'buy' ? matchMarkets[0].buyPrice : matchMarkets[0].sellPrice;
          console.log(`✅ Found market price: ${price} for ${data.matchName}`);
        } else {
          // Try to get latest price from regular market scraper
          const markets = await marketScraper.fetchMarkets(sport);
          const market = markets.find(m => 
            m.match.toLowerCase().includes(data.matchName.toLowerCase())
          );
          
          if (market) {
            price = data.action === 'buy' ? market.buyPrice : market.sellPrice;
            console.log(`✅ Found market price: ${price} for ${data.matchName}`);
          } else {
            // Fallback to sample prices if market not found
            price = data.action === 'buy' ? 3.2 : 2.8;
            console.log(`⚠️ Using fallback price: ${price} for ${data.matchName}`);
          }
        }
      } else {
        // If we couldn't extract home/away, fall back to regular market search
        const markets = await marketScraper.fetchMarkets(sport);
        const market = markets.find(m => 
          m.match.toLowerCase().includes(data.matchName.toLowerCase())
        );
        
        if (market) {
          price = data.action === 'buy' ? market.buyPrice : market.sellPrice;
          console.log(`✅ Found market price: ${price} for ${data.matchName}`);
        } else {
          // Fallback to sample prices if market not found
          price = data.action === 'buy' ? 3.2 : 2.8;
          console.log(`⚠️ Using fallback price: ${price} for ${data.matchName}`);
        }
      }
    } catch (error) {
      console.error("Error getting market price:", error);
      // Fallback to sample prices if there's an error
      price = data.action === 'buy' ? 3.2 : 2.8;
    }
    
    // Place the bet
    const result = placeBet(
      data.userId,
      data.matchName,
      data.action,
      price,
      data.stake,
      data.multiplier
    );
    
    if (!result.success) {
      throw new Error(result.message || "Failed to place bet");
    }
    
    // Get updated balance
    const account = getUserAccount(data.userId);
    const newBalance = account.accountType === 'free' ? account.virtualBalance : account.walletBalance;
    
    return {
      success: true,
      positionId: result.betId,
      newBalance,
      message: result.message,
      entryPrice: price
    };
  } catch (error) {
    console.error("❌ Trade execution error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Close a position via API
 * @param data Position closure data
 * @returns Result with success status and details
 */
export const closePositionApi = async (data: {
  positionId?: string,
  matchName?: string, // Either positionId or matchName is required
  userId: string,
  percentageToClose: number // 0.5 for 50%, 1.0 for full
}) => {
  try {
    console.log("📝 Closing position:", data);
    
    // Validate input
    if (!data.positionId && !data.matchName) {
      throw new Error("Either positionId or matchName is required");
    }
    
    if (data.percentageToClose <= 0 || data.percentageToClose > 1) {
      throw new Error("Percentage to close must be between 0.01 and 1.0");
    }
    
    // Get the bet
    const bets = getUserBets();
    let bet;
    
    if (data.positionId) {
      bet = bets.find(b => b.id === data.positionId);
    } else if (data.matchName) {
      bet = bets.find(b => 
        b.matchName?.toLowerCase().includes(data.matchName.toLowerCase()) &&
        (b.status === 'open' || b.status === 'partially_closed')
      );
    }
    
    if (!bet) {
      throw new Error(`No open position found for ${data.positionId || data.matchName}`);
    }
    
    // Get latest price for the market
    const sport = guessSportFromMatchName(bet.matchName || "");
    let currentPrice = 0;
    
    try {
      // Extract home and away teams from matchName
      if (bet.matchName) {
        const [home, away] = bet.matchName.split(' vs ');
        
        if (home && away) {
          // Create match data object for specific match scraping
          const matchData: MatchData = {
            home,
            away,
            sportType: sport
          };
          
          // Fetch markets specifically for this match
          const matchMarkets = await marketScraper.fetchMatchMarkets([matchData]);
          
          if (matchMarkets.length > 0) {
            // Use the mid-price for settlement from the first market
            currentPrice = (matchMarkets[0].buyPrice + matchMarkets[0].sellPrice) / 2;
            console.log(`✅ Found market price: ${currentPrice} for ${bet.matchName}`);
          } else {
            // Try regular market scraper
            const markets = await marketScraper.fetchMarkets(sport);
            const market = markets.find(m => 
              m.match.toLowerCase().includes(bet.matchName?.toLowerCase() || "")
            );
            
            if (market) {
              // Use the mid-price for settlement
              currentPrice = (market.buyPrice + market.sellPrice) / 2;
              console.log(`✅ Found market price: ${currentPrice} for ${bet.matchName}`);
            } else {
              // Fallback - use a price that gives a small profit
              currentPrice = bet.betType === 'buy' ? bet.betPrice + 0.2 : bet.betPrice - 0.2;
              console.log(`⚠️ Using fallback price: ${currentPrice} for ${bet.matchName}`);
            }
          }
        } else {
          // If we couldn't extract home/away, fall back to regular market search
          const markets = await marketScraper.fetchMarkets(sport);
          const market = markets.find(m => 
            m.match.toLowerCase().includes(bet.matchName?.toLowerCase() || "")
          );
          
          if (market) {
            // Use the mid-price for settlement
            currentPrice = (market.buyPrice + market.sellPrice) / 2;
            console.log(`✅ Found market price: ${currentPrice} for ${bet.matchName}`);
          } else {
            // Fallback - use a price that gives a small profit
            currentPrice = bet.betType === 'buy' ? bet.betPrice + 0.2 : bet.betPrice - 0.2;
            console.log(`⚠️ Using fallback price: ${currentPrice} for ${bet.matchName}`);
          }
        }
      } else {
        // Fallback - use a price that gives a small profit
        currentPrice = bet.betType === 'buy' ? bet.betPrice + 0.2 : bet.betPrice - 0.2;
      }
    } catch (error) {
      console.error("Error getting market price:", error);
      // Fallback - use a price that gives a small profit
      currentPrice = bet.betType === 'buy' ? bet.betPrice + 0.2 : bet.betPrice - 0.2;
    }
    
    // Convert percentage to whole number for our utility function
    const percentageWholeNumber = Math.round(data.percentageToClose * 100);
    
    // Close the position
    const result = closePosition(
      data.userId,
      bet.id,
      percentageWholeNumber,
      currentPrice
    );
    
    if (!result.success) {
      throw new Error(result.message || "Failed to close position");
    }
    
    // Get updated balance
    const account = getUserAccount(data.userId);
    const newBalance = account.accountType === 'free' ? account.virtualBalance : account.walletBalance;
    
    return {
      success: true,
      positionId: result.positionId,
      profitLoss: result.profitLoss,
      collateralReleased: result.collateralReleased,
      newStatus: result.newStatus,
      newBalance,
      message: result.message,
      currentPrice
    };
  } catch (error) {
    console.error("❌ Position closure error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error)
    };
  }
};

/**
 * Guess the sport based on team names in the match
 */
function guessSportFromMatchName(matchName: string): 'football' | 'basketball' | 'tennis' | 'golf' | 'baseball' {
  const normalizedMatch = matchName.toLowerCase();
  
  // Check for baseball patterns first (common format differences)
  if (
    normalizedMatch.includes(' at ') || // Common format for baseball games
    /\s+vs\s+.*\s+(\d+th|\d+nd|\d+rd|\d+st)\s+inning/i.test(normalizedMatch) || // Inning references
    /\([0-9]+-[0-9]+\)/.test(normalizedMatch) // Common baseball score format
  ) {
    return 'baseball';
  }
  
  // Check through all teams in our keywords mapping
  // MLB Teams
  for (const team of teamKeywords.MLB) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      return 'baseball';
    }
  }
  
  // NBA Teams
  for (const team of teamKeywords.NBA) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      return 'basketball';
    }
  }
  
  // NCAAB Teams (also basketball)
  for (const team of teamKeywords.NCAAB) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      return 'basketball';
    }
  }
  
  // NFL Teams
  for (const team of teamKeywords.NFL) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      return 'football';
    }
  }
  
  // NCAAF Teams (also football)
  for (const team of teamKeywords.NCAAF) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      return 'football';
    }
  }
  
  // NHL Teams (hockey - we'll map this to closest supported type)
  for (const team of teamKeywords.NHL) {
    if (normalizedMatch.includes(team.toLowerCase())) {
      // Hockey isn't directly supported, so we'll default to baseball
      // This is a compromise until hockey is fully supported
      return 'baseball';
    }
  }
  
  // Check for sport-specific terms
  for (const term of sportTerms.baseball) {
    if (normalizedMatch.includes(term.toLowerCase())) {
      return 'baseball';
    }
  }
  
  for (const term of sportTerms.basketball) {
    if (normalizedMatch.includes(term.toLowerCase())) {
      return 'basketball';
    }
  }
  
  for (const term of sportTerms.football) {
    if (normalizedMatch.includes(term.toLowerCase())) {
      return 'football';
    }
  }
  
  // Fallback to original keyword check for sports we haven't expanded yet
  const sportKeywords = {
    football: ['united', 'fc', 'city', 'arsenal', 'chelsea', 'liverpool', 'madrid', 'barcelona', 'west ham', 'leicester'],
    basketball: ['lakers', 'bulls', 'warriors', 'celtics', 'heat', 'knicks', 'bucks', 'raptors', 'nba'],
    tennis: ['djokovic', 'nadal', 'federer', 'murray', 'williams', 'osaka', 'atp', 'wta'],
    golf: ['woods', 'mcilroy', 'masters', 'open', 'championship', 'pga'],
    baseball: ['yankees', 'red sox', 'cubs', 'dodgers', 'astros', 'mets', 'cardinals', 'mlb', 'giants', 'braves', 'nationals', 'angels', 'blue jays', 'mariners', 'twins', 'brewers', 'phillies', 'rangers', 'padres', 'orioles', 'royals', 'athletics', 'pirates', 'marlins', 'rays', 'rockies', 'white sox', 'diamondbacks', 'tigers']
  };
  
  for (const [sport, keywords] of Object.entries(sportKeywords)) {
    for (const keyword of keywords) {
      if (normalizedMatch.includes(keyword)) {
        return sport as any;
      }
    }
  }
  
  // Default to football if no match
  return 'football';
}

/**
 * Mock API endpoint for place-trade (in real app, this would be a backend route)
 */
export const mockPlaceTradeEndpoint = async (req: any) => {
  try {
    // In a real app, this would extract data from req.body
    const data = req.body || req;
    
    // Validate required fields
    const requiredFields = ['matchId', 'action', 'stake', 'userId', 'multiplier', 'accountType', 'matchName'];
    for (const field of requiredFields) {
      if (!data[field]) {
        return {
          status: 400,
          json: {
            success: false,
            message: `Missing required field: ${field}`
          }
        };
      }
    }
    
    // Execute the trade
    const result = await executeTrade({
      matchId: data.matchId,
      matchName: data.matchName,
      action: data.action,
      stake: data.stake,
      userId: data.userId,
      multiplier: data.multiplier,
      accountType: data.accountType
    });
    
    if (!result.success) {
      return {
        status: 400,
        json: {
          success: false,
          message: result.message
        }
      };
    }
    
    return {
      status: 200,
      json: {
        success: true,
        positionId: result.positionId,
        newBalance: result.newBalance,
        message: result.message,
        entryPrice: result.entryPrice
      }
    };
  } catch (error) {
    console.error("❌ Place trade endpoint error:", error);
    return {
      status: 500,
      json: {
        success: false,
        message: "Internal server error"
      }
    };
  }
};

/**
 * Mock API endpoint for close-position (in real app, this would be a backend route)
 */
export const mockClosePositionEndpoint = async (req: any) => {
  try {
    // In a real app, this would extract data from req.body
    const data = req.body || req;
    
    // Validate required fields
    if (!data.userId) {
      return {
        status: 400,
        json: {
          success: false,
          message: "Missing required field: userId"
        }
      };
    }
    
    if (!data.positionId && !data.matchName) {
      return {
        status: 400,
        json: {
          success: false,
          message: "Either positionId or matchName is required"
        }
      };
    }
    
    if (!data.percentageToClose) {
      return {
        status: 400,
        json: {
          success: false,
          message: "Missing required field: percentageToClose"
        }
      };
    }
    
    // Close the position
    const result = await closePositionApi({
      positionId: data.positionId,
      matchName: data.matchName,
      userId: data.userId,
      percentageToClose: data.percentageToClose
    });
    
    if (!result.success) {
      return {
        status: 400,
        json: {
          success: false,
          message: result.message
        }
      };
    }
    
    return {
      status: 200,
      json: {
        success: true,
        positionId: result.positionId,
        profitLoss: result.profitLoss,
        collateralReleased: result.collateralReleased,
        newStatus: result.newStatus,
        newBalance: result.newBalance,
        message: result.message,
        currentPrice: result.currentPrice
      }
    };
  } catch (error) {
    console.error("❌ Close position endpoint error:", error);
    return {
      status: 500,
      json: {
        success: false,
        message: "Internal server error"
      }
    };
  }
};
