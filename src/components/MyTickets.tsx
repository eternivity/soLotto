import React, { useState, useEffect, useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Ticket } from '../types';
import { solanaService } from '../services/solanaService';

export const MyTickets: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [userTickets, setUserTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSeason, setSelectedSeason] = useState<number | 'all'>('all');

  // Local storage key for user tickets
  const getStorageKey = (walletAddress: string) => `solotto_tickets_${walletAddress}`;

  useEffect(() => {
    if (connected && publicKey) {
      setIsLoading(true);
      
      const loadUserTickets = async () => {
        try {
          console.log('Loading user tickets for wallet:', publicKey.toString());
          
          // Try to get tickets from blockchain first
          const blockchainTickets = await solanaService.getUserTickets(publicKey);
          
          if (blockchainTickets && blockchainTickets.length > 0) {
            console.log('Found tickets on blockchain:', blockchainTickets.length);
            setUserTickets(blockchainTickets);
          } else {
            // Fallback to local storage
            const storageKey = getStorageKey(publicKey.toString());
            const storedTickets = localStorage.getItem(storageKey);
            
            if (storedTickets) {
              const parsedTickets = JSON.parse(storedTickets).map((ticket: any) => ({
                ...ticket,
                purchaseTime: new Date(ticket.purchaseTime)
              }));
              console.log('Found tickets in local storage:', parsedTickets.length);
              setUserTickets(parsedTickets);
            } else {
              console.log('No tickets found for this wallet');
              setUserTickets([]);
            }
          }
        } catch (error) {
          console.error('Error loading user tickets:', error);
          setUserTickets([]);
        } finally {
          setIsLoading(false);
        }
      };

      loadUserTickets();
    } else {
      setUserTickets([]);
    }
  }, [connected, publicKey]);

  const filteredTickets = selectedSeason === 'all' 
    ? userTickets 
    : userTickets.filter(ticket => ticket.seasonId === selectedSeason);

  const getSeasonTickets = (seasonId: number) => {
    return userTickets.filter(ticket => ticket.seasonId === seasonId);
  };

  const getUniqueSeasons = () => {
    return Array.from(new Set(userTickets.map(ticket => ticket.seasonId))).sort((a, b) => b - a);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const refreshTickets = async () => {
    if (connected && publicKey) {
      setIsLoading(true);
      try {
        const storageKey = getStorageKey(publicKey.toString());
        const storedTickets = localStorage.getItem(storageKey);
        
        if (storedTickets) {
          const parsedTickets = JSON.parse(storedTickets).map((ticket: any) => ({
            ...ticket,
            purchaseTime: new Date(ticket.purchaseTime)
          }));
          setUserTickets(parsedTickets);
        } else {
          setUserTickets([]);
        }
      } catch (error) {
        console.error('Error refreshing tickets:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (!connected) {
    return (
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
        <div className="text-center">
          <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
            🎫 My Tickets
          </h2>
          <p className="text-gray-400 text-lg mb-6">
            Connect your wallet to view your tickets
          </p>
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="text-gray-400 text-sm">
              Please connect your wallet to see your purchased tickets
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          🎫 My Tickets
        </h2>
        <p className="text-gray-400 text-lg">
          View and manage your purchased tickets
        </p>
        {connected && publicKey && (
          <div className="mt-4 flex items-center justify-center space-x-4">
            <div className="inline-flex items-center px-3 py-1 bg-green-900/20 border border-green-500/30 rounded-full">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-green-400 text-sm font-medium">
                {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
              </span>
            </div>
            <button
              onClick={refreshTickets}
              disabled={isLoading}
              className="inline-flex items-center px-3 py-1 bg-solana-purple hover:bg-purple-600 disabled:bg-gray-600 text-white text-sm font-medium rounded-full transition-colors"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                  Refreshing...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading your tickets...</p>
        </div>
      ) : userTickets.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🎫</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Tickets Found</h3>
          <p className="text-gray-400">
            You haven't purchased any tickets yet. Buy your first ticket to get started!
          </p>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-solana-green mb-2">
                  {userTickets.length}
                </div>
                <div className="text-gray-400">Total Tickets</div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-solana-purple mb-2">
                  {getUniqueSeasons().length}
                </div>
                <div className="text-gray-400">Seasons Participated</div>
              </div>
            </div>
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-yellow-400 mb-2">
                  {getSeasonTickets(1).length}
                </div>
                <div className="text-gray-400">Current Season</div>
              </div>
            </div>
          </div>

          {/* Season Filter */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2 justify-center">
              <button
                onClick={() => setSelectedSeason('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedSeason === 'all'
                    ? 'bg-solana-purple text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                All Seasons ({userTickets.length})
              </button>
              {getUniqueSeasons().map(seasonId => (
                <button
                  key={seasonId}
                  onClick={() => setSelectedSeason(seasonId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedSeason === seasonId
                      ? 'bg-solana-purple text-white'
                      : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                  }`}
                >
                  Season {seasonId} ({getSeasonTickets(seasonId).length})
                </button>
              ))}
            </div>
          </div>

          {/* Tickets List */}
          <div className="bg-gray-800 rounded-lg border border-gray-700">
            <div className="p-6 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {selectedSeason === 'all' ? 'All Tickets' : `Season ${selectedSeason} Tickets`}
              </h3>
              <p className="text-gray-400 text-sm">
                {filteredTickets.length} ticket{filteredTickets.length !== 1 ? 's' : ''} found
              </p>
            </div>
            
            <div className="max-h-96 overflow-y-auto custom-scrollbar">
              {filteredTickets.length === 0 ? (
                <div className="p-6 text-center text-gray-400">
                  No tickets found for the selected season
                </div>
              ) : (
                <div className="divide-y divide-gray-700">
                  {filteredTickets.map((ticket) => (
                    <div key={ticket.id} className="p-6 hover:bg-gray-750 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-solana-purple to-solana-green rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-lg">🎫</span>
                          </div>
                          <div>
                            <div className="text-lg font-bold text-solana-green font-mono">
                              {ticket.ticketNumber}
                            </div>
                            <div className="text-gray-400 text-sm">
                              Season {ticket.seasonId} • {formatDate(ticket.purchaseTime)}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="inline-flex items-center px-3 py-1 bg-green-900/20 border border-green-500/30 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            <span className="text-green-400 text-sm font-medium">Active</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

                        {/* Winner Check */}
              <div className="mt-6 bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4">
                <div className="text-center">
                                     <div className="text-lg font-bold text-yellow-400 mb-2">🏆 Check if you're a winner!</div>
                   <p className="text-gray-400 text-sm mb-3">
                     Scroll down to the "Winner Prize Status" section to see if you've won any prizes
                   </p>
                  <div className="text-gray-500 text-xs">
                    Winners are automatically selected when seasons end
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-6 text-center">
                <p className="text-gray-400 text-sm">
                  Your tickets are automatically entered into the lottery draw
                </p>
                <p className="text-gray-500 text-xs mt-2">
                  Winners are selected randomly from all purchased tickets
                </p>
              </div>
        </>
      )}
    </div>
  );
};
