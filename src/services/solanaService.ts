import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@project-serum/anchor';
import { PROGRAM_ID, NETWORK_CONFIG, COMMISSION_WALLET } from '../constants';
import idlJson from '../types/idl.json';

function toNum(value: any): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'bigint') return Number(value);
  if (value && typeof value.toNumber === 'function') return value.toNumber();
  if (typeof value === 'string') return Number(value);
  return Number(value);
}

export class SolanaService {
  private connection: Connection;
  private program: Program<Idl>;

  constructor() {
    this.connection = new Connection(NETWORK_CONFIG.endpoint, NETWORK_CONFIG.commitment);

    // Minimal provider (connection-only). Signing happens via wallet adapter.
    const dummyProvider = {
      connection: this.connection,
      wallet: { publicKey: new PublicKey(COMMISSION_WALLET) },
      opts: { commitment: 'confirmed', preflightCommitment: 'confirmed' },
    } as unknown as AnchorProvider;

    this.program = new Program(idlJson as unknown as Idl, new PublicKey(PROGRAM_ID), dummyProvider);
  }

  getConnection(): Connection {
    return this.connection;
  }

  getProgramId(): PublicKey {
    return new PublicKey(PROGRAM_ID);
  }

  async getBalance(publicKey: PublicKey): Promise<number> {
    const balance = await this.connection.getBalance(publicKey);
    return balance / LAMPORTS_PER_SOL;
  }

  // Real Anchor instruction based on IDL (buyTicket(quantity))
  async buyTicket(
    buyerPublicKey: PublicKey,
    quantity: number,
    _ticketPrice: number,
    treasuryPublicKey: PublicKey
  ): Promise<Transaction> {
    const tx = new Transaction();

    // Build Anchor instruction
    const ix = await this.program.methods
      .buyTicket(quantity)
      .accounts({
        buyer: buyerPublicKey,
        treasury: treasuryPublicKey,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    tx.add(ix);

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = buyerPublicKey;
    return tx;
  }

  async claimCommission(adminPublicKey: PublicKey, _treasuryPublicKey: PublicKey): Promise<Transaction> {
    const tx = new Transaction();
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminPublicKey;
    return tx;
  }

  async startSeason(adminPublicKey: PublicKey, _treasuryPublicKey: PublicKey, _seasonId: number): Promise<Transaction> {
    const tx = new Transaction();
    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = adminPublicKey;
    return tx;
  }

  // Try to fetch Season account (PDA seed assumed: ["season", u32_le])
  async getSeasonData(seasonId: number): Promise<any> {
    try {
      const [seasonPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('season'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
        new PublicKey(PROGRAM_ID)
      );

      // Prefer lowercased account namespace (Anchor JS convention)
      let account: any | null = null;
      try {
        account = await (this.program.account as any).season.fetch(seasonPda);
      } catch (_) {
        // Fallback to PascalCase access if needed
        if ((this.program.account as any).Season?.fetch) {
          account = await (this.program.account as any).Season.fetch(seasonPda);
        }
      }

      if (!account) {
        return {
          seasonId,
          totalTicketsSold: 0,
          totalPrizePool: 0,
          isActive: true,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
      }

      const totalTicketsSold = toNum(account.totalTicketsSold);
      const totalPrizePoolLamports = toNum(account.totalPrizePool);
      const endTimeSeconds = toNum(account.endTime);

      return {
        seasonId: toNum(account.seasonId),
        totalTicketsSold,
        // Prize pool is stored as lamports in IDL. Convert to USD on UI via current price if desired.
        totalPrizePool: totalPrizePoolLamports / LAMPORTS_PER_SOL,
        isActive: !!account.isActive,
        endTime: new Date(endTimeSeconds * 1000),
        winner: account.winner ?? null,
        winnerTicketId: account.winnerTicketId ?? null,
        admin: account.admin ?? null,
      };
    } catch (error) {
      console.error('getSeasonData (on-chain) error:', error);
      return {
        seasonId,
        totalTicketsSold: 0,
        totalPrizePool: 0,
        isActive: true,
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      };
    }
  }

  async getUserTickets(_userPublicKey: PublicKey): Promise<any[]> {
    return [];
  }

  async getWinnersHistory(): Promise<any[]> {
    return [];
  }
}

export const solanaService = new SolanaService();







