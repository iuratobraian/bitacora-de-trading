
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, ArrowLeft, Calculator, Lightbulb, Ban, PlayCircle, Zap, Trash2, Link as LinkIcon, X, FileText, TrendingUp, TrendingDown, Clock, MousePointerClick, Percent, DollarSign, ChevronDown, ChevronUp, Settings2, AlertCircle, ShieldAlert, Wallet, ArrowRightLeft } from 'lucide-react';
import { storageService } from '../services/storageService';
import { TradeStatus, TradeType, Session } from '../types';

const ASSETS = [
  { value: 'BTCUSD', label: 'BTC' },
  { value: 'EURUSD', label: 'EUR' },
  { value: 'GBPUSD', label: 'GBP' },
  { value: 'XAUUSD', label: 'ORO' },
  { value: 'US100', label: 'NAS' },
  { value: 'US30', label: 'DOW' },
];

const TIMEFRAMES = ['M1', 'M5', 'M15', 'H1', 'H4', 'D1'];

interface TradeEntryProps {
    onClose?: () => void;
    onSuccess?: () => void;
    initialId?: string;
}

const TradeEntry: React.FC<TradeEntryProps> = ({ onClose, onSuccess, initialId }) => {
  const navigate = useNavigate();
  const { id: paramId } = useParams(); 
  const id = initialId || paramId;

  // MODES: TRADING vs BALANCE
  const [entryMode, setEntryMode] = React.useState<'TRADING' | 'BALANCE'>('TRADING');

  // Common States
  const [isIdea, setIsIdea] = React.useState(false);
  const [notes, setNotes] = React.useState('');
  
  // Trading Mode States
  const [showAdvanced, setShowAdvanced] = React.useState(false);
  const [asset, setAsset] = React.useState(ASSETS[0].value);
  const [type, setType] = React.useState<TradeType>(TradeType.BUY);
  const [session] = React.useState<Session>(Session.NEW_YORK); 
  const [entryPrice, setEntryPrice] = React.useState('');
  const [timeframe, setTimeframe] = React.useState('H1');
  const [outcome, setOutcome] = React.useState<TradeStatus>(TradeStatus.WIN);
  const [riskValue, setRiskValue] = React.useState(''); 
  const [riskMode, setRiskMode] = React.useState<'USD' | 'PERCENT'>('USD');
  const [pnl, setPnl] = React.useState('');
  const [commission, setCommission] = React.useState('');             
  const [rr, setRr] = React.useState<number>(0);        
  const [tradingViewUrl, setTradingViewUrl] = React.useState(''); 
  const [skipReason, setSkipReason] = React.useState(''); 

  // Balance Mode States
  const [balanceOpType, setBalanceOpType] = React.useState<'DEPOSIT' | 'WITHDRAWAL'>('WITHDRAWAL');
  const [balanceAmount, setBalanceAmount] = React.useState('');

  // Context Data
  const [accountBalance, setAccountBalance] = React.useState(0);
  const [rrSuggestion, setRrSuggestion] = React.useState({ streak: 0, suggestion: 2.0 });
  const [lossStatus, setLossStatus] = React.useState({ isLimitReached: false, currentLoss: 0, limit: 0 });

  React.useEffect(() => {
    const acc = storageService.getActiveAccount();
    if (acc) setAccountBalance(acc.startingBalance);

    const analysis = storageService.getStreakAnalysis();
    setRrSuggestion(analysis);

    const status = storageService.getDailyLossLimitStatus();
    setLossStatus(status);

    if (id) {
        const trade = storageService.getTradeById(id);
        if (trade) {
            setNotes(trade.notes);
            
            if (trade.type === TradeType.BALANCE) {
                setEntryMode('BALANCE');
                setBalanceOpType(trade.pnl >= 0 ? 'DEPOSIT' : 'WITHDRAWAL');
                setBalanceAmount(Math.abs(trade.pnl).toString());
            } else {
                setEntryMode('TRADING');
                setAsset(trade.asset);
                setType(trade.type);
                setEntryPrice(trade.entryPrice ? trade.entryPrice.toString() : '');
                setTimeframe(trade.timeframe);
                setRiskValue(trade.riskValue.toString());
                setRiskMode('USD'); 
                setOutcome(trade.outcome === TradeStatus.IDEA ? TradeStatus.WIN : trade.outcome);
                setPnl(trade.pnl !== 0 ? Math.abs(trade.pnl).toString() : '');
                setCommission(trade.commission ? Math.abs(trade.commission).toString() : '');
                if (trade.tradingViewUrl) setTradingViewUrl(trade.tradingViewUrl);
                setIsIdea(trade.outcome === TradeStatus.IDEA);
                if (trade.entryPrice || trade.notes || trade.tradingViewUrl || trade.commission) setShowAdvanced(true);
            }
        }
    }
  }, [id]);

  React.useEffect(() => {
    if (entryMode === 'TRADING') {
        let actualRisk = parseFloat(riskValue);
        if (riskMode === 'PERCENT' && !isNaN(actualRisk)) {
            actualRisk = (accountBalance * actualRisk) / 100;
        }
        let p = parseFloat(pnl);
        if (outcome === TradeStatus.LOSS && p > 0) p = -p;
        if (!isNaN(actualRisk) && !isNaN(p) && actualRisk !== 0) {
          setRr(parseFloat((p / actualRisk).toFixed(2)));
        } else {
          setRr(0);
        }
    }
  }, [riskValue, riskMode, pnl, outcome, accountBalance, entryMode]);

  const handleClose = () => onClose ? onClose() : navigate(-1);

  const handleDelete = () => {
    if (confirm("¿Eliminar este registro permanentemente?")) {
        storageService.deleteTrade(id!);
        if (onSuccess) onSuccess();
        handleClose();
    }
  };

  const handleSave = () => {
    // Logic for TRADING
    if (entryMode === 'TRADING') {
        if (lossStatus.isLimitReached && !id) {
            alert("¡BLOQUEO DE RIESGO! Límite de pérdida diaria alcanzado.");
            return;
        }

        let finalOutcome = isIdea ? TradeStatus.IDEA : outcome;
        let finalRiskUSD = Number(riskValue);
        if (riskMode === 'PERCENT') finalRiskUSD = (accountBalance * finalRiskUSD) / 100;

        let finalPnl = Math.abs(Number(pnl));
        if (finalOutcome === TradeStatus.LOSS) finalPnl = -finalPnl;
        else if ([TradeStatus.IDEA, TradeStatus.SKIPPED, TradeStatus.RUN].includes(finalOutcome)) {
            if (finalOutcome === TradeStatus.RUN && pnl === '') finalPnl = 0;
        }

        let finalNotes = notes;
        if (finalOutcome === TradeStatus.SKIPPED && skipReason) {
            finalNotes = `[NO TOMADA]: ${skipReason}\n\n${notes}`;
        }

        storageService.saveTrade({
          id, 
          date: new Date().toISOString(),
          asset: asset.toUpperCase(),
          type,
          session,
          timeframe,
          entryPrice: entryPrice ? Number(entryPrice) : 0,
          riskValue: finalRiskUSD, 
          rr: (finalOutcome === TradeStatus.IDEA || finalOutcome === TradeStatus.SKIPPED) ? 0 : rr,                       
          outcome: finalOutcome,
          pnl: finalPnl, 
          commission: commission ? Number(commission) : 0,
          notes: finalNotes,
          tradingViewUrl: tradingViewUrl || undefined
        });
    } 
    // Logic for BALANCE
    else {
        if (!balanceAmount) return;
        const amount = Math.abs(Number(balanceAmount));
        const finalPnl = balanceOpType === 'DEPOSIT' ? amount : -amount;
        
        storageService.saveTrade({
            id,
            date: new Date().toISOString(),
            asset: 'BALANCE',
            type: TradeType.BALANCE,
            session: Session.NONE,
            timeframe: 'NA',
            entryPrice: 0,
            riskValue: 0,
            rr: 0,
            outcome: balanceOpType === 'DEPOSIT' ? TradeStatus.DEPOSIT : TradeStatus.WITHDRAWAL,
            pnl: finalPnl,
            commission: 0,
            notes: notes || (balanceOpType === 'DEPOSIT' ? 'Depósito Manual' : 'Retiro Manual')
        });
    }

    if (onSuccess) onSuccess();
    handleClose();
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-start p-4 md:p-8 animate-in fade-in duration-500">
      <div className="w-full max-w-xl bg-surface border border-border rounded-[2.5rem] shadow-2xl overflow-hidden relative">
        
        {/* Daily Loss Warning */}
        {lossStatus.isLimitReached && !id && entryMode === 'TRADING' && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-10 text-center animate-in fade-in duration-500">
                <ShieldAlert size={64} className="text-loss mb-6 animate-pulse" />
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">Límite Alcanzado</h2>
                <p className="text-gray-400 font-bold uppercase text-[10px] tracking-[0.2em] mb-8 leading-relaxed">
                    Has alcanzado el <span className="text-loss">1% de pérdida diaria</span>. El sistema ha bloqueado nuevas operaciones de trading.
                </p>
                <button onClick={handleClose} className="px-10 py-4 bg-white text-black font-black rounded-xl uppercase tracking-widest text-[10px] active:scale-95 transition-all">Volver</button>
            </div>
        )}

        {/* Header with Mode Switch */}
        <div className="p-6 border-b border-border flex justify-between items-center bg-background/30">
            <div className="flex items-center gap-3">
                <button onClick={handleClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setEntryMode('TRADING')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${entryMode === 'TRADING' ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-gray-500 hover:text-white'}`}
                    >
                        <TrendingUp size={12} /> Trading
                    </button>
                    <button 
                        onClick={() => setEntryMode('BALANCE')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition-all flex items-center gap-2 ${entryMode === 'BALANCE' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ArrowRightLeft size={12} /> Balance
                    </button>
                </div>
            </div>
            {entryMode === 'TRADING' && (
                <div className="flex bg-background/50 p-1 rounded-xl border border-border">
                    <button onClick={() => setIsIdea(false)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${!isIdea ? 'bg-primary text-black' : 'text-gray-500'}`}>Real</button>
                    <button onClick={() => setIsIdea(true)} className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${isIdea ? 'bg-yellow-500 text-black' : 'text-gray-500'}`}>Idea</button>
                </div>
            )}
        </div>

        <div className="p-8 space-y-6">
            
            {/* ---- TRADING FORM ---- */}
            {entryMode === 'TRADING' && (
                <>
                    {/* RR Suggestion Box */}
                    {!id && (
                        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-center justify-between animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <Zap size={18} className="text-primary" />
                                <div>
                                    <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">Guía de Riesgo</p>
                                    <p className="text-[10px] text-white font-bold">
                                        {rrSuggestion.streak > 0 
                                            ? `Racha de ${rrSuggestion.streak} victorias. Maximiza.` 
                                            : rrSuggestion.streak < 0 
                                            ? `Racha de ${Math.abs(rrSuggestion.streak)} derrotas. Conserva.` 
                                            : 'Busca setups de alta calidad.'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-[8px] text-gray-500 font-black uppercase">TP Sugerido</p>
                                <p className="text-lg font-black text-primary font-mono">{rrSuggestion.suggestion}R</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                        {ASSETS.map((a) => (
                            <button key={a.value} onClick={() => setAsset(a.value)} className={`py-3 rounded-2xl text-[10px] font-black border transition-all ${asset === a.value ? 'bg-white text-black border-white' : 'bg-background/40 border-border text-gray-500 hover:border-gray-600'}`}>
                                {a.label}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex gap-2 p-1 bg-background/40 border border-border rounded-2xl">
                            <button onClick={() => setType(TradeType.BUY)} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${type === TradeType.BUY ? 'bg-primary/20 text-primary border border-primary/30' : 'text-gray-600'}`}>
                                <TrendingUp size={16} /> <span className="text-[10px] font-black uppercase">Compra</span>
                            </button>
                            <button onClick={() => setType(TradeType.SELL)} className={`flex-1 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${type === TradeType.SELL ? 'bg-loss/20 text-loss border border-loss/30' : 'text-gray-600'}`}>
                                <TrendingDown size={16} /> <span className="text-[10px] font-black uppercase">Venta</span>
                            </button>
                        </div>

                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <div className="flex bg-surface rounded-lg border border-border overflow-hidden scale-75">
                                    <button onClick={() => setRiskMode('USD')} className={`px-2 py-1 text-[10px] font-black ${riskMode === 'USD' ? 'bg-primary text-black' : 'text-gray-500'}`}>$</button>
                                    <button onClick={() => setRiskMode('PERCENT')} className={`px-2 py-1 text-[10px] font-black ${riskMode === 'PERCENT' ? 'bg-primary text-black' : 'text-gray-500'}`}>%</button>
                                </div>
                            </div>
                            <input 
                                type="number" 
                                value={riskValue} 
                                onChange={(e) => setRiskValue(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-background/40 border border-border rounded-2xl py-4 pl-24 pr-4 text-center text-white font-mono font-black focus:outline-none focus:border-primary/50 transition-all"
                            />
                            <label className="absolute -top-2 left-6 px-2 bg-surface text-[8px] font-black text-gray-500 uppercase tracking-widest">Riesgo</label>
                        </div>
                    </div>

                    {!isIdea && (
                        <div className="space-y-4 animate-in slide-in-from-top-2">
                            <div className="grid grid-cols-4 gap-2">
                                {[TradeStatus.WIN, TradeStatus.LOSS, TradeStatus.BREAKEVEN, TradeStatus.RUN].map(s => (
                                    <button key={s} onClick={() => setOutcome(s)} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${outcome === s ? 'bg-white/10 border-white text-white' : 'bg-background/20 border-border text-gray-600'}`}>
                                        {s === TradeStatus.WIN ? 'TP' : s === TradeStatus.LOSS ? 'SL' : s === TradeStatus.BREAKEVEN ? 'BE' : 'RUN'}
                                    </button>
                                ))}
                            </div>
                            
                            {outcome !== TradeStatus.RUN && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="relative">
                                        <input 
                                            type="number" 
                                            value={pnl} 
                                            onChange={(e) => setPnl(e.target.value)}
                                            placeholder="0.00"
                                            className={`w-full bg-background/40 border border-border rounded-2xl py-4 text-center font-mono font-black focus:outline-none transition-all ${outcome === TradeStatus.WIN ? 'text-primary' : 'text-loss'}`}
                                        />
                                        <label className="absolute -top-2 left-6 px-2 bg-surface text-[8px] font-black text-gray-500 uppercase tracking-widest">PnL Neto</label>
                                    </div>
                                    <div className="bg-background/20 border border-border/50 rounded-2xl flex items-center justify-between px-6">
                                        <span className="text-[9px] font-black text-gray-500 uppercase">Ratio</span>
                                        <span className="font-mono font-black text-primary">{rr}R</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </>
            )}

            {/* ---- BALANCE FORM ---- */}
            {entryMode === 'BALANCE' && (
                <div className="space-y-6 animate-in slide-in-from-right-4">
                     <div className="bg-surface/50 border border-border p-6 rounded-2xl text-center">
                        <Wallet size={48} className="mx-auto text-gray-500 mb-4" />
                        <h3 className="text-white font-black uppercase">Gestión de Fondos Manual</h3>
                        <p className="text-gray-500 text-xs mt-2">Registra movimientos de capital que no provienen de trading (ajustes de prop firm, retiros, depósitos).</p>
                     </div>

                     <div className="flex gap-4">
                        <button 
                            onClick={() => setBalanceOpType('WITHDRAWAL')}
                            className={`flex-1 py-6 rounded-2xl border flex flex-col items-center gap-2 transition-all ${balanceOpType === 'WITHDRAWAL' ? 'bg-loss/10 border-loss text-loss' : 'bg-background/40 border-border text-gray-500'}`}
                        >
                            <TrendingDown size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Retiro</span>
                        </button>
                        <button 
                            onClick={() => setBalanceOpType('DEPOSIT')}
                            className={`flex-1 py-6 rounded-2xl border flex flex-col items-center gap-2 transition-all ${balanceOpType === 'DEPOSIT' ? 'bg-primary/10 border-primary text-primary' : 'bg-background/40 border-border text-gray-500'}`}
                        >
                            <TrendingUp size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Depósito</span>
                        </button>
                     </div>

                     <div className="relative">
                        <input 
                            type="number" 
                            value={balanceAmount} 
                            onChange={(e) => setBalanceAmount(e.target.value)}
                            placeholder="0.00"
                            className={`w-full bg-background/40 border rounded-2xl py-6 text-center text-2xl font-mono font-black focus:outline-none transition-all ${balanceOpType === 'DEPOSIT' ? 'text-primary border-primary/50' : 'text-loss border-loss/50'}`}
                        />
                        <label className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 bg-black text-[10px] font-black text-gray-500 uppercase tracking-widest border border-border rounded-full">
                            Monto de la Operación
                        </label>
                    </div>
                </div>
            )}

            {/* Advanced Toggle (Only for Trading) */}
            {entryMode === 'TRADING' && (
                <button 
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="w-full py-2 flex items-center justify-center gap-2 text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] hover:text-white transition-colors"
                >
                    {showAdvanced ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showAdvanced ? 'Ocultar Detalles' : 'Más Detalles'}
                </button>
            )}

            {(showAdvanced || entryMode === 'BALANCE') && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                    {entryMode === 'TRADING' && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="relative">
                                    <input type="number" value={entryPrice} onChange={e => setEntryPrice(e.target.value)} className="w-full bg-background/20 border border-border rounded-xl p-3 text-xs text-white font-mono" placeholder="0.00000" />
                                    <label className="absolute -top-2 left-4 px-1 bg-surface text-[8px] font-black text-gray-600 uppercase">Precio Entrada</label>
                                </div>
                                <div className="relative">
                                    <input type="number" value={commission} onChange={e => setCommission(e.target.value)} className="w-full bg-background/20 border border-border rounded-xl p-3 text-xs text-loss font-mono" placeholder="0.00" />
                                    <label className="absolute -top-2 left-4 px-1 bg-surface text-[8px] font-black text-gray-600 uppercase">Comisión</label>
                                </div>
                            </div>
                             <div className="flex bg-background/20 rounded-xl border border-border overflow-hidden">
                                {TIMEFRAMES.map(tf => (
                                    <button key={tf} onClick={() => setTimeframe(tf)} className={`flex-1 text-[9px] font-black py-2 ${timeframe === tf ? 'bg-white/10 text-white' : 'text-gray-600'}`}>{tf}</button>
                                ))}
                            </div>
                            <div className="relative">
                                <input type="url" value={tradingViewUrl} onChange={e => setTradingViewUrl(e.target.value)} className="w-full bg-background/20 border border-border rounded-xl p-3 pl-10 text-xs text-white font-mono" placeholder="https://www.tradingview.com/x/..." />
                                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                                <label className="absolute -top-2 left-4 px-1 bg-surface text-[8px] font-black text-gray-600 uppercase">Link TradingView</label>
                            </div>
                        </>
                    )}
                    <textarea 
                        value={notes} 
                        onChange={e => setNotes(e.target.value)}
                        placeholder="Notas adicionales..."
                        className="w-full h-24 bg-background/20 border border-border rounded-2xl p-4 text-xs text-gray-300 resize-none focus:outline-none focus:border-white/20"
                    ></textarea>
                </div>
            )}

            {/* Footer de Acciones */}
            <div className="pt-4 flex flex-col gap-3">
                <button 
                    onClick={() => handleSave()}
                    className={`w-full py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl ${
                        entryMode === 'BALANCE' 
                            ? 'bg-white text-black shadow-white/10' 
                            : isIdea 
                                ? 'bg-yellow-500 text-black shadow-yellow-500/10' 
                                : 'bg-primary text-black shadow-primary/10'
                    }`}
                >
                    {id ? 'Actualizar Registro' : entryMode === 'BALANCE' ? 'Registrar Movimiento' : 'Finalizar Trade'}
                </button>
                {id && (
                    <button onClick={handleDelete} className="w-full py-3 text-[9px] font-black text-loss uppercase tracking-widest hover:bg-loss/5 rounded-xl transition-all">
                        Eliminar Registro
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

export default TradeEntry;
