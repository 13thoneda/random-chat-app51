import { useCallback, useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useSocket } from "../context/SocketProvider"
import { usePremium } from "../context/PremiumProvider"
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, Eye, Palette, Check, CheckCheck, Clock, Camera, Mic } from "lucide-react";
import SecretChatModal from "./SecretChatModal";
import WallpaperSelector from "./WallpaperSelector";

interface MessageProps{
    remoteChatToken: string | null;
    messagesArray: Array<{ sender: string; message: string; id?: string; isSecret?: boolean; timestamp?: number; isRead?: boolean }>;
    setMessagesArray: React.Dispatch<React.SetStateAction<Array<{ sender: string; message: string; id?: string; isSecret?: boolean; timestamp?: number; isRead?: boolean }>>>;
    partnerName?: string;
    partnerImage?: string;
}

interface ReceivedMessageProps {
    message: string;
    from: string;
    isSecret?: boolean;
    messageId?: string;
}

const wallpaperGradients: Record<string, string> = {
  'default': 'from-gray-900 to-gray-800',
  'sunset': 'from-orange-900/50 to-pink-900/50',
  'ocean': 'from-blue-900/50 to-cyan-900/50',
  'forest': 'from-green-900/50 to-emerald-900/50',
  'lavender': 'from-purple-900/50 to-pink-900/50',
  'mint': 'from-teal-900/50 to-green-900/50',
  'rose': 'from-rose-900/50 to-pink-900/50',
  'cosmic': 'from-indigo-900/50 to-purple-900/50',
};

export default function Messages({
    remoteChatToken, 
    messagesArray, 
    setMessagesArray, 
    partnerName = "Stranger",
    partnerImage
}: MessageProps) {
    const navigate = useNavigate();
    const {socket} = useSocket();
    const { isPremium, isUltraPremium, isProMonthly } = usePremium();
    const [message, setMessage] = useState<string>('');
    const [isSecretMode, setIsSecretMode] = useState<boolean>(false);
    const [showSecretModal, setShowSecretModal] = useState<boolean>(false);
    const [showWallpaperSelector, setShowWallpaperSelector] = useState<boolean>(false);
    const [currentWallpaper, setCurrentWallpaper] = useState<string>('default');
    const [isTyping, setIsTyping] = useState<boolean>(false);
    const [partnerTyping, setPartnerTyping] = useState<boolean>(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messagesArray]);

    // Load saved wallpaper
    useEffect(() => {
        const savedWallpaper = localStorage.getItem('ajnabicam_chat_wallpaper');
        if (savedWallpaper) {
            setCurrentWallpaper(savedWallpaper);
        }
    }, []);

    // Auto-delete secret messages
    useEffect(() => {
        if (isSecretMode) {
            const secretMessages = messagesArray.filter(msg => msg.isSecret);
            secretMessages.forEach(msg => {
                if (msg.timestamp && Date.now() - msg.timestamp > 3000) {
                    setMessagesArray(prev => prev.filter(m => m.id !== msg.id));
                }
            });
        }
    }, [messagesArray, isSecretMode]);

    const handleSendMessage = () => {
        if (!message.trim() || !remoteChatToken) return;

        const messageId = Date.now().toString();
        const newMessage = {
            sender: 'You',
            message: message.trim(),
            id: messageId,
            isSecret: isSecretMode,
            timestamp: Date.now()
        };

        setMessagesArray((prev) => [...prev, newMessage]);
        setMessage('');
        
        socket?.emit("send:message", {
            message: message.trim(),
            targetChatToken: remoteChatToken,
            isSecret: isSecretMode,
            messageId
        });

        // Send typing status end for premium users
        if (isUltraPremium() || isProMonthly()) {
            socket?.emit("typing:end", { targetChatToken: remoteChatToken });
            setIsTyping(false);
        }

        // Auto-delete secret message after 3 seconds
        if (isSecretMode) {
            setTimeout(() => {
                setMessagesArray(prev => prev.filter(msg => msg.id !== messageId));
            }, 3000);
        }

        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter") {
          handleSendMessage();
        }
    };

    const handleMessageReceived = useCallback(({message, isSecret = false, messageId}: ReceivedMessageProps) => {
        const newMessage = {
            sender: 'Stranger',
            message,
            id: messageId || Date.now().toString(),
            isSecret,
            timestamp: Date.now()
        };

        setMessagesArray((prev) => [...prev, newMessage]);

        // Send read receipt for premium users
        if ((isUltraPremium() || isProMonthly()) && messageId) {
            socket?.emit("message:read", {
                messageId,
                targetChatToken: remoteChatToken
            });
        }

        // Auto-delete secret message after 3 seconds
        if (isSecret) {
            setTimeout(() => {
                setMessagesArray(prev => prev.filter(msg => msg.id !== newMessage.id));
            }, 3000);
        }
    }, [setMessagesArray, remoteChatToken, socket, isUltraPremium, isProMonthly]);

    const handleSecretModeToggle = (enabled: boolean) => {
        setIsSecretMode(enabled);
        setShowSecretModal(false);
        
        // Notify partner about secret mode change
        socket?.emit("secret:mode:toggle", {
            targetChatToken: remoteChatToken,
            enabled
        });
    };

    const handleWallpaperSelect = (wallpaper: string) => {
        setCurrentWallpaper(wallpaper);
        localStorage.setItem('ajnabicam_chat_wallpaper', wallpaper);
    };

    const handleUpgrade = useCallback(() => {
        navigate('/premium');
        setShowSecretModal(false);
        setShowWallpaperSelector(false);
    }, [navigate]);

    const handlePremiumPurchase = useCallback((plan: string) => {
        console.log(`Processing payment for ${plan} plan`);
        console.log(`🎉 Welcome to Premium! Your ${plan} subscription is now active!`);
    }, []);

    // Handle typing status for premium users
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setMessage(e.target.value);

        // Typing indicator for premium users
        if (isUltraPremium() || isProMonthly()) {
            if (!isTyping) {
                setIsTyping(true);
                socket?.emit("typing:start", { targetChatToken: remoteChatToken });
            }

            // Clear existing timeout
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }

            // Set new timeout
            const timeout = setTimeout(() => {
                setIsTyping(false);
                socket?.emit("typing:end", { targetChatToken: remoteChatToken });
            }, 2000);

            setTypingTimeout(timeout);
        }
    };

    const formatTime = (timestamp: number) => {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
    };

    useEffect(() => {
        socket?.on("message:recieved", handleMessageReceived);
        socket?.on("secret:mode:changed", ({ enabled }: { enabled: boolean }) => {
            setIsSecretMode(enabled);
        });

        // Read receipt events for premium users
        socket?.on("message:read", ({ messageId }: { messageId: string }) => {
            setMessagesArray(prev => prev.map(msg =>
                msg.id === messageId ? { ...msg, isRead: true } : msg
            ));
        });

        // Typing status events for premium users
        socket?.on("typing:start", () => {
            setPartnerTyping(true);
        });

        socket?.on("typing:end", () => {
            setPartnerTyping(false);
        });

        return () => {
            socket?.off("message:recieved", handleMessageReceived);
            socket?.off("secret:mode:changed");
            socket?.off("message:read");
            socket?.off("typing:start");
            socket?.off("typing:end");

            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        }
    }, [handleMessageReceived, socket, typingTimeout]);

    return (
        <div className="flex flex-1 flex-col h-full bg-gray-900 text-white">
            {/* Messages Area with Dark Wallpaper */}
            <div className={`h-full overflow-y-auto p-4 bg-gradient-to-br ${wallpaperGradients[currentWallpaper]} scrollbar-hide relative`}>
                {/* Secret Mode Indicator */}
                {isSecretMode && (
                    <div className="sticky top-0 z-10 bg-purple-600 text-white text-center py-2 rounded-lg mb-4 shadow-md">
                        <div className="flex items-center justify-center gap-2">
                            <Eye className="h-4 w-4" />
                            <span className="text-sm font-semibold">Secret Mode Active - Messages disappear in 3s</span>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {messagesArray.map((msg, ind) => (
                        <div key={msg.id || ind} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`flex items-start gap-2 max-w-[75%] ${msg.sender === 'You' ? 'flex-row-reverse' : ''} ${msg.isSecret ? 'animate-pulse' : ''}`}>
                                {msg.sender !== 'You' && (
                                    <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                        {partnerImage ? (
                                            <img 
                                                src={partnerImage} 
                                                alt={partnerName}
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-passion-400 to-romance-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                                {partnerName.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="flex flex-col">
                                    <div
                                        className={`px-4 py-3 rounded-2xl ${
                                            msg.sender === 'You'
                                                ? 'bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-br-md'
                                                : 'bg-gray-700 text-gray-100 rounded-bl-md'
                                        } ${msg.isSecret ? 'border-purple-400 border-2 shadow-purple-300/30 shadow-lg' : ''}`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            {msg.isSecret && (
                                                <Eye className="h-3 w-3 text-purple-300" />
                                            )}
                                        </div>
                                        <p className="text-sm">{msg.message}</p>
                                        {/* Read receipt for own messages (premium users only) */}
                                        {msg.sender === 'You' && (isUltraPremium() || isProMonthly()) && (
                                            <div className="flex justify-end mt-1">
                                                {msg.isRead ? (
                                                    <CheckCheck className="h-3 w-3 text-blue-300" />
                                                ) : (
                                                    <Check className="h-3 w-3 text-gray-300" />
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {msg.timestamp && (
                                        <p className={`text-xs mt-1 ${
                                            msg.sender === 'You' ? 'text-right text-gray-400' : 'text-left text-gray-500'
                                        }`}>
                                            {formatTime(msg.timestamp)}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Typing indicator for premium users */}
                    {partnerTyping && (isUltraPremium() || isProMonthly()) && (
                        <div className="flex justify-start">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 mt-1">
                                    {partnerImage ? (
                                        <img 
                                            src={partnerImage} 
                                            alt={partnerName}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-passion-400 to-romance-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                            {partnerName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-gray-700 text-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Last seen indicator for premium users */}
                    {(isUltraPremium() || isProMonthly()) && !partnerTyping && messagesArray.length > 0 && (
                        <div className="flex justify-center">
                            <div className="bg-gray-700/50 px-3 py-1 rounded-full">
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    <span>Active now</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area with Dark Theme */}
            <div className="sticky bottom-0 left-0 w-full bg-gray-900 border-t border-gray-700 p-4">
                {/* Premium Controls */}
                <div className="flex gap-2 mb-3">
                    <Button
                        onClick={() => setShowSecretModal(true)}
                        size="sm"
                        variant={isSecretMode ? "default" : "outline"}
                        className={`flex items-center gap-1 ${
                            isSecretMode 
                                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                                : isPremium 
                                    ? 'border-purple-400 text-purple-300 hover:bg-purple-900/50 bg-transparent' 
                                    : 'border-gray-600 text-gray-500 bg-transparent'
                        }`}
                        disabled={!isPremium && !isSecretMode}
                    >
                        <Eye className="h-3 w-3" />
                        Secret
                    </Button>
                    
                    <Button
                        onClick={() => setShowWallpaperSelector(true)}
                        size="sm"
                        variant="outline"
                        className={`flex items-center gap-1 ${
                            isPremium 
                                ? 'border-purple-400 text-purple-300 hover:bg-purple-900/50 bg-transparent' 
                                : 'border-gray-600 text-gray-500 bg-transparent'
                        }`}
                        disabled={!isPremium}
                    >
                        <Palette className="h-3 w-3" />
                        Theme
                    </Button>
                </div>

                {/* Message Input */}
                <div className="flex items-center gap-3">
                    <div className="flex-1 relative">
                        <Input
                            ref={inputRef}
                            placeholder={isSecretMode ? "Secret message..." : "Write your message here"}
                            value={message}
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            aria-label="Message input"
                            disabled={!remoteChatToken}
                            className={`w-full bg-gray-700 border-gray-600 text-white placeholder-gray-400 rounded-2xl px-4 py-3 pr-24 focus:border-rose-500 focus:ring-rose-500 ${
                                isSecretMode
                                    ? 'border-purple-400 focus:border-purple-400 focus:ring-purple-400 bg-purple-900/30'
                                    : ''
                            }`}
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
                        className={`rounded-2xl px-4 py-3 min-w-[44px] h-12 flex items-center justify-center ${
                            isSecretMode 
                                ? 'bg-purple-600 hover:bg-purple-700' 
                                : 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700'
                        } text-white disabled:opacity-50`}
                        onClick={handleSendMessage} 
                        disabled={!remoteChatToken || !message.trim()}
                        aria-label="Send message"
                    >
                        <Send size={18} />
                    </Button>
                </div>
            </div>

            {/* Modals */}
            <SecretChatModal
                isOpen={showSecretModal}
                onClose={() => setShowSecretModal(false)}
                onToggle={handleSecretModeToggle}
                isEnabled={isSecretMode}
                isPremium={isPremium}
                onUpgrade={handleUpgrade}
            />

            <WallpaperSelector
                isOpen={showWallpaperSelector}
                onClose={() => setShowWallpaperSelector(false)}
                onSelect={handleWallpaperSelect}
                currentWallpaper={currentWallpaper}
                isPremium={isPremium}
                onUpgrade={handleUpgrade}
            />
        </div>
    );
}
