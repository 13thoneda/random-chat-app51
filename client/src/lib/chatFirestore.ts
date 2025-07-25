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
  increment
} from "./firestoreWrapper";

// Types for chat messages
export interface ChatMessage {
  id?: string;
  chatRoomId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  recipientId: string;
  recipientName: string;
  message: string;
  messageType: 'text' | 'image' | 'video' | 'emoji' | 'system';
  imageUrl?: string;
  videoUrl?: string;
  isRead: boolean;
  timestamp: Timestamp;
  edited?: boolean;
  editedAt?: Timestamp;
  replyTo?: string; // ID of message being replied to
  reactions?: { [userId: string]: string }; // emoji reactions
  metadata?: {
    chatDuration?: number;
    isFirstMessage?: boolean;
    systemMessageType?: string;
  };
}

export interface ChatRoom {
  id?: string;
  participants: string[];
  participantNames: { [userId: string]: string };
  participantAvatars: { [userId: string]: string };
  lastMessage?: {
    text: string;
    senderId: string;
    timestamp: Timestamp;
    type: 'text' | 'image' | 'video' | 'emoji';
  };
  totalMessages: number;
  isActive: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  chatType: 'random' | 'friend' | 'group';
  wallpaper?: {
    id: number;
    name: string;
    gradient?: string;
    imageUrl?: string;
  };
  settings: {
    messagesEnabled: boolean;
    imagesEnabled: boolean;
    videosEnabled: boolean;
    soundEnabled: boolean;
  };
}

/**
 * Create or get existing chat room between two users
 */
export async function createOrGetChatRoom(user1Id: string, user2Id: string, user1Name: string, user2Name: string, user1Avatar?: string, user2Avatar?: string): Promise<string> {
  try {
    // Create a consistent room ID regardless of user order
    const roomId = [user1Id, user2Id].sort().join('_');
    const chatRoomRef = doc(db, "chatRooms", roomId);
    const chatRoomSnap = await getDoc(chatRoomRef);

    if (!chatRoomSnap.exists()) {
      // Create new chat room
      const newChatRoom: ChatRoom = {
        participants: [user1Id, user2Id],
        participantNames: {
          [user1Id]: user1Name,
          [user2Id]: user2Name
        },
        participantAvatars: {
          [user1Id]: user1Avatar || '',
          [user2Id]: user2Avatar || ''
        },
        totalMessages: 0,
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
        chatType: 'random',
        settings: {
          messagesEnabled: true,
          imagesEnabled: true,
          videosEnabled: true,
          soundEnabled: true
        }
      };

      await setDoc(chatRoomRef, newChatRoom);
      console.log("✅ Chat room created:", roomId);
    }

    return roomId;
  } catch (error) {
    console.error("❌ Error creating/getting chat room:", error);
    throw error;
  }
}

/**
 * Send a message to a chat room
 */
export async function sendMessage(chatRoomId: string, senderId: string, senderName: string, recipientId: string, recipientName: string, message: string, messageType: 'text' | 'image' | 'video' | 'emoji' = 'text', mediaUrl?: string): Promise<string | null> {
  try {
    const messagesRef = collection("chatRooms", chatRoomId, "messages");
    
    const newMessage: Omit<ChatMessage, 'id'> = {
      chatRoomId,
      senderId,
      senderName,
      recipientId,
      recipientName,
      message,
      messageType,
      isRead: false,
      timestamp: serverTimestamp() as Timestamp
    };

    if (messageType === 'image' && mediaUrl) {
      newMessage.imageUrl = mediaUrl;
    } else if (messageType === 'video' && mediaUrl) {
      newMessage.videoUrl = mediaUrl;
    }

    // Add the message
    const messageDoc = await addDoc(messagesRef, newMessage);

    // Update chat room with last message info
    const chatRoomRef = doc(db, "chatRooms", chatRoomId);
    await updateDoc(chatRoomRef, {
      lastMessage: {
        text: messageType === 'text' ? message : `📷 ${messageType}`,
        senderId,
        timestamp: serverTimestamp(),
        type: messageType
      },
      totalMessages: increment(1),
      updatedAt: serverTimestamp()
    });

    console.log("✅ Message sent:", messageDoc.id);
    return messageDoc.id;
  } catch (error) {
    console.error("❌ Error sending message:", error);
    return null;
  }
}

/**
 * Listen to messages in a chat room (real-time)
 */
export function listenToMessages(chatRoomId: string, callback: (messages: ChatMessage[]) => void, limitCount: number = 50): () => void {
  try {
    const messagesRef = collection("chatRooms", chatRoomId, "messages");
    const q = query(
      messagesRef,
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messages: ChatMessage[] = [];
      snapshot.forEach((doc) => {
        messages.push({ id: doc.id, ...doc.data() } as ChatMessage);
      });
      
      // Reverse to show oldest first
      messages.reverse();
      callback(messages);
    }, (error) => {
      console.error("❌ Error listening to messages:", error);
    });

    return unsubscribe;
  } catch (error) {
    console.error("❌ Error setting up message listener:", error);
    return () => {};
  }
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(chatRoomId: string, userId: string): Promise<boolean> {
  try {
    const messagesRef = collection("chatRooms", chatRoomId, "messages");
    const q = query(
      messagesRef,
      where("recipientId", "==", userId),
      where("isRead", "==", false)
    );

    const snapshot = await getDocs(q);

    const promises = snapshot.docs.map(doc =>
      updateDoc(doc.ref, { isRead: true })
    );

    await Promise.all(promises);
    console.log("✅ Messages marked as read");
    return true;
  } catch (error) {
    console.error("❌ Error marking messages as read:", error);
    return false;
  }
}

/**
 * Get chat rooms for a user
 */
export async function getUserChatRooms(userId: string): Promise<ChatRoom[]> {
  try {
    const chatRoomsRef = collection(db, "chatRooms");
    const q = query(
      chatRoomsRef,
      where("participants", "array-contains", userId),
      orderBy("updatedAt", "desc")
    );

    const snapshot = await getDocs(q);
    const chatRooms: ChatRoom[] = [];

    snapshot.forEach((doc) => {
      chatRooms.push({ id: doc.id, ...doc.data() } as ChatRoom);
    });

    return chatRooms;
  } catch (error) {
    console.error("❌ Error getting user chat rooms:", error);
    return [];
  }
}

/**
 * Update chat room wallpaper
 */
export async function updateChatRoomWallpaper(chatRoomId: string, wallpaper: ChatRoom['wallpaper']): Promise<boolean> {
  try {
    const chatRoomRef = doc(db, "chatRooms", chatRoomId);
    await updateDoc(chatRoomRef, {
      wallpaper,
      updatedAt: serverTimestamp()
    });
    console.log("✅ Chat room wallpaper updated");
    return true;
  } catch (error) {
    console.error("❌ Error updating chat room wallpaper:", error);
    return false;
  }
}

/**
 * Add reaction to a message
 */
export async function addMessageReaction(chatRoomId: string, messageId: string, userId: string, emoji: string): Promise<boolean> {
  try {
    const messageRef = doc(db, "chatRooms", chatRoomId, "messages", messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: emoji
    });
    return true;
  } catch (error) {
    console.error("❌ Error adding message reaction:", error);
    return false;
  }
}

/**
 * Remove reaction from a message
 */
export async function removeMessageReaction(chatRoomId: string, messageId: string, userId: string): Promise<boolean> {
  try {
    const messageRef = doc(db, "chatRooms", chatRoomId, "messages", messageId);
    await updateDoc(messageRef, {
      [`reactions.${userId}`]: null
    });
    return true;
  } catch (error) {
    console.error("❌ Error removing message reaction:", error);
    return false;
  }
}

/**
 * Delete a message (soft delete by updating content)
 */
export async function deleteMessage(chatRoomId: string, messageId: string): Promise<boolean> {
  try {
    const messageRef = doc(db, "chatRooms", chatRoomId, "messages", messageId);
    await updateDoc(messageRef, {
      message: "This message was deleted",
      messageType: 'system',
      edited: true,
      editedAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error("❌ Error deleting message:", error);
    return false;
  }
}
