import * as React from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";

// Import providers with try-catch
let ThemeProvider: any = null;
let LanguageProvider: any = null;
let PremiumProvider: any = null;
let CoinProvider: any = null;
let FriendsProvider: any = null;
let SocketProvider: any = null;

try {
  const themeModule = require("./components/theme-provider.tsx");
  ThemeProvider = themeModule.ThemeProvider;
} catch (error) {
  console.warn("Failed to load ThemeProvider:", error);
}

try {
  const langModule = require("./context/LanguageProvider.tsx");
  LanguageProvider = langModule.LanguageProvider;
} catch (error) {
  console.warn("Failed to load LanguageProvider:", error);
}

try {
  const premiumModule = require("./context/PremiumProvider.tsx");
  PremiumProvider = premiumModule.PremiumProvider;
} catch (error) {
  console.warn("Failed to load PremiumProvider:", error);
}

try {
  const coinModule = require("./context/CoinProvider.tsx");
  CoinProvider = coinModule.CoinProvider;
} catch (error) {
  console.warn("Failed to load CoinProvider:", error);
}

try {
  const friendsModule = require("./context/FriendsProvider.tsx");
  FriendsProvider = friendsModule.FriendsProvider;
} catch (error) {
  console.warn("Failed to load FriendsProvider:", error);
}

try {
  const socketModule = require("./context/SocketProvider.tsx");
  SocketProvider = socketModule.SocketProvider;
} catch (error) {
  console.warn("Failed to load SocketProvider:", error);
}

// Simple error fallback component
function ErrorFallback({error}: {error: Error}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
        <h2 className="text-xl font-bold text-red-600 mb-4">Something went wrong</h2>
        <p className="text-gray-600 mb-4">{error.message}</p>
        <details className="text-left text-sm text-gray-500 mb-4">
          <summary>Error Details</summary>
          <pre className="mt-2 text-xs overflow-auto">{error.stack}</pre>
        </details>
        <button onClick={() => window.location.reload()} className="bg-blue-500 text-white px-4 py-2 rounded">
          Reload Page
        </button>
      </div>
    </div>
  );
}

// Error boundary component
class ErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, error?: Error}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('React Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return <ErrorFallback error={this.state.error} />;
    }

    return this.props.children;
  }
}

// Wrapper component that conditionally includes providers
function AppWithProviders() {
  let app = <App />;

  // Wrap with available providers in reverse order
  if (SocketProvider) {
    app = <SocketProvider>{app}</SocketProvider>;
  }

  if (FriendsProvider) {
    app = <FriendsProvider>{app}</FriendsProvider>;
  }

  if (CoinProvider) {
    app = <CoinProvider>{app}</CoinProvider>;
  }

  if (PremiumProvider) {
    app = <PremiumProvider>{app}</PremiumProvider>;
  }

  if (ThemeProvider) {
    app = <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">{app}</ThemeProvider>;
  }

  if (LanguageProvider) {
    app = <LanguageProvider>{app}</LanguageProvider>;
  }

  return app;
}

const root = document.getElementById("root");
if (!root) {
  throw new Error("Root element not found");
}

// Try to render with error handling
try {
  createRoot(root).render(
    <React.StrictMode>
      <ErrorBoundary>
        <HelmetProvider>
          <BrowserRouter>
            <ErrorBoundary>
              <AppWithProviders />
            </ErrorBoundary>
          </BrowserRouter>
        </HelmetProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
  console.log("✅ App rendered successfully");
} catch (error) {
  console.error("Failed to render app:", error);
  // Fallback: render a simple error message
  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; background: #f3f4f6;">
      <div style="text-align: center; padding: 2rem; background: white; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h2 style="color: #dc2626; margin-bottom: 1rem;">App Failed to Load</h2>
        <p style="color: #6b7280; margin-bottom: 1rem;">Please check the console for errors</p>
        <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
