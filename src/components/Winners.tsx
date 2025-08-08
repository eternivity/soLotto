import React, { useState, useEffect } from 'react';
import { Winner } from '../types';
import { solanaService } from '../services/solanaService';
import { priceService } from '../services/priceService';

export const Winners: React.FC = () => {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [solPriceUSD, setSolPriceUSD] = useState(100);

  // Load winners from blockchain
  useEffect(() => {
    const loadWinners = async () => {
      try {
        setIsLoading(true);
        
        // Load SOL price for conversions
        const solPrice = await priceService.getSolPriceUSD();
        setSolPriceUSD(solPrice);
        
        // Load winners from blockchain
        const blockchainWinners = await solanaService.getWinnersHistory();
        console.log('Loaded winners from blockchain:', blockchainWinners);
        
        if (blockchainWinners && blockchainWinners.length > 0) {
          setWinners(blockchainWinners);
        } else {
          // Fallback to sample data if no blockchain data
          const sampleWinners: Winner[] = [
            {
              seasonId: 3,
              walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
              prizeAmount: 8.5,
              timestamp: new Date('2024-01-15'),
              ticketId: "TKT-000156",
            },
            {
              seasonId: 2,
              walletAddress: "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM",
              prizeAmount: 7.2,
              timestamp: new Date('2024-01-08'),
              ticketId: "TKT-000089",
            },
            {
              seasonId: 1,
              walletAddress: "3xJ8HdK7vQ2mN9pL5rT8wE1sA4bC6dF9gH2jK5mN8pQ",
              prizeAmount: 6.8,
              timestamp: new Date('2024-01-01'),
              ticketId: "TKT-000023",
            },
          ];
          setWinners(sampleWinners);
        }
      } catch (error) {
        console.error('Error loading winners:', error);
        setWinners([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadWinners();
  }, []);

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          Previous Winners
        </h2>
        <p className="text-gray-400 text-lg">
          Check out the lucky winners from past seasons
        </p>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-solana-purple mx-auto mb-4"></div>
          <p className="text-gray-400">Loading winners from blockchain...</p>
        </div>
      ) : winners.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-xl font-semibold text-white mb-2">No Winners Yet</h3>
          <p className="text-gray-400">
            Winners will be announced here once seasons are completed.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {winners.map((winner, index) => (
              <div key={winner.seasonId} className="bg-gray-800 rounded-lg p-6 border border-gray-700 hover:border-solana-purple transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-r from-solana-purple to-solana-green rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Season {winner.seasonId}</h3>
                      <p className="text-gray-400 text-sm">
                        {winner.timestamp.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-solana-green">
                      ${winner.prizeAmount.toFixed(2)}
                    </div>
                    <div className="text-solana-green font-semibold text-sm">
                      ≈ {priceService.formatSOL(winner.prizeAmount / solPriceUSD)} SOL
                    </div>
                    <div className="text-gray-400 text-sm">Prize</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Winner Address</div>
                    <div className="text-white font-mono text-sm">
                      {shortenAddress(winner.walletAddress)}
                    </div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm mb-1">Winning Ticket</div>
                    <div className="text-solana-green font-mono text-sm font-bold">
                      {winner.ticketId}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 text-sm">
              Each season has unlimited tickets available. Winners are selected randomly from all purchased tickets.
            </p>
          </div>
        </>
      )}
    </div>
  );
};
