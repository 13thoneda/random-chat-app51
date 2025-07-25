import React from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Button } from "../components/ui/button";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";

const ChatListPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  const handleNewChat = () => {
    navigate('/video-chat', { state: { isSearching: true } });
  };

  return (
    <>
      <Helmet>
        <title>AjnabiCam - Chats</title>
      </Helmet>
      <main className="flex flex-col min-h-screen w-full max-w-md mx-auto bg-gray-900 text-white relative">
        
        {/* Header */}
        <div className="flex items-center p-4 bg-gradient-to-r from-rose-600 to-pink-700 text-white shadow-lg">
          <button 
            onClick={handleBackClick} 
            className="mr-3 text-white hover:scale-110 transition-transform"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold">Chats</h1>
            <p className="text-sm opacity-80">Your conversations</p>
          </div>
          <button 
            onClick={handleNewChat}
            className="bg-white/20 backdrop-blur-sm rounded-full p-2 hover:bg-white/30 transition-colors"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h2 className="text-xl font-bold text-gray-300 mb-2">Chat List Works!</h2>
            <p className="text-gray-400 mb-6 text-sm">
              The routing is working correctly. This is your chat list.
            </p>
            <Button
              onClick={handleNewChat}
              className="bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white px-6 py-3 rounded-2xl font-semibold"
            >
              <MessageCircle className="h-5 w-5 mr-2" />
              Start New Chat
            </Button>
          </div>
        </div>
      </main>
    </>
  );
};

export default ChatListPage;
