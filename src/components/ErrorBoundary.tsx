import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Check if it's a wallet-related error first
    if (error.message.includes('MetaMask') || 
        error.message.includes('ethereum') || 
        error.message.includes('Failed to connect') ||
        error.message.includes('web3') ||
        error.message.includes('chrome-extension')) {
      // Don't set error state for wallet conflicts
      return { hasError: false };
    }
    
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console but don't show to user if it's a wallet conflict
    if (error.message.includes('MetaMask') || 
        error.message.includes('ethereum') || 
        error.message.includes('Failed to connect') ||
        error.message.includes('web3') ||
        error.message.includes('chrome-extension') ||
        error.stack?.includes('metamask') ||
        error.stack?.includes('ethereum')) {
      console.warn('Wallet conflict detected, ignoring:', error.message);
      return;
    }
    
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      // Check if it's a wallet-related error
      if (this.state.error?.message.includes('MetaMask') || 
          this.state.error?.message.includes('ethereum') ||
          this.state.error?.message.includes('Failed to connect') ||
          this.state.error?.message.includes('web3') ||
          this.state.error?.message.includes('chrome-extension') ||
          this.state.error?.stack?.includes('metamask') ||
          this.state.error?.stack?.includes('ethereum')) {
        // Don't show error UI for wallet conflicts, just render children
        return this.props.children;
      }

      // For other errors, show fallback UI
      return (
        <div className="min-h-screen bg-gray-900 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-400 mb-4">
              Please refresh the page and try again.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-solana-purple hover:bg-purple-600 text-white font-bold py-2 px-4 rounded"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
