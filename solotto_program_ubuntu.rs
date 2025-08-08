use anchor_lang::prelude::*;

declare_id!("YOUR_PROGRAM_ID_HERE"); // Deploy sonrası güncellenecek

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

    // Sezon başlatma (sadece admin)
    pub fn start_season(ctx: Context<StartSeason>, season_id: u32) -> Result<()> {
        require!(ctx.accounts.admin.key() == ctx.accounts.treasury.key(), ErrorCode::NotAdmin);
        
        let season = &mut ctx.accounts.season;
        season.season_id = season_id;
        season.total_tickets_sold = 0;
        season.total_prize_pool = 0;
        season.is_active = true;
        season.end_time = Clock::get()?.unix_timestamp + 7 * 24 * 60 * 60; // 7 gün
        season.winner = None;
        season.winner_ticket_id = None;
        season.admin = ctx.accounts.admin.key();
        
        msg!("Started season {}", season_id);
        Ok(())
    }

    // Sezon bitirme (sadece admin)
    pub fn end_season(ctx: Context<EndSeason>) -> Result<()> {
        require!(ctx.accounts.admin.key() == ctx.accounts.season.admin, ErrorCode::NotAdmin);
        require!(ctx.accounts.season.is_active, ErrorCode::SeasonNotActive);
        
        let season = &mut ctx.accounts.season;
        season.is_active = false;
        season.end_time = Clock::get()?.unix_timestamp;
        
        msg!("Ended season {}", season.season_id);
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

#[derive(Accounts)]
#[instruction(season_id: u32)]
pub struct StartSeason<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(
        init,
        payer = admin,
        space = 8 + Season::LEN,
        seeds = [b"season", season_id.to_le_bytes().as_ref()],
        bump
    )]
    pub season: Account<'info, Season>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct EndSeason<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    
    #[account(mut)]
    pub season: Account<'info, Season>,
}

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

impl Season {
    pub const LEN: usize = 4 + 4 + 8 + 1 + 8 + 32 + 32 + 32; // Tüm alanların boyutu
}

#[error_code]
pub enum ErrorCode {
    #[msg("Only admin can perform this action")]
    NotAdmin,
    #[msg("Season is not active")]
    SeasonNotActive,
    #[msg("Season already ended")]
    SeasonAlreadyEnded,
    #[msg("Invalid ticket price")]
    InvalidTicketPrice,
    #[msg("No tickets sold")]
    NoTicketsSold,
    #[msg("Winner already selected")]
    WinnerAlreadySelected,
    #[msg("Commission already claimed")]
    CommissionAlreadyClaimed,
}






