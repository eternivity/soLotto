import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const WalletConnect: React.FC = () => {
  const { publicKey } = useWallet();

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex items-center space-x-4">
      {publicKey ? (
        <div className="flex items-center space-x-3">
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg px-3 py-2">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-green-400 text-sm font-medium">
                {shortenAddress(publicKey.toString())}
              </span>
            </div>
          </div>
          <WalletMultiButton className="bg-gradient-to-r from-solana-purple to-solana-green hover:from-purple-600 hover:to-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105" />
        </div>
      ) : (
        <WalletMultiButton className="bg-gradient-to-r from-solana-purple to-solana-green hover:from-purple-600 hover:to-green-500 text-white font-bold py-2 px-4 rounded-lg transition-all duration-200 transform hover:scale-105" />
      )}
    </div>
  );
};
