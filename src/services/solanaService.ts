import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
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

const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export class SolanaService {
  private connection: Connection;
  private program: Program<Idl>;

  constructor() {
    this.connection = new Connection(NETWORK_CONFIG.endpoint, NETWORK_CONFIG.commitment);

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

  private buildMemoIx(seasonId: number, quantity: number, lamports: number): TransactionInstruction {
    const memo = `solotto:v1;season=${seasonId};qty=${quantity};lamports=${lamports}`;
    return new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, 'utf8') });
  }

  // Buy ticket with Anchor if possible; otherwise fallback to transfer + SPL Memo
  async buyTicket(
    buyerPublicKey: PublicKey,
    quantity: number,
    ticketPrice: number,
    treasuryPublicKey: PublicKey
  ): Promise<Transaction> {
    const tx = new Transaction();
    const seasonId = 1;
    const totalLamports = Math.floor(ticketPrice * quantity * LAMPORTS_PER_SOL);

    const programId = new PublicKey(PROGRAM_ID);
    const programInfo = await this.connection.getAccountInfo(programId);

    let usedFallback = false;
    try {
      if (!programInfo || !programInfo.executable) throw new Error('Program not found on this cluster');

      const ix = await (this.program as any).methods
        .buyTicket(quantity)
        .accounts({
          buyer: buyerPublicKey,
          treasury: treasuryPublicKey,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(ix);
    } catch (_) {
      // Fallback: simple transfer + memo (so everyone can aggregate on-chain)
      const transferIx = SystemProgram.transfer({ fromPubkey: buyerPublicKey, toPubkey: treasuryPublicKey, lamports: totalLamports });
      tx.add(transferIx);
      tx.add(this.buildMemoIx(seasonId, quantity, totalLamports));
      usedFallback = true;
    }

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = buyerPublicKey;

    if (usedFallback) {
      console.log('Using fallback: transfer + memo');
    } else {
      console.log('Using Anchor program instruction');
    }

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

  private extractMemoFromParsedIx(ix: any): string | null {
    try {
      if (ix?.program === 'spl-memo') {
        if (typeof ix.parsed === 'string') return ix.parsed;
        if (typeof ix.parsed?.info?.memo === 'string') return ix.parsed.info.memo;
      }
    } catch (_) {
      // ignore
    }
    return null;
  }

  // Try program Season account first; if not available, aggregate via SPL Memo transfers
  async getSeasonData(seasonId: number): Promise<any> {
    const programId = new PublicKey(PROGRAM_ID);
    try {
      const [seasonPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('season'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
        programId
      );

      // Try lower-case then PascalCase
      let account: any | null = null;
      try {
        account = await (this.program.account as any).season.fetch(seasonPda);
      } catch (_) {
        if ((this.program.account as any).Season?.fetch) {
          account = await (this.program.account as any).Season.fetch(seasonPda);
        }
      }

      if (account) {
        const totalTicketsSold = toNum(account.totalTicketsSold);
        const totalPrizePoolLamports = toNum(account.totalPrizePool);
        const endTimeSeconds = toNum(account.endTime);
        return {
          seasonId: toNum(account.seasonId),
          totalTicketsSold,
          totalPrizePool: totalPrizePoolLamports / LAMPORTS_PER_SOL,
          isActive: !!account.isActive,
          endTime: new Date(endTimeSeconds * 1000),
          winner: account.winner ?? null,
          winnerTicketId: account.winnerTicketId ?? null,
          admin: account.admin ?? null,
        };
      }
      // If account missing, fall through to memo aggregation
      throw new Error('Season account not found');
    } catch (error) {
      console.warn('Program Season fetch failed, falling back to memo aggregation:', (error as Error).message);
      // Memo aggregation fallback (global, works even without program)
      try {
        const treasury = new PublicKey(COMMISSION_WALLET);
        const signatures = await this.connection.getSignaturesForAddress(treasury, { limit: 1000 });
        const txs = await this.connection.getParsedTransactions(signatures.map(s => s.signature), { maxSupportedTransactionVersion: 0 });

        let ticketsSold = 0;
        for (const tx of txs) {
          if (!tx) continue;
          const outer = tx.transaction.message.instructions as any[];
          const inner = ((tx.meta?.innerInstructions || []).flatMap((ii: any) => ii.instructions) as any[]) || [];
          for (const ix of [...outer, ...inner]) {
            const memo = this.extractMemoFromParsedIx(ix);
            if (!memo || !memo.startsWith('solotto:')) continue;
            const parts = memo.split(';');
            const seasonPart = parts.find(p => p.startsWith('season='));
            const qtyPart = parts.find(p => p.startsWith('qty='));
            const seasonVal = seasonPart ? Number(seasonPart.split('=')[1]) : NaN;
            const qtyVal = qtyPart ? Number(qtyPart.split('=')[1]) : 0;
            if (seasonVal === seasonId && Number.isFinite(qtyVal)) ticketsSold += qtyVal;
          }
        }
        return {
          seasonId,
          totalTicketsSold: ticketsSold,
          totalPrizePool: ticketsSold * 1.0, // $1 per ticket (gross). UI düşecek
          isActive: true,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
      } catch (e) {
        console.error('Memo aggregation failed:', e);
        return {
          seasonId,
          totalTicketsSold: 0,
          totalPrizePool: 0,
          isActive: true,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        };
      }
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







