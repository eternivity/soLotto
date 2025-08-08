import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Program, BN, Idl } from '@project-serum/anchor';
import { PROGRAM_ID, NETWORK_CONFIG, COMMISSION_WALLET } from '../constants';
import { IDL, SolottoIDL } from '../types/idl';

function toNum(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  if (typeof value === 'string') return Number(value);
  return Number(value);
}

export class SolanaService {
  private connection: Connection;
  private program: Program<SolottoIDL>;

  constructor() {
    this.connection = new Connection(NETWORK_CONFIG.endpoint, NETWORK_CONFIG.commitment);
    
    // Create a dummy provider for now - will be replaced with real wallet provider
    const dummyProvider = {
      connection: this.connection,
      publicKey: new PublicKey(COMMISSION_WALLET),
      signTransaction: async (tx: Transaction) => tx,
      signAllTransactions: async (txs: Transaction[]) => txs,
      wallet: {
        publicKey: new PublicKey(COMMISSION_WALLET),
        signTransaction: async (tx: Transaction) => tx,
        signAllTransactions: async (txs: Transaction[]) => txs,
      },
      opts: {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed',
      },
      sendAndConfirm: async (tx: Transaction) => tx,
      sendAll: async (txs: Transaction[]) => txs,
      simulate: async (tx: Transaction) => ({ value: { err: null } }),
    } as unknown as AnchorProvider;
    
    this.program = new Program(IDL as Idl, PROGRAM_ID, dummyProvider) as unknown as Program<SolottoIDL>;
  }

  // Get connection instance
  getConnection(): Connection {
    return this.connection;
  }

  // Get program public key
  getProgramId(): PublicKey {
    return new PublicKey(PROGRAM_ID);
  }

  // Get SOL balance
  async getBalance(publicKey: PublicKey): Promise<number> {
    try {
      const balance = await this.connection.getBalance(publicKey);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error('Error getting balance:', error);
      throw error;
    }
  }

  // Buy ticket transaction using real smart contract
  async buyTicket(
    buyerPublicKey: PublicKey,
    quantity: number,
    ticketPrice: number,
    treasuryPublicKey: PublicKey
  ): Promise<Transaction> {
    try {
      console.log('Creating buy ticket transaction with smart contract...');
      console.log('Buyer:', buyerPublicKey.toString());
      console.log('Treasury:', treasuryPublicKey.toString());
      console.log('Quantity:', quantity);
      console.log('Price per ticket:', ticketPrice, 'SOL');
      
      // Create smart contract instruction
      const instruction = await this.program.methods
        .buyTicket(new BN(quantity))
        .accounts({
          buyer: buyerPublicKey,
          treasury: treasuryPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const transaction = new Transaction();
      transaction.add(instruction);
      
      // Get recent blockhash
      console.log('Getting recent blockhash...');
      const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = buyerPublicKey;
      
      console.log('Smart contract transaction created successfully');
      console.log('Blockhash:', blockhash);
      console.log('Fee payer:', buyerPublicKey.toString());
      
      return transaction;
    } catch (error) {
      console.error('Error creating buy ticket transaction:', error);
      throw error;
    }
  }

  // Claim commission transaction using real smart contract
  async claimCommission(
    adminPublicKey: PublicKey,
    treasuryPublicKey: PublicKey
  ): Promise<Transaction> {
    try {
      console.log('Creating claim commission transaction with smart contract...');
      
      const instruction = await this.program.methods
        .claimCommission()
        .accounts({
          admin: adminPublicKey,
          treasury: treasuryPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const transaction = new Transaction();
      transaction.add(instruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = adminPublicKey;
      
      console.log('Claim commission transaction created successfully');
      return transaction;
    } catch (error) {
      console.error('Error creating claim commission transaction:', error);
      throw error;
    }
  }

  // Start season transaction using real smart contract
  async startSeason(
    adminPublicKey: PublicKey,
    treasuryPublicKey: PublicKey,
    seasonId: number
  ): Promise<Transaction> {
    try {
      console.log('Creating start season transaction with smart contract...');
      
      // Find season PDA
      const [seasonPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("season"), new Uint8Array(new Uint32Array([seasonId]).buffer)],
        this.getProgramId()
      );
      
      const instruction = await this.program.methods
        .startSeason(new BN(seasonId))
        .accounts({
          admin: adminPublicKey,
          treasury: treasuryPublicKey,
          season: seasonPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      
      const transaction = new Transaction();
      transaction.add(instruction);
      
      // Get recent blockhash
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = adminPublicKey;
      
      console.log('Start season transaction created successfully');
      return transaction;
    } catch (error) {
      console.error('Error creating start season transaction:', error);
      throw error;
    }
  }

  // Get season data from blockchain
  async getSeasonData(seasonId: number): Promise<any> {
    try {
      console.log('Getting season data from blockchain for season:', seasonId);
      
      // Find season PDA
      const [seasonPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("season"), new Uint8Array(new Uint32Array([seasonId]).buffer)],
        this.getProgramId()
      );
      
      console.log('Season PDA:', seasonPda.toString());
      
      // Fetch season account from blockchain
      const seasonAccount: any = await this.program.account.Season.fetch(seasonPda);
      
      if (seasonAccount) {
        console.log('Season account found on blockchain:', seasonAccount);
        
        const seasonIdNum = toNum(seasonAccount.seasonId);
        const totalTicketsSoldNum = toNum(seasonAccount.totalTicketsSold);
        const totalPrizePoolLamports = toNum(seasonAccount.totalPrizePool);
        const endTimeSeconds = toNum(seasonAccount.endTime);
        
        return {
          seasonId: seasonIdNum,
          totalTicketsSold: totalTicketsSoldNum,
          totalPrizePool: totalPrizePoolLamports / LAMPORTS_PER_SOL,
          isActive: seasonAccount.isActive,
          endTime: new Date(endTimeSeconds * 1000),
          winner: seasonAccount.winner,
          winnerTicketId: seasonAccount.winnerTicketId,
          admin: seasonAccount.admin,
        };
      }
      
      console.log('Season account not found on blockchain, returning default data');
      return {
        seasonId,
        totalTicketsSold: 0,
        totalPrizePool: 0,
        isActive: true,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        winner: null,
        winnerTicketId: null,
        admin: null,
      };
    } catch (error) {
      console.error('Error getting season data from blockchain:', error);
      
      // Fallback to local storage data
      const storageKey = `solotto_tickets_season_${seasonId}`;
      const storedTickets = localStorage.getItem(storageKey);
      
      let totalTicketsSold = 0;
      let totalPrizePool = 0;
      
      if (storedTickets) {
        try {
          const tickets = JSON.parse(storedTickets);
          totalTicketsSold = tickets.length;
          totalPrizePool = totalTicketsSold * 1.0; // $1 per ticket
          console.log('Fallback to local storage data - Tickets sold:', totalTicketsSold, 'Prize pool:', totalPrizePool);
        } catch (error) {
          console.error('Error parsing stored tickets:', error);
        }
      }
      
      return {
        seasonId,
        totalTicketsSold,
        totalPrizePool,
        isActive: true,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        winner: null,
        winnerTicketId: null,
        admin: null,
      };
    }
  }

  // Get user tickets from blockchain (future implementation)
  async getUserTickets(userPublicKey: PublicKey): Promise<any[]> {
    try {
      console.log('Getting user tickets from blockchain for:', userPublicKey.toString());
      
      // TODO: Implement actual blockchain ticket queries
      // This would require querying the smart contract for user tickets
      
      // For now, return empty array as we're using local storage
      return [];
    } catch (error) {
      console.error('Error getting user tickets:', error);
      return [];
    }
  }

  // Get winners history from blockchain (future implementation)
  async getWinnersHistory(): Promise<any[]> {
    try {
      console.log('Getting winners history from blockchain...');
      
      // TODO: Implement actual winner history queries from smart contract
      // This would require querying multiple season accounts for winners
      
      // For now, return empty array as we don't have completed seasons yet
      return [];
    } catch (error) {
      console.error('Error getting winners history:', error);
      return [];
    }
  }
}

// Export singleton instance
export const solanaService = new SolanaService();







