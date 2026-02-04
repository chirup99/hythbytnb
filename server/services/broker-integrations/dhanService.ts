import axios from 'axios';
import { dhanOAuthManager } from '../../dhan-oauth';
import type { DhanCredentials, BrokerTrade } from "@shared/schema";

export interface DhanTrade {
  time: string;
  order: 'BUY' | 'SELL';
  symbol: string;
  qty: number;
  price: number;
  pnl: string;
  type: string;
  status: string;
}

export interface DhanPosition {
  symbol: string;
  entry_price: number;
  current_price: number;
  qty: number;
  quantity: number;
  unrealized_pnl: number;
  unrealizedPnl: number;
  return_percent: string;
  returnPercent: string;
  status: string;
}

export async function fetchDhanTrades(): Promise<DhanTrade[]> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) {
      console.error('❌ [DHAN] No access token available');
      return [];
    }

    console.log('📊 [DHAN] Fetching trades...');
    
    // Call Dhan API to get trades/orders
    // Dhan API requires access-token header
    const response = await axios.get('https://api.dhan.co/v2/orders', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const orders = response.data?.data || [];

    // Transform Dhan orders to our trade format
    const trades: DhanTrade[] = orders.map((order: any) => {
      const statusUpper = String(order.orderStatus || order.status || '').toUpperCase();
      let mappedStatus = 'PENDING';
      
      if (statusUpper.includes('COMPLETE') || statusUpper.includes('EXECUTED')) {
        mappedStatus = 'COMPLETE';
      } else if (statusUpper.includes('REJECT')) {
        mappedStatus = 'REJECTED';
      } else if (statusUpper.includes('CANCEL')) {
        mappedStatus = 'CANCELLED';
      }

      return {
        time: order.orderDateTime ? new Date(order.orderDateTime).toLocaleTimeString() : '-',
        order: order.transactionType === 'BUY' ? 'BUY' : 'SELL',
        symbol: order.symbol || order.tradingSymbol || 'N/A',
        qty: order.quantity || 0,
        price: order.averagePrice || order.price || 0,
        pnl: order.pnl ? `₹${order.pnl.toFixed(2)}` : '-',
        type: order.orderType || 'MARKET',
        status: mappedStatus
      };
    });

    console.log(`✅ [DHAN] Fetched ${trades.length} trades`);
    return trades;
  } catch (error: any) {
    console.error('❌ [DHAN] Error fetching trades:', error.message);
    return [];
  }
}

export async function fetchDhanPositions(): Promise<DhanPosition[]> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) {
      console.error('❌ [DHAN] No access token available');
      return [];
    }

    console.log('📊 [DHAN] Fetching positions...');
    
    // Call Dhan API to get positions
    // Dhan API requires access-token header
    const response = await axios.get('https://api.dhan.co/v2/positions', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const positionsData = response.data?.data || [];

    // Group by symbol and consolidate
    const positionMap = new Map();

    positionsData.forEach((pos: any) => {
      const symbol = pos.symbol || pos.tradingSymbol || 'N/A';
      if (!positionMap.has(symbol)) {
        positionMap.set(symbol, {
          symbol: symbol,
          entry_price: pos.averagePrice || pos.entryPrice || 0,
          current_price: pos.lastPrice || pos.currentPrice || 0,
          qty: pos.quantity || 0,
          quantity: pos.quantity || 0,
          unrealized_pnl: pos.unrealizedPnl || 0,
          unrealizedPnl: pos.unrealizedPnl || 0,
          status: (pos.quantity || 0) > 0 ? 'OPEN' : 'CLOSED'
        });
      } else {
        // Consolidate positions with same symbol
        const existing = positionMap.get(symbol);
        existing.qty += pos.quantity || 0;
        existing.quantity += pos.quantity || 0;
        existing.unrealized_pnl += pos.unrealizedPnl || 0;
        existing.unrealizedPnl += pos.unrealizedPnl || 0;
      }
    });

    // Convert to array and calculate return percentage
    const positions: DhanPosition[] = Array.from(positionMap.values()).map((pos: any) => ({
      ...pos,
      return_percent: pos.unrealizedPnl && pos.entry_price && pos.qty 
        ? ((pos.unrealizedPnl / (pos.entry_price * pos.qty)) * 100).toFixed(2) 
        : "0.00",
      returnPercent: pos.unrealizedPnl && pos.entry_price && pos.qty 
        ? ((pos.unrealizedPnl / (pos.entry_price * pos.qty)) * 100).toFixed(2) 
        : "0.00"
    }));

    console.log(`✅ [DHAN] Fetched ${positions.length} positions`);
    return positions;
  } catch (error: any) {
    console.error('❌ [DHAN] Error fetching positions:', error.message);
    return [];
  }
}

export async function fetchDhanMargins(): Promise<number> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) {
      console.error('❌ [DHAN] No access token available');
      return 0;
    }

    console.log('📊 [DHAN] Fetching available funds...');
    
    // Call Dhan API to get fund/limit details
    // Official Dhan API uses /v2/fundlimit
    const response = await axios.get('https://api.dhan.co/v2/fundlimit', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Available funds in Dhan API response
    // Official Dhan API uses /v2/fundlimit and returns dhanCash
    const availableFunds = response.data?.dhanCash || response.data?.availableBalance || 0;

    console.log(`✅ [DHAN] Available funds: ₹${availableFunds}`);
    return availableFunds;
  } catch (error: any) {
    console.error('❌ [DHAN] Error fetching margins:', error.message);
    return 0;
  }
}
