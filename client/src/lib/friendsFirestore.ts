import {
  collection,
  doc,
  addDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  updateDoc,
  serverTimestamp,
  Timestamp,
  getDoc,
  getDocs,
  setDoc,
  arrayUnion,
  arrayRemove,
  increment,
  deleteDoc
} from "./firestoreWrapper";

// Types for friends system
export interface FriendRequest {
  id?: string;
  fromUserId: string;
  fromUserName: string;
  fromUserAvatar?: string;
  toUserId: string;
  toUserName: string;
  toUserAvatar?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  message?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface Friend {
  id?: string;
  userId: string;
  friendId: string;
  friendName: string;
  friendAvatar?: string;
  addedAt: Timestamp;
  lastInteraction?: Timestamp;
  chatRoomId?: string;
  isOnline: boolean;
  isFavorite: boolean;
  mutualFriends: number;
  nickname?: string;
  notes?: string;
}

export interface FriendsStats {
  totalFriends: number;
  onlineFriends: number;
  pendingRequests: number;
  sentRequests: number;
  mutualConnections: number;
}

/**
 * Send a friend request
 */
export async function sendFriendRequest(fromUserId: string, fromUserName: string, toUserId: string, toUserName: string, message?: string): Promise<boolean> {
  try {
    // Check if request already exists
    const existingRequestQuery = query(
      collection("friendRequests"),
      where("fromUserId", "==", fromUserId),
      where("toUserId", "==", toUserId),
      where("status", "==", "pending")
    );
    
    const existingRequests = await getDocs(existingRequestQuery);
    if (!existingRequests.empty) {
      console.log("Friend request already exists");
      return false;
    }

    // Check reverse request
    const reverseRequestQuery = query(
      collection("friendRequests"),
      where("fromUserId", "==", toUserId),
      where("toUserId", "==", fromUserId),
      where("status", "==", "pending")
    );
    
    const reverseRequests = await getDocs(reverseRequestQuery);
    if (!reverseRequests.empty) {
      console.log("Reverse friend request already exists");
      return false;
    }

    // Create friend request
    const friendRequest: Omit<FriendRequest, 'id'> = {
      fromUserId,
      fromUserName,
      toUserId,
      toUserName,
      status: 'pending',
      message,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp
    };

    await addDoc(collection("friendRequests"), friendRequest);
    console.log("✅ Friend request sent");
    return true;
  } catch (error) {
    console.error("❌ Error sending friend request:", error);
    return false;
  }
}

/**
 * Accept a friend request
 */
export async function acceptFriendRequest(requestId: string): Promise<boolean> {
  try {
    const requestRef = doc("friendRequests", requestId);
    const requestSnap = await getDoc(requestRef);
    
    if (!requestSnap.exists()) {
      return false;
    }

    const requestData = requestSnap.data() as FriendRequest;
    
    // Update request status
    await updateDoc(requestRef, {
      status: 'accepted',
      updatedAt: serverTimestamp()
    });

    // Create friendship records for both users
    const friendship1: Omit<Friend, 'id'> = {
      userId: requestData.fromUserId,
      friendId: requestData.toUserId,
      friendName: requestData.toUserName,
      friendAvatar: requestData.toUserAvatar,
      addedAt: serverTimestamp() as Timestamp,
      isOnline: false,
      isFavorite: false,
      mutualFriends: 0
    };

    const friendship2: Omit<Friend, 'id'> = {
      userId: requestData.toUserId,
      friendId: requestData.fromUserId,
      friendName: requestData.fromUserName,
      friendAvatar: requestData.fromUserAvatar,
      addedAt: serverTimestamp() as Timestamp,
      isOnline: false,
      isFavorite: false,
      mutualFriends: 0
    };

    await addDoc(collection("friends"), friendship1);
    await addDoc(collection("friends"), friendship2);

    // Update friend counts
    const user1Ref = doc("users", requestData.fromUserId);
    const user2Ref = doc("users", requestData.toUserId);
    
    await updateDoc(user1Ref, {
      friendsCount: increment(1),
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(user2Ref, {
      friendsCount: increment(1),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Friend request accepted");
    return true;
  } catch (error) {
    console.error("❌ Error accepting friend request:", error);
    return false;
  }
}

/**
 * Reject a friend request
 */
export async function rejectFriendRequest(requestId: string): Promise<boolean> {
  try {
    const requestRef = doc("friendRequests", requestId);
    await updateDoc(requestRef, {
      status: 'rejected',
      updatedAt: serverTimestamp()
    });
    console.log("✅ Friend request rejected");
    return true;
  } catch (error) {
    console.error("❌ Error rejecting friend request:", error);
    return false;
  }
}

/**
 * Remove a friend
 */
export async function removeFriend(userId: string, friendId: string): Promise<boolean> {
  try {
    // Find and delete both friendship records
    const friendship1Query = query(
      collection("friends"),
      where("userId", "==", userId),
      where("friendId", "==", friendId)
    );
    
    const friendship2Query = query(
      collection("friends"),
      where("userId", "==", friendId),
      where("friendId", "==", userId)
    );

    const [friendship1Snap, friendship2Snap] = await Promise.all([
      getDocs(friendship1Query),
      getDocs(friendship2Query)
    ]);

    const deletePromises: Promise<void>[] = [];
    
    friendship1Snap.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    friendship2Snap.forEach(doc => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    await Promise.all(deletePromises);

    // Update friend counts
    const user1Ref = doc(db, "users", userId);
    const user2Ref = doc(db, "users", friendId);
    
    await updateDoc(user1Ref, {
      friendsCount: increment(-1),
      updatedAt: serverTimestamp()
    });
    
    await updateDoc(user2Ref, {
      friendsCount: increment(-1),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Friend removed");
    return true;
  } catch (error) {
    console.error("❌ Error removing friend:", error);
    return false;
  }
}

/**
 * Get user's friends list
 */
export async function getUserFriends(userId: string): Promise<Friend[]> {
  try {
    const friendsQuery = query(
      collection("friends"),
      where("userId", "==", userId),
      orderBy("addedAt", "desc")
    );

    const snapshot = await getDocs(friendsQuery);
    const friends: Friend[] = [];

    snapshot.forEach((doc) => {
      friends.push({ id: doc.id, ...doc.data() } as Friend);
    });

    return friends;
  } catch (error) {
    console.error("❌ Error getting user friends:", error);
    return [];
  }
}

/**
 * Get pending friend requests for a user
 */
export async function getPendingFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const requestsQuery = query(
      collection("friendRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(requestsQuery);
    const requests: FriendRequest[] = [];

    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
    });

    return requests;
  } catch (error) {
    console.error("❌ Error getting pending friend requests:", error);
    return [];
  }
}

/**
 * Get sent friend requests by a user
 */
export async function getSentFriendRequests(userId: string): Promise<FriendRequest[]> {
  try {
    const requestsQuery = query(
      collection("friendRequests"),
      where("fromUserId", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(requestsQuery);
    const requests: FriendRequest[] = [];

    snapshot.forEach((doc) => {
      requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
    });

    return requests;
  } catch (error) {
    console.error("❌ Error getting sent friend requests:", error);
    return [];
  }
}

/**
 * Listen to friend requests (real-time)
 */
export function listenToFriendRequests(userId: string, callback: (requests: FriendRequest[]) => void): () => void {
  try {
    const requestsQuery = query(
      collection("friendRequests"),
      where("toUserId", "==", userId),
      where("status", "==", "pending"),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(requestsQuery, (snapshot) => {
      const requests: FriendRequest[] = [];
      snapshot.forEach((doc) => {
        requests.push({ id: doc.id, ...doc.data() } as FriendRequest);
      });
      callback(requests);
    }, (error) => {
      console.error("❌ Error listening to friend requests:", error);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up friend requests listener:", error);
    return () => {};
  }
}

/**
 * Listen to friends list (real-time)
 */
export function listenToFriends(userId: string, callback: (friends: Friend[]) => void): () => void {
  try {
    const friendsQuery = query(
      collection("friends"),
      where("userId", "==", userId),
      orderBy("addedAt", "desc")
    );

    const unsubscribe = onSnapshot(friendsQuery, (snapshot) => {
      const friends: Friend[] = [];
      snapshot.forEach((doc) => {
        friends.push({ id: doc.id, ...doc.data() } as Friend);
      });
      callback(friends);
    }, (error) => {
      console.error("❌ Error listening to friends:", error);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up friends listener:", error);
    return () => {};
  }
}

/**
 * Update friend's online status
 */
export async function updateFriendOnlineStatus(userId: string, friendId: string, isOnline: boolean): Promise<boolean> {
  try {
    const friendQuery = query(
      collection("friends"),
      where("userId", "==", userId),
      where("friendId", "==", friendId)
    );

    const snapshot = await getDocs(friendQuery);
    
    if (!snapshot.empty) {
      const friendDoc = snapshot.docs[0];
      await updateDoc(friendDoc.ref, {
        isOnline,
        lastInteraction: serverTimestamp()
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error updating friend online status:", error);
    return false;
  }
}

/**
 * Add friend to favorites
 */
export async function toggleFriendFavorite(userId: string, friendId: string): Promise<boolean> {
  try {
    const friendQuery = query(
      collection("friends"),
      where("userId", "==", userId),
      where("friendId", "==", friendId)
    );

    const snapshot = await getDocs(friendQuery);
    
    if (!snapshot.empty) {
      const friendDoc = snapshot.docs[0];
      const currentData = friendDoc.data() as Friend;
      
      await updateDoc(friendDoc.ref, {
        isFavorite: !currentData.isFavorite
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error("❌ Error toggling friend favorite:", error);
    return false;
  }
}

/**
 * Get friends statistics
 */
export async function getFriendsStats(userId: string): Promise<FriendsStats> {
  try {
    const [friends, pendingRequests, sentRequests] = await Promise.all([
      getUserFriends(userId),
      getPendingFriendRequests(userId),
      getSentFriendRequests(userId)
    ]);

    const onlineFriends = friends.filter(friend => friend.isOnline).length;

    return {
      totalFriends: friends.length,
      onlineFriends,
      pendingRequests: pendingRequests.length,
      sentRequests: sentRequests.length,
      mutualConnections: 0 // Can be calculated based on mutual friends
    };
  } catch (error) {
    console.error("❌ Error getting friends stats:", error);
    return {
      totalFriends: 0,
      onlineFriends: 0,
      pendingRequests: 0,
      sentRequests: 0,
      mutualConnections: 0
    };
  }
}
