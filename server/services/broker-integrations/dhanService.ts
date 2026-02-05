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
    const response = await axios.get('https://api.dhan.co/v2/orders', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const orders = response.data?.data || response.data || [];

    // Transform Dhan orders to our trade format
    const trades: DhanTrade[] = orders.map((order: any) => {
      const statusUpper = String(order.orderStatus || order.status || '').toUpperCase();
      let mappedStatus = 'PENDING';
      
      if (statusUpper === 'TRADED' || statusUpper === 'EXECUTED' || statusUpper === 'COMPLETE' || statusUpper === 'SUCCESS') {
        mappedStatus = 'COMPLETE';
      } else if (statusUpper.includes('REJECT')) {
        mappedStatus = 'REJECTED';
      } else if (statusUpper.includes('CANCEL')) {
        mappedStatus = 'CANCELLED';
      }

      const qty = Number(order.quantity || order.qty || 0);
      const price = Number(order.averagePrice || order.price || 0);

      return {
        time: order.orderDateTime || order.updateTime ? new Date(order.orderDateTime || order.updateTime).toLocaleTimeString() : '-',
        order: (order.transactionType || order.side || '').toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
        symbol: order.tradingSymbol || order.symbol || 'N/A',
        qty: qty,
        price: price,
        pnl: order.pnl ? `₹${Number(order.pnl).toFixed(2)}` : '-',
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
    
    const response = await axios.get('https://api.dhan.co/v2/positions', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    const positionsData = response.data?.data || response.data || [];

    // Map Dhan positions to our internal format
    const positions: DhanPosition[] = positionsData.map((pos: any) => {
      const quantity = Number(pos.netQty || pos.quantity || 0);
      const entryPrice = Number(pos.avgCost || pos.averagePrice || pos.entryPrice || 0);
      const lastPrice = Number(pos.lastPrice || pos.currentPrice || 0);
      const unrealizedPnl = Number(pos.unrealizedProfit || pos.unrealizedPnl || 0);
      
      return {
        symbol: pos.tradingSymbol || pos.symbol || 'N/A',
        entry_price: entryPrice,
        current_price: lastPrice,
        qty: quantity,
        quantity: quantity,
        unrealized_pnl: unrealizedPnl,
        unrealizedPnl: unrealizedPnl,
        return_percent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        returnPercent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        status: quantity !== 0 ? 'OPEN' : 'CLOSED'
      };
    });

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
    
    const response = await axios.get('https://api.dhan.co/v2/fundlimit', {
      headers: {
        'access-token': accessToken,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      timeout: 10000
    });

    // Available funds in Dhan API response
    // Per Dhan docs: "availabelBalance" (typo)
    const availableFunds = response.data?.availabelBalance ?? 
                           response.data?.availableBalance ?? 
                           response.data?.dhanCash ?? 
                           response.data?.data?.availabelBalance ?? 
                           response.data?.data?.availableBalance ?? 0;

    console.log(`✅ [DHAN] Available funds: ₹${availableFunds}`);
    return availableFunds;
  } catch (error: any) {
    console.error('❌ [DHAN] Error fetching margins:', error.message);
    return 0;
  }
}
