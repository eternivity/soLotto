# 🚀 Smart Contract Entegrasyonu Rehberi

## 📋 SİZİN YAPMANIZ GEREKENLER

### 1️⃣ **Program ID'nizi Güncelleyin**
```typescript
// src/constants/index.ts dosyasında
export const PROGRAM_ID = "YOUR_ACTUAL_PROGRAM_ID_HERE";
```

### 2️⃣ **Admin Cüzdan Adresinizi Güncelleyin**
```typescript
// src/constants/index.ts dosyasında
export const COMMISSION_WALLET = "YOUR_ADMIN_WALLET_ADDRESS";
```

### 3️⃣ **Anchor IDL Dosyanızı Ekleyin**
- `src/types/anchor.ts` dosyasını kendi program IDL'inize göre güncelleyin
- Program instruction'larınızı ekleyin
- Account structure'larınızı tanımlayın

### 4️⃣ **SolanaService'i Güncelleyin**
`src/services/solanaService.ts` dosyasında:

#### **Buy Ticket Instruction:**
```typescript
async buyTicket(buyerPublicKey: PublicKey, quantity: number, ticketPrice: number): Promise<string> {
  // TODO: Kendi program instruction'ınızı ekleyin
  const instruction = {
    programId: this.getProgramId(),
    keys: [
      { pubkey: buyerPublicKey, isSigner: true, isWritable: true },
      // Diğer gerekli account'ları ekleyin
    ],
    data: Buffer.from([/* instruction data */])
  };
}
```

#### **Claim Commission Instruction:**
```typescript
async claimCommission(adminPublicKey: PublicKey): Promise<string> {
  // TODO: Kendi program instruction'ınızı ekleyin
  const instruction = {
    programId: this.getProgramId(),
    keys: [
      { pubkey: adminPublicKey, isSigner: true, isWritable: true },
      // Diğer gerekli account'ları ekleyin
    ],
    data: Buffer.from([/* instruction data */])
  };
}
```

#### **Account Queries:**
```typescript
// Season data almak için
async getSeasonData(seasonId: number): Promise<any> {
  // TODO: PDA ile season account'ını bulun
  // TODO: Account data'sını deserialize edin
}

// User ticket'larını almak için
async getUserTickets(userPublicKey: PublicKey): Promise<any[]> {
  // TODO: User'ın tüm ticket account'larını bulun
}

// Winner history almak için
async getWinnersHistory(): Promise<any[]> {
  // TODO: Tüm completed season'ları bulun
}
```

### 5️⃣ **Bileşenleri Aktif Hale Getirin**
`src/components/BuyTicket.tsx` ve `src/components/CommissionClaim.tsx` dosyalarında:

```typescript
// TODO: Bu satırları aktif hale getirin
const transaction = await solanaService.buyTicket(publicKey, quantity, TICKET_PRICE_SOL);
const signature = await sendTransaction(transaction, connection);
await connection.confirmTransaction(signature);
```

## 🔧 Gerekli Kütüphaneler

Eğer Anchor kullanıyorsanız:
```bash
npm install @project-serum/anchor
```

## 📝 Örnek Anchor Program Yapısı

### **Program Instructions:**
```rust
// Buy ticket
pub fn buy_ticket(ctx: Context<BuyTicket>, quantity: u32) -> Result<()> {
    // Implementation
}

// Claim commission
pub fn claim_commission(ctx: Context<ClaimCommission>) -> Result<()> {
    // Implementation
}

// End season
pub fn end_season(ctx: Context<EndSeason>) -> Result<()> {
    // Implementation
}

// Select winner
pub fn select_winner(ctx: Context<SelectWinner>) -> Result<()> {
    // Implementation
}
```

### **Account Structures:**
```rust
#[account]
pub struct Season {
    pub season_id: u32,
    pub total_tickets_sold: u32,
    pub total_prize_pool: u64,
    pub is_active: bool,
    pub end_time: i64,
    pub winner: Option<Pubkey>,
    pub winner_ticket_id: Option<String>,
    pub admin: Pubkey,
}

#[account]
pub struct Ticket {
    pub ticket_id: String,
    pub season_id: u32,
    pub owner: Pubkey,
    pub purchase_time: i64,
    pub price: u64,
}

#[account]
pub struct Commission {
    pub total_revenue: u64,
    pub total_commission: u64,
    pub pending_commission: u64,
    pub claimed_commission: u64,
    pub last_claim_date: i64,
    pub admin: Pubkey,
}
```

## 🧪 Test Etme

### **1. Devnet Testleri:**
```bash
# Solana CLI ile test
solana config set --url devnet
solana airdrop 2 YOUR_WALLET_ADDRESS
```

### **2. Program Testleri:**
```bash
# Anchor test
anchor test
```

### **3. Frontend Testleri:**
```bash
npm start
# http://localhost:3000 adresinde test edin
```

## ⚠️ Önemli Notlar

1. **Program ID**: Doğru program ID'yi kullandığınızdan emin olun
2. **Account Validation**: Tüm account'ların doğru validate edildiğinden emin olun
3. **Error Handling**: Hata durumlarını düzgün handle edin
4. **Transaction Confirmation**: Transaction'ların confirm edildiğinden emin olun
5. **Security**: Admin wallet'ın güvenliğini sağlayın

## 🆘 Yardım

Eğer sorun yaşarsanız:
1. Solana Explorer'da transaction'ları kontrol edin
2. Console'da hata mesajlarını kontrol edin
3. Program log'larını kontrol edin
4. Anchor program'ınızı test edin

## 📞 İletişim

Sorularınız için GitHub issue açabilirsiniz.







