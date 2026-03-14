
import React from 'react';
import { Crosshair, DollarSign, Percent, Target, AlertTriangle } from 'lucide-react';

interface RiskCalculatorProps {
    initialBalance?: number;
    compact?: boolean;
}

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({ initialBalance = 0, compact = false }) => {
  const [riskCalc, setRiskCalc] = React.useState({
    balance: initialBalance,
    asset: 'FOREX',
    riskPercent: 1,
    stopLoss: 10,
    dailyDDLimit: 5,
    profitTarget: 10
  });

  React.useEffect(() => {
    if (initialBalance > 0) {
        setRiskCalc(prev => ({ ...prev, balance: initialBalance }));
    }
  }, [initialBalance]);

  const calculateLots = () => {
      if (!riskCalc.stopLoss || riskCalc.stopLoss <= 0) return '0.00';
      const riskUSD = riskCalc.balance * (riskCalc.riskPercent / 100);
      let pipValueMultiplier = 10; 
      if (riskCalc.asset === 'XAUUSD') pipValueMultiplier = 1; 
      if (riskCalc.asset === 'INDICES') pipValueMultiplier = 1; 
      if (riskCalc.asset === 'CRYPTO') pipValueMultiplier = 1; 
      
      const lots = riskUSD / (riskCalc.stopLoss * pipValueMultiplier);
      return isNaN(lots) || !isFinite(lots) ? '0.00' : lots.toFixed(2);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className={`bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden ${compact ? 'p-4' : ''}`}>
      <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
          <Crosshair size={14} className="text-white" /> Calculadora de Riesgo Avanzada
      </h3>
      <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Activo</label>
                  <select 
                      value={riskCalc.asset} 
                      onChange={(e) => setRiskCalc({...riskCalc, asset: e.target.value})}
                      className="w-full bg-background/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/30"
                  >
                      <option value="FOREX">Forex (EURUSD, GBPUSD)</option>
                      <option value="XAUUSD">Oro (XAUUSD)</option>
                      <option value="INDICES">Índices (US30, NAS100)</option>
                      <option value="CRYPTO">Crypto (BTCUSD)</option>
                  </select>
              </div>
              <div>
                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Balance Cuenta</label>
                  <input 
                      type="number" 
                      value={riskCalc.balance} 
                      onChange={(e) => setRiskCalc({...riskCalc, balance: Number(e.target.value)})}
                      className="w-full bg-background/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/30"
                  />
              </div>
              <div>
                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Riesgo %</label>
                  <input 
                      type="number" 
                      value={riskCalc.riskPercent} 
                      onChange={(e) => setRiskCalc({...riskCalc, riskPercent: Number(e.target.value)})}
                      className="w-full bg-background/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/30"
                  />
              </div>
              <div>
                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Stop Loss (Pips/Pts)</label>
                  <input 
                      type="number" 
                      value={riskCalc.stopLoss} 
                      onChange={(e) => setRiskCalc({...riskCalc, stopLoss: Number(e.target.value)})}
                      className="w-full bg-background/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/30"
                  />
              </div>
              <div>
                  <label className="text-[9px] text-gray-500 font-bold uppercase block mb-1">Objetivo Ganancia %</label>
                  <input 
                      type="number" 
                      value={riskCalc.profitTarget} 
                      onChange={(e) => setRiskCalc({...riskCalc, profitTarget: Number(e.target.value)})}
                      className="w-full bg-background/40 border border-white/5 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-primary/30"
                  />
              </div>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex justify-between items-center">
              <div>
                  <p className="text-[9px] text-primary font-black uppercase tracking-widest">Lotes Sugeridos</p>
                  <p className="text-2xl font-black font-mono text-white">
                      {calculateLots()}
                  </p>
              </div>
              <div className="text-right">
                  <p className="text-[9px] text-gray-500 font-bold uppercase">Riesgo USD</p>
                  <p className="text-sm font-mono font-bold text-primary">
                      {formatCurrency(riskCalc.balance * (riskCalc.riskPercent / 100))}
                  </p>
              </div>
          </div>
      </div>
    </div>
  );
};
