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
    if (!accessToken) return [];

    const response = await axios.get('https://api.dhan.co/v2/orders', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const orders = response.data?.data || response.data || [];
    return orders.map((order: any) => {
      const statusUpper = String(order.orderStatus || order.status || '').toUpperCase();
      let mappedStatus = 'PENDING';
      if (['TRADED', 'EXECUTED', 'COMPLETE', 'SUCCESS'].includes(statusUpper)) mappedStatus = 'COMPLETE';
      else if (statusUpper.includes('REJECT')) mappedStatus = 'REJECTED';
      else if (statusUpper.includes('CANCEL')) mappedStatus = 'CANCELLED';

      return {
        time: order.orderDateTime || order.updateTime ? new Date(order.orderDateTime || order.updateTime).toLocaleTimeString() : '-',
        order: (order.transactionType || order.side || '').toUpperCase() === 'SELL' ? 'SELL' : 'BUY',
        symbol: order.tradingSymbol || order.symbol || 'N/A',
        qty: Number(order.quantity || order.qty || 0),
        price: Number(order.averagePrice || order.price || 0),
        pnl: order.pnl ? `₹${Number(order.pnl).toFixed(2)}` : '-',
        type: order.orderType || 'MARKET',
        status: mappedStatus
      };
    });
  } catch (error) {
    return [];
  }
}

export async function fetchDhanPositions(): Promise<DhanPosition[]> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) return [];

    const response = await axios.get('https://api.dhan.co/v2/positions', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    const positionsData = response.data?.data || response.data || [];
    return positionsData.map((pos: any) => {
      const quantity = Number(pos.netQty || pos.quantity || 0);
      const entryPrice = Number(pos.buyAvg || pos.avgCostPrice || pos.averagePrice || pos.entryPrice || 0);
      const unrealizedPnl = Number(pos.unrealizedProfit || pos.unrealizedPnl || 0);
      return {
        symbol: pos.tradingSymbol || pos.symbol || 'N/A',
        entry_price: entryPrice,
        current_price: Number(pos.lastPrice || pos.currentPrice || 0),
        qty: quantity,
        quantity: quantity,
        unrealized_pnl: unrealizedPnl,
        unrealizedPnl: unrealizedPnl,
        return_percent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        returnPercent: entryPrice && quantity ? ((unrealizedPnl / (entryPrice * Math.abs(quantity))) * 100).toFixed(2) : "0.00",
        status: quantity !== 0 ? 'OPEN' : 'CLOSED'
      };
    });
  } catch (error) {
    return [];
  }
}

export async function fetchDhanMargins(): Promise<number> {
  try {
    const accessToken = dhanOAuthManager.getAccessToken();
    if (!accessToken) return 0;

    const response = await axios.get('https://api.dhan.co/v2/fundlimit', {
      headers: { 'access-token': accessToken, 'Content-Type': 'application/json' },
      timeout: 10000
    });

    return response.data?.availabelBalance ?? response.data?.availableBalance ?? response.data?.dhanCash ?? 0;
  } catch (error) {
    return 0;
  }
}
