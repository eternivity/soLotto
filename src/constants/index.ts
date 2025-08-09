// Your deployed program ID from Solana Playground (Testnet)
export const PROGRAM_ID = "9Lu5557CPM7DtBadKFkh9kd48KpyHku4kTi4xnmJWhYe";

// Ticket pricing in USD (SOL will be calculated dynamically)
export const TICKET_PRICE_USD = 1.0; // USD

// Commission settings
export const COMMISSION_PERCENTAGE = 10; // 10%
export const COMMISSION_WALLET = "43kyNFpG5sje54EZYWQvRXuQjerCYvfWv715mPucnypo"; // Admin wallet address

// Prize havuzu (kasa) adresi - test için farklı bir adres
export const TREASURY_WALLET = "5x2cxjYcEv6qNP8XGJAXdX8rM5G8tgNp3PNDjJP3Kx7F"; // Separate treasury wallet

export const SEASON_CONFIG = {
  DURATION_DAYS: 7, // Season duration in days
  TICKET_PRICE_USD: 1.0,
  COMMISSION_PERCENTAGE: 10,
  // No limit on tickets - users can buy as many as they want
  MAX_TICKETS_PER_USER: null, // null means unlimited 
  MIN_TICKETS_FOR_DRAW: 1, // Minimum tickets needed for a draw
};

export const NETWORK_CONFIG = {
  endpoint: "https://rpc.testnet.solana.com",
  commitment: "confirmed" as const,
};

// Explorer URL testnet için cluster parametresiyle
export const EXPLORER_URL = "https://explorer.solana.com/address/?cluster=testnet";
export const GITHUB_URL = "https://github.com/your-username/solotto";

// Social Media Links
export const SOCIAL_LINKS = {
  TWITTER: "https://twitter.com/solotto_app",
  DISCORD: "https://discord.gg/solotto",
  TELEGRAM: "https://t.me/solotto",
  GITHUB: "https://github.com/your-username/solotto",
};
