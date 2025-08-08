#[derive(Accounts)]
#[instruction(season_id: u32)]
pub struct StartSeason<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,

    #[account(mut)]
    pub treasury: AccountInfo<'info>,

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