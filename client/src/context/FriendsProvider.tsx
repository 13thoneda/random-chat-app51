import * as React from "react";
import { auth } from "../firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { usePremium } from "./PremiumProvider";
import {
  getUserFriends,
  listenToFriends,
  sendFriendRequest,
  removeFriend as removeFirestoreFriend,
  updateFriendOnlineStatus,
  getPendingFriendRequests,
  acceptFriendRequest,
  rejectFriendRequest,
  listenToFriendRequests,
  getFriendsStats,
  type Friend as FirestoreFriend,
  type FriendRequest,
  type FriendsStats
} from "../lib/friendsFirestore";

interface Friend {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastSeen?: Date;
  addedAt: Date;
  isFavorite?: boolean;
  nickname?: string;
}

interface FriendsContextType {
  friends: Friend[];
  friendRequests: FriendRequest[];
  friendsStats: FriendsStats;
  loading: boolean;
  addFriend: (friendId: string, friendName: string, friendAvatar?: string) => Promise<boolean>;
  removeFriend: (friendId: string) => Promise<boolean>;
  updateFriendStatus: (friendId: string, isOnline: boolean) => void;
  sendFriendRequestToUser: (toUserId: string, toUserName: string, message?: string) => Promise<boolean>;
  acceptRequest: (requestId: string) => Promise<boolean>;
  rejectRequest: (requestId: string) => Promise<boolean>;
  toggleFriendFavorite: (friendId: string) => Promise<boolean>;
  canAddMoreFriends: boolean;
  maxFreeLimit: number;
  getFriendById: (friendId: string) => Friend | undefined;
  refreshFriendsData: () => Promise<void>;
}

const FriendsContext = React.createContext<FriendsContextType | null>(null);

export const useFriends = () => {
  const context = React.useContext(FriendsContext);
  if (!context) {
    throw new Error("useFriends must be used within a FriendsProvider");
  }
  return context;
};

interface FriendsProviderProps {
  children: React.ReactNode;
}

export const FriendsProvider = ({ children }: FriendsProviderProps) => {
  const [friends, setFriends] = React.useState<Friend[]>([]);
  const [friendRequests, setFriendRequests] = React.useState<FriendRequest[]>([]);
  const [friendsStats, setFriendsStats] = React.useState<FriendsStats>({
    totalFriends: 0,
    onlineFriends: 0,
    pendingRequests: 0,
    sentRequests: 0,
    mutualConnections: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [currentUserId, setCurrentUserId] = React.useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>("User");

  const { isPremium } = usePremium();
  const maxFreeLimit = 3;

  // Monitor auth state
  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
        setCurrentUserName(user.displayName || `User${Math.floor(Math.random() * 1000)}`);
      } else {
        setCurrentUserId(null);
        setCurrentUserName("User");
        setFriends([]);
        setFriendRequests([]);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Set up real-time friends listener
  React.useEffect(() => {
    if (!currentUserId) return;

    setLoading(true);

    const unsubscribeFriends = listenToFriends(currentUserId, (firestoreFriends) => {
      const convertedFriends: Friend[] = firestoreFriends.map(f => ({
        id: f.friendId,
        name: f.friendName,
        avatar: f.friendAvatar || '',
        isOnline: f.isOnline,
        lastSeen: f.lastInteraction?.toDate(),
        addedAt: f.addedAt.toDate(),
        isFavorite: f.isFavorite,
        nickname: f.nickname
      }));

      setFriends(convertedFriends);
      setLoading(false);
    });

    const unsubscribeRequests = listenToFriendRequests(currentUserId, (requests) => {
      setFriendRequests(requests);
    });

    // Load friends stats
    refreshFriendsData();

    return () => {
      unsubscribeFriends();
      unsubscribeRequests();
    };
  }, [currentUserId]);

  const refreshFriendsData = async () => {
    if (!currentUserId) return;

    try {
      const stats = await getFriendsStats(currentUserId);
      setFriendsStats(stats);
    } catch (error) {
      console.error("Error refreshing friends data:", error);
    }
  };

  const addFriend = async (friendId: string, friendName: string, friendAvatar?: string): Promise<boolean> => {
    if (!currentUserId) return false;

    // Check if already at limit for free users
    if (!isPremium && friends.length >= maxFreeLimit) {
      return false; // Cannot add more friends
    }

    // Check if friend already exists
    if (friends.some(friend => friend.id === friendId)) {
      return true; // Already friends
    }

    // This will be used for direct friend addition (if needed)
    // For now, we'll use the friend request system
    return await sendFriendRequestToUser(friendId, friendName);
  };

  const sendFriendRequestToUser = async (toUserId: string, toUserName: string, message?: string): Promise<boolean> => {
    if (!currentUserId) return false;

    return await sendFriendRequest(currentUserId, currentUserName, toUserId, toUserName, message);
  };

  const acceptRequest = async (requestId: string): Promise<boolean> => {
    const success = await acceptFriendRequest(requestId);
    if (success) {
      await refreshFriendsData();
    }
    return success;
  };

  const rejectRequest = async (requestId: string): Promise<boolean> => {
    return await rejectFriendRequest(requestId);
  };

  const removeFriend = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    const success = await removeFirestoreFriend(currentUserId, friendId);
    if (success) {
      await refreshFriendsData();
    }
    return success;
  };

  const updateFriendStatus = (friendId: string, isOnline: boolean) => {
    if (!currentUserId) return;

    // Update local state immediately for better UX
    setFriends(prev => prev.map(friend =>
      friend.id === friendId
        ? {
            ...friend,
            isOnline,
            lastSeen: isOnline ? undefined : new Date()
          }
        : friend
    ));

    // Update in Firestore
    updateFriendOnlineStatus(currentUserId, friendId, isOnline);
  };

  const toggleFriendFavorite = async (friendId: string): Promise<boolean> => {
    if (!currentUserId) return false;

    // Import the function dynamically to avoid circular dependency
    const { toggleFriendFavorite: toggleFavorite } = await import("../lib/friendsFirestore");
    return await toggleFavorite(currentUserId, friendId);
  };

  const getFriendById = (friendId: string): Friend | undefined => {
    return friends.find(friend => friend.id === friendId);
  };

  const canAddMoreFriends = isPremium || friends.length < maxFreeLimit;

  return (
    <FriendsContext.Provider
      value={{
        friends,
        friendRequests,
        friendsStats,
        loading,
        addFriend,
        removeFriend,
        updateFriendStatus,
        sendFriendRequestToUser,
        acceptRequest,
        rejectRequest,
        toggleFriendFavorite,
        canAddMoreFriends,
        maxFreeLimit,
        getFriendById,
        refreshFriendsData,
      }}
    >
      {children}
    </FriendsContext.Provider>
  );
};
