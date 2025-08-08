# 🐧 Ubuntu Terminal ile Solana Program Deploy Rehberi

## 📋 **Gerekli Kurulumlar:**

### **1. Rust Kurulumu:**
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
source ~/.cargo/env
rustup component add rust-src
```

### **2. Solana CLI Kurulumu:**
```bash
sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"
export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
```

### **3. Anchor Kurulumu:**
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### **4. Node.js Kurulumu:**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install node
nvm use node
```

## 🎯 **Program Deploy Adımları:**

### **1. Proje Klasörüne Geçin:**
```bash
cd ~/Desktop/solotto-program
```

### **2. Devnet'e Geçin:**
```bash
solana config set --url devnet
```

### **3. Cüzdan Oluşturun (Eğer yoksa):**
```bash
solana-keygen new
```

### **4. Devnet SOL Alın:**
```bash
solana airdrop 2
```

### **5. Programı Build Edin:**
```bash
anchor build
```

### **6. Program ID'yi Alın:**
```bash
solana address -k target/deploy/solotto_program-keypair.json
```

### **7. Anchor.toml Dosyasını Güncelleyin:**
```toml
[programs.devnet]
solotto_program = "YOUR_PROGRAM_ID_HERE"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"
```

### **8. Programı Deploy Edin:**
```bash
anchor deploy
```

## 🔧 **Smart Contract Kodları:**

### **Basit Piyango Programı (lib.rs):**
```rust
use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_HERE");

#[program]
pub mod solotto_program {
    use super::*;

    // Bilet satın alma
    pub fn buy_ticket(ctx: Context<BuyTicket>, quantity: u32) -> Result<()> {
        let ticket_price = 100_000_000; // 0.1 SOL in lamports
        let total_cost = ticket_price * quantity as u64;
        
        // SOL transfer
        let transfer_instruction = anchor_lang::solana_program::system_instruction::transfer(
            &ctx.accounts.buyer.key(),
            &ctx.accounts.treasury.key(),
            total_cost,
        );
        
        anchor_lang::solana_program::program::invoke(
            &transfer_instruction,
            &[
                ctx.accounts.buyer.to_account_info(),
                ctx.accounts.treasury.to_account_info(),
            ],
        )?;
        
        msg!("Bought {} tickets for {} SOL", quantity, total_cost as f64 / 1_000_000_000.0);
        Ok(())
    }

    // Komisyon çekme (sadece admin)
    pub fn claim_commission(ctx: Context<ClaimCommission>) -> Result<()> {
        require!(ctx.accounts.admin.key() == ctx.accounts.treasury.key(), ErrorCode::NotAdmin);
        
        let balance = ctx.accounts.treasury.lamports();
        let commission = balance * 10 / 100; // %10 komisyon
        
        // Komisyon transfer
        **ctx.accounts.treasury.try_borrow_mut_lamports()? -= commission;
        **ctx.accounts.admin.try_borrow_mut_lamports()? += commission;
        
        msg!("Claimed {} SOL commission", commission as f64 / 1_000_000_000.0);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,
    
    /// CHECK: Treasury account
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ClaimCommission<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    /// CHECK: Treasury account
    #[account(mut)]
    pub treasury: AccountInfo<'info>,
    
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Only admin can claim commission")]
    NotAdmin,
}
```

## 🔗 **Frontend Entegrasyonu:**

### **1. Program ID'yi Güncelleyin:**
```typescript
// src/constants/index.ts
export const PROGRAM_ID = "YOUR_ACTUAL_PROGRAM_ID";
```

### **2. SolanaService'i Güncelleyin:**
```typescript
// src/services/solanaService.ts
async buyTicket(buyerPublicKey: PublicKey, quantity: number, ticketPrice: number): Promise<Transaction> {
  const instruction = new TransactionInstruction({
    programId: this.getProgramId(),
    keys: [
      { pubkey: buyerPublicKey, isSigner: true, isWritable: true },
      { pubkey: treasuryPublicKey, isSigner: false, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: Buffer.from([0, ...new BN(quantity).toArray('le', 4)]) // 0 = buy_ticket instruction
  });
  
  const transaction = new Transaction().add(instruction);
  return transaction;
}
```

## 🧪 **Test Etme:**

### **1. Program Testleri:**
```bash
anchor test
```

### **2. Frontend Testleri:**
```bash
cd ../solotto
npm start
```

### **3. Devnet Testleri:**
```bash
# Solana Explorer'da transaction'ları kontrol edin
# https://explorer.solana.com/?cluster=devnet
```

## ⚠️ **Önemli Notlar:**

1. **Program ID**: Deploy sonrası alınan program ID'yi frontend'e ekleyin
2. **Treasury Account**: Komisyon toplanacak account'ı belirleyin
3. **Admin Wallet**: Komisyon çekme yetkisi olan cüzdanı belirleyin
4. **Error Handling**: Hata durumlarını düzgün handle edin

## 🆘 **Yardım:**

Eğer sorun yaşarsanız:
1. `anchor --version` ile Anchor'ın yüklü olduğunu kontrol edin
2. `solana --version` ile Solana CLI'nin yüklü olduğunu kontrol edin
3. `rustc --version` ile Rust'un yüklü olduğunu kontrol edin
4. Log'ları kontrol edin: `anchor deploy --provider.cluster devnet --verbose`

## 📞 **İletişim:**

Sorularınız için GitHub issue açabilirsiniz.






