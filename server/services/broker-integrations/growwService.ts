import axios from 'axios';

/**
 * Groww API Service
 * Note: Groww does not have a public official Node.js SDK like Kite or Dhan.
 * We use their REST API directly.
 */

export async function getGrowwAccessToken(apiKey: string, apiSecret: string): Promise<string> {
  try {
    // Placeholder for actual Groww Auth flow
    console.log(`🔐 Authenticating with Groww for API Key: ${apiKey.substring(0, 5)}...`);
    return `groww_token_${Math.random().toString(36).substring(7)}`;
  } catch (error: any) {
    console.error('❌ Groww Auth Error:', error.message);
    throw new Error(`Groww authentication failed: ${error.message}`);
  }
}

export async function fetchGrowwFunds(accessToken: string): Promise<number> {
  try {
    console.log('💰 Fetching funds from Groww...');
    // According to Groww API documentation, we use get_available_margin_details
    // For the REST API implementation, we'll call the margin details endpoint
    const response = await axios.get('https://api.groww.in/v1/margin/details', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.equity_margin_details) {
      // Use cnc_balance_available or clear_cash as per documentation
      return response.data.equity_margin_details.cnc_balance_available || response.data.clear_cash || 0;
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
    // According to Groww API documentation, we use get_order_list
    const response = await axios.get('https://api.groww.in/v1/orders', {
      params: {
        page: 0,
        page_size: 100
      },
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.order_list) {
      return response.data.order_list.map((order: any) => ({
        time: order.created_at,
        order: order.transaction_type, // BUY or SELL
        symbol: order.trading_symbol,
        type: order.order_type, // MARKET, LIMIT, etc.
        qty: order.quantity,
        price: order.average_fill_price || order.price,
        status: order.order_status, // OPEN, COMPLETED, CANCELLED, etc.
        groww_order_id: order.groww_order_id
      }));
    }
    return [];
  } catch (error: any) {
    console.error('❌ Groww Orders Error:', error.message);
    return [];
  }
}
