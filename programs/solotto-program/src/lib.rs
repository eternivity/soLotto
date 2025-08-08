use anchor_lang::prelude::*;

declare_id!("SoLoTto1111111111111111111111111111111111111");

#[program]
pub mod solotto_program {
    use super::*;

    pub fn start_season(ctx: Context<StartSeason>, season_id: u32, end_time: i64) -> Result<()> {
        let season = &mut ctx.accounts.season;
        season.season_id = season_id;
        season.total_tickets_sold = 0;
        season.total_revenue_lamports = 0;
        season.is_active = true;
        season.end_time = end_time;
        season.admin = ctx.accounts.admin.key();
        season.bump = *ctx.bumps.get("season").unwrap();
        Ok(())
    }

    pub fn buy_ticket(
        ctx: Context<BuyTicket>,
        season_id: u32,
        quantity: u32,
        amount_lamports: u64,
    ) -> Result<()> {
        let season = &mut ctx.accounts.season;
        require!(season.is_active, SolottoError::SeasonNotActive);
        require!(season.season_id == season_id, SolottoError::InvalidSeason);
        require!(quantity > 0, SolottoError::InvalidQuantity);
        // Basit doğrulama: gelen miktarı topla (transfer aynı tx içinde yapılmalı)
        season.total_tickets_sold = season
            .total_tickets_sold
            .checked_add(quantity)
            .ok_or(SolottoError::Overflow)?;
        season.total_revenue_lamports = season
            .total_revenue_lamports
            .checked_add(amount_lamports)
            .ok_or(SolottoError::Overflow)?;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(season_id: u32)]
pub struct StartSeason<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    /// Treasury cüzdanı (komisyon/prize fonlarının biriktiği)
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        init,
        payer = admin,
        space = 8 + Season::LEN,
        seeds = [b"season", &season_id.to_le_bytes()],
        bump
    )]
    pub season: Account<'info, Season>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(season_id: u32, quantity: u32, amount_lamports: u64)]
pub struct BuyTicket<'info> {
    #[account(mut)]
    pub buyer: Signer<'info>,

    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(
        mut,
        seeds = [b"season", &season_id.to_le_bytes()],
        bump = season.bump
    )]
    pub season: Account<'info, Season>,

    pub system_program: Program<'info, System>,
}

#[account]
pub struct Season {
    pub season_id: u32,
    pub total_tickets_sold: u32,
    pub total_revenue_lamports: u64,
    pub is_active: bool,
    pub end_time: i64,
    pub admin: Pubkey,
    pub bump: u8,
}

impl Season {
    pub const LEN: usize = 4  // season_id
        + 4                   // total_tickets_sold
        + 8                   // total_revenue_lamports
        + 1                   // is_active
        + 8                   // end_time
        + 32                  // admin
        + 1;                  // bump
}

#[error_code]
pub enum SolottoError {
    #[msg("Season is not active")] 
    SeasonNotActive,
    #[msg("Invalid season")]
    InvalidSeason,
    #[msg("Invalid quantity")]
    InvalidQuantity,
    #[msg("Overflow")] 
    Overflow,
}