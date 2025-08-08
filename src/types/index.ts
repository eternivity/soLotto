export interface Season {
  id: number;
  totalTickets: number;
  soldTickets: number;
  prizePool: number;
  endTime: Date;
  isActive: boolean;
  status: 'active' | 'ended' | 'drawing' | 'completed';
  winner?: string;
  winnerTicketId?: string;
}

export interface Winner {
  seasonId: number;
  walletAddress: string;
  prizeAmount: number;
  timestamp: Date;
  ticketId: string;
}

export interface Ticket {
  id: string;
  seasonId: number;
  walletAddress: string;
  purchaseTime: Date;
  ticketNumber: string;
}

export interface SeasonStatus {
  currentSeason: number;
  totalTicketsSold: number;
  totalPrizePool: number;
  timeRemaining: {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  };
  isActive: boolean;
  status: 'active' | 'ended' | 'drawing' | 'completed';
  winner?: string;
  winnerTicketId?: string;
}

export interface UserTickets {
  walletAddress: string;
  tickets: Ticket[];
  totalTickets: number;
  totalSpent: number;
}
