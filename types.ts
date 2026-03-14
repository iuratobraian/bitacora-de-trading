
export enum TradeType {
    BUY = 'BUY',
    SELL = 'SELL',
    BALANCE = 'BALANCE'
  }
  
  export enum TradeStatus {
    WIN = 'WIN',
    LOSS = 'LOSS',
    BREAKEVEN = 'BREAKEVEN',
    OPEN = 'OPEN',
    RUN = 'RUN',        
    IDEA = 'IDEA',      
    SKIPPED = 'SKIPPED',
    DEPOSIT = 'DEPOSIT',
    WITHDRAWAL = 'WITHDRAWAL'
  }
  
  export enum Session {
    ASIA = 'ASIA',
    LONDON = 'LONDON',
    NEW_YORK = 'NEW_YORK',
    NONE = 'NONE'
  }
  
  export interface Trade {
    id: string;
    date: string;
    asset: string;
    type: TradeType;
    session: Session;
    timeframe: string;
    entryPrice: number;
    exitPrice?: number;
    lotSize?: number;
    riskValue: number; 
    rr: number;        
    riskPercent?: number;
    outcome: TradeStatus;
    pnl: number; 
    commission?: number;
    notes: string;
    description?: string;
    mistake?: string; 
    imageUrl?: string;
    aiAnalysis?: string;
    tradingViewUrl?: string; 
  }

  export interface Account {
    id: string;
    name: string; 
    startingBalance: number;
    currency: string;
    createdAt: string;
  }

  export interface UserProfile {
    id: string;
    name: string; 
    pin?: string; 
    role?: 'ADMIN' | 'USER'; 
    createdAt: string;
    avatar?: string; 
    lastActive?: string; 
    aiXP?: number; // Experiencia acumulada con la Mente Maestra
  }

  export type ImageSize = '1K' | '2K' | '4K';
  
  export type LayoutMode = 'SIDEBAR' | 'TOPBAR';