import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { 
  CognitoIdentityProviderClient, 
  AdminSetUserPasswordCommand,
  AdminGetUserCommand,
  AdminUpdateUserAttributesCommand
} from '@aws-sdk/client-cognito-identity-provider';

let verifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null;

export function initializeCognitoVerifier() {
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.AWS_COGNITO_APP_CLIENT_ID;
  const region = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION || 'eu-north-1';
  
  if (!userPoolId || !clientId) {
    console.warn('⚠️ AWS Cognito credentials not configured for backend verification');
    console.warn('   Required: AWS_COGNITO_USER_POOL_ID, AWS_COGNITO_APP_CLIENT_ID');
    return null;
  }
  
  try {
    verifier = CognitoJwtVerifier.create({
      userPoolId,
      tokenUse: 'id',
      clientId,
    });
    
    console.log('✅ AWS Cognito JWT Verifier initialized');
    console.log(`   Region: ${region}`);
    console.log(`   User Pool: ${userPoolId}`);
    
    return verifier;
  } catch (error) {
    console.error('❌ Failed to initialize Cognito JWT Verifier:', error);
    return null;
  }
}

export interface CognitoUserClaims {
  sub: string;
  email: string;
  name?: string;
  email_verified?: boolean;
  iat: number;
  exp: number;
}

export async function verifyCognitoToken(token: string): Promise<CognitoUserClaims | null> {
  if (!verifier) {
    verifier = initializeCognitoVerifier() as ReturnType<typeof CognitoJwtVerifier.create> | null;
  }
  
  if (!verifier) {
    console.warn('⚠️ Cognito verifier not available - cannot verify token');
    return null;
  }
  
  try {
    const payload = await verifier.verify(token);
    
    return {
      sub: payload.sub,
      email: payload.email as string,
      name: payload.name as string | undefined,
      email_verified: payload.email_verified as boolean | undefined,
      iat: payload.iat,
      exp: payload.exp,
    };
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    return null;
  }
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

export async function authenticateRequest(authHeader: string | undefined): Promise<CognitoUserClaims | null> {
  const token = extractBearerToken(authHeader);
  if (!token) {
    return null;
  }
  return verifyCognitoToken(token);
}

// Admin function to reset password directly (bypasses email verification)
export async function adminResetPassword(email: string, newPassword: string): Promise<{ success: boolean; message: string }> {
  const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID;
  const region = process.env.AWS_COGNITO_REGION || process.env.AWS_REGION || 'eu-north-1';
  
  if (!userPoolId) {
    return { success: false, message: 'Cognito User Pool not configured' };
  }
  
  const client = new CognitoIdentityProviderClient({ region });
  
  try {
    // First verify the user exists
    await client.send(new AdminGetUserCommand({
      UserPoolId: userPoolId,
      Username: email
    }));
    
    // Set the new password directly
    await client.send(new AdminSetUserPasswordCommand({
      UserPoolId: userPoolId,
      Username: email,
      Password: newPassword,
      Permanent: true
    }));
    
    // Also mark email as verified so future password resets work
    await client.send(new AdminUpdateUserAttributesCommand({
      UserPoolId: userPoolId,
      Username: email,
      UserAttributes: [
        { Name: 'email_verified', Value: 'true' }
      ]
    }));
    
    console.log(`✅ Admin password reset successful for: ${email}`);
    return { success: true, message: 'Password reset successfully' };
  } catch (error: any) {
    console.error('❌ Admin password reset failed:', error.name, error.message);
    
    if (error.name === 'UserNotFoundException') {
      return { success: false, message: 'User not found' };
    } else if (error.name === 'InvalidPasswordException') {
      return { success: false, message: 'Password does not meet requirements (8+ chars, uppercase, lowercase, numbers)' };
    }
    
    return { success: false, message: error.message || 'Failed to reset password' };
  }
}
