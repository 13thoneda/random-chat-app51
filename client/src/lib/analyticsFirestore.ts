import {
  collection,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  increment
} from "./firestoreWrapper";
import { analytics } from "../firebaseConfig";
import { logEvent, setUserId, setUserProperties } from "firebase/analytics";

// Types for analytics
export interface UserSession {
  id?: string;
  userId: string;
  sessionId: string;
  platform: string;
  browser: string;
  deviceType: 'mobile' | 'tablet' | 'desktop';
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in seconds
  pageViews: number;
  interactions: number;
  location?: {
    country?: string;
    city?: string;
    timezone?: string;
  };
}

export interface UserInteraction {
  id?: string;
  userId: string;
  sessionId: string;
  action: string;
  target: string;
  details?: { [key: string]: any };
  timestamp: Timestamp;
  pageUrl: string;
  userAgent: string;
}

export interface ChatSessionAnalytics {
  id?: string;
  userId: string;
  chatRoomId: string;
  partnerUserId?: string;
  sessionType: 'random' | 'friend' | 'group';
  startTime: Timestamp;
  endTime?: Timestamp;
  duration?: number; // in seconds
  messagesCount: number;
  imagesShared: number;
  videosShared: number;
  wallpaperChanged: boolean;
  userRating?: number; // 1-5 stars
  reportIssues: boolean;
  connectionQuality: 'poor' | 'fair' | 'good' | 'excellent';
}

export interface FeatureUsage {
  id?: string;
  userId: string;
  feature: string;
  action: 'used' | 'enabled' | 'disabled' | 'purchased';
  metadata?: { [key: string]: any };
  timestamp: Timestamp;
  sessionId: string;
}

export interface UserBehaviorMetrics {
  id?: string;
  userId: string;
  date: string; // YYYY-MM-DD
  totalSessions: number;
  totalTimeSpent: number; // in seconds
  totalInteractions: number;
  totalChats: number;
  totalMessages: number;
  premiumFeatureUsage: number;
  coinsEarned: number;
  coinsSpent: number;
  friendsAdded: number;
  reportsMade: number;
  averageSessionDuration: number;
  mostUsedFeatures: string[];
  lastActive: Timestamp;
}

/**
 * Initialize user analytics session
 */
export async function startUserSession(userId: string): Promise<string> {
  try {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Detect device info
    const deviceType = getDeviceType();
    const platform = navigator.platform;
    const browser = getBrowserInfo();
    
    const sessionData: Omit<UserSession, 'id'> = {
      userId,
      sessionId,
      platform,
      browser,
      deviceType,
      startTime: serverTimestamp() as Timestamp,
      pageViews: 1,
      interactions: 0
    };

    const sessionDoc = await addDoc(collection("userSessions"), sessionData);
    
    // Log to Firebase Analytics if available
    if (analytics) {
      setUserId(analytics, userId);
      logEvent(analytics, 'session_start', {
        session_id: sessionId,
        device_type: deviceType,
        platform,
        browser
      });
    }

    // Store session ID in localStorage for this session
    localStorage.setItem('current_session_id', sessionId);
    
    console.log("✅ User session started:", sessionId);
    return sessionId;
  } catch (error) {
    console.error("❌ Error starting user session:", error);
    return '';
  }
}

/**
 * End user analytics session
 */
export async function endUserSession(sessionId?: string): Promise<boolean> {
  try {
    const currentSessionId = sessionId || localStorage.getItem('current_session_id');
    if (!currentSessionId) return false;

    // Find session document
    const sessionsQuery = query(
      collection("userSessions"),
      where("sessionId", "==", currentSessionId),
      limit(1)
    );

    const sessionSnap = await getDocs(sessionsQuery);
    if (sessionSnap.empty) return false;

    const sessionDoc = sessionSnap.docs[0];
    const sessionData = sessionDoc.data() as UserSession;
    
    const endTime = new Date();
    const startTime = sessionData.startTime.toDate();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await updateDoc(sessionDoc.ref, {
      endTime: serverTimestamp(),
      duration
    });

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'session_end', {
        session_id: currentSessionId,
        session_duration: duration
      });
    }

    localStorage.removeItem('current_session_id');
    console.log("✅ User session ended:", currentSessionId);
    return true;
  } catch (error) {
    console.error("❌ Error ending user session:", error);
    return false;
  }
}

/**
 * Track user interaction
 */
export async function trackUserInteraction(
  userId: string, 
  action: string, 
  target: string, 
  details?: { [key: string]: any }
): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem('current_session_id') || 'unknown';
    
    const interaction: Omit<UserInteraction, 'id'> = {
      userId,
      sessionId,
      action,
      target,
      details,
      timestamp: serverTimestamp() as Timestamp,
      pageUrl: window.location.href,
      userAgent: navigator.userAgent
    };

    await addDoc(collection("userInteractions"), interaction);

    // Update session interaction count
    if (sessionId !== 'unknown') {
      const sessionsQuery = query(
        collection("userSessions"),
        where("sessionId", "==", sessionId),
        limit(1)
      );

      const sessionSnap = await getDocs(sessionsQuery);
      if (!sessionSnap.empty) {
        const sessionDoc = sessionSnap.docs[0];
        await updateDoc(sessionDoc.ref, {
          interactions: increment(1)
        });
      }
    }

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'user_interaction', {
        action,
        target,
        session_id: sessionId,
        ...details
      });
    }

    return true;
  } catch (error) {
    console.error("❌ Error tracking user interaction:", error);
    return false;
  }
}

/**
 * Track chat session analytics
 */
export async function startChatSession(
  userId: string, 
  chatRoomId: string, 
  sessionType: 'random' | 'friend' | 'group',
  partnerUserId?: string
): Promise<string> {
  try {
    const chatSessionData: Omit<ChatSessionAnalytics, 'id'> = {
      userId,
      chatRoomId,
      partnerUserId,
      sessionType,
      startTime: serverTimestamp() as Timestamp,
      messagesCount: 0,
      imagesShared: 0,
      videosShared: 0,
      wallpaperChanged: false,
      reportIssues: false,
      connectionQuality: 'good'
    };

    const chatSessionDoc = await addDoc(collection("chatSessionAnalytics"), chatSessionData);
    
    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'chat_session_start', {
        chat_type: sessionType,
        has_partner: !!partnerUserId
      });
    }

    await trackUserInteraction(userId, 'chat_started', 'chat_room', {
      chatRoomId,
      sessionType
    });

    console.log("✅ Chat session started:", chatSessionDoc.id);
    return chatSessionDoc.id;
  } catch (error) {
    console.error("❌ Error starting chat session:", error);
    return '';
  }
}

/**
 * End chat session analytics
 */
export async function endChatSession(
  chatSessionId: string, 
  rating?: number, 
  reportIssues?: boolean
): Promise<boolean> {
  try {
    const chatSessionRef = doc(db, "chatSessionAnalytics", chatSessionId);
    const chatSessionSnap = await getDoc(chatSessionRef);
    
    if (!chatSessionSnap.exists()) return false;

    const sessionData = chatSessionSnap.data() as ChatSessionAnalytics;
    const endTime = new Date();
    const startTime = sessionData.startTime.toDate();
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

    await updateDoc(chatSessionRef, {
      endTime: serverTimestamp(),
      duration,
      userRating: rating,
      reportIssues: reportIssues || false
    });

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'chat_session_end', {
        session_duration: duration,
        messages_count: sessionData.messagesCount,
        user_rating: rating,
        had_issues: reportIssues
      });
    }

    console.log("✅ Chat session ended:", chatSessionId);
    return true;
  } catch (error) {
    console.error("❌ Error ending chat session:", error);
    return false;
  }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(
  userId: string,
  feature: string,
  action: 'used' | 'enabled' | 'disabled' | 'purchased',
  metadata?: { [key: string]: any }
): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem('current_session_id') || 'unknown';
    
    const featureUsage: Omit<FeatureUsage, 'id'> = {
      userId,
      feature,
      action,
      metadata,
      timestamp: serverTimestamp() as Timestamp,
      sessionId
    };

    await addDoc(collection("featureUsage"), featureUsage);

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'feature_usage', {
        feature_name: feature,
        action,
        ...metadata
      });
    }

    await trackUserInteraction(userId, `feature_${action}`, feature, metadata);

    return true;
  } catch (error) {
    console.error("❌ Error tracking feature usage:", error);
    return false;
  }
}

/**
 * Update daily user behavior metrics
 */
export async function updateDailyMetrics(userId: string, metrics: Partial<UserBehaviorMetrics>): Promise<boolean> {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const metricsRef = doc(db, "userBehaviorMetrics", `${userId}_${today}`);
    
    const existingMetrics = await getDoc(metricsRef);
    
    if (existingMetrics.exists()) {
      // Update existing metrics
      await updateDoc(metricsRef, {
        ...metrics,
        lastActive: serverTimestamp()
      });
    } else {
      // Create new metrics document
      const newMetrics: Omit<UserBehaviorMetrics, 'id'> = {
        userId,
        date: today,
        totalSessions: 0,
        totalTimeSpent: 0,
        totalInteractions: 0,
        totalChats: 0,
        totalMessages: 0,
        premiumFeatureUsage: 0,
        coinsEarned: 0,
        coinsSpent: 0,
        friendsAdded: 0,
        reportsMade: 0,
        averageSessionDuration: 0,
        mostUsedFeatures: [],
        lastActive: serverTimestamp() as Timestamp,
        ...metrics
      };
      
      await setDoc(metricsRef, newMetrics);
    }

    return true;
  } catch (error) {
    console.error("❌ Error updating daily metrics:", error);
    return false;
  }
}

/**
 * Helper functions
 */
function getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  const userAgent = navigator.userAgent;
  
  if (/tablet|ipad|playbook|silk/i.test(userAgent)) {
    return 'tablet';
  }
  
  if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile/i.test(userAgent)) {
    return 'mobile';
  }
  
  return 'desktop';
}

function getBrowserInfo(): string {
  const userAgent = navigator.userAgent;
  
  if (userAgent.includes('Firefox')) return 'Firefox';
  if (userAgent.includes('Chrome')) return 'Chrome';
  if (userAgent.includes('Safari')) return 'Safari';
  if (userAgent.includes('Edge')) return 'Edge';
  if (userAgent.includes('Opera')) return 'Opera';
  
  return 'Unknown';
}

/**
 * Set user properties for analytics
 */
export function setAnalyticsUserProperties(userId: string, properties: { [key: string]: any }): void {
  if (analytics) {
    setUserId(analytics, userId);
    setUserProperties(analytics, properties);
  }
}

/**
 * Track page view
 */
export async function trackPageView(userId: string, page: string, title?: string): Promise<boolean> {
  try {
    const sessionId = localStorage.getItem('current_session_id') || 'unknown';
    
    // Update session page views
    if (sessionId !== 'unknown') {
      const sessionsQuery = query(
        collection("userSessions"),
        where("sessionId", "==", sessionId),
        limit(1)
      );

      const sessionSnap = await getDocs(sessionsQuery);
      if (!sessionSnap.empty) {
        const sessionDoc = sessionSnap.docs[0];
        await updateDoc(sessionDoc.ref, {
          pageViews: increment(1)
        });
      }
    }

    // Log to Firebase Analytics
    if (analytics) {
      logEvent(analytics, 'page_view', {
        page_title: title || page,
        page_location: window.location.href
      });
    }

    await trackUserInteraction(userId, 'page_view', page, { title });
    
    return true;
  } catch (error) {
    console.error("❌ Error tracking page view:", error);
    return false;
  }
}
