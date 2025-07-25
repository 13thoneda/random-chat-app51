import { useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import {
  startUserSession,
  endUserSession,
  trackUserInteraction,
  trackPageView,
  trackFeatureUsage,
  setAnalyticsUserProperties,
  updateDailyMetrics
} from "../lib/analyticsFirestore";

interface UseAnalyticsReturn {
  trackInteraction: (action: string, target: string, details?: { [key: string]: any }) => Promise<boolean>;
  trackFeature: (feature: string, action: 'used' | 'enabled' | 'disabled' | 'purchased', metadata?: { [key: string]: any }) => Promise<boolean>;
  setUserProperties: (properties: { [key: string]: any }) => void;
  updateMetrics: (metrics: { [key: string]: any }) => Promise<boolean>;
}

export function useAnalytics(): UseAnalyticsReturn {
  let location: any = null;
  try {
    location = useLocation();
  } catch (error) {
    console.warn("useLocation failed, analytics will have limited functionality:", error);
    location = { pathname: '/', search: '', hash: '' };
  }

  // Initialize analytics session and track page views
  useEffect(() => {
    let currentUserId: string | null = null;
    let sessionStarted = false;

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && !sessionStarted) {
        currentUserId = user.uid;
        sessionStarted = true;
        
        // Start analytics session
        await startUserSession(user.uid);
        
        // Set user properties
        setAnalyticsUserProperties(user.uid, {
          user_id: user.uid,
          sign_up_method: user.providerData[0]?.providerId || 'anonymous'
        });

        // Update daily metrics
        await updateDailyMetrics(user.uid, {
          totalSessions: 1
        });
      }
    });

    // End session on page unload
    const handleBeforeUnload = () => {
      if (sessionStarted) {
        endUserSession();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      unsubscribe();
      window.removeEventListener('beforeunload', handleBeforeUnload);
      if (sessionStarted) {
        endUserSession();
      }
    };
  }, []);

  // Track page views
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const pageTitle = document.title;
        const pagePath = location.pathname;
        
        await trackPageView(user.uid, pagePath, pageTitle);
      }
    });

    return () => unsubscribe();
  }, [location]);

  // Track user interaction
  const trackInteraction = useCallback(async (
    action: string, 
    target: string, 
    details?: { [key: string]: any }
  ): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    return await trackUserInteraction(user.uid, action, target, details);
  }, []);

  // Track feature usage
  const trackFeature = useCallback(async (
    feature: string, 
    action: 'used' | 'enabled' | 'disabled' | 'purchased', 
    metadata?: { [key: string]: any }
  ): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    return await trackFeatureUsage(user.uid, feature, action, metadata);
  }, []);

  // Set user properties
  const setUserProperties = useCallback((properties: { [key: string]: any }): void => {
    const user = auth.currentUser;
    if (!user) return;

    setAnalyticsUserProperties(user.uid, properties);
  }, []);

  // Update daily metrics
  const updateMetrics = useCallback(async (metrics: { [key: string]: any }): Promise<boolean> => {
    const user = auth.currentUser;
    if (!user) return false;

    return await updateDailyMetrics(user.uid, metrics);
  }, []);

  return {
    trackInteraction,
    trackFeature,
    setUserProperties,
    updateMetrics
  };
}

// Predefined tracking functions for common actions
export const Analytics = {
  // Chat actions
  chatStarted: (chatType: 'random' | 'friend') => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'chat_started', 'chat_button', { chatType });
      trackFeatureUsage(user.uid, 'video_chat', 'used', { type: chatType });
    }
  },

  messagesSent: (messageType: 'text' | 'image' | 'emoji', count: number = 1) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'message_sent', 'chat_input', { messageType, count });
      updateDailyMetrics(user.uid, { totalMessages: count });
    }
  },

  wallpaperChanged: (wallpaperType: 'free' | 'premium', wallpaperName: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'wallpaper_changed', 'wallpaper_modal', { wallpaperType, wallpaperName });
      trackFeatureUsage(user.uid, 'chat_wallpaper', 'used', { type: wallpaperType, name: wallpaperName });
    }
  },

  // Premium actions
  premiumPurchased: (plan: string, price: number) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'premium_purchased', 'payment_button', { plan, price });
      trackFeatureUsage(user.uid, 'premium_subscription', 'purchased', { plan, price });
    }
  },

  premiumFeatureUsed: (feature: string) => {
    const user = auth.currentUser;
    if (user) {
      trackFeatureUsage(user.uid, feature, 'used', { isPremiumFeature: true });
      updateDailyMetrics(user.uid, { premiumFeatureUsage: 1 });
    }
  },

  // Friend actions
  friendRequestSent: () => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'friend_request_sent', 'add_friend_button');
      updateDailyMetrics(user.uid, { friendsAdded: 1 });
    }
  },

  friendRequestAccepted: () => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'friend_request_accepted', 'accept_button');
    }
  },

  // Coin actions
  coinsEarned: (amount: number, source: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'coins_earned', source, { amount });
      updateDailyMetrics(user.uid, { coinsEarned: amount });
    }
  },

  coinsSpent: (amount: number, item: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'coins_spent', item, { amount });
      updateDailyMetrics(user.uid, { coinsSpent: amount });
    }
  },

  // Report actions
  userReported: (reason: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'user_reported', 'report_button', { reason });
      updateDailyMetrics(user.uid, { reportsMade: 1 });
    }
  },

  // Navigation actions
  navigationUsed: (section: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'navigation_used', 'bottom_nav', { section });
    }
  },

  // Settings actions
  settingsChanged: (setting: string, value: any) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'settings_changed', 'settings_page', { setting, value });
    }
  },

  // Error tracking
  errorOccurred: (error: string, context: string) => {
    const user = auth.currentUser;
    if (user) {
      trackUserInteraction(user.uid, 'error_occurred', context, { error, timestamp: new Date().toISOString() });
    }
  }
};
