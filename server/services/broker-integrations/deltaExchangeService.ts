import axios from 'axios';
import crypto from 'crypto';
import type { BrokerTrade } from "@shared/schema";

export interface DeltaOrder {
  id: number;
  product_symbol: string;
  side: 'buy' | 'sell';
  order_type: string;
  limit_price: string;
  size: number;
  state: string;
  created_at: string;
}

function generateSignature(secret: string, message: string) {
  return crypto.createHmac('sha256', secret).update(message).digest('hex');
}

export async function fetchDeltaTrades(apiKey: string, apiSecret: string): Promise<BrokerTrade[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/v2/orders/history';
    const query = '?page_size=50';
    const payload = '';
    
    const signatureData = method + timestamp + path + query + payload;
    const signature = generateSignature(apiSecret, signatureData);

    const response = await axios.get(`https://api.india.delta.exchange${path}${query}`, {
      headers: {
        'api-key': apiKey,
        'timestamp': timestamp,
        'signature': signature,
        'User-Agent': 'replit-agent',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data.success) return [];

    const orders: DeltaOrder[] = response.data.result || [];
    return orders.map(order => ({
      time: new Date(parseInt(order.created_at) / 1000).toLocaleTimeString(),
      order: order.side.toUpperCase() as 'BUY' | 'SELL',
      symbol: order.product_symbol,
      qty: order.size,
      price: parseFloat(order.limit_price || '0'),
      type: order.order_type === 'limit_order' ? 'LIMIT' : 'MARKET',
      status: order.state.toUpperCase() === 'CLOSED' ? 'COMPLETE' : order.state.toUpperCase(),
      pnl: '-',
      duration: '-'
    }));
  } catch (error) {
    console.error('Error fetching Delta trades:', error);
    return [];
  }
}

export async function fetchDeltaPositions(apiKey: string, apiSecret: string): Promise<any[]> {
  try {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const method = 'GET';
    const path = '/v2/positions';
    const query = '';
    const payload = '';
    
    const signatureData = method + timestamp + path + query + payload;
    const signature = generateSignature(apiSecret, signatureData);

    const response = await axios.get(`https://api.india.delta.exchange${path}`, {
      headers: {
        'api-key': apiKey,
        'timestamp': timestamp,
        'signature': signature,
        'User-Agent': 'replit-agent',
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    if (!response.data.success) return [];

    const positions = response.data.result || [];
    return positions.map((pos: any) => ({
      symbol: pos.product_symbol,
      entryPrice: parseFloat(pos.entry_price || '0'),
      currentPrice: parseFloat(pos.mark_price || '0'),
      qty: parseFloat(pos.size || '0'),
      unrealizedPnl: parseFloat(pos.unrealized_pnl || '0'),
      status: parseFloat(pos.size) !== 0 ? 'OPEN' : 'CLOSED',
      returnPercent: pos.entry_price ? ((parseFloat(pos.unrealized_pnl) / (parseFloat(pos.entry_price) * Math.abs(parseFloat(pos.size)))) * 100).toFixed(2) : "0.00"
    }));
  } catch (error) {
    console.error('Error fetching Delta positions:', error);
    return [];
  }
}
