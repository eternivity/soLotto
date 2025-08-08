# 🐧 Ubuntu'da Anchor Projesi Kurulum Rehberi

## ❌ **Hata:** "Not in workspace"
Bu hata, Anchor projesinin doğru yapılandırılmadığı anlamına gelir.

## ✅ **Çözüm Adımları:**

### **1. Yeni Anchor Projesi Oluşturun:**
```bash
# Mevcut klasörden çıkın
cd ..

# Yeni Anchor projesi oluşturun
anchor init solotto-program
cd solotto-program
```

### **2. Anchor.toml Dosyasını Güncelleyin:**
```toml
[toolchain]
package_manager = "yarn"

[features]
resolution = true
skip-lint = false

[programs.devnet]
solotto_program = "YOUR_PROGRAM_ID_HERE"

[registry]
url = "https://api.apr.dev"

[provider]
cluster = "devnet"
wallet = "~/.config/solana/id.json"

[scripts]
```

### **3. Cargo.toml Dosyasını Güncelleyin:**
```toml
[package]
name = "solotto-program"
version = "0.1.0"
description = "Created with Anchor"
edition = "2021"

[lib]
crate-type = ["cdylib", "lib"]
name = "solotto_program"

[features]
no-entrypoint = []
no-idl = []
no-log-ix-name = []
cpi = ["no-entrypoint"]
default = []

[dependencies]
anchor-lang = "0.29.0"
```

### **4. Program Kodunu Ekleyin:**
`programs/solotto-program/src/lib.rs` dosyasına şu kodu ekleyin:

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

### **5. Build ve Deploy:**
```bash
# Build
anchor build

# Program ID al
solana address -k target/deploy/solotto_program-keypair.json

# Anchor.toml'de program ID'yi güncelle
# Sonra deploy et
anchor deploy
```

## 📁 **Klasör Yapısı:**
```
solotto-program/
├── Anchor.toml
├── Cargo.toml
├── programs/
│   └── solotto-program/
│       ├── Cargo.toml
│       └── src/
│           └── lib.rs
└── target/
```

## 🚀 **Hızlı Komutlar:**
```bash
# Yeni proje oluştur
cd ..
anchor init solotto-program
cd solotto-program

# Devnet'e geç
solana config set --url devnet

# Cüzdan oluştur
solana-keygen new

# SOL al
solana airdrop 2

# Build et
anchor build

# Program ID al
solana address -k target/deploy/solotto_program-keypair.json

# Deploy et
anchor deploy
```




