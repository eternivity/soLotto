import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL, TransactionInstruction } from '@solana/web3.js';
import { AnchorProvider, Program, Idl } from '@project-serum/anchor';
import { PROGRAM_ID, NETWORK_CONFIG, COMMISSION_WALLET, TREASURY_WALLET, COMMISSION_PERCENTAGE } from '../constants';
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
  private memoProgram: PublicKey;

  constructor() {
    this.connection = new Connection(NETWORK_CONFIG.endpoint, NETWORK_CONFIG.commitment);
    this.memoProgram = MEMO_PROGRAM_ID;

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

  private buildMemoIx(seasonId: number, quantity: number, lamports: number, buyerPublicKey?: PublicKey): TransactionInstruction {
    // JSON format memo for getUserTickets compatibility
    const ticketNumbers: string[] = [];
    const startTicketNumber = Date.now();
    
    for (let i = 0; i < quantity; i++) {
      ticketNumbers.push(`TKT-${(startTicketNumber + i).toString().padStart(6, '0')}`);
    }
    
    const memoData = {
      type: 'TICKET_PURCHASE',
      seasonId,
      quantity,
      lamports,
      buyer: buyerPublicKey?.toString(),
      ticketNumbers,
      timestamp: new Date().toISOString(),
    };
    
    const memo = JSON.stringify(memoData);
    return new TransactionInstruction({ programId: MEMO_PROGRAM_ID, keys: [], data: Buffer.from(memo, 'utf8') });
  }

  // Buy ticket with Anchor if possible; otherwise fallback to transfer + SPL Memo
  async buyTicket(
    buyerPublicKey: PublicKey,
    quantity: number,
    ticketPrice: number,
  ): Promise<Transaction> {
    const tx = new Transaction();
    const seasonId = 1;
    // Brüt bilet bedeli = $1.00 karşılığı SOL
    // Komisyon = brütün %COMMISSION_PERCENTAGE'i (üstten ek alınır)
    // Prize pool'a eklenen: sadece brüt
    const grossPerTicketSol = ticketPrice;
    const grossLamports = Math.floor(grossPerTicketSol * quantity * LAMPORTS_PER_SOL);
    const commissionLamports = Math.floor((grossPerTicketSol * (COMMISSION_PERCENTAGE / 100)) * quantity * LAMPORTS_PER_SOL);

    const programId = new PublicKey(PROGRAM_ID);
    const programInfo = await this.connection.getAccountInfo(programId);
    const [seasonPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('season'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
      programId
    );
    const [commissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('commission'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
      programId
    );

    let usedFallback = false;
    try {
      if (!programInfo || !programInfo.executable) throw new Error('Program not found on this cluster');

      const treasuryPk = new PublicKey(TREASURY_WALLET);
      const ix = await (this.program as any).methods
        .buyTicket(seasonId, quantity, grossLamports, commissionLamports)
        .accounts({
          buyer: buyerPublicKey,
          treasury: treasuryPk,
          commissionVault: commissionPda,
          season: seasonPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(ix);
    } catch (_) {
      // Fallback: iki ayrı transfer + memo
      // 1) Brüt bilet bedeli prize pool (treasury)'ye
      const treasuryPk = new PublicKey(TREASURY_WALLET);
      const transferGross = SystemProgram.transfer({ fromPubkey: buyerPublicKey, toPubkey: treasuryPk, lamports: grossLamports });
      tx.add(transferGross);
      // 2) Komisyon admin cüzdanına
      const commissionPk = new PublicKey(COMMISSION_WALLET);
      if (commissionLamports > 0) {
        const transferCommission = SystemProgram.transfer({ fromPubkey: buyerPublicKey, toPubkey: commissionPk, lamports: commissionLamports });
        tx.add(transferCommission);
      }
      // Memo sadece bilet bilgisi için (brüt tutarı yazılır)
      tx.add(this.buildMemoIx(seasonId, quantity, grossLamports, buyerPublicKey));
      usedFallback = true;
    }

    const { blockhash } = await this.connection.getLatestBlockhash('confirmed');
    tx.recentBlockhash = blockhash;
    tx.feePayer = buyerPublicKey;

    if (usedFallback) {
      console.log('Using fallback: split transfer (gross to treasury + commission to admin) + memo');
    } else {
      console.log('Using Anchor program instruction');
    }

    return tx;
  }

  async claimCommission(adminPublicKey: PublicKey, seasonId: number): Promise<Transaction | null> {
    const tx = new Transaction();
    const programId = new PublicKey(PROGRAM_ID);
    const [seasonPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('season'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
      programId
    );
    const [commissionPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('commission'), new Uint8Array(new Uint32Array([seasonId]).buffer)],
      programId
    );

    try {
      // Program gerçekten mevcut ve executable mı?
      const programInfo = await this.connection.getAccountInfo(programId);
      if (!programInfo || !programInfo.executable) {
        throw new Error('Program not found or not executable on this cluster');
      }

      // Commission kasasında bakiye var mı?
      const commissionBalanceLamports = await this.connection.getBalance(commissionPda);
      if (!commissionBalanceLamports || commissionBalanceLamports <= 0) {
        throw new Error('No commission balance available to claim');
      }

      const ix = await (this.program as any).methods
        .claimCommission(seasonId)
        .accounts({
          admin: adminPublicKey,
          season: seasonPda,
          commissionVault: commissionPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();
      tx.add(ix);
    } catch (e) {
      console.error('claimCommission build failed or not claimable:', e);
      return null; // Boş işlem göndermeyelim
    }

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

  private extractSolTransferLamportsTo(ix: any, destinationBase58: string): number {
    try {
      if (ix?.program === 'system' && ix?.parsed?.type === 'transfer') {
        const dest = ix.parsed?.info?.destination;
        const lamports = Number(ix.parsed?.info?.lamports ?? 0);
        if (dest === destinationBase58) return lamports;
      }
    } catch (_) {
      // ignore
    }
    return 0;
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
        const treasury = new PublicKey(TREASURY_WALLET);
        const admin = new PublicKey(COMMISSION_WALLET);
        const sigsTreasury = await this.connection.getSignaturesForAddress(treasury, { limit: 1000 });
        const sigsAdmin = await this.connection.getSignaturesForAddress(admin, { limit: 1000 });
        const uniqueSigs = Array.from(new Set([...sigsTreasury, ...sigsAdmin].map(s => s.signature)));
        const txs = await this.connection.getParsedTransactions(uniqueSigs, { maxSupportedTransactionVersion: 0 });

        let ticketsSold = 0;
        let commissionLamportsReceived = 0;
        for (const tx of txs) {
          if (!tx) continue;
          const outer = tx.transaction.message.instructions as any[];
          const inner = ((tx.meta?.innerInstructions || []).flatMap((ii: any) => ii.instructions) as any[]) || [];
          const allIxs = [...outer, ...inner];
          for (const ix of allIxs) {
            const memo = this.extractMemoFromParsedIx(ix);
            if (!memo || !memo.startsWith('solotto:')) continue;
            const parts = memo.split(';');
            const seasonPart = parts.find(p => p.startsWith('season='));
            const qtyPart = parts.find(p => p.startsWith('qty='));
            const seasonVal = seasonPart ? Number(seasonPart.split('=')[1]) : NaN;
            const qtyVal = qtyPart ? Number(qtyPart.split('=')[1]) : 0;
            if (seasonVal === seasonId && Number.isFinite(qtyVal)) ticketsSold += qtyVal;
          }
          // If this tx has our season memo, sum transfers to admin wallet as realized commission
          const containsOurMemo = allIxs.some(ix => {
            const m = this.extractMemoFromParsedIx(ix);
            if (!m || !m.startsWith('solotto:')) return false;
            const parts = m.split(';');
            const seasonPart = parts.find(p => p.startsWith('season='));
            const seasonVal = seasonPart ? Number(seasonPart.split('=')[1]) : NaN;
            return seasonVal === seasonId;
          });
          if (containsOurMemo) {
            for (const ix of allIxs) {
              commissionLamportsReceived += this.extractSolTransferLamportsTo(ix, COMMISSION_WALLET);
            }
          }
        }
        return {
          seasonId,
          totalTicketsSold: ticketsSold,
          totalPrizePool: ticketsSold * 1.0, // $1 per ticket (gross)
          isActive: true,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          commissionLamportsReceived,
        };
      } catch (e) {
        console.error('Memo aggregation failed:', e);
        return {
          seasonId,
          totalTicketsSold: 0,
          totalPrizePool: 0,
          isActive: true,
          endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          commissionLamportsReceived: 0,
        };
      }
    }
  }

  async getUserTickets(userPublicKey: PublicKey): Promise<any[]> {
    try {
      console.log('🔍 Fetching user tickets from blockchain for:', userPublicKey.toString());
      
      // User'ın tüm transaction'larını getir
      const transactions = await this.connection.getSignaturesForAddress(userPublicKey, {
        limit: 100, // Son 100 transaction
      });
      
      console.log('📋 Found', transactions.length, 'transactions for user');
      
      const userTickets: any[] = [];
      
      for (const txInfo of transactions) {
        try {
          const tx = await this.connection.getTransaction(txInfo.signature, {
            maxSupportedTransactionVersion: 0,
          });
          
          if (!tx || !tx.meta) continue;
          
          // SPL Memo instruction'ları ara - Versioned transaction uyumlu
          const message = tx.transaction.message;
          const instructions = 'instructions' in message ? message.instructions : message.compiledInstructions;
          
          if (instructions) {
            for (const instruction of instructions) {
              try {
                // Versioned transaction'da programId index üzerinden çözülür
                let programId: PublicKey;
                let data: Uint8Array;
                
                if ('programId' in instruction) {
                  // Legacy instruction
                  programId = instruction.programId as PublicKey;
                  data = instruction.data as Uint8Array;
                } else {
                  // Compiled instruction (versioned)
                  const accountKeys = message.staticAccountKeys || [];
                  const compiledInstruction = instruction as any;
                  if (compiledInstruction.programIdIndex < accountKeys.length) {
                    programId = accountKeys[compiledInstruction.programIdIndex];
                    data = compiledInstruction.data as Uint8Array;
                  } else {
                    continue;
                  }
                }
                
                if (programId.equals(this.memoProgram)) {
                  const memoText = Buffer.from(data).toString('utf8');
                  console.log('📝 Found memo:', memoText);
                  
                  // Bilet satın alma memo'sunu parse et
                  if (memoText.includes('TICKET_PURCHASE')) {
                    console.log('🎫 Found TICKET_PURCHASE memo:', memoText);
                    try {
                      const memoData = JSON.parse(memoText);
                      console.log('📊 Parsed memo data:', memoData);
                      console.log('👤 Memo buyer:', memoData.buyer);
                      console.log('👤 Current user:', userPublicKey.toString());
                      
                      if (memoData.buyer === userPublicKey.toString()) {
                        // Bu user'ın bileti
                        const ticket = {
                          id: `${txInfo.signature}_${Date.now()}`,
                          seasonId: memoData.seasonId || 1,
                          walletAddress: userPublicKey.toString(),
                          purchaseTime: new Date(tx.blockTime! * 1000),
                          ticketNumber: memoData.ticketNumbers ? memoData.ticketNumbers[0] : `TKT-${Date.now()}`,
                          quantity: memoData.quantity || 1,
                          txSignature: txInfo.signature,
                        };
                        console.log('✅ Adding ticket for user:', ticket);
                        userTickets.push(ticket);
                      } else {
                        console.log('❌ Memo buyer mismatch - skipping');
                      }
                    } catch (parseError) {
                      console.error('❌ JSON parse error for memo:', memoText, parseError);
                      continue;
                    }
                  }
                }
              } catch (instructionError) {
                // Instruction işleme hatası - skip
                continue;
              }
            }
          }
        } catch (txError) {
          // Transaction fetch hatası - skip
          continue;
        }
      }
      
      console.log('Found user tickets on blockchain:', userTickets.length);
      return userTickets;
    } catch (error) {
      console.error('Error fetching user tickets from blockchain:', error);
      return [];
    }
  }

  async getWinnersHistory(): Promise<any[]> {
    return [];
  }
}

export const solanaService = new SolanaService();







