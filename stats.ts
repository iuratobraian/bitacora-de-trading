import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://tgsojwhkknwynnokzini.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRnc29qd2hra253eW5ub2t6aW5pIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg4ODgwMDksImV4cCI6MjA4NDQ2NDAwOX0.qw1504Eeiic71bt0DsWH7jSEhzgrGzmXQI_hWHHKoyg';

interface Trade {
  id: string;
  user_id: string;
  account_id: string;
  symbol: string;
  type: string;
  price: number;
  profit: number;
  commission?: number;
  outcome?: string;
  timestamp: string;
}

interface UserStats {
  userId: string;
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  totalPnl: number;
  winRate: string;
  bestTrade: number;
  worstTrade: number;
  avgWin: number;
  avgLoss: number;
  profitFactor: string;
  bestAsset: string;
  lastTradeDate: string | null;
}

async function calculateStats(userId: string): Promise<UserStats> {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  
  const { data: trades, error } = await supabase
    .from('app_trades')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error || !trades || trades.length === 0) {
    return {
      userId,
      totalTrades: 0,
      wins: 0,
      losses: 0,
      breakeven: 0,
      totalPnl: 0,
      winRate: '0.0',
      bestTrade: 0,
      worstTrade: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: '0.00',
      bestAsset: '-',
      lastTradeDate: null
    };
  }

  const tradingTrades = trades.filter((t: Trade) => 
    t.profit !== undefined && t.profit !== null
  );

  const wins = tradingTrades.filter((t: Trade) => t.profit > 0);
  const losses = tradingTrades.filter((t: Trade) => t.profit < 0);
  const breakeven = tradingTrades.filter((t: Trade) => t.profit === 0);

  const winsPnl = wins.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0);
  const lossesPnl = Math.abs(losses.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0));

  const profitFactor = lossesPnl > 0 
    ? (winsPnl / lossesPnl).toFixed(2)
    : winsPnl > 0 ? '∞' : '0.00';

  const assetStats: Record<string, { count: number; pnl: number }> = {};
  tradingTrades.forEach((t: Trade) => {
    if (!assetStats[t.symbol]) {
      assetStats[t.symbol] = { count: 0, pnl: 0 };
    }
    assetStats[t.symbol].count++;
    assetStats[t.symbol].pnl += t.profit || 0;
  });

  const bestAsset = Object.entries(assetStats)
    .sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] || '-';

  const pnls = tradingTrades.map((t: Trade) => t.profit || 0);

  return {
    userId,
    totalTrades: tradingTrades.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: breakeven.length,
    totalPnl: tradingTrades.reduce((sum: number, t: Trade) => sum + (t.profit || 0), 0),
    winRate: tradingTrades.length > 0 
      ? ((wins.length / tradingTrades.length) * 100).toFixed(1)
      : '0.0',
    bestTrade: Math.max(...pnls, 0),
    worstTrade: Math.min(...pnls, 0),
    avgWin: wins.length > 0 ? winsPnl / wins.length : 0,
    avgLoss: losses.length > 0 ? lossesPnl / losses.length : 0,
    profitFactor,
    bestAsset,
    lastTradeDate: trades[0]?.timestamp || null
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'userId is required' });
  }

  try {
    const stats = await calculateStats(userId);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('Error calculating stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
