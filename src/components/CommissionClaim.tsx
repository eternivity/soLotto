import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { COMMISSION_WALLET, COMMISSION_PERCENTAGE } from '../constants';
import { solanaService } from '../services/solanaService';
import { priceService } from '../services/priceService';

export const CommissionClaim: React.FC = () => {
  const { publicKey, connected } = useWallet();
  const [commissionData, setCommissionData] = useState({
    totalRevenue: 0,
    totalCommission: 0, // USD cinsinden gerçekleşen komisyon
    totalCommissionSOL: 0, // SOL cinsinden gerçekleşen komisyon
    pendingCommission: 0,
    claimedCommission: 0,
    lastClaimDate: new Date(),
  });

  // Check if current wallet is admin wallet
  const isAdmin = connected && publicKey && publicKey.toString() === COMMISSION_WALLET;

  // Load commission data from blockchain
  useEffect(() => {
    const loadCommissionData = async () => {
      if (!isAdmin) return;
      try {
        const solPrice = await priceService.getSolPriceUSD();
        // Get season data to calculate realized commission
        const seasonData = await solanaService.getSeasonData(2); // 🆕 Season 2
        if (seasonData) {
          const totalTicketsSold = seasonData.totalTicketsSold || 0;
          const totalRevenue = totalTicketsSold * 1.0; // $1 per ticket (gross)

          const realizedLamports = Number(seasonData.commissionLamportsReceived || 0);
          const realizedSOL = realizedLamports / LAMPORTS_PER_SOL;
          const realizedUSD = realizedSOL * solPrice;

          setCommissionData({
            totalRevenue,
            totalCommission: realizedUSD,
            totalCommissionSOL: realizedSOL,
            pendingCommission: 0,
            claimedCommission: realizedUSD,
            lastClaimDate: new Date(),
          });
        }
      } catch (error) {
        console.error('Error loading commission data:', error);
      }
    };

    loadCommissionData();
  }, [isAdmin]);

  // Don't render if not admin
  if (!isAdmin) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          🏦 Commission Dashboard
        </h2>
        <p className="text-gray-400 text-lg">
          Admin-only commission management panel
        </p>
        <div className="mt-2 inline-flex items-center px-3 py-1 bg-red-900/20 border border-red-500/30 rounded-full">
          <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
          <span className="text-red-400 text-sm font-medium">Admin Only</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-white mb-2">
              ${commissionData.totalRevenue.toFixed(2)}
            </div>
            <div className="text-gray-400">Total Revenue</div>
            <div className="text-sm text-gray-500 mt-1">
              All seasons combined
            </div>
          </div>
        </div>

        {/* Gerçekleşen Komisyon (USD) */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-1">
              ${commissionData.totalCommission.toFixed(2)}
            </div>
            <div className="text-gray-400">Toplam Kazanç</div>
            <div className="text-sm text-gray-500 mt-1">
              ≈ {commissionData.totalCommissionSOL.toFixed(4)} SOL
            </div>
            <div className="text-xs text-green-300 mt-1">
              {COMMISSION_PERCENTAGE}% komisyon
            </div>
          </div>
        </div>

        {/* Pending Commission (Instant modda yok) */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-yellow-400 mb-2">
              $0.00
            </div>
            <div className="text-gray-400">Pending Commission</div>
            <div className="text-sm text-gray-500 mt-1">Instant mode</div>
          </div>
        </div>

        {/* Cüzdandaki Gerçek Bakiye */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">
              ${commissionData.claimedCommission.toFixed(2)}
            </div>
            <div className="text-gray-400">Cüzdana Gelen</div>
            <div className="text-sm text-gray-500 mt-1">Instant transfer</div>
          </div>
        </div>
      </div>

      {/* Commission Details */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-semibold text-blue-400 mb-4">Commission Breakdown</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-400">Commission Rate:</span>
                <span className="text-white font-semibold">{COMMISSION_PERCENTAGE}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Admin Wallet:</span>
                <span className="text-white font-mono text-sm">
                  {COMMISSION_WALLET.slice(0, 4)}...{COMMISSION_WALLET.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Last Update:</span>
                <span className="text-white">
                  {commissionData.lastClaimDate.toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-400 mb-4">Instant Mode</h3>
            <div className="space-y-3">
              <div className="p-4 rounded-lg bg-green-900/20 border border-green-500/30 text-green-300">
                Komisyonlar bilet alım anında otomatik olarak admin cüzdanına gönderilir. Claim işlemi gerekmemektedir.
              </div>
              <div className="text-center text-gray-400 text-sm">
                Gerçekleşen komisyonlar zincir işlemlerinden (SPL Memo + SystemProgram transfer) toplanarak hesaplanır.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instant Mode Bilgi */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-6 mb-6">
        <div className="text-center">
          <div className="flex items-center justify-center text-blue-400 mb-4">
            <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M13 3a1 1 0 100 2h.293l-6.647 6.646a1 1 0 101.414 1.414L14.707 6.707V7a1 1 0 102 0V3.5a1.5 1.5 0 00-1.5-1.5H13z" clipRule="evenodd"/>
              <path fillRule="evenodd" d="M2.5 3A1.5 1.5 0 001 4.5v12A1.5 1.5 0 002.5 18h12a1.5 1.5 0 001.5-1.5V10a1 1 0 10-2 0v6.5h-12V4.5h6a1 1 0 100-2h-6z" clipRule="evenodd"/>
            </svg>
            <span className="font-medium text-lg">Instant Settlement Mode Aktif</span>
          </div>
          <div className="text-gray-300 text-sm mb-2">
            Komisyonlar bilet satın alma anında otomatik olarak admin cüzdanına gönderilmektedir.
          </div>
          <div className="text-blue-400 text-xs">
            Claim işlemi gereksizdir - her satışta anlık hesap görmektedir.
          </div>
        </div>
      </div>

      {/* Admin Info */}
      <div className="mt-6 text-center">
        <p className="text-gray-400 text-sm">
          This dashboard is only visible to the admin wallet.
        </p>
        <p className="text-gray-500 text-xs mt-2">
          Instant mode aktiftir: Komisyonlar otomatik olarak tahsil edilir.
        </p>
      </div>
    </div>
  );
};

