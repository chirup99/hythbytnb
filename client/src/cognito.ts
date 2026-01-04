import { Amplify } from 'aws-amplify';
import { 
  signIn, 
  signUp, 
  signOut, 
  getCurrentUser, 
  fetchAuthSession,
  signInWithRedirect,
  fetchUserAttributes,
  resetPassword,
  confirmResetPassword,
  sendUserAttributeVerificationCode,
  confirmUserAttribute
} from 'aws-amplify/auth';

async function exchangeCodeForSession(): Promise<boolean> {
  try {
    const session = await fetchAuthSession({ forceRefresh: true });
    return !!session.tokens?.idToken;
  } catch (error) {
    console.error('Failed to exchange code for session:', error);
    return false;
  }
}

// Dynamically determine redirect URLs based on current origin
// This ensures OAuth works from both dev domain and production domain
export const getRedirectUrl = () => {
  const currentOrigin = window.location.origin;
  const prodDomain = 'https://perala.in';
  
  // If we're on perala.in, use perala.in redirects
  // Otherwise use current origin (for Replit dev domain)
  if (currentOrigin.includes('perala.in')) {
    return `${prodDomain}/landing`;
  }
  return `${currentOrigin}/landing`;
};

const cognitoConfig = {
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID || '',
      userPoolClientId: import.meta.env.VITE_COGNITO_APP_CLIENT_ID || '',
      loginWith: {
        oauth: {
          domain: import.meta.env.VITE_COGNITO_DOMAIN || '',
          scopes: ['openid', 'email', 'profile'],
          redirectSignIn: [
            'https://perala.in/landing',
            'http://localhost:5000/landing',
            window.location.origin + '/landing'
          ],
          redirectSignOut: [
            'https://perala.in/landing',
            'http://localhost:5000/landing',
            window.location.origin + '/landing'
          ],
          responseType: 'code' as const,
        },
      },
    },
  },
};

let isConfigured = false;

export function initializeCognito() {
  if (isConfigured) return;
  
  const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const clientId = import.meta.env.VITE_COGNITO_APP_CLIENT_ID;
  
  if (!userPoolId || !clientId) {
    console.warn('⚠️ AWS Cognito credentials not configured. Set VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_APP_CLIENT_ID');
    return;
  }
  
  try {
    Amplify.configure(cognitoConfig);
    isConfigured = true;
    console.log('✅ AWS Cognito initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize AWS Cognito:', error);
  }
}

export async function cognitoSignUp(email: string, password: string, name: string): Promise<{ userId: string; email: string; name: string }> {
  initializeCognito();
  
  const result = await signUp({
    username: email,
    password,
    options: {
      userAttributes: {
        email,
        name,
      },
    },
  });
  
  if (!result.userId) {
    throw new Error('Sign up failed - no user ID returned');
  }
  
  return {
    userId: result.userId,
    email,
    name,
  };
}

export async function cognitoSignIn(email: string, password: string): Promise<{ userId: string; email: string; name: string }> {
  initializeCognito();
  
  const result = await signIn({
    username: email,
    password,
  });
  
  if (!result.isSignedIn) {
    throw new Error('Sign in failed');
  }
  
  const session = await fetchAuthSession();
  const attributes = await fetchUserAttributes();
  
  const userId = session.tokens?.idToken?.payload?.sub as string || '';
  const userName = attributes.name || attributes.email || email;
  
  return {
    userId,
    email: attributes.email || email,
    name: userName,
  };
}

export async function cognitoSignInWithGoogle(): Promise<void> {
  initializeCognito();
  
  // Directly trigger Google OAuth via AWS Cognito
  await signInWithRedirect({
    provider: 'Google'
  });
}

export async function cognitoSignOut(): Promise<void> {
  initializeCognito();
  await signOut();
}

export async function getCognitoUser(): Promise<{ userId: string; email: string; name: string; displayName: string } | null> {
  initializeCognito();
  
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();
    const attributes = await fetchUserAttributes();
    
    const name = attributes.name || attributes.email || '';
    
    return {
      userId: user.userId,
      email: attributes.email || '',
      name,
      displayName: name,
    };
  } catch {
    return null;
  }
}

export async function getCognitoToken(): Promise<string | null> {
  initializeCognito();
  
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch {
    return null;
  }
}

export async function handleCognitoCallback(): Promise<{ userId: string; email: string; name: string } | null> {
  initializeCognito();
  
  try {
    console.log('🔐 [OAuth] Processing Google OAuth callback...');
    
    // First, exchange the authorization code for tokens
    // This is critical for completing the OAuth flow with AWS Amplify v6+
    const exchangeSuccess = await exchangeCodeForSession();
    
    if (!exchangeSuccess) {
      console.log('⚠️ [OAuth] Code exchange did not yield tokens, trying direct session fetch...');
    }
    
    // Now fetch the session - this should have the tokens after code exchange
    const session = await fetchAuthSession({ forceRefresh: true });
    
    if (session.tokens?.idToken) {
      console.log('✅ [OAuth] Session tokens obtained successfully');
      const attributes = await fetchUserAttributes();
      const userId = session.tokens.idToken.payload.sub as string;
      
      console.log('✅ [OAuth] User authenticated:', { userId, email: attributes.email });
      
      return {
        userId,
        email: attributes.email || '',
        name: attributes.name || attributes.email || '',
      };
    }
    
    console.log('❌ [OAuth] No tokens in session after code exchange');
    return null;
  } catch (error) {
    console.error('❌ [OAuth] Error handling Cognito callback:', error);
    return null;
  }
}

export async function cognitoForgotPassword(email: string): Promise<void> {
  initializeCognito();
  
  try {
    console.log('📧 Calling AWS Cognito: resetPassword for', email);
    await resetPassword({
      username: email,
    });
    console.log('✅ OTP sent to email');
  } catch (error: any) {
    console.error('❌ resetPassword failed:', error);
    throw error;
  }
}

export async function cognitoConfirmResetPassword(email: string, code: string, newPassword: string): Promise<void> {
  initializeCognito();
  
  try {
    console.log('🔐 Step 2: Confirming password reset...');
    console.log('   Email:', email);
    console.log('   Code: [6-digit OTP]');
    console.log('   Password: [hidden]');
    
    await confirmResetPassword({
      username: email,
      confirmationCode: code,
      newPassword,
    });
    
    console.log('✅ Password reset successful for:', email);
    console.log('   User can now login with new password');
  } catch (error: any) {
    console.error('❌ Password reset confirmation failed:', error);
    throw error;
  }
}

// Email verification functions
export async function sendEmailVerificationCode(): Promise<void> {
  initializeCognito();
  
  try {
    console.log('📧 Sending email verification code...');
    await sendUserAttributeVerificationCode({
      userAttributeKey: 'email',
    });
    console.log('✅ Email verification code sent successfully');
  } catch (error: any) {
    console.error('❌ Failed to send email verification code:', error);
    throw error;
  }
}

export async function confirmEmailVerification(code: string): Promise<void> {
  initializeCognito();
  
  try {
    console.log('🔐 Confirming email verification with code...');
    await confirmUserAttribute({
      userAttributeKey: 'email',
      confirmationCode: code,
    });
    console.log('✅ Email verified successfully');
  } catch (error: any) {
    console.error('❌ Email verification failed:', error);
    throw error;
  }
}

export async function checkEmailVerified(): Promise<boolean> {
  initializeCognito();
  
  try {
    const attributes = await fetchUserAttributes();
    return attributes.email_verified === 'true';
  } catch {
    return false;
  }
}

export { signOut };
