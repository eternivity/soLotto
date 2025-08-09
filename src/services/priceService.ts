export class PriceService {
  private static instance: PriceService;
  private solPriceUSD: number = 0;
  private lastUpdate: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 dakika

  private constructor() {}

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  async getSolPriceUSD(): Promise<number> {
    const now = Date.now();
    
    // Cache kontrolü
    if (this.solPriceUSD > 0 && (now - this.lastUpdate) < this.CACHE_DURATION) {
      return this.solPriceUSD;
    }

    try {
      console.log('Fetching real SOL price via Netlify function...');
      
      // Production'da Netlify function kullan, development'da direkt API
      const isProduction = window.location.hostname.includes('netlify.app');
      const apiUrl = isProduction 
        ? '/.netlify/functions/sol-price'
        : 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      this.solPriceUSD = data.solana.usd;
      this.lastUpdate = now;
      
      console.log('Current SOL price:', this.solPriceUSD, 'USD');
      return this.solPriceUSD;
    } catch (error) {
      console.error('Error fetching SOL price:', error);
      // Fallback değer - cache varsa onu kullan
      if (this.solPriceUSD > 0) {
        console.log('Using cached SOL price:', this.solPriceUSD);
        return this.solPriceUSD;
      }
      return 100; // Varsayılan değer
    }
  }

  async getTicketPriceSOL(): Promise<number> {
    const solPrice = await this.getSolPriceUSD();
    const ticketPriceUSD = 1.0; // 1 USD
    return ticketPriceUSD / solPrice;
  }

  formatSOL(amount: number): string {
    return amount.toFixed(4);
  }

  formatUSD(amount: number): string {
    return amount.toFixed(2);
  }
}

export const priceService = PriceService.getInstance();
