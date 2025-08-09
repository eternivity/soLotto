import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useConnection } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TICKET_PRICE_USD, COMMISSION_PERCENTAGE } from '../constants';
import { solanaService } from '../services/solanaService';
import { priceService } from '../services/priceService';
import { useToast } from './ToastProvider';

export const BuyTicket: React.FC = () => {
  const { publicKey, connected, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [ticketNumbers, setTicketNumbers] = useState<string[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [currentTicketCount, setCurrentTicketCount] = useState(25); // Simulated current ticket count
  const [ticketPriceSOL, setTicketPriceSOL] = useState(0.01); // Will be updated with real price
  const [solPriceUSD, setSolPriceUSD] = useState(100); // Will be updated with real price
  const [isLoadingPrice, setIsLoadingPrice] = useState(true);

  // Load real SOL price on component mount
  useEffect(() => {
    const loadPrices = async () => {
      try {
        setIsLoadingPrice(true);
        const solPrice = await priceService.getSolPriceUSD();
        const ticketPrice = await priceService.getTicketPriceSOL();
        
        setSolPriceUSD(solPrice);
        setTicketPriceSOL(ticketPrice);
        console.log('Real prices loaded - SOL:', solPrice, 'USD, Ticket:', ticketPrice, 'SOL');
      } catch (error) {
        console.error('Error loading prices:', error);
      } finally {
        setIsLoadingPrice(false);
      }
    };

    loadPrices();
  }, []);

  const generateTicketNumbers = (count: number, startFrom: number) => {
    const numbers = [];
    for (let i = 0; i < count; i++) {
      const ticketNumber = startFrom + i;
      numbers.push(`TKT-${ticketNumber.toString().padStart(6, '0')}`);
    }
    return numbers;
  };

  const handleBuyTicket = async () => {
    if (!connected || !publicKey) {
      toast.info('Lütfen önce cüzdanınızı bağlayın.');
      return;
    }

    setIsLoading(true);
    
    try {
      // Ön kontrol: bakiye yeterli mi?
      const balanceLamports = await connection.getBalance(publicKey);
      const grossPerTicketSol = ticketPriceSOL;
      const grossLamports = Math.floor(grossPerTicketSol * quantity * LAMPORTS_PER_SOL);
      const commissionLamports = Math.floor((grossPerTicketSol * (COMMISSION_PERCENTAGE / 100)) * quantity * LAMPORTS_PER_SOL);
      const totalLamports = grossLamports + commissionLamports;
      const feeBufferLamports = 5000; // yaklaşık tx ücreti için küçük pay

      if (balanceLamports < totalLamports + feeBufferLamports) {
        const haveSol = balanceLamports / LAMPORTS_PER_SOL;
        const needSol = (totalLamports + feeBufferLamports) / LAMPORTS_PER_SOL;
        setIsLoading(false);
        toast.error(`Cüzdan bakiyesi yetersiz. Gerekli: ~${priceService.formatSOL(needSol)} SOL, Mevcut: ${priceService.formatSOL(haveSol)} SOL. Lütfen Devnet SOL yükleyip tekrar deneyin.`);
        return;
      }

      console.log('Creating real blockchain transaction...');
      
      // Create transaction (service içinde prize pool + komisyon ayrıştırılır)
      const transaction = await solanaService.buyTicket(
        publicKey,
        quantity,
        ticketPriceSOL,
      );
      
      console.log('Transaction created, sending to blockchain...');
      console.log('Transaction object:', transaction);
      console.log('From:', publicKey.toString());
      console.log('Amount (gross per ticket):', ticketPriceSOL, 'SOL');
      console.log('Current SOL price:', solPriceUSD, 'USD');
      console.log('Program ID:', solanaService.getProgramId().toString());
      
      // Send transaction - this will prompt wallet approval
      const signature = await sendTransaction(transaction, connection);
      console.log('Transaction sent with signature:', signature);
      
      // Wait for confirmation
      const confirmation = await connection.confirmTransaction(signature, 'confirmed');
      console.log('Transaction confirmed:', confirmation);
      
                // Generate ticket numbers
          const newTicketNumbers = generateTicketNumbers(quantity, currentTicketCount + 1);
          setTicketNumbers(newTicketNumbers);
          setCurrentTicketCount(prev => prev + quantity);
          setShowSuccess(true);
          
          // Save tickets to local storage for MyTickets component
          const newTickets = newTicketNumbers.map((ticketNumber, index) => ({
            id: `${Date.now()}_${index}`,
            seasonId: 1, // Current season
            walletAddress: publicKey.toString(),
            purchaseTime: new Date(),
            ticketNumber: ticketNumber,
          }));
          
          const storageKey = `solotto_tickets_${publicKey.toString()}`;
          const existingTickets = localStorage.getItem(storageKey);
          const allTickets = existingTickets 
            ? [...JSON.parse(existingTickets), ...newTickets]
            : newTickets;
          
          localStorage.setItem(storageKey, JSON.stringify(allTickets));
          console.log('Tickets saved to local storage:', newTickets.length);
          
          // Also save to season storage for real-time updates
          const seasonStorageKey = `solotto_tickets_season_1`;
          const existingSeasonTickets = localStorage.getItem(seasonStorageKey);
          const allSeasonTickets = existingSeasonTickets 
            ? [...JSON.parse(existingSeasonTickets), ...newTickets]
            : newTickets;
          
          localStorage.setItem(seasonStorageKey, JSON.stringify(allSeasonTickets));
          console.log('Season tickets updated:', allSeasonTickets.length);
          
          // Trigger a custom event to update other components
          window.dispatchEvent(new CustomEvent('ticketsUpdated', { 
            detail: { ticketsSold: allSeasonTickets.length } 
          }));
      
      console.log('Tickets purchased successfully:', newTicketNumbers);
      
      setTimeout(() => {
        setShowSuccess(false);
        setTicketNumbers([]);
      }, 8000); // Show for 8 seconds
      
    } catch (error) {
      console.error('Error buying ticket:', error);
      
      // Detailed error logging for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
        
        // Check for specific wallet errors
        const lower = error.message.toLowerCase();
        if (
          lower.includes('insufficient funds') ||
          lower.includes('insufficient lamports') ||
          lower.includes('insufficient balance')
        ) {
          toast.error('Cüzdan bakiyesi yetersiz. Lütfen Devnet SOL ekleyip tekrar deneyin.');
          setIsLoading(false);
          return;
        }

        if (error.message.includes('WalletSendTransactionError')) {
          console.error('Wallet transaction failed - this usually means:');
          console.error('1. Program ID mismatch');
          console.error('2. Invalid instruction parameters');
          console.error('3. Network connection issues');
          console.error('4. Wallet permissions');
        }
        
        toast.error('İşlem başarısız oldu. Lütfen ağ bağlantınızı ve cüzdan yetkilerini kontrol edin, sonra tekrar deneyin.');
      } else {
        console.error('Unknown error type:', error);
        toast.error('İşlem başarısız oldu (bilinmeyen hata). Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

      const totalPrice = quantity * TICKET_PRICE_USD; // brüt USD
      const commissionUSD = totalPrice * (COMMISSION_PERCENTAGE / 100);
      const grandTotalUSD = totalPrice + commissionUSD;
      const grossSOL = quantity * ticketPriceSOL;
      const commissionSOL = grossSOL * (COMMISSION_PERCENTAGE / 100);
      const grandTotalSOL = grossSOL + commissionSOL;

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-xl p-8 border border-gray-700 shadow-2xl">
      <div className="text-center mb-8">
        <h2 className="text-4xl font-bold bg-gradient-to-r from-solana-purple to-solana-green bg-clip-text text-transparent mb-4">
          Buy Your Tickets
        </h2>
        <p className="text-gray-400 text-lg">
          Buy unlimited tickets and increase your chances to win
        </p>
      </div>

      <div className="max-w-md mx-auto">
                    {/* Ticket Price Display */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
              <div className="text-center">
                <div className="text-4xl font-bold text-solana-purple mb-2">
                  ${TICKET_PRICE_USD}
                </div>
                <div className="text-gray-400 mb-2">Per Ticket</div>
                {isLoadingPrice ? (
                  <div className="text-lg font-semibold text-solana-green">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-solana-green mx-auto mb-2"></div>
                    Loading price...
                  </div>
                ) : (
                  <div className="text-lg font-semibold text-solana-green">
                    ≈ {priceService.formatSOL(ticketPriceSOL)} SOL
                  </div>
                )}
                <div className="text-sm text-gray-500 mt-2">
                  Current SOL: ${priceService.formatUSD(solPriceUSD)}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Buy as many tickets as you want
                </div>
              </div>
            </div>

        {/* Quantity Selector */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700 mb-6">
          <div className="text-center mb-4">
            <label className="text-gray-400 text-sm mb-2 block">Number of Tickets</label>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold"
              >
                -
              </button>
              <span className="text-2xl font-bold text-white min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold"
              >
                +
              </button>
            </div>
          </div>
          
                        {/* Total Price */}
              <div className="text-center pt-4 border-t border-gray-600">
                <div className="text-lg text-gray-400 mb-1">Total Price</div>
                <div className="text-sm text-gray-400">Subtotal: ${totalPrice.toFixed(2)} | Fee ({COMMISSION_PERCENTAGE}%): ${commissionUSD.toFixed(2)}</div>
                <div className="text-2xl font-bold text-solana-green mb-1">${grandTotalUSD.toFixed(2)}</div>
                <div className="text-sm text-gray-500">≈ {priceService.formatSOL(grandTotalSOL)} SOL</div>
              </div>
        </div>

        {/* Wallet Connection Status */}
        {connected && publicKey && (
          <div className="bg-green-900/20 border border-green-500/30 rounded-lg p-4 mb-6">
            <div className="text-center">
              <div className="text-green-400 text-sm mb-2">Connected Wallet</div>
              <div className="text-white font-mono text-sm">
                {publicKey?.toString().slice(0, 4)}...{publicKey?.toString().slice(-4)}
              </div>
            </div>
          </div>
        )}

        {/* Buy Button */}
        <button
          onClick={handleBuyTicket}
          disabled={!connected || isLoading}
          className={`w-full py-4 px-6 rounded-lg font-bold text-lg transition-all duration-200 ${
            connected && !isLoading
              ? 'bg-gradient-to-r from-solana-purple to-solana-green hover:from-purple-600 hover:to-green-500 transform hover:scale-105'
              : 'bg-gray-700 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Processing...
            </div>
          ) : connected ? (
            `Buy ${quantity} Ticket${quantity > 1 ? 's' : ''} Now`
          ) : (
            'Connect Wallet to Buy'
          )}
        </button>

        {/* Success Message with Ticket Numbers */}
        {showSuccess && (
          <div className="mt-4 bg-green-900/20 border border-green-500/30 rounded-lg p-6">
            <div className="text-center">
              <div className="flex items-center justify-center text-green-400 mb-4">
                <svg className="w-6 h-6 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="font-medium text-lg">Tickets purchased successfully!</span>
              </div>
              
              {/* Ticket Numbers Display with Scrollbar */}
              <div className="bg-gray-800 rounded-lg p-4 border border-gray-600 mb-4">
                <div className="text-gray-400 text-sm mb-3">Your Ticket Numbers</div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                  <div className="space-y-2">
                    {ticketNumbers.map((ticketNumber, index) => (
                      <div key={index} className="text-lg font-bold text-solana-green font-mono">
                        {ticketNumber}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-gray-500 text-xs mt-3">
                  Save these numbers for reference
                </div>
              </div>
              
              <div className="text-gray-400 text-sm">
                Good luck! Winner will be announced at the end of the season.
              </div>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-gray-400 text-sm">
            Tickets are non-refundable. Winners are selected automatically.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Platform fee: {COMMISSION_PERCENTAGE}%
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Buy unlimited tickets to increase your chances
          </p>
          <p className="text-gray-500 text-xs mt-1">
            Tickets are numbered sequentially from TKT-000001
          </p>
        </div>
      </div>
    </div>
  );
};
