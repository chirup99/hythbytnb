import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { 
  cognitoSignIn, 
  cognitoSignUp, 
  cognitoSignInWithGoogle,
  handleCognitoCallback,
  getCognitoToken,
  initializeCognito,
  cognitoForgotPassword,
  cognitoConfirmResetPassword,
  getRedirectUrl,
  getCognitoUser
} from "@/cognito";

export default function Landing() {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isCheckingCallback, setIsCheckingCallback] = useState(true);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { toast } = useToast();

  // Cooldown timer effect
  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  useEffect(() => {
    initializeCognito();
    
    // Check if user is already authenticated
    const checkExistingSession = async () => {
      console.log('🔍 [Landing] Checking for existing session...');
      try {
        const user = await getCognitoUser();
        if (user && user.userId) {
          console.log('👤 [Landing] User already authenticated:', user.email);
          console.log('🚀 [Landing] Redirecting to home page...');
          
          // Ensure localStorage is synced but respect existing linked ID
          const storedUserId = localStorage.getItem('currentUserId');
          
          // Only overwrite if not set, or if we want to force sync (but here we want to preserve link)
          // If storedUserId exists and is different from user.userId (506c...), it might be the linked ID (c06...)
          // So we should NOT overwrite it with the raw token ID.
          if (!storedUserId) {
             localStorage.setItem('currentUserId', user.userId);
          }
          
          localStorage.setItem('currentUserEmail', user.email);
          localStorage.setItem('currentUsername', user.email);
          localStorage.setItem('currentDisplayName', user.displayName);
          localStorage.setItem('currentUserName', user.displayName);

          // Force redirect to home
          window.location.href = '/';
          return true;
        } else {
          console.log('ℹ️ [Landing] No active session found via getCognitoUser');
        }
      } catch (error) {
        console.error('❌ [Landing] Error in checkExistingSession:', error);
      }
      return false;
    };

    const checkOAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const hasCode = urlParams.has('code');
        const hasError = urlParams.has('error');
        
        // Handle OAuth error
        if (hasError) {
          const errorDesc = urlParams.get('error_description') || 'Authentication failed';
          console.error('❌ OAuth error:', errorDesc);
          toast({
            title: "Sign-In Failed",
            description: errorDesc,
            variant: "destructive",
          });
          // Clean up URL
          window.history.replaceState({}, document.title, window.location.pathname);
          setIsCheckingCallback(false);
          return;
        }
        
        if (hasCode) {
          const logDiv = document.getElementById('auth-debug-log');
          const log = (msg: string) => {
             console.log(msg);
             if (logDiv) {
               const p = document.createElement('div');
               p.innerHTML = `> ${msg}`;
               logDiv.appendChild(p);
               logDiv.scrollTop = logDiv.scrollHeight;
             }
          };

          log('🔐 [Google OAuth] Callback code detected..');
          
          // Process the OAuth callback - this exchanges the code for tokens
          const user = await handleCognitoCallback();
          
          if (user) {
            log(`✅ User Authenticated. Email: ${user.email}`);
            log(`🔑 Token ID (Sub): ${user.userId.substring(0, 10)}...`);
            
            const token = await getCognitoToken();
            let finalUserId = user.userId; // Default to Cognito sub
            let accountLinked = false;
            
            if (token) {
              try {
                log('📡 Syncing with Backend ID System...');
                const response = await fetch('/api/auth/cognito', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ name: user.name, email: user.email }),
                });
                
                const result = await response.json();
                log(`📩 Backend Reply: ${JSON.stringify(result)}`);

                if (result.success && result.userId) {
                  finalUserId = result.userId; // Use canonical userId from backend
                  accountLinked = result.accountLinked || false;
                  log(`🔗 LINKED ID FOUND: ${finalUserId}`);
                }
              } catch (err) {
                log(`⚠️ Backend Sync Failed: ${err}`);
              }
            } else {
               log('⚠️ No Token found.');
            }
            
            log(`💾 Final Storage ID: ${finalUserId}`);
            // Store the canonical userId (original or new)
            localStorage.setItem('currentUserId', finalUserId);
            localStorage.setItem('currentUserEmail', user.email);
            localStorage.setItem('currentUsername', user.email);
            localStorage.setItem('currentDisplayName', user.name);
            localStorage.setItem('currentUserName', user.name);
            
            log('✅ Redirecting to Home...');
            
            // Clean up URL before redirect
            window.history.replaceState({}, document.title, window.location.pathname);
            window.location.href = '/';
            return;

          } else {
            console.error('❌ [Google OAuth] Failed to get user from callback');
            toast({
              title: "Sign-In Failed",
              description: "Could not complete Google sign-in. Please try again.",
              variant: "destructive",
            });
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } else {
          // If not an OAuth callback, check for existing session
          await checkExistingSession();
        }
      } catch (error: any) {
        console.error('❌ [Google OAuth] Callback error:', error);
        toast({
          title: "Sign-In Error",
          description: error.message || "An unexpected error occurred during sign-in.",
          variant: "destructive",
        });
        // Clean up URL on error
        window.history.replaceState({}, document.title, window.location.pathname);
      } finally {
        setIsCheckingCallback(false);
      }
    };
    
    checkOAuthCallback();
  }, []);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      console.log('🔐 Initiating Google OAuth via AWS Cognito...');
      console.log('   Redirect URI:', getRedirectUrl());
      console.log('   Cognito Domain:', import.meta.env.VITE_COGNITO_DOMAIN);
      await cognitoSignInWithGoogle();
    } catch (error: any) {
      console.error("Google sign-in error:", error);
      console.error("Error stack:", error.stack);
      
      if (error.message?.includes('not configured')) {
        toast({
          title: "Configuration Error",
          description: "Google Sign-In is not configured. Please set up AWS Cognito with Google federation.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Sign-In Error",
          description: error.message || "An unexpected error occurred during Google sign-in.",
          variant: "destructive",
        });
      }
      setIsGoogleLoading(false);
    }
  };

  const [isSignupVerification, setIsSignupVerification] = useState(false);

  const handleSignupVerification = async () => {
    if (!otp || otp.length < 6) {
      toast({
        title: "Invalid Code",
        description: "Please enter the 6-digit verification code sent to your email.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      console.log('🔐 Confirming signup for:', email);
      const response = await fetch('/api/auth/cognito/confirm-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: otp }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.details || result.message || "Verification failed");
      }

      toast({
        title: "Account Verified",
        description: "Your account has been verified successfully. Logging you in...",
      });

      // Now automatically sign the user in since we have the password and email from state
      console.log('🔐 Signing in after verification...');
      const authUser = await cognitoSignIn(email, password);
      
      localStorage.setItem('currentUserId', authUser.userId);
      localStorage.setItem('currentUserEmail', authUser.email);
      localStorage.setItem('currentUsername', authUser.email);
      localStorage.setItem('currentDisplayName', authUser.name);
      localStorage.setItem('currentUserName', authUser.name); 

      const token = await getCognitoToken();
      if (token) {
        try {
          await fetch('/api/auth/cognito', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ name: authUser.name, email: authUser.email }),
          });
        } catch (err) {
          console.warn('Backend sync failed, continuing...', err);
        }
      }

      console.log('✅ Auto-login successful, redirecting to app...');
      window.location.href = "/";
    } catch (error: any) {
      console.error('❌ Verification error:', error);
      toast({
        title: "Verification Failed",
        description: error.message || "Invalid verification code.",
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleEmailAuth = async () => {
    if (!isLogin && !name) {
      toast({
        title: "Missing Information",
        description: "Please enter your name to create an account.",
        variant: "destructive",
      });
      return;
    }

    if (!email || !password) {
      toast({
        title: "Missing Information",
        description: "Please enter email and password.",
        variant: "destructive",
      });
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address (e.g., name@example.com).",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      return;
    }

    setIsEmailLoading(true);
    try {
      if (isLogin) {
        console.log('🔐 Signing in with AWS Cognito...');
        const user = await cognitoSignIn(email, password);
        
        const token = await getCognitoToken();
        let finalUserId = user.userId; // Default to Cognito sub

        console.log('🔑 Authentication successful:', { 
          action: 'login',
          userId: user.userId,
          email: user.email 
        });

        if (token) {
          try {
            const response = await fetch('/api/auth/cognito', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ name: user.name, email: user.email }),
              signal: AbortSignal.timeout(8000)
            });
            
            const result = await response.json();
            if (result.success && result.userId) {
              finalUserId = result.userId; // Use canonical userId from backend
            }
          } catch (fetchError) {
            console.warn('⚠️ Backend sync failed, but Cognito Auth succeeded. Continuing...', fetchError);
          }
        }

        // Store the canonical userId
        localStorage.setItem('currentUserId', finalUserId);
        localStorage.setItem('currentUserEmail', user.email);
        localStorage.setItem('currentUsername', user.email);
        localStorage.setItem('currentDisplayName', user.name);
        localStorage.setItem('currentUserName', user.name);

        console.log('✅ Authentication successful, redirecting to app...');
        window.location.href = "/";

      } else {
        console.log('🔐 Signing up with AWS Cognito...');
        await cognitoSignUp(email, password, name);
        
        setIsSignupVerification(true);
        setOtp("");
        toast({
          title: "Verification Required",
          description: "Please check your email for a verification code.",
        });
      }
    } catch (error: any) {
      console.error('❌ Authentication error:', error);
      
      let errorMessage = error.message || "Something went wrong. Please try again.";
      
      if (error.name === 'UserNotConfirmedException') {
        errorMessage = "Please verify your email before signing in. Check your inbox for a verification code.";
        setIsSignupVerification(true);
        setOtp("");
      } else if (error.name === 'NotAuthorizedException') {
        errorMessage = "Incorrect email or password.";
      } else if (error.name === 'UserNotFoundException') {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.name === 'UsernameExistsException') {
        errorMessage = "An account with this email already exists.";
      } else if (error.name === 'InvalidPasswordException') {
        errorMessage = "Password does not meet requirements. Use at least 8 characters with uppercase, lowercase, numbers, and symbols.";
      }
      
      toast({
        title: "Authentication Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        title: "Missing Email",
        description: "Enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (cooldownSeconds > 0) {
      toast({
        title: "Please Wait",
        description: `Rate limit active. Try again in ${cooldownSeconds} seconds.`,
        variant: "destructive",
      });
      return;
    }

    setIsSendingOtp(true);
    try {
      console.log('📧 Sending forgot password request via backend...');
      
      // Use backend endpoint that auto-verifies email before sending OTP
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw { name: result.code || 'Error', message: result.message };
      }
      
      console.log('✅ OTP sent successfully!');
      setIsOtpSent(true);
      
      toast({
        title: "Code Sent Successfully",
        description: "Verification code sent to your email.",
      });
    } catch (error: any) {
      console.error('❌ Forgot Password Error:', error.name, error.message);
      let msg = error.message || "Failed to send code.";
      let title = "Error";
      
      if (error.name === 'UserNotFoundException') {
        msg = "This email is not registered. Please sign up first.";
        title = "User Not Found";
      } else if (error.name === 'LimitExceededException') {
        msg = "Rate limit exceeded. Please wait before trying again.";
        title = "Rate Limited";
        setCooldownSeconds(300); // 5 minute cooldown
      }
      
      toast({
        title: title,
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSaveNewPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Missing Password",
        description: "Enter new password.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Mismatch",
        description: "Passwords don't match.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 8) {
      toast({
        title: "Too Short",
        description: "Use 8+ characters.",
        variant: "destructive",
      });
      return;
    }

    setIsSavingPassword(true);
    try {
      console.log('🔐 AWS confirmResetPassword:', email, otp.length, 'chars');
      await cognitoConfirmResetPassword(email, otp, newPassword);
      
      toast({
        title: "Success",
        description: "Password reset. Login now.",
      });
      
      setIsForgotPassword(false);
      setIsOtpSent(false);
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      setEmail("");
      setIsLogin(true);
    } catch (error: any) {
      console.error('❌ Error:', error.name, error.message);
      let msg = "Reset failed.";
      
      if (error.name === 'CodeMismatchException') {
        msg = "Wrong verification code. Please check and try again.";
      } else if (error.name === 'ExpiredCodeException') {
        msg = "Code expired. Request new one.";
        setIsOtpSent(false);
        setOtp("");
      } else if (error.name === 'InvalidPasswordException') {
        msg = "Password needs: uppercase, lowercase, numbers, symbols.";
      } else if (error.name === 'LimitExceededException') {
        msg = "Too many attempts. Wait 5-10 min.";
      }
      
      toast({
        title: "Error",
        description: msg,
        variant: "destructive",
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleBackToLogin = () => {
    setIsForgotPassword(false);
    setIsOtpSent(false);
    setOtp("");
    setNewPassword("");
    setConfirmPassword("");
  };

  if (isCheckingCallback) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="text-white text-lg">Processing authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6 py-8">
      <div className="text-center mb-12">
        <h1 className="text-7xl md:text-8xl font-bold text-white tracking-tight">PERALA</h1>
      </div>
      <div className="max-w-xl w-full space-y-6">
        <div className="text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Get Early Access</h2>
          <p className="text-gray-400 text-lg mb-2">Daily Trade Tracking</p>
          <p className="text-gray-400 text-lg mb-6">AI Performance Analysis</p>
          <p className="text-gray-500 text-sm">View detailed P&L and trading statistics</p>
        </div>
        <div className="w-full max-w-md mx-auto space-y-4">
          {isSignupVerification ? (
            <>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">Verify Your Account</h3>
                <p className="text-gray-400 text-sm">Enter the 6-digit code sent to <strong>{email}</strong></p>
              </div>
              <div className="space-y-4">
                <Input
                  type="text"
                  placeholder="Enter verification code"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  maxLength={6}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg text-center text-lg tracking-widest"
                  data-testid="input-signup-otp"
                />
                <Button
                  onClick={handleSignupVerification}
                  disabled={otp.length < 6 || isEmailLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-lg disabled:opacity-50"
                  data-testid="button-verify-signup"
                >
                  {isEmailLoading ? "Verifying..." : "Verify & Continue"}
                  {!isEmailLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>

                {/* DEBUG CONSOLE FOR AUTH FLOW */}
                <div className="mt-8 p-4 bg-gray-900 border border-gray-800 rounded-lg text-xs font-mono text-green-400 overflow-hidden">
                  <div className="mb-2 font-bold text-gray-500">AUTH DEBUG LOG:</div>
                  <div id="auth-debug-log" className="h-32 overflow-y-auto space-y-1">
                     <div>Waiting for action...</div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <button
                    onClick={() => {
                      setIsSignupVerification(false);
                      setIsLogin(true);
                      setOtp("");
                    }}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    data-testid="button-back-to-login-from-verify"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </>
          ) : isForgotPassword ? (
            <>
              <div className="text-center mb-4">
                <h3 className="text-xl font-semibold text-white mb-2">Reset Password</h3>
                <p className="text-gray-400 text-sm">Enter your email to receive a verification code</p>
              </div>
              <div className="space-y-3">
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isOtpSent}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg disabled:opacity-50"
                  data-testid="input-forgot-email"
                />
                {cooldownSeconds > 0 && (
                  <div className="p-3 bg-orange-900/30 border border-orange-700 rounded-lg text-center">
                    <p className="text-orange-400 text-sm">
                      AWS rate limit active. Wait {Math.floor(cooldownSeconds / 60)}:{(cooldownSeconds % 60).toString().padStart(2, '0')}
                    </p>
                  </div>
                )}
                {!isOtpSent ? (
                  <Button
                    onClick={handleSendOtp}
                    disabled={isSendingOtp || cooldownSeconds > 0}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-lg disabled:opacity-50"
                    data-testid="button-send-otp"
                  >
                    {isSendingOtp ? "Sending..." : cooldownSeconds > 0 ? `Wait ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}` : "Send OTP"}
                    {!isSendingOtp && cooldownSeconds === 0 && <ArrowRight className="ml-2 h-4 w-4" />}
                  </Button>
                ) : (
                  <>
                    <div className="p-3 bg-green-900/30 border border-green-700 rounded-lg text-center">
                      <p className="text-green-400 text-sm">Verification code sent to your email</p>
                    </div>
                    <Input
                      type="text"
                      placeholder="Enter 6-digit verification code"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      maxLength={6}
                      className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg text-center text-lg tracking-widest"
                      data-testid="input-otp"
                    />
                    <div className="relative">
                      <Input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="New Password (8+ characters)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg pr-12"
                        data-testid="input-new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                        data-testid="button-toggle-new-password-visibility"
                      >
                        {showNewPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg pr-12"
                        data-testid="input-confirm-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                        data-testid="button-toggle-confirm-password-visibility"
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    <Button
                      onClick={handleSaveNewPassword}
                      disabled={otp.length < 6 || !newPassword || !confirmPassword || isSavingPassword}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-lg disabled:opacity-50"
                      data-testid="button-save-password"
                    >
                      {isSavingPassword ? "Resetting Password..." : "Reset Password"}
                      {!isSavingPassword && <ArrowRight className="ml-2 h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={handleSendOtp}
                      disabled={isSendingOtp || cooldownSeconds > 0}
                      className="w-full text-gray-400 hover:text-white disabled:opacity-50"
                      data-testid="button-resend-otp"
                    >
                      {isSendingOtp ? "Sending..." : cooldownSeconds > 0 ? `Wait ${Math.floor(cooldownSeconds / 60)}:${(cooldownSeconds % 60).toString().padStart(2, '0')}` : "Resend Code"}
                    </Button>
                  </>
                )}
                <div className="flex justify-center">
                  <button
                    onClick={handleBackToLogin}
                    className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
                    data-testid="button-back-to-login"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex gap-2 p-1 bg-gray-800 rounded-lg">
                <Button
                  variant="ghost"
                  className={`flex-1 ${isLogin ? "bg-gray-700 text-white" : "text-gray-400"}`}
                  onClick={() => setIsLogin(true)}
                  data-testid="button-toggle-login"
                >
                  Login
                </Button>
                <Button
                  variant="ghost"
                  className={`flex-1 ${!isLogin ? "bg-gray-700 text-white" : "text-gray-400"}`}
                  onClick={() => setIsLogin(false)}
                  data-testid="button-toggle-signup"
                >
                  Sign Up
                </Button>
              </div>
              <div className="space-y-3">
                {!isLogin && (
                  <Input
                    type="text"
                    placeholder="Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg"
                    data-testid="input-name"
                  />
                )}
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg"
                  data-testid="input-email"
                />
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleEmailAuth()}
                    className="bg-gray-800 border-gray-700 text-white placeholder-gray-400 h-12 rounded-lg pr-12"
                    data-testid="input-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200 transition-colors"
                    data-testid="button-toggle-password-visibility"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <Button
                  onClick={handleEmailAuth}
                  disabled={isEmailLoading || isGoogleLoading}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium h-12 rounded-lg"
                  data-testid="button-email-auth"
                >
                  {isEmailLoading ? "Processing..." : isLogin ? "Login" : "Create Account"}
                  {!isEmailLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                </Button>
                {isLogin && (
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}
                
                <div className="pt-4 space-y-4">
                  <div className="relative flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-800"></div>
                    </div>
                    <span className="relative px-3 bg-black text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                      Or continue with
                    </span>
                  </div>

                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isGoogleLoading || isEmailLoading}
                    variant="outline"
                    className="w-full bg-white hover:bg-gray-100 text-gray-900 font-medium h-12 rounded-lg border-0 flex items-center justify-center gap-3"
                    data-testid="button-google-auth"
                  >
                    {isGoogleLoading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
                    ) : (
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                        />
                        <path fill="none" d="M1 1h22v22H1z" />
                      </svg>
                    )}
                    <span className="text-sm">Sign in with Google</span>
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="flex flex-col items-center space-y-3 text-sm text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Improve Your Trading</span>
          </div>
         
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
            <span>Learn from your trading mistakes and patterns</span>
          </div>
        </div>
      </div>
    </div>
  );
}
