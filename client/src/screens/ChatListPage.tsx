import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BottomNavBar from "../components/BottomNavBar";
import UltraBottomNavBar from "../components/UltraBottomNavBar";
import { UltraPageTransition } from "../components/UltraBottomNavBar";
import { usePremium } from "../context/PremiumProvider";
import { useFriends } from "../context/FriendsProvider";
import { Button } from "../components/ui/button";
import { ArrowLeft, MessageCircle, Search, Plus, Users, Phone, Video, Circle, Crown } from "lucide-react";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: Date;
  unreadCount: number;
  isOnline: boolean;
  avatar?: string;
  type: 'friend' | 'stranger' | 'ai';
  isFavorite?: boolean;
}

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUltraPremium } = usePremium();
  const { friends } = useFriends();
  const [searchTerm, setSearchTerm] = useState("");
  const [chats, setChats] = useState<ChatItem[]>([]);

  const handleBackClick = () => {
    navigate(-1);
  };

  // Initialize chat list with friends and recent conversations
  useEffect(() => {
    const sampleChats: ChatItem[] = [
      {
        id: "ai-chat",
        name: "AI Assistant",
        lastMessage: "How can I help you today? 🤖",
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        unreadCount: 0,
        isOnline: true,
        type: 'ai',
        avatar: "🤖"
      },
      // Add friends as potential chats
      ...friends.map((friend, index) => ({
        id: friend.id,
        name: friend.name,
        lastMessage: `Hey! How are you doing? 😊`,
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * (index + 1)), // Hours ago
        unreadCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : 0,
        isOnline: Math.random() > 0.5,
        type: 'friend' as const,
        avatar: friend.avatar,
        isFavorite: Math.random() > 0.8
      })),
      // Add some sample recent stranger chats
      {
        id: "stranger-1",
        name: "Jenna",
        lastMessage: "Thanks for the great conversation! 💕",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
        unreadCount: 2,
        isOnline: false,
        type: 'stranger',
        avatar: "https://cdn.builder.io/api/v1/image/assets%2Feb241c248ac841278e2030c55cc7db99%2Fd10127518d49448b813b68c9486b4f71?format=webp&width=100"
      },
      {
        id: "stranger-2", 
        name: "Alex",
        lastMessage: "See you around! 👋",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 12), // 12 hours ago
        unreadCount: 0,
        isOnline: true,
        type: 'stranger'
      }
    ];

    setChats(sampleChats);
  }, [friends]);

  const filteredChats = chats.filter(chat =>
    chat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChatClick = (chat: ChatItem) => {
    if (chat.type === 'ai') {
      navigate('/ai-chatbot');
    } else if (chat.type === 'friend') {
      navigate('/personal-chat', { state: { friendId: chat.id, friendName: chat.name } });
    } else {
      navigate('/chat', { state: { partnerId: chat.id, partnerName: chat.name } });
    }
  };

  const handleNewChat = () => {
    navigate('/video-chat', { state: { isSearching: true } });
  };

  const handleVideoCall = (chat: ChatItem) => {
    if (chat.type === 'friend') {
      navigate('/video-chat', { 
        state: { 
          friendCall: true, 
          friendId: chat.id, 
          friendName: chat.name 
        } 
      });
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffMinutes < 1 ? 'now' : `${diffMinutes}m`;
    } else if (diffHours < 24) {
      return `${diffHours}h`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    }
  };

  return (
    <>
      <Helmet>
        <title>AjnabiCam - Chats</title>
      </Helmet>
      <UltraPageTransition>
        <main className={`flex flex-col min-h-screen w-full ${
          isUltraPremium() ? 'max-w-full' : 'max-w-md'
        } mx-auto bg-gray-900 text-white relative`}>
          
          {/* Header */}
          <div className={`flex items-center p-4 ${
            isUltraPremium() 
              ? 'bg-gradient-to-r from-purple-800 to-pink-800' 
              : 'bg-gradient-to-r from-rose-600 to-pink-700'
          } text-white shadow-lg`}>
            <button 
              onClick={handleBackClick} 
              className="mr-3 text-white hover:scale-110 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold">Chats</h1>
              <p className="text-sm opacity-80">{filteredChats.length} conversations</p>
            </div>
            <button 
              onClick={handleNewChat}
              className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
            >
              <Plus size={24} />
            </button>
          </div>

          {/* Search Bar */}
          <div className="p-4 bg-gray-900 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-2xl pl-10 pr-4 py-3 text-white placeholder-gray-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Chat List */}
          <div className="flex-1 overflow-y-auto bg-gray-900">
            {filteredChats.length === 0 ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-xl font-bold text-gray-300 mb-2">No Chats Yet</h2>
                  <p className="text-gray-400 mb-6 text-sm">
                    Start your first conversation by meeting new people
                  </p>
                  <Button
                    onClick={handleNewChat}
                    className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Meet New People
                  </Button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-700">
                {filteredChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="flex items-center gap-3 p-4 hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => handleChatClick(chat)}
                  >
                    {/* Avatar */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-passion-400 to-romance-500 flex items-center justify-center">
                        {chat.avatar && !chat.avatar.startsWith('http') ? (
                          <span className="text-2xl">{chat.avatar}</span>
                        ) : chat.avatar ? (
                          <img 
                            src={chat.avatar} 
                            alt={chat.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-white font-bold text-lg">
                            {chat.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      
                      {/* Online Status */}
                      {chat.isOnline && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                      )}
                      
                      {/* Premium/Favorite Badge */}
                      {chat.type === 'ai' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-xs">🤖</span>
                        </div>
                      )}
                      {chat.isFavorite && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center">
                          <span className="text-xs">⭐</span>
                        </div>
                      )}
                    </div>

                    {/* Chat Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{chat.name}</h3>
                        {chat.type === 'friend' && (
                          <Crown className="w-4 h-4 text-yellow-500" />
                        )}
                        {chat.isOnline && (
                          <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                        )}
                      </div>
                      <p className="text-sm text-gray-400 truncate">{chat.lastMessage}</p>
                    </div>

                    {/* Time and Actions */}
                    <div className="flex flex-col items-end gap-2">
                      <span className="text-xs text-gray-500">{formatTime(chat.timestamp)}</span>
                      
                      {/* Unread Count */}
                      {chat.unreadCount > 0 && (
                        <div className="bg-rose-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                          {chat.unreadCount}
                        </div>
                      )}
                      
                      {/* Quick Actions */}
                      <div className="flex gap-1">
                        {chat.type === 'friend' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleVideoCall(chat);
                            }}
                            className="text-gray-400 hover:text-white transition-colors p-1"
                          >
                            <Video className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChatClick(chat);
                          }}
                          className="text-gray-400 hover:text-white transition-colors p-1"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div className="p-4 bg-gray-900 border-t border-gray-700">
            <div className="flex gap-2">
              <Button
                onClick={handleNewChat}
                className="flex-1 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white py-3 rounded-2xl font-semibold"
              >
                <Users className="h-5 w-5 mr-2" />
                Meet New People
              </Button>
              <Button
                onClick={() => navigate('/ai-chatbot')}
                className="px-4 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-2xl"
              >
                🤖
              </Button>
            </div>
          </div>
          
          <div className="pb-20">
            {isUltraPremium() ? <UltraBottomNavBar /> : <BottomNavBar />}
          </div>
        </main>
      </UltraPageTransition>
    </>
  );
};

export default ChatListPage;
