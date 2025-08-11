import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

import { COMMISSION_WALLET, TREASURY_WALLET } from '../constants';
import { solanaService } from '../services/solanaService';
import { useToast } from './ToastProvider';

export const AdminPanel: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const { show } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [seasonData, setSeasonData] = useState({
    currentSeason: 2,
    isActive: false,
    endTime: new Date(),
    totalTicketsSold: 0,
    totalPrizePool: 0,
  });
  const [newSeasonDuration, setNewSeasonDuration] = useState(7); // days
  const [extraPrizeAmount, setExtraPrizeAmount] = useState(''); // SOL
  const [treasuryBalance, setTreasuryBalance] = useState(0);

  // Check if current wallet is admin wallet
  const isAdmin = connected && publicKey && publicKey.toString() === COMMISSION_WALLET;

  // Load current season data
  useEffect(() => {
    const loadSeasonData = async () => {
      if (!isAdmin) return;
      try {
        const data = await solanaService.getSeasonData(2);
        if (data) {
          setSeasonData({
            currentSeason: data.seasonId || 2,
            isActive: data.isActive || false,
            endTime: data.endTime || new Date(),
            totalTicketsSold: data.totalTicketsSold || 0,
            totalPrizePool: data.totalPrizePool || 0,
          });
        }
        
        // Get treasury balance
        const balance = await solanaService.getAccountBalance(TREASURY_WALLET);
        setTreasuryBalance(balance);
      } catch (error) {
        console.error('Error loading season data:', error);
      }
    };

    loadSeasonData();
    const interval = setInterval(loadSeasonData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Start new season
  const handleStartSeason = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      const newSeasonId = seasonData.currentSeason + 1;
      const durationMs = newSeasonDuration * 24 * 60 * 60 * 1000; // Convert days to milliseconds
      const endTime = new Date(Date.now() + durationMs);
      
      await solanaService.startSeason(newSeasonId, endTime);
      
      show('success', `Season ${newSeasonId} started successfully!`);
      
      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error starting season:', error);
      show('error', `Failed to start season: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // End current season
  const handleEndSeason = async () => {
    if (!isAdmin) return;
    
    setIsLoading(true);
    try {
      await solanaService.endSeason(seasonData.currentSeason);
      
      show('success', `Season ${seasonData.currentSeason} ended successfully!`);
      
      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error ending season:', error);
      show('error', `Failed to end season: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Add extra prize to pool
  const handleAddExtraPrize = async () => {
    if (!isAdmin || !extraPrizeAmount) return;
    
    setIsLoading(true);
    try {
      const amountSOL = parseFloat(extraPrizeAmount);
      if (isNaN(amountSOL) || amountSOL <= 0) {
        show('error', 'Please enter a valid SOL amount');
        return;
      }
      
      await solanaService.addExtraPrize(amountSOL);
      
      show('success', `Added ${amountSOL} SOL to prize pool!`);
      setExtraPrizeAmount('');
      
      // Reload data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error) {
      console.error('Error adding extra prize:', error);
      show('error', `Failed to add extra prize: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          ⚙️ Admin Panel
        </h2>
        <p className="text-gray-400 text-lg">
          Season management and prize pool control
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-400 text-sm font-medium">Admin Only</span>
        </div>
      </div>

      {/* Current Season Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              {seasonData.currentSeason}
            </div>
            <div className="text-gray-400">Current Season</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">
              {seasonData.isActive ? '🟢 Active' : '🔴 Inactive'}
            </div>
            <div className="text-gray-400">Status</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              {seasonData.totalTicketsSold}
            </div>
            <div className="text-gray-400">Tickets Sold</div>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              {seasonData.totalPrizePool.toFixed(4)}
            </div>
            <div className="text-gray-400">Prize Pool (SOL)</div>
          </div>
        </div>
      </div>

      {/* Treasury Balance */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-8">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-white mb-4">🏦 Treasury Balance</h3>
          <div className="text-4xl font-bold text-green-400 mb-2">
            {treasuryBalance.toFixed(4)} SOL
          </div>
          <div className="text-gray-400">Available for prize pool</div>
          <div className="text-sm text-gray-500 mt-2">
            Treasury Address: {TREASURY_WALLET}
          </div>
        </div>
      </div>

      {/* Season Management */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Start New Season */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">🚀 Start New Season</h3>
          
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Season Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={newSeasonDuration}
              onChange={(e) => setNewSeasonDuration(parseInt(e.target.value) || 7)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-solana-purple"
            />
          </div>

          <button
            onClick={handleStartSeason}
            disabled={isLoading || seasonData.isActive}
            className="w-full bg-gradient-to-r from-solana-purple to-solana-green text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Starting...' : 'Start New Season'}
          </button>
          
          {seasonData.isActive && (
            <p className="text-yellow-400 text-sm mt-2 text-center">
              ⚠️ Current season is still active
            </p>
          )}
        </div>

        {/* End Current Season */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-xl font-semibold text-white mb-4">⏹️ End Current Season</h3>
          
          <div className="mb-4">
            <p className="text-gray-300 text-sm mb-2">
              Current Season: {seasonData.currentSeason}
            </p>
            <p className="text-gray-300 text-sm mb-2">
              End Time: {seasonData.endTime.toLocaleString()}
            </p>
          </div>

          <button
            onClick={handleEndSeason}
            disabled={isLoading || !seasonData.isActive}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Ending...' : 'End Current Season'}
          </button>
          
          {!seasonData.isActive && (
            <p className="text-gray-400 text-sm mt-2 text-center">
              No active season to end
            </p>
          )}
        </div>
      </div>

      {/* Extra Prize Management */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-xl font-semibold text-white mb-4">🎁 Add Extra Prize to Pool</h3>
        
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Amount (SOL)
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={extraPrizeAmount}
              onChange={(e) => setExtraPrizeAmount(e.target.value)}
              placeholder="0.1"
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-solana-purple"
            />
          </div>
          
          <button
            onClick={handleAddExtraPrize}
            disabled={isLoading || !extraPrizeAmount}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? 'Adding...' : 'Add to Prize Pool'}
          </button>
        </div>
        
        <p className="text-gray-400 text-sm mt-2">
          💡 Extra prizes will be added to the current season's prize pool
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 p-6 bg-gray-800 rounded-lg border border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-4">⚡ Quick Actions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.open(`https://explorer.solana.com/address/${TREASURY_WALLET}?cluster=testnet`, '_blank')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            🔍 View Treasury
          </button>
          
          <button
            onClick={() => window.open(`https://explorer.solana.com/address/${COMMISSION_WALLET}?cluster=testnet`, '_blank')}
            className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            🔍 View Admin Wallet
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            🔄 Refresh Data
          </button>
        </div>
      </div>
    </div>
  );
};
