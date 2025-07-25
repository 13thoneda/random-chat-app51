import { useState } from "react";
import { Button } from "./ui/button";
import { Heart, X, MessageCircle, MapPin, Loader } from "lucide-react";

interface StayConnectedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStayConnected: (wantToStay: boolean) => void;
  partnerName?: string;
  partnerAge?: number;
  partnerLocation?: string;
  partnerImage?: string;
}

export default function StayConnectedModal({ 
  isOpen, 
  onClose, 
  onStayConnected, 
  partnerName = "Stranger",
  partnerAge = 25,
  partnerLocation = "Lindenhurst, NY",
  partnerImage
}: StayConnectedModalProps) {
  const [isWaiting, setIsWaiting] = useState(false);
  const [myChoice, setMyChoice] = useState<boolean | null>(null);

  if (!isOpen) return null;

  const handleStayConnected = () => {
    setIsWaiting(true);
    setMyChoice(true);
    onStayConnected(true);
  };

  const handleDontStay = () => {
    setMyChoice(false);
    onStayConnected(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-end justify-center z-50 p-0 md:items-center md:p-4">
      {/* Main Card */}
      <div className="w-full max-w-sm bg-white overflow-hidden relative md:rounded-2xl h-full md:h-auto max-h-[90vh] flex flex-col">
        {/* Profile Card - Dating App Style */}
        <div className="relative h-[70vh] md:h-96 bg-gradient-to-b from-transparent to-black/60 overflow-hidden">
          {/* Background Image */}
          <div className="absolute inset-0">
            {partnerImage ? (
              <img
                src={partnerImage}
                alt={partnerName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-passion-400 via-romance-500 to-royal-600 flex items-center justify-center">
                <div className="w-32 h-32 bg-white/20 rounded-full flex items-center justify-center text-6xl text-white font-bold">
                  {partnerName.charAt(0).toUpperCase()}
                </div>
              </div>
            )}
          </div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/60 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Profile Info */}
          <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-2xl md:text-3xl font-bold">
                {partnerName}, {partnerAge}
              </h2>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            </div>
            <div className="flex items-center gap-1 text-white/80 text-sm mb-6">
              <MapPin className="w-4 h-4" />
              <span>{partnerLocation}</span>
            </div>

            {!isWaiting && myChoice === null && (
              <>
                {/* Action Buttons - Dating App Style */}
                <div className="flex items-center justify-center gap-6 mb-6">
                  {/* Skip Button */}
                  <button
                    onClick={handleDontStay}
                    className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110 touch-manipulation"
                    aria-label="Skip"
                  >
                    <X className="w-6 h-6 text-white" />
                  </button>

                  {/* Message Button */}
                  <button
                    className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all duration-200 hover:scale-110 touch-manipulation"
                    aria-label="Message"
                  >
                    <MessageCircle className="w-5 h-5 text-white" />
                  </button>

                  {/* Add Friend Button */}
                  <button
                    onClick={handleStayConnected}
                    className="w-14 h-14 bg-gradient-to-r from-passion-500 to-romance-600 rounded-full flex items-center justify-center hover:from-passion-600 hover:to-romance-700 transition-all duration-200 hover:scale-110 shadow-lg touch-manipulation"
                    aria-label="Add Friend"
                  >
                    <Heart className="w-6 h-6 text-white fill-current" />
                  </button>
                </div>

                {/* View Profile Button */}
                <Button
                  className="w-full bg-white/90 backdrop-blur-sm text-gray-800 hover:bg-white font-semibold py-4 rounded-xl border-0 text-base touch-manipulation"
                >
                  Add as Friend
                </Button>
              </>
            )}

            {isWaiting && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Loader className="w-8 h-8 text-white animate-spin" />
                </div>
                
                {myChoice === true ? (
                  <div>
                    <p className="text-lg font-semibold text-white mb-2">
                      Waiting for {partnerName}...
                    </p>
                    <p className="text-white/80 text-sm">
                      You want to be friends! Let's see what {partnerName} decides.
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg font-semibold text-white mb-2">
                      Moving to next chat...
                    </p>
                    <p className="text-white/80 text-sm">
                      Finding you someone new to chat with.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Content - Only show if not waiting */}
        {!isWaiting && myChoice === null && (
          <div className="p-6 bg-white">
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Want to stay connected?
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Add {partnerName} as a friend to chat anytime and see when they're online!
              </p>
              
              {/* Alternative action - quick skip */}
              <Button
                onClick={handleDontStay}
                variant="outline"
                className="w-full border-2 border-gray-200 text-gray-600 hover:bg-gray-50 font-medium py-3 rounded-xl text-sm touch-manipulation"
              >
                Maybe Later - Find Next Chat
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
