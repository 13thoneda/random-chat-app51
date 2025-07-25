import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import BottomNavBar from "../components/BottomNavBar";
import UltraBottomNavBar from "../components/UltraBottomNavBar";
import { UltraPageTransition } from "../components/UltraBottomNavBar";
import { usePremium } from "../context/PremiumProvider";
import { useSocket } from "../context/SocketProvider";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ArrowLeft, Send, MessageCircle, Crown, Users, MoreVertical, Mic, Camera, Circle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  timestamp: Date;
  isOwnMessage: boolean;
}

const ChatPage: React.FC = () => {
  const navigate = useNavigate();
  const { isUltraPremium } = usePremium();
  const socketContext = useSocket();
  const socket = (socketContext as any).socket || socketContext;
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partnerConnected, setPartnerConnected] = useState(false);
  const [partnerName] = useState("Jenna");
  const [showNotification, setShowNotification] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const handleBackClick = () => {
    navigate(-1);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    socket.on("chat-connected", () => {
      setIsConnected(true);
      setPartnerConnected(true);
      setMessages([]);
    });

    socket.on("chat-message", (data: { message: string; timestamp: string }) => {
      const newMessage: Message = {
        id: Date.now().toString(),
        text: data.message,
        timestamp: new Date(data.timestamp),
        isOwnMessage: false
      };
      setMessages(prev => [...prev, newMessage]);
    });

    socket.on("partner-disconnected", () => {
      setPartnerConnected(false);
      const systemMessage: Message = {
        id: Date.now().toString(),
        text: "Your chat partner has disconnected. Looking for a new partner...",
        timestamp: new Date(),
        isOwnMessage: false
      };
      setMessages(prev => [...prev, systemMessage]);
    });

    socket.on("partner-typing", () => {
      setIsTyping(true);
      setTimeout(() => setIsTyping(false), 3000);
    });

    socket.on("chat-disconnected", () => {
      setIsConnected(false);
      setPartnerConnected(false);
    });

    return () => {
      socket.off("chat-connected");
      socket.off("chat-message");
      socket.off("partner-disconnected");
      socket.off("partner-typing");
      socket.off("chat-disconnected");
    };
  }, [socket]);

  const handleStartChat = () => {
    if (socket) {
      socket.emit("start-text-chat");
      setIsConnected(true);
      setPartnerConnected(true);
      // Add some demo messages for the design
      setTimeout(() => {
        setMessages([
          {
            id: "1",
            text: "Hello! How are you doing? 😊",
            timestamp: new Date(Date.now() - 60000),
            isOwnMessage: false
          },
          {
            id: "2", 
            text: "Hi! Great!",
            timestamp: new Date(Date.now() - 30000),
            isOwnMessage: true
          }
        ]);
      }, 500);
    }
  };

  const handleSendMessage = () => {
    if (!messageText.trim() || !socket || !partnerConnected) return;

    const newMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      timestamp: new Date(),
      isOwnMessage: true
    };

    setMessages(prev => [...prev, newMessage]);
    socket.emit("send-chat-message", messageText);
    setMessageText("");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    if (socket && partnerConnected) {
      socket.emit("typing");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  const handleStopChat = () => {
    if (socket) {
      socket.emit("stop-chat");
      setIsConnected(false);
      setPartnerConnected(false);
      setMessages([]);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <>
      <Helmet>
        <title>AjnabiCam - Text Chat</title>
      </Helmet>
      <UltraPageTransition>
        <main className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-gray-900 text-white relative">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
            <button 
              onClick={handleBackClick} 
              className="text-white hover:scale-110 transition-transform"
            >
              <ArrowLeft size={24} />
            </button>
            
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden">
                <img 
                  src="https://cdn.builder.io/api/v1/image/assets%2Feb241c248ac841278e2030c55cc7db99%2Fd10127518d49448b813b68c9486b4f71?format=webp&width=100" 
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-semibold">{partnerName}</h1>
                <div className="flex items-center gap-1">
                  <Circle className="w-2 h-2 fill-green-400 text-green-400" />
                  <span className="text-xs text-gray-400">online</span>
                </div>
              </div>
            </div>

            <button className="text-white">
              <MoreVertical size={24} />
            </button>
          </div>

          {/* Chat Area */}
          <div className="flex-1 overflow-y-auto bg-gray-900 relative">
            
            {/* Notification Message */}
            {showNotification && partnerConnected && (
              <div className="p-4">
                <div className="bg-gray-700 rounded-2xl p-3 text-center">
                  <div className="w-8 h-8 rounded-full overflow-hidden mx-auto mb-2">
                    <img 
                      src="https://cdn.builder.io/api/v1/image/assets%2Feb241c248ac841278e2030c55cc7db99%2Fd10127518d49448b813b68c9486b4f71?format=webp&width=100" 
                      alt={partnerName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <p className="text-sm text-gray-300">
                    {partnerName} is waiting for a message from you!
                  </p>
                </div>
              </div>
            )}

            {!isConnected ? (
              <div className="flex-1 flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <h2 className="text-2xl font-bold text-rose-400 mb-2">Text Chat</h2>
                  <p className="text-gray-400 mb-6">
                    Connect with strangers through anonymous text conversations
                  </p>
                  
                  <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-xl p-4 mb-6 border border-purple-700/30 max-w-sm mx-auto">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Crown className="h-5 w-5 text-purple-400" />
                      <span className="font-semibold text-purple-300">Premium Feature</span>
                    </div>
                    <p className="text-sm text-purple-300">
                      Text chat is available for all users. Premium users get priority matching!
                    </p>
                  </div>

                  <Button
                    onClick={handleStartChat}
                    className="w-full max-w-sm py-4 text-lg font-bold rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                  >
                    <Users className="h-5 w-5 mr-2" />
                    Start Text Chat
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.isOwnMessage ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start gap-2 max-w-[75%] ${message.isOwnMessage ? 'flex-row-reverse' : ''}`}>
                      {!message.isOwnMessage && (
                        <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                          <img 
                            src="https://cdn.builder.io/api/v1/image/assets%2Feb241c248ac841278e2030c55cc7db99%2Fd10127518d49448b813b68c9486b4f71?format=webp&width=100" 
                            alt={partnerName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`px-4 py-3 rounded-2xl ${
                            message.isOwnMessage
                              ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-md'
                              : 'bg-gray-700 text-gray-100 rounded-bl-md'
                          }`}
                        >
                          <p className="text-sm">{message.text}</p>
                        </div>
                        <p className={`text-xs mt-1 ${
                          message.isOwnMessage ? 'text-right text-gray-400' : 'text-left text-gray-500'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                        <img 
                          src="https://cdn.builder.io/api/v1/image/assets%2Feb241c248ac841278e2030c55cc7db99%2Fd10127518d49448b813b68c9486b4f71?format=webp&width=100" 
                          alt={partnerName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>

          {/* Input Area */}
          {isConnected && partnerConnected && (
            <div className="p-4 bg-gray-900 border-t border-gray-700">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <Input
                    type="text"
                    placeholder="Write your message here"
                    value={messageText}
                    onChange={handleInputChange}
                    onKeyPress={handleKeyPress}
                    className="w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-2xl px-4 py-3 pr-24 focus:border-rose-500 focus:ring-rose-500"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Camera className="w-5 h-5" />
                    </button>
                    <button className="text-gray-400 hover:text-white transition-colors">
                      <Mic className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <Button
                  onClick={handleSendMessage}
                  disabled={!messageText.trim()}
                  className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white rounded-2xl px-4 py-3 min-w-[44px] h-12 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
            </div>
          )}
          
          {!isConnected && (
            <div className="pb-20">
              {isUltraPremium() ? <UltraBottomNavBar /> : <BottomNavBar />}
            </div>
          )}
        </main>
      </UltraPageTransition>
    </>
  );
};

export default ChatPage;
