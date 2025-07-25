import { useCallback, useState, useEffect, useRef } from "react";
import { Button } from "../components/ui/button";
import { playSound } from "../lib/audio";
import { useSocket } from "../context/SocketProvider";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useInAppNotification } from "../components/InAppNotification";
import { useDailyBonusNotification } from "../hooks/useDailyBonusNotification";
import {
  Crown,
  Coins,
  Mic,
  Video,
  Users,
  Sparkles,
  Heart,
  Zap,
  Shield,
  Star,
  Play,
  Globe,
  User,
  Gem,
  Settings,
  Bot,
  MessageCircle,
} from "lucide-react";
import GenderFilter from "../components/GenderFilter";
// import PremiumPaywall from "../components/PremiumPaywall"; // Now using separate page
import TreasureChest from "../components/TreasureChest";
import BottomNavBar from "../components/BottomNavBar";
import { usePremium } from "../context/PremiumProvider";
import { useCoin } from "../context/CoinProvider";
import { useLanguage } from "../context/LanguageProvider";
import BannerAd from "../components/BannerAd";
import RewardedAdButton from "../components/RewardedAdButton";
import PremiumBadge from "../components/PremiumBadge";
import { OnlineNotificationManager } from "../components/OnlineNotification";
import UltraHomeEnhancements from "../components/UltraHomeEnhancements";
import UltraBottomNavBar from "../components/UltraBottomNavBar";
import { UltraPageTransition } from "../components/UltraBottomNavBar";
import { useHaptics } from "../lib/haptics";

// Ad unit IDs for scrollable banner ads
const adUnitIds = [
  import.meta.env.VITE_ADMOB_BANNER_ID || 'ca-app-pub-1776596266948987/2770517385', // Original banner ad
  'ca-app-pub-1776596266948987/7315217300', // New ad unit 1
  'ca-app-pub-1776596266948987/2468099206', // New ad unit 2
];

const testimonials = [
  {
    name: "Priya",
    text: "Found my perfect match here! So grateful 💕",
    rating: 5,
  },
  {
    name: "Arjun",
    text: "Every chat is a new adventure, truly amazing!",
    rating: 5,
  },
  {
    name: "Sneha",
    text: "Safe, fun, and full of romantic possibilities 🌟",
    rating: 5,
  },
];

const stats = [
  { number: "10M+", label: "Happy Users", icon: Users },
  { number: "50M+", label: "Connections Made", icon: Heart },
  { number: "99.9%", label: "Uptime", icon: Shield },
];

export default function Home() {
  const { socket, isUsingMockMode } = useSocket();
  const navigate = useNavigate();
  const { isPremium, setPremium, isUltraPremium, isProMonthly, premiumPlan } = usePremium();
  const {
    coins,
    claimDailyBonus,
    canClaimDailyBonus,
    isLoading: coinsLoading,
    currentUser,
    hasCompletedOnboarding,
  } = useCoin();
  const { t } = useLanguage();
  const [currentAdIndex, setCurrentAdIndex] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  // const [showPaywall, setShowPaywall] = useState(false); // Now using separate page
  const [showTreasureChest, setShowTreasureChest] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState(12847);
  const { showBonusNotification, NotificationComponent } =
    useInAppNotification();
  const { buttonTap, premiumAction, matchFound } = useHaptics();

  // Handle daily bonus notification
  useDailyBonusNotification({
    canClaimDailyBonus,
    currentUser,
    hasCompletedOnboarding,
    showBonusNotification,
    claimDailyBonus,
  });

  // Redirect to onboarding if user hasn't completed it
  useEffect(() => {
    if (currentUser && !coinsLoading && !hasCompletedOnboarding) {
      navigate('/onboarding');
    }
  }, [currentUser, hasCompletedOnboarding, coinsLoading, navigate]);

  // Simulate online users count
  useEffect(() => {
    const interval = setInterval(() => {
      setOnlineUsers((prev) => prev + Math.floor(Math.random() * 10) - 5);
    }, 5000);
    return () => clearInterval(interval);
  }, []);



  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentAdIndex((prev) => (prev + 1) % adUnitIds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleStartCall = useCallback(
    async (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (isConnecting) return;

      // Haptic feedback for main action
      matchFound();
      setIsConnecting(true);
      playSound("join");

      // Navigate to chat list to see recent conversations
      console.log("Navigating to chat list...");
      navigate("/chat-list");

      setIsConnecting(false);
    },
    [navigate, isConnecting, matchFound],
  );

  const handleVoiceChat = useCallback(() => {
    buttonTap();
    navigate("/voice");
  }, [navigate, buttonTap]);

  const handleUpgrade = () => {
    premiumAction();
    navigate("/premium");
  };

  // const handlePremiumPurchase = (plan: string) => {
  //   const now = new Date();
  //   const expiry = new Date(now);
  //   if (plan === "weekly") {
  //     expiry.setDate(now.getDate() + 7);
  //   } else {
  //     expiry.setMonth(now.getMonth() + 1);
  //   }

  //   setPremium(true, expiry);
  //   setShowPaywall(false);

  //   showBonusNotification(
  //     "🎉 Welcome to Premium!",
  //     `Your ${plan} subscription is now active! Enjoy unlimited features.`,
  //     () => {},
  //   );
  // }; // Now handled in PremiumPage

  // Show loading while checking authentication and onboarding status
  if (coinsLoading && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-peach-25 via-cream-50 to-blush-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-peach-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>
          {t("app.name")} - Random Video Chat - Live chat with ajnabis
        </title>
      </Helmet>
      <UltraPageTransition>
        <main className={`flex flex-col min-h-screen w-full relative ${
          isUltraPremium()
            ? 'bg-rose-50/30'
            : 'bg-gray-50'
        }`}>
        {/* Mobile App Content Container */}
        <div className="flex-1 px-4 py-6 space-y-6">

          {/* User Status Card */}
          <div className={`rounded-2xl p-4 shadow-sm border ${
            isUltraPremium()
              ? 'bg-gradient-to-br from-amber-100 to-orange-100 border-amber-200/50'
              : 'bg-white border-gray-100'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  isUltraPremium()
                    ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600'
                }`}>
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold ${
                      isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                    }`}>AjnabiCam</span>
                    {isPremium && (
                      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full ${
                        isUltraPremium()
                          ? 'bg-gradient-to-r from-rose-500 to-pink-500'
                          : 'bg-gradient-to-r from-purple-500 to-pink-500'
                      }`}>
                        <Crown className="h-3 w-3 text-white" />
                        <span className="text-white text-xs font-bold">ULTRA+</span>
                      </div>
                    )}
                  </div>
                  <div className={`flex items-center gap-4 text-sm ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>
                    <div className="flex items-center gap-1">
                      <Coins className={`h-4 w-4 ${
                        isUltraPremium() ? 'text-amber-600' : 'text-yellow-500'
                      }`} />
                      <span className="font-medium">{coinsLoading ? "..." : coins}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-rose-500 rounded-full"></div>
                      <span>Online</span>
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  buttonTap();
                  navigate("/profile");
                }}
                className={`p-2 rounded-lg transition-colors ${
                  isUltraPremium()
                    ? 'bg-amber-200/50 hover:bg-amber-200 text-amber-700'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Main Action Card */}
          <div className={`rounded-2xl p-6 text-white shadow-lg ${
            isUltraPremium()
              ? 'bg-gradient-to-br from-amber-700 via-orange-600 to-red-500'
              : 'bg-gradient-to-br from-purple-600 to-pink-600'
          }`}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <Heart className="h-8 w-8 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Open Chats</h2>
                <p className="text-white/90 text-sm">View your conversations and meet new people</p>
              </div>
              <Button
                className={`w-full py-4 rounded-xl font-semibold text-lg shadow-lg touch-action-manipulation transition-all duration-200 active:scale-95 ${
                  isUltraPremium()
                    ? 'bg-white text-amber-700 hover:bg-amber-50'
                    : 'bg-white text-purple-600 hover:bg-gray-100'
                }`}
                onClick={handleStartCall}
                disabled={isConnecting}
              >
                {isConnecting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${
                      isUltraPremium() ? 'border-amber-700' : 'border-purple-600'
                    }`}></div>
                    <span>Finding match...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <MessageCircle className="h-5 w-5" />
                    <span>Open Chats</span>
                    <Sparkles className="h-4 w-4" />
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Preferences Card */}
          <div className={`rounded-2xl p-4 shadow-sm border ${
            isUltraPremium()
              ? 'bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200/50'
              : 'bg-white border-gray-100'
          }`}>
            <h3 className={`font-semibold mb-3 ${
              isUltraPremium() ? 'text-rose-900' : 'text-gray-900'
            }`}>Chat Preferences</h3>
            <GenderFilter
              isPremium={isPremium}
              onGenderSelect={(gender: string) => {
                console.log("Selected gender:", gender);
              }}
              onUpgrade={handleUpgrade}
            />
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => {
                buttonTap();
                navigate("/friends");
              }}
              className={`rounded-xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-95 cursor-pointer ${
                isUltraPremium()
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                  isUltraPremium()
                    ? 'bg-rose-100 text-rose-600'
                    : 'bg-rose-100 text-rose-600'
                }`}>
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                  }`}>Friends</h4>
                  <p className={`text-xs ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>Connect with buddies</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                buttonTap();
                navigate("/video-chat", { state: { isSearching: true } });
              }}
              className={`rounded-xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-95 cursor-pointer ${
                isUltraPremium()
                  ? 'bg-gradient-to-br from-blue-50 to-purple-50 border-blue-200/50'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                  isUltraPremium()
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-blue-100 text-blue-600'
                }`}>
                  <Video className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                  }`}>Video Chat</h4>
                  <p className={`text-xs ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>Meet new people</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                buttonTap();
                navigate("/ai-chatbot");
              }}
              className={`rounded-xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-95 cursor-pointer ${
                isUltraPremium()
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                  isUltraPremium()
                    ? 'bg-pink-100 text-pink-600'
                    : 'bg-pink-100 text-pink-600'
                }`}>
                  <Bot className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                  }`}>AI Chat</h4>
                  <p className={`text-xs ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>Smart conversations</p>
                </div>
              </div>
            </div>

            <div
              onClick={handleVoiceChat}
              className={`rounded-xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-95 cursor-pointer ${
                isUltraPremium()
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                  isUltraPremium()
                    ? 'bg-orange-100 text-orange-600'
                    : 'bg-orange-100 text-orange-600'
                }`}>
                  <Mic className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                  }`}>Voice</h4>
                  <p className={`text-xs ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>Audio only chats</p>
                </div>
              </div>
            </div>

            <div
              onClick={() => {
                buttonTap();
                setShowTreasureChest(true);
              }}
              className={`rounded-xl p-4 shadow-sm border hover:shadow-md transition-all active:scale-95 cursor-pointer ${
                isUltraPremium()
                  ? 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200/50'
                  : 'bg-white border-gray-100'
              }`}
            >
              <div className="text-center space-y-2">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto ${
                  isUltraPremium()
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-amber-100 text-amber-600'
                }`}>
                  <Coins className="h-6 w-6" />
                </div>
                <div>
                  <h4 className={`font-semibold ${
                    isUltraPremium() ? 'text-amber-900' : 'text-gray-900'
                  }`}>Coins</h4>
                  <p className={`text-xs ${
                    isUltraPremium() ? 'text-amber-700' : 'text-gray-600'
                  }`}>Earn rewards</p>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features */}
          {!isPremium && (
            <div className={`rounded-2xl p-4 text-white ${
              isUltraPremium()
                ? 'bg-gradient-to-r from-rose-400 to-pink-500'
                : 'bg-gradient-to-r from-yellow-400 to-orange-500'
            }`}>
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-bold mb-1">💰 Earn Free Coins!</h3>
                  <p className="text-sm text-white/90">Watch ads to earn coins</p>
                </div>
                <RewardedAdButton
                  variant="compact"
                  onRewardEarned={(amount) => {
                    console.log(`User earned ${amount} coins from ad`);
                  }}
                />
              </div>
            </div>
          )}

        </div>

        {/* Debug: Test ULTRA+ Features */}
        {!isUltraPremium() && (
          <div className="px-4 pb-6">
            <Button
              onClick={() => {
                premiumAction();
                const expiry = new Date();
                expiry.setMonth(expiry.getMonth() + 3);
                setPremium(true, expiry, 'ultra-quarterly');
                alert('🎉 ULTRA+ activated! Experience the luxury!');
                window.location.reload();
              }}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 active:scale-95 text-white py-4 px-5 rounded-2xl shadow-lg transition-all duration-200 text-center touch-action-manipulation"
            >
              <Crown className="h-5 w-5 mr-2" />
              🧪 Try ULTRA+ Experience (Test Mode)
            </Button>
          </div>
        )}

        {/* ULTRA+ Home Enhancements */}
        {isUltraPremium() && (
          <div className="px-4 pb-6">
            <UltraHomeEnhancements
              isUltraPremium={true}
              onQuickMatch={() => {
                setIsConnecting(true);
                navigate("/video-chat", {
                  state: { genderFilter: "all", voiceOnly: false, isSearching: true }
                });
              }}
              onPremiumSearch={() => {
                // Premium search with VIP matching
                setIsConnecting(true);
                navigate("/video-chat", {
                  state: { genderFilter: "premium", voiceOnly: false, isSearching: true }
                });
              }}
              onAnalytics={() => {
                // Open premium analytics dashboard
                console.log("Opening ULTRA+ Analytics Dashboard");
              }}
            />
          </div>
        )}

        {/* Use UltraBottomNavBar for ULTRA+ users, regular for others */}
        {isUltraPremium() ? <UltraBottomNavBar /> : <BottomNavBar />}
        </main>
      </UltraPageTransition>

      {/* PremiumPaywall now moved to separate /premium page */}

      {/* Online Notifications for Premium Users */}
      {(isUltraPremium() || isProMonthly()) && <OnlineNotificationManager />}

      <TreasureChest
        isOpen={showTreasureChest}
        onClose={() => setShowTreasureChest(false)}
      />

      <NotificationComponent />
    </>
  );
}
