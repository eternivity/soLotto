import React, { useState, useEffect, useMemo } from 'react';
import { SeasonStatus as SeasonStatusType } from '../types';
import { SEASON_CONFIG, COMMISSION_PERCENTAGE } from '../constants';
import { priceService } from '../services/priceService';
import { solanaService } from '../services/solanaService';

export const SeasonStatus: React.FC = () => {
  const [solPriceUSD, setSolPriceUSD] = useState(100);

  // Season end time - localStorage ile kalıcı ve test modları
  const seasonEndTime = useMemo(() => {
    const key = 'solotto_season_2_end'; // 🆕 Season 2
    const saved = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
    
    // Test için: localStorage'da saved bir end time varsa kullan
    if (saved) {
      const savedDate = new Date(Number(saved));
      console.log('Loaded saved season end time:', savedDate);
      return savedDate;
    }
    
    // İlk kez açılıyor - yeni season başlat
    const endMs = Date.now() + SEASON_CONFIG.DURATION_DAYS * 24 * 60 * 60 * 1000;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, String(endMs));
      console.log('Created new season end time:', new Date(endMs));
    }
    return new Date(endMs);
  }, []); // Dependency array boş - sadece mount'ta çalışır

  // Test için: season süresini kısaltma fonksiyonu
  const setTestEndTime = (minutes: number) => {
    const key = 'solotto_season_2_end'; // 🆕 Season 2
    const testEndMs = Date.now() + minutes * 60 * 1000;
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(key, String(testEndMs));
      console.log(`Test: Season ${minutes} dakika sonra bitecek:`, new Date(testEndMs));
      // Sayfayı yenile ki yeni end time yüklenmesi için
      window.location.reload();
    }
  };

  // 🆕 Fresh start: localStorage temizleme fonksiyonu
  const clearAllData = () => {
    if (typeof window !== 'undefined') {
      // Eski season data'larını temizle
      window.localStorage.removeItem('solotto_season_1_end');
      window.localStorage.removeItem('solotto_season_2_end');
      // Tüm ticket data'larını temizle
      Object.keys(window.localStorage).forEach(key => {
        if (key.startsWith('solotto_tickets_')) {
          window.localStorage.removeItem(key);
        }
      });
      console.log('🆕 Fresh start: Tüm localStorage data temizlendi!');
      window.location.reload();
    }
  };

  // Console'dan test etmek için window'a fonksiyonu ekle
  if (typeof window !== 'undefined') {
    (window as any).setTestEndTime = setTestEndTime;
    (window as any).clearAllData = clearAllData; // 🆕 Fresh start function
    (window as any).clearSeasonData = clearAllData; // Backward compatibility
    
    // 🔧 Debug: Force countdown refresh
    (window as any).refreshCountdown = () => {
      console.log('🔄 Force refreshing countdown...');
      window.location.reload();
    };
  }

  const [seasonStatus, setSeasonStatus] = useState<SeasonStatusType>({
    currentSeason: 2, // 🆕 Season 2
    totalTicketsSold: 0,
    totalPrizePool: 0,
    timeRemaining: {
      days: 7,
      hours: 0,
      minutes: 0,
      seconds: 0,
    },
    isActive: true,
    status: 'active',
  });

  // Load real SOL price and season data
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load prices
        const solPrice = await priceService.getSolPriceUSD();
        await priceService.getTicketPriceSOL();
        setSolPriceUSD(solPrice);

        // Load season data from blockchain
        console.log('🔄 Loading Season 2 data from blockchain...');
        const seasonData = await solanaService.getSeasonData(2); // 🆕 Season 2
        console.log('📊 Loaded season data from blockchain:', seasonData);
        console.log('📊 Total tickets sold:', seasonData?.totalTicketsSold);
        console.log('📊 Total prize pool:', seasonData?.totalPrizePool);

        if (seasonData) {
          setSeasonStatus(prev => ({
            ...prev,
            totalTicketsSold: seasonData.totalTicketsSold || 0,
            totalPrizePool: seasonData.totalPrizePool || 0,
            isActive: seasonData.isActive !== false,
            status: seasonData.isActive ? 'active' : 'ended',
            winner: seasonData.winner,
            winnerTicketId: seasonData.winnerTicketId,
          }));

          // Eğer on-chain bir endTime geldiyse ve farklıysa güncelle
          if (seasonData.endTime) {
            const onChainEnd = new Date(seasonData.endTime).getTime();
            const currentStoredTime = seasonEndTime.getTime();
            
            // Sadece gerçekten farklı bir zaman gelirse ve 1 dakikadan fazla fark varsa güncelle
            if (Number.isFinite(onChainEnd) && Math.abs(onChainEnd - currentStoredTime) > 60000) {
              const key = 'solotto_season_2_end'; // 🆕 Season 2
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(key, String(onChainEnd));
                console.log('On-chain end time significantly updated:', new Date(onChainEnd));
                // Sadece gerçekten önemli farklar için sayfa yenile
                setTimeout(() => window.location.reload(), 1000);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading data in SeasonStatus:', error);
      }
    };

    loadData();

    // Refresh data every 60 seconds to avoid rate limiting
    const interval = setInterval(loadData, 60000);

    // Listen for ticket updates
    const handleTicketsUpdated = () => {
      loadData(); // Reload data immediately when tickets are updated
    };

    window.addEventListener('ticketsUpdated', handleTicketsUpdated);

    return () => {
      clearInterval(interval);
      window.removeEventListener('ticketsUpdated', handleTicketsUpdated);
    };
  }, [seasonEndTime]);

  // Live countdown timer - her saniye çalışır
  useEffect(() => {
    const updateTimeRemaining = () => {
      const now = new Date();
      const timeLeft = seasonEndTime.getTime() - now.getTime();

      if (timeLeft <= 0) {
        // Season ended
        setSeasonStatus(prev => ({
          ...prev,
          timeRemaining: { days: 0, hours: 0, minutes: 0, seconds: 0 },
          isActive: false,
          status: 'ended',
        }));
        return;
      }

      // Calculate remaining time
      const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
      const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      setSeasonStatus(prev => ({
        ...prev,
        timeRemaining: { days, hours, minutes, seconds },
      }));
    };

    // Ilk hesaplama hemen yap
    updateTimeRemaining();
    
    // Her saniye güncelle (canlı sayaç)
    const timer = setInterval(updateTimeRemaining, 1000);

    return () => clearInterval(timer);
  }, [seasonEndTime]);

  // Prize pool = sadece brüt bilet bedelleri (komisyon ayrıdır ve ek ücret olarak tahsil edilir)
  const grossRevenue = seasonStatus.totalTicketsSold * SEASON_CONFIG.TICKET_PRICE_USD;
  const netPrizePool = grossRevenue; // komisyon düşülmez
  const netPrizePoolSOL = netPrizePool / solPriceUSD;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'ended': return 'text-yellow-400';
      case 'drawing': return 'text-blue-400';
      case 'completed': return 'text-purple-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Season Active';
      case 'ended': return 'Season Ended';
      case 'drawing': return 'Drawing Winner';
      case 'completed': return 'Winner Announced';
      default: return 'Unknown';
    }
  };

  // Generate ticket range display
  const getTicketRange = () => {
    if (seasonStatus.totalTicketsSold === 0) {
      return "No tickets sold yet";
    }
    return `TKT-000001 to TKT-${seasonStatus.totalTicketsSold.toString().padStart(6, '0')}`;
  };

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          Season {seasonStatus.currentSeason}
        </h2>
        <p className="text-gray-400 text-lg">
          Buy unlimited tickets and win big prizes
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Total Tickets Sold */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-solana-green mb-2">
              {seasonStatus.totalTicketsSold}
            </div>
            <div className="text-gray-400">Tickets Sold</div>
            <div className="text-sm text-gray-500 mt-1">
              {getTicketRange()}
            </div>
          </div>
        </div>

        {/* Prize Pool */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            <div className="text-3xl font-bold text-solana-purple mb-2">
              ${netPrizePool.toFixed(2)}
            </div>
            <div className="text-gray-400">Net Prize Pool</div>
            <div className="text-lg font-semibold text-solana-green mb-1">
              ≈ {priceService.formatSOL(netPrizePoolSOL)} SOL
            </div>
            <div className="text-sm text-gray-500 mt-1">
              Commission charged on top: {COMMISSION_PERCENTAGE}% (not deducted from prize pool)
            </div>
          </div>
        </div>

        {/* Time Remaining or Status */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <div className="text-center">
            {seasonStatus.isActive ? (
              <>
                <div className="text-2xl font-bold text-white mb-2">
                  {seasonStatus.timeRemaining.days}d {seasonStatus.timeRemaining.hours}h
                </div>
                <div className="text-gray-400">Time Remaining</div>
                <div className="text-sm text-gray-500 mt-1">
                  {seasonStatus.timeRemaining.minutes}m {seasonStatus.timeRemaining.seconds}s
                </div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-yellow-400 mb-2">
                  Season Ended
                </div>
                <div className="text-gray-400">Drawing Winner</div>
                <div className="text-sm text-gray-500 mt-1">
                  Stay tuned for results
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Numbering Info */}
      <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 mb-6">
        <div className="text-center">
          <div className="text-lg font-bold text-purple-400 mb-2">🎫 Sequential Ticket Numbering</div>
          <div className="text-gray-300 text-sm">
            Tickets are numbered sequentially from TKT-000001. Each ticket has an equal chance to win!
          </div>
          <div className="text-gray-400 text-xs mt-2">
            Current range: {getTicketRange()}
          </div>
        </div>
      </div>

      {/* Status Indicator */}
      <div className="text-center">
        <div className={`inline-flex items-center px-4 py-2 bg-gray-800 border border-gray-600 rounded-full`}>
          <div className={`w-2 h-2 rounded-full mr-2 ${seasonStatus.isActive ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className={`text-sm font-medium ${getStatusColor(seasonStatus.status)}`}>
            {getStatusText(seasonStatus.status)}
          </span>
        </div>
      </div>

      {/* Winner Announcement */}
      {seasonStatus.winner && (
        <div className="mt-6 bg-green-900/20 border border-green-500/30 rounded-lg p-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400 mb-2">🎉 Winner Announced! 🎉</div>
            <div className="text-white font-mono text-lg mb-2">
              {seasonStatus.winner.slice(0, 4)}...{seasonStatus.winner.slice(-4)}
            </div>
            <div className="text-gray-400 text-sm">
              Winning Ticket: {seasonStatus.winnerTicketId}
            </div>
            <div className="text-solana-green font-bold text-lg mt-2">
              Prize: ${netPrizePool.toFixed(2)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
