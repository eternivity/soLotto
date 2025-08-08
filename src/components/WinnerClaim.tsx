import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Winner } from '../types';

export const WinnerClaim: React.FC = () => {
  const { publicKey, connected } = useWallet();

  // Sample winner data - in real app this would come from blockchain
  const currentWinner: Winner | null = {
    seasonId: 3,
    walletAddress: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
    prizeAmount: 8.5,
    timestamp: new Date('2024-01-15'),
    ticketId: "TKT-000156",
  };

  // Check if current wallet is the winner
  const isWinner = connected && publicKey && 
    currentWinner && 
    publicKey.toString() === currentWinner.walletAddress;

  // Prize is automatically transferred when winner is selected
  // No manual claim needed - prize goes directly to winner's wallet

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  if (!currentWinner) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
             <div className="text-center mb-8">
         <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
           🏆 Winner Prize Status
         </h2>
         <p className="text-gray-400 text-lg">
           Check if you've won and received your prize
         </p>
       </div>

      {/* Winner Info */}
      <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-6 mb-8">
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400 mb-4">🎉 Season {currentWinner.seasonId} Winner! 🎉</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <div className="text-lg font-bold text-white mb-2">Winner Address</div>
              <div className="text-gray-400 font-mono text-sm">
                {shortenAddress(currentWinner.walletAddress)}
              </div>
            </div>
            <div>
              <div className="text-lg font-bold text-white mb-2">Winning Ticket</div>
              <div className="text-solana-green font-mono text-sm font-bold">
                {currentWinner.ticketId}
              </div>
            </div>
                         <div>
               <div className="text-lg font-bold text-white mb-2">Prize Amount</div>
               <div className="text-solana-green font-bold text-lg">
                 ${currentWinner.prizeAmount.toFixed(2)}
               </div>
               <div className="text-solana-green font-semibold text-sm">
                 ≈ {(currentWinner.prizeAmount / 0.1).toFixed(2)} SOL
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Claim Section */}
      {connected && publicKey ? (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="mb-4">
              <div className="text-lg font-semibold text-white mb-2">Your Wallet</div>
              <div className="text-gray-400 font-mono text-sm">
                {shortenAddress(publicKey.toString())}
              </div>
            </div>

                         {isWinner ? (
               <div className="space-y-4">
                 <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4">
                   <div className="flex items-center justify-center text-green-400 mb-2">
                     <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                       <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                     </svg>
                     <span className="font-medium">You are the winner!</span>
                   </div>
                   <p className="text-gray-400 text-sm">
                     Congratulations! Your prize of ${currentWinner.prizeAmount.toFixed(2)} has been automatically sent to your wallet.
                   </p>
                 </div>

                 <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                   <div className="text-center">
                     <div className="text-lg font-bold text-blue-400 mb-2">💰 Prize Automatically Transferred</div>
                     <p className="text-gray-400 text-sm">
                       No action required! Your prize has been sent directly to your wallet.
                     </p>
                     <div className="text-solana-green font-bold text-lg mt-2">
                       ${currentWinner.prizeAmount.toFixed(2)} received
                     </div>
                   </div>
                 </div>
               </div>
                          ) : (
               <div className="bg-gray-700 rounded-lg p-4">
                 <div className="text-gray-400 text-sm">
                   This wallet is not the winner. Prize is automatically transferred to the winning wallet.
                 </div>
               </div>
             )}
          </div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-gray-400 text-sm mb-4">
              Connect your wallet to check if you're the winner
            </div>
                         <div className="text-gray-500 text-xs">
               Prize is automatically transferred to the winning wallet
             </div>
          </div>
        </div>
      )}

      

             {/* Info */}
       <div className="mt-6 text-center">
         <p className="text-gray-400 text-sm">
           Winners are automatically selected when the season ends
         </p>
         <p className="text-gray-500 text-xs mt-2">
           Prize is automatically transferred to winner's wallet - no manual claim needed
         </p>
       </div>
    </div>
  );
};
