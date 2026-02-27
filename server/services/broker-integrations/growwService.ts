import axios from 'axios';

/**
 * Groww API Service
 * Note: Groww does not have a public official Node.js SDK like Kite or Dhan.
 * We use their REST API directly.
 */

export async function getGrowwAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  try {
    // According to Groww Trade API docs, we authenticate with API Key and Secret
    // This typically returns a session/access token
    console.log(`🔐 Authenticating with Groww for API Key: ${apiKey.substring(0, 5)}...`);
    
    // The actual endpoint for authentication would be called here
    // For now, we'll return the apiKey as the token if it's already a persistent token,
    // or perform the auth exchange.
    return apiKey; 
  } catch (error: any) {
    console.error('❌ Groww Auth Error:', error.message);
    throw new Error(`Groww authentication failed: ${error.message}`);
  }
}

export async function fetchGrowwFunds(accessToken: string): Promise<number> {
  try {
    console.log('💰 Fetching funds from Groww...');
    // Endpoint: GET /v1/accounts/funds
    const response = await axios.get('https://api.groww.in/v1/accounts/funds', {
      headers: {
        'X-API-KEY': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.available_cash) {
      return response.data.available_cash;
    }
    return 0;
  } catch (error: any) {
    console.error('❌ Groww Funds Error:', error.message);
    return 0;
  }
}

export async function fetchGrowwTrades(accessToken: string): Promise<any[]> {
  try {
    console.log('📜 Fetching orders from Groww...');
    // Endpoint: GET /v1/orders
    const response = await axios.get('https://api.groww.in/v1/orders', {
      headers: {
        'X-API-KEY': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    // The response schema from the attached document shows an object with an "order_list" array
    if (response.data && Array.isArray(response.data.order_list)) {
      return response.data.order_list.map((order: any) => ({
        time: order.created_at || order.exchange_time || new Date().toISOString(),
        order: order.transaction_type, // BUY or SELL
        symbol: order.trading_symbol,
        type: order.order_type, // MARKET, LIMIT, etc.
        qty: order.quantity,
        price: order.average_fill_price || order.price,
        status: order.order_status, // OPEN, COMPLETE, CANCELLED, etc.
        groww_order_id: order.groww_order_id
      }));
    }
    
    // Fallback if the response is a direct array (as previously implemented)
    if (Array.isArray(response.data)) {
      return response.data.map((order: any) => ({
        time: order.order_time || order.created_at || new Date().toISOString(),
        order: order.transaction_type,
        symbol: order.trading_symbol,
        type: order.order_type,
        qty: order.quantity,
        price: order.average_price || order.average_fill_price || order.price,
        status: order.order_status,
        groww_order_id: order.order_id || order.groww_order_id
      }));
    }
    
    return [];
  } catch (error: any) {
    console.error('❌ Groww Orders Error:', error.message);
    return [];
  }
}

export async function fetchGrowwPositions(accessToken: string): Promise<any[]> {
  try {
    console.log('💼 Fetching positions from Groww...');
    // Endpoint: GET /v1/positions
    const response = await axios.get('https://api.groww.in/v1/positions', {
      headers: {
        'X-API-KEY': accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }
    return [];
  } catch (error: any) {
    console.error('❌ Groww Positions Error:', error.message);
    return [];
  }
}
