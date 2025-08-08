import React from 'react';
import { WalletContextProvider } from './components/WalletProvider';
import { WalletConnect } from './components/WalletConnect';
import { SeasonStatus } from './components/SeasonStatus';
import { BuyTicket } from './components/BuyTicket';
import { Winners } from './components/Winners';
import { MyTickets } from './components/MyTickets';
import { FAQ } from './components/FAQ';
import { CommissionClaim } from './components/CommissionClaim';
import { WinnerClaim } from './components/WinnerClaim';
import { Footer } from './components/Footer';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <WalletContextProvider>
        <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black text-white">
          {/* Header */}
          <header className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-solana-purple to-solana-green rounded-xl flex items-center justify-center animate-pulse">
                    <span className="text-white font-bold text-xl">🎰</span>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent">
                      soLotto
                    </h1>
                    <p className="text-xs text-gray-400">Decentralized Lottery</p>
                  </div>
                </div>
                <WalletConnect />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="max-w-6xl mx-auto px-4 py-8">
            {/* Hero Section */}
            <section className="text-center mb-16">
              <div className="mb-8">
                <div className="w-24 h-24 bg-gradient-to-r from-solana-purple to-solana-green rounded-full mx-auto mb-6 flex items-center justify-center animate-bounce">
                  <span className="text-4xl">🎰</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-6">
                  soLotto
                </h1>
                <p className="text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
                  The first decentralized lottery on Solana blockchain. 
                  Transparent, fair, and secure - powered by smart contracts.
                </p>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">🔒</div>
                  <h3 className="text-lg font-semibold mb-2">Secure</h3>
                  <p className="text-gray-400 text-sm">
                    Built on Solana blockchain with transparent smart contracts
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">⚡</div>
                  <h3 className="text-lg font-semibold mb-2">Fast</h3>
                  <p className="text-gray-400 text-sm">
                    Instant transactions and real-time updates
                  </p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                  <div className="text-3xl mb-4">🎯</div>
                  <h3 className="text-lg font-semibold mb-2">Fair</h3>
                  <p className="text-gray-400 text-sm">
                    Verifiable random selection with no human intervention
                  </p>
                </div>
              </div>
            </section>

            {/* Season Status */}
            <section className="mb-16">
              <SeasonStatus />
            </section>

            {/* Buy Ticket and Winners Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
              <BuyTicket />
              <Winners />
            </section>

            {/* My Tickets Section */}
            <section className="mb-16">
              <MyTickets />
            </section>

                            {/* Winner Prize Claim */}
                <section className="mb-16">
                  <WinnerClaim />
                </section>

                {/* Commission Dashboard - Admin Only */}
                <section className="mb-16">
                  <CommissionClaim />
                </section>

                {/* FAQ Section */}
                <section className="mb-16">
                  <FAQ />
                </section>
          </main>

          {/* Footer */}
          <Footer />
        </div>
      </WalletContextProvider>
    </ErrorBoundary>
  );
}

export default App;
