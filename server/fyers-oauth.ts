// Fyers OAuth 2.0 Implementation
import axios from 'axios';
import crypto from 'crypto';

interface FyersOAuthState {
  accessToken: string | null;
  userId: string | null;
  userEmail: string | null;
  userName: string | null;
  isAuthenticated: boolean;
  tokenExpiry: Date | null;
  lastRefresh: Date | null;
}

interface FyersTokenResponse {
  s: string;
  code: number;
  message: string;
  access_token: string;
}

interface FyersProfileResponse {
  s: string;
  code: number;
  message: string;
  data: {
    fy_id: string;
    name: string;
    email_id: string;
    display_name: string;
  };
}

class FyersOAuthManager {
  private state: FyersOAuthState = {
    accessToken: null,
    userId: null,
    userEmail: null,
    userName: null,
    isAuthenticated: false,
    tokenExpiry: null,
    lastRefresh: null,
  };

  private appId: string;
  private secretKey: string;
  private redirectUri: string;
  private oauthStates: Map<string, { state: string; createdAt: Date }> = new Map();

  constructor(appId?: string, secretKey?: string) {
    this.appId = appId || process.env.FYERS_APP_ID || '';
    this.secretKey = secretKey || process.env.FYERS_SECRET_KEY || '';
    this.redirectUri = `http://localhost:5000/api/fyers/callback`;

    console.log('🔵 [FYERS] OAuth Manager initialized');
    if (!this.appId || !this.secretKey) {
      console.error('🔴 [FYERS] CRITICAL: Missing Fyers credentials!');
    }
  }

  generateAuthorizationUrl(domain?: string): { url: string; state: string } {
    if (!this.appId || !this.secretKey) {
      throw new Error('Fyers credentials not configured.');
    }

    const state = crypto.randomBytes(32).toString('hex');
    let redirectUri = this.redirectUri;
    
    if (domain) {
      const protocol = (domain.includes('localhost') || domain.includes('127.0.0.1')) ? 'http' : 'https';
      const cleanDomain = domain.split(':')[0];
      redirectUri = `${protocol}://${cleanDomain}/api/fyers/callback`;
    }

    const params = new URLSearchParams({
      client_id: this.appId,
      redirect_uri: redirectUri,
      response_type: 'code',
      state: state,
    });

    const authUrl = `https://api-t1.fyers.in/api/v3/generate-authcode?${params.toString()}`;
    this.oauthStates.set(state, { state, createdAt: new Date() });

    return { url: authUrl, state };
  }

  async exchangeCodeForToken(code: string, state: string): Promise<boolean> {
    try {
      if (!this.oauthStates.has(state)) {
        console.error('🔴 [FYERS] Invalid state parameter');
        return false;
      }
      this.oauthStates.delete(state);

      const appIdHash = crypto.createHash('sha256').update(`${this.appId}:${this.secretKey}`).digest('hex');

      const response = await axios.post('https://api-t1.fyers.in/api/v3/validate-authcode', {
        grant_type: 'authorization_code',
        appIdHash: appIdHash,
        code: code,
      });

      if (response.data.s === 'ok' && response.data.access_token) {
        this.state.accessToken = response.data.access_token;
        this.state.isAuthenticated = true;
        this.state.lastRefresh = new Date();
        this.state.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // Fyers tokens usually last 24h

        await this.fetchUserProfile();
        return true;
      }
      return false;
    } catch (error: any) {
      console.error('🔴 [FYERS] Token exchange error:', error.message);
      return false;
    }
  }

  private async fetchUserProfile(): Promise<void> {
    try {
      if (!this.state.accessToken) return;

      const appIdHash = crypto.createHash('sha256').update(`${this.appId}:${this.secretKey}`).digest('hex');
      const response = await axios.get('https://api-t1.fyers.in/api/v3/profile', {
        headers: {
          'Authorization': `${this.appId}:${this.state.accessToken}`
        }
      });

      if (response.data.s === 'ok') {
        this.state.userId = response.data.data.fy_id;
        this.state.userEmail = response.data.data.email_id;
        this.state.userName = response.data.data.display_name || response.data.data.name;
      }
    } catch (error: any) {
      console.error('🔴 [FYERS] Profile fetch error:', error.message);
    }
  }

  getStatus() {
    return {
      connected: this.state.isAuthenticated,
      authenticated: this.state.isAuthenticated,
      accessToken: this.state.accessToken,
      userId: this.state.userId,
      userEmail: this.state.userEmail,
      userName: this.state.userName,
    };
  }

  disconnect(): void {
    this.state = {
      accessToken: null,
      userId: null,
      userEmail: null,
      userName: null,
      isAuthenticated: false,
      tokenExpiry: null,
      lastRefresh: null,
    };
  }
}

export const fyersOAuthManager = new FyersOAuthManager();
