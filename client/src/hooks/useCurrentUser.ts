import { useState, useEffect } from 'react';
import { getCognitoUser, getCognitoToken, cognitoSignOut, initializeCognito } from '../cognito';

interface CurrentUser {
  userId: string | null;
  email: string | null;
  username: string | null;
  displayName: string | null;
}

export function useCurrentUser() {
  const [currentUser, setCurrentUser] = useState<CurrentUser>({
    userId: null,
    email: null,
    username: null,
    displayName: null
  });
  const [loading, setLoading] = useState(true);
  const [profileChecked, setProfileChecked] = useState(false);

  useEffect(() => {
    initializeCognito();
    
    const loadUserData = async () => {
      const savedUserId = localStorage.getItem('currentUserId');
      const savedUserEmail = localStorage.getItem('currentUserEmail');
      const savedUsername = localStorage.getItem('currentUsername');
      const savedDisplayName = localStorage.getItem('currentDisplayName') || localStorage.getItem('currentUserName');
      
      setCurrentUser({
        userId: savedUserId,
        email: savedUserEmail,
        username: savedUsername,
        displayName: savedDisplayName
      });

      if (savedUserId && savedUserEmail) {
        try {
          const token = await getCognitoToken();
          if (token) {
            const response = await fetch('/api/user/profile', {
              headers: {
                'Authorization': `Bearer ${token}`
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.profile) {
                const profile = data.profile;
                updateUser(
                  savedUserId,
                  savedUserEmail,
                  profile.username,
                  profile.displayName
                );
              } else {
                updateUser(savedUserId, savedUserEmail, null, savedDisplayName);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching user profile:', error);
        }
      }
      
      setProfileChecked(true);
      setLoading(false);
    };

    loadUserData();
  }, []);

  const updateUser = (userId: string, email: string, username?: string | null, displayName?: string | null) => {
    localStorage.setItem('currentUserId', userId);
    localStorage.setItem('currentUserEmail', email);
    
    if (username) {
      localStorage.setItem('currentUsername', username);
    } else {
      localStorage.removeItem('currentUsername');
    }
    
    if (displayName) {
      localStorage.setItem('currentDisplayName', displayName);
      localStorage.setItem('currentUserName', displayName);
    } else {
      localStorage.removeItem('currentDisplayName');
      localStorage.removeItem('currentUserName');
    }
    
    setCurrentUser({ 
      userId, 
      email,
      username: username || null,
      displayName: displayName || null
    });
  };

  const updateProfile = (username: string, displayName: string) => {
    localStorage.setItem('currentUsername', username);
    localStorage.setItem('currentDisplayName', displayName);
    localStorage.setItem('currentUserName', displayName);
    setCurrentUser(prev => ({
      ...prev,
      username,
      displayName
    }));
  };

  const clearUser = async () => {
    try {
      await cognitoSignOut();
    } catch (error) {
      console.error('Error signing out from Cognito:', error);
    }
    
    localStorage.removeItem('currentUserId');
    localStorage.removeItem('currentUserEmail');
    localStorage.removeItem('currentUsername');
    localStorage.removeItem('currentDisplayName');
    localStorage.removeItem('currentUserName');
    setCurrentUser({ 
      userId: null, 
      email: null,
      username: null,
      displayName: null
    });
  };

  const getUserDisplayName = () => {
    return currentUser.displayName || currentUser.username || currentUser.email || 'Anonymous User';
  };

  const getUsername = () => {
    return currentUser.username || null;
  };

  const hasUsername = () => {
    return !!currentUser.username;
  };

  const isLoggedIn = () => {
    return !!currentUser.userId && !!currentUser.email;
  };

  return {
    currentUser,
    loading,
    profileChecked,
    updateUser,
    updateProfile,
    clearUser,
    getUserDisplayName,
    getUsername,
    hasUsername,
    isLoggedIn
  };
}
