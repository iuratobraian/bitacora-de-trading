
import React from 'react';
import { Activity, TrendingUp, DollarSign, Trophy, Wallet, Radio, List, Clock, ExternalLink, Landmark, Percent, Loader2, RefreshCw, Lightbulb, Sparkles, Plus, X, AlertTriangle, Database, Zap, Target, ShieldCheck, Thermometer, AlertOctagon, BarChart2, Crosshair, Download, Calendar, Link as LinkIcon } from 'lucide-react';
import { storageService } from '../services/storageService';
import TradeEntry from './TradeEntry';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import CalendarView from './CalendarView';

const EquityChart = React.lazy(() => import('./EquityChart'));
const DailyPnLChart = React.lazy(() => import('./DailyPnLChart'));

const PSYCHOLOGY_MESSAGES = [
  "El trading no se trata de tener razón, sino de hacer dinero.",
  "La disciplina de seguir tu plan es el activo más valioso que tienes.",
  "Un trade perdedor es solo un gasto operativo, no un fracaso personal.",
  "El mercado es un mecanismo para transferir dinero de los impacientes a los pacientes.",
  "No busques predecir, busca reaccionar a lo que el precio te muestra.",
  "Tu ventaja estadística solo se manifiesta a través de una muestra grande de trades.",
  "El riesgo siempre debe ser tu prioridad antes que el beneficio potencial.",
  "Acepta la incertidumbre; el próximo trade es probabilístico, no determinista.",
  "Controla tus emociones o ellas controlarán tu cuenta bancaria.",
  "La consistencia es el resultado de la repetición de procesos correctos."
];

const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2
    }).format(val);
};

const StatCard = ({ title, value, subtext, isPositive, icon: Icon, percent, isSyncing, trend }: any) => (
  <div className="bg-surface border border-border p-5 rounded-2xl flex flex-col justify-between hover:border-border/80 transition-all group relative overflow-hidden shadow-lg hover:shadow-primary/5 h-full">
    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity rotate-12">
        {isSyncing ? <RefreshCw className="animate-spin text-primary" size={56} /> : <Icon size={56} />}
    </div>
    <div>
      <p className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2">
        <h3 className="text-2xl xl:text-3xl font-black text-white font-mono tracking-tighter">{value}</h3>
        {percent !== undefined && (
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${percent >= 0 ? 'bg-primary/10 text-primary' : 'bg-loss/10 text-loss'}`}>
                {percent >= 0 ? '+' : ''}{percent.toFixed(2)}%
            </span>
        )}
      </div>
    </div>
    <div className="mt-4 flex items-center justify-between">
      <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
        <span className={`${isPositive ? 'text-primary' : 'text-loss'}`}>{subtext}</span>
      </div>
      {trend && (
        <div className="flex gap-1">
          {trend.map((v: number, i: number) => (
            <div key={i} className={`w-1 h-3 rounded-full ${v > 0 ? 'bg-primary/40' : 'bg-loss/40'}`} style={{ height: `${Math.abs(v) * 10}px` }}></div>
          ))}
        </div>
      )}
    </div>
  </div>
);

const IntelligenceCard = ({ title, value, subtext, icon: Icon, colorClass }: any) => (
    <div className="bg-black/30 border border-white/5 rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden group">
        <div className={`p-3 rounded-xl bg-opacity-10 ${colorClass.replace('text-', 'bg-')} ${colorClass}`}>
            <Icon size={20} />
        </div>
        <div>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-0.5">{title}</p>
            <p className="text-lg font-black text-white font-mono">{value}</p>
            {subtext && <p className={`text-[9px] font-bold ${colorClass} opacity-80`}>{subtext}</p>}
        </div>
        <div className={`absolute -right-2 -bottom-2 opacity-5 rotate-12 ${colorClass}`}>
            <Icon size={48} />
        </div>
    </div>
);

const SessionStatus = () => {
    const [time, setTime] = React.useState(new Date());

    React.useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 60000);
        return () => clearInterval(timer);
    }, []);

    const getSessionStatus = (start: number, end: number, current: number) => {
        if (start < end) return current >= start && current < end;
        return current >= start || current < end; 
    };

    const utcHour = time.getUTCHours();
    
    const sessions = [
        { name: 'Londres', start: 8, end: 16 },
        { name: 'N. York', start: 13, end: 21 },
        { name: 'Tokio', start: 0, end: 8 },
        { name: 'Sídney', start: 22, end: 6 }
    ];

    return (
        <div className="flex flex-wrap gap-3 bg-surface/40 border border-white/5 px-4 py-2 rounded-2xl backdrop-blur-md">
            {sessions.map(s => {
                const isActive = getSessionStatus(s.start, s.end, utcHour);
                return (
                    <div key={s.name} className="flex items-center gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${isActive ? 'bg-primary animate-pulse shadow-[0_0_8px_rgba(0,204,102,0.5)]' : 'bg-gray-600'}`}></div>
                        <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-gray-500'}`}>{s.name}</span>
                    </div>
                );
            })}
        </div>
    );
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<any>({ 
      assetsBreakdown: [], 
      sessionBreakdown: [], 
      equityCurve: [],
      dailyPnl: 0,
      dailyGrowth: 0,
      bestAsset: '---',
      suggestedRR: 0,
      avgTradesPerDay: 0,
      maxLossStreak: 0,
      last7DaysPnL: []
  });
  const [growthPercent, setGrowthPercent] = React.useState(0);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = React.useState(0);
  const [isEntryModalOpen, setIsEntryModalOpen] = React.useState(false);
  const [dbError, setDbError] = React.useState(false);

  const loadData = () => {
      const s = storageService.getStats();
      const growth = s.baseBalance > 0 ? ((s.currentBalance + s.totalWithdrawn - s.baseBalance) / s.baseBalance) * 100 : 0;
      setGrowthPercent(growth);
      setStats(s);
  };

  const handleManualSync = async () => {
      setIsSyncing(true);
      await storageService.syncFromCloud();
      loadData();
      setIsSyncing(false);
  };

  const checkDb = async () => {
      try {
          const { error } = await supabase.from('app_trades').select('ticket').limit(1);
          if (error && (error.code === 'PGRST204' || error.message.includes('ticket'))) {
              setDbError(true);
          } else {
              setDbError(false);
          }
      } catch (e) {
          setDbError(true);
      }
  };

  React.useEffect(() => {
    loadData();
    checkDb();
    window.addEventListener('apex-db-change', loadData);
    
    const messageInterval = setInterval(() => {
        setCurrentMessageIndex(prev => (prev + 1) % PSYCHOLOGY_MESSAGES.length);
    }, 10000);

    return () => {
        window.removeEventListener('apex-db-change', loadData);
        clearInterval(messageInterval);
    };
  }, []);

  // Calcular estilo para Racha de Pérdidas
  let streakBgClass = "bg-background/40 border-white/5";
  let streakTextClass = "text-white";
  let streakIconColor = "text-gray-500";
  
  if (stats.maxLossStreak === 3) {
      streakBgClass = "bg-yellow-500/10 border-yellow-500/50";
      streakTextClass = "text-yellow-500";
      streakIconColor = "text-yellow-500";
  } else if (stats.maxLossStreak > 3) {
      streakBgClass = "bg-loss/10 border-loss animate-pulse";
      streakTextClass = "text-loss";
      streakIconColor = "text-loss";
  }

  return (
    <div className="p-4 md:p-8 w-full max-w-[96%] 2xl:max-w-[1920px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500 pb-24">
      
      {/* QUICK ENTRY MODAL */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10 animate-in fade-in zoom-in-95 duration-300">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setIsEntryModalOpen(false)}></div>
            <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button 
                  onClick={() => setIsEntryModalOpen(false)}
                  className="absolute top-6 right-6 z-[110] p-2 bg-surface border border-border rounded-full text-gray-400 hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <TradeEntry 
                    onClose={() => setIsEntryModalOpen(false)} 
                    onSuccess={() => {
                        setIsEntryModalOpen(false);
                        loadData();
                    }}
                />
            </div>
        </div>
      )}

      {/* DB ERROR BANNER - GLOBAL */}
      {dbError && (
          <div className="mb-8 bg-loss border border-loss rounded-3xl p-6 shadow-2xl relative overflow-hidden animate-pulse cursor-pointer hover:brightness-110 transition-all" onClick={() => (document.querySelector('button[title="Ajustes"]') as HTMLElement)?.click()}>
              <div className="flex items-center gap-4 relative z-10">
                  <div className="bg-white/20 p-3 rounded-full">
                      <Database className="text-white" size={32} />
                  </div>
                  <div>
                      <h2 className="text-xl font-black text-white uppercase tracking-tighter">SISTEMA DE SINCRONIZACIÓN DETENIDO</h2>
                      <p className="text-xs text-white/90 font-bold uppercase tracking-widest mt-1">El esquema de Base de Datos está incompleto. Haz clic aquí o ve a Ajustes para repararlo.</p>
                  </div>
              </div>
          </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Radio size={20} className="text-primary animate-pulse" />
              <h1 className="text-3xl font-black text-white uppercase tracking-tighter">BI TERMINAL</h1>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em]">Braian Iurato Edition | Inteligencia de Riesgo 1%</p>
          </div>
          <SessionStatus />
        </div>
        
        <div className="flex items-center gap-3">
            <button 
                onClick={() => setIsEntryModalOpen(true)}
                className="w-14 h-14 bg-gradient-to-br from-primary to-primary-dark text-black rounded-full flex items-center justify-center shadow-xl shadow-primary/20 hover:scale-110 active:scale-95 transition-all group"
                title="Nueva Operación"
            >
                <Plus size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            </button>
            <button 
                onClick={handleManualSync}
                disabled={isSyncing}
                className="w-14 h-14 bg-surface border border-border text-gray-400 rounded-full flex items-center justify-center hover:text-primary hover:border-primary/30 transition-all disabled:opacity-50"
                title="Sincronizar MT5"
            >
                {isSyncing ? <RefreshCw size={20} className="animate-spin" /> : <RefreshCw size={20} />}
            </button>
            <button 
                onClick={() => (document.querySelector('button[title="Ajustes"]') as HTMLElement)?.click()}
                className="flex items-center gap-1 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] hover:text-primary transition-all opacity-60 hover:opacity-100"
                title="Descargar EA para MT5"
            >
                <LinkIcon size={10} />
                Portal EA
            </button>
        </div>
      </div>

      {/* COMPACT INTELLIGENCE CENTER */}
      <div className="mb-8 flex flex-col lg:flex-row gap-6">
          <div className="lg:w-[35%] bg-primary/5 border border-primary/20 rounded-3xl p-6 relative overflow-hidden shadow-xl flex flex-col justify-center">
              <div className="relative z-10">
                  <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                      <Sparkles size={10} /> Mindset
                  </p>
                  <p className="text-sm font-bold text-gray-200 animate-in slide-in-from-right duration-700 italic leading-relaxed">
                      "{PSYCHOLOGY_MESSAGES[currentMessageIndex]}"
                  </p>
              </div>
              <div className="absolute -bottom-4 -right-4 opacity-5">
                  <Lightbulb size={100} className="text-primary" />
              </div>
          </div>

          <div className="lg:w-[65%] flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface border border-border rounded-3xl p-4 shadow-xl">
                 <IntelligenceCard 
                    title="% Diario" 
                    value={`${stats.dailyGrowth >= 0 ? '+' : ''}${stats.dailyGrowth.toFixed(2)}%`}
                    subtext={formatCurrency(stats.dailyPnl)}
                    icon={TrendingUp}
                    colorClass={stats.dailyGrowth >= 0 ? 'text-primary' : 'text-loss'}
                 />
                 <IntelligenceCard 
                    title="Activo Maestro" 
                    value={stats.bestAsset}
                    subtext="Mejor Desempeño"
                    icon={Target}
                    colorClass="text-yellow-500"
                 />
                 <IntelligenceCard 
                    title="RR Sugerido" 
                    value={`1:${stats.suggestedRR}`}
                    subtext={stats.suggestedRR > 2 ? 'Modo: Agresivo' : 'Modo: Conservador'}
                    icon={Crosshair}
                    colorClass="text-blue-400"
                 />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface border border-border rounded-3xl p-4 shadow-xl">
                 <IntelligenceCard 
                    title="Profit Factor" 
                    value={stats.profitFactor || '0.00'}
                    subtext="Beneficio / Pérdida"
                    icon={Activity}
                    colorClass={Number(stats.profitFactor) >= 1.5 ? 'text-primary' : 'text-yellow-500'}
                 />
                 <IntelligenceCard 
                    title="Recuperación" 
                    value={stats.avgLossRecovery || '0.00'}
                    subtext="Promedio de Recuperación"
                    icon={TrendingUp}
                    colorClass={Number(stats.avgLossRecovery) >= 1 ? 'text-primary' : 'text-loss'}
                 />
                 <IntelligenceCard 
                    title="Overall Drawdown" 
                    value={`${stats.overallDrawdown || '0.00'}%`}
                    subtext="Caída Máxima"
                    icon={AlertTriangle}
                    colorClass={Number(stats.overallDrawdown) > 10 ? 'text-loss' : 'text-yellow-500'}
                 />
              </div>
          </div>
      </div>

      {/* DISCIPLINE TRAFFIC LIGHT & DAILY PNL SECTION */}
      <div className="mb-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SEMÁFORO DISCIPLINA */}
          <div className="bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-6">
                <ShieldCheck size={14} className="text-white" /> Semáforo de Disciplina
            </h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
                
                {/* Daily Volume */}
                <div className="bg-background/40 p-4 rounded-2xl border border-white/5 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">Volumen Diario</p>
                        <Thermometer size={16} className={stats.avgTradesPerDay > 5 ? 'text-loss' : stats.avgTradesPerDay < 3 ? 'text-primary' : 'text-yellow-500'} />
                    </div>
                    <div>
                        <p className="text-2xl font-black font-mono text-white">{stats.avgTradesPerDay.toFixed(1)}</p>
                        <p className="text-[9px] text-gray-400">Promedio trades / día</p>
                    </div>
                    {stats.avgTradesPerDay > 5 && <p className="text-[8px] text-loss font-black uppercase mt-2">¡Sobregiro detectado!</p>}
                </div>

                {/* Loss Streak (MODIFIED) */}
                <div className={`${streakBgClass} p-4 rounded-2xl border flex flex-col justify-between transition-all duration-300`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className={`text-[9px] font-bold uppercase tracking-widest ${streakIconColor === 'text-gray-500' ? 'text-gray-500' : 'text-white'}`}>Racha Pérdidas (Hoy)</p>
                        <AlertOctagon size={16} className={streakIconColor} />
                    </div>
                    <div>
                        <p className={`text-2xl font-black font-mono ${streakTextClass}`}>{stats.maxLossStreak}</p>
                        <p className={`text-[9px] ${streakTextClass} opacity-80`}>Consecutivas máx.</p>
                    </div>
                    {stats.maxLossStreak >= 3 && <p className={`text-[8px] font-black uppercase mt-2 ${streakTextClass}`}>{stats.maxLossStreak === 3 ? "¡Cuidado! Pausa Sugerida." : "¡DETENTE! RIESGO ALTO."}</p>}
                </div>
            </div>
          </div>

          {/* GRÁFICO PNL 7 DÍAS */}
          <div className="lg:col-span-2 bg-surface border border-border rounded-3xl p-6 shadow-2xl relative overflow-hidden">
             <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                 <BarChart2 size={14} className="text-white" /> Rendimiento Semanal (7 Días)
             </h3>
             <div className="h-[120px] w-full">
                <React.Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
                    <DailyPnLChart data={stats.last7DaysPnL} />
                </React.Suspense>
             </div>
          </div>
      </div>

      {/* Stats Grid - CONSOLIDATED */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <StatCard 
              title="PnL / Equidad" 
              value={formatCurrency(stats.equity || 0)} 
              subtext={`${formatCurrency(stats.totalPnl || 0)} PnL Realizado`} 
              isPositive={stats.equity >= stats.baseBalance} 
              percent={growthPercent}
              icon={Wallet} 
          />
          <div className="bg-surface border border-border p-5 rounded-2xl flex flex-col justify-center items-center shadow-lg">
              <p className="text-gray-500 text-[10px] font-black uppercase mb-2 tracking-widest">Win Rate Global</p>
              <h3 className="text-3xl font-black text-white font-mono tracking-tighter">{stats.winRate}%</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{stats.wins} G / {stats.losses} P</p>
          </div>
          <CalendarView />
      </div>

      <div className="grid grid-cols-12 gap-6">
          {/* Gráfico principal */}
          <div className="col-span-full lg:col-span-8 2xl:col-span-9 bg-surface border border-border rounded-3xl p-8 h-[320px] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent"></div>
              <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <TrendingUp size={14} className="text-primary" /> Curva de Crecimiento
                    </h3>
                </div>
              </div>
              <div className="h-[240px] w-full">
                <React.Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>}>
                    <EquityChart data={stats.equityCurve} />
                </React.Suspense>
              </div>
          </div>

          {/* Breakdown Lateral - TABLA DETALLADA */}
          <div className="col-span-full lg:col-span-4 2xl:col-span-3 bg-surface border border-border rounded-3xl p-6 flex flex-col h-[320px] shadow-2xl relative overflow-hidden">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-4">
                  <List size={14} className="text-primary" /> Desglose Detallado
              </h3>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead className="sticky top-0 bg-surface z-10 text-[9px] font-black uppercase text-gray-500 tracking-wider">
                          <tr>
                              <th className="pb-3">Activo</th>
                              <th className="pb-3 text-center">Trades</th>
                              <th className="pb-3 text-center">WR%</th>
                              <th className="pb-3 text-right">RR Avg</th>
                              <th className="pb-3 text-right">PnL</th>
                          </tr>
                      </thead>
                      <tbody className="text-xs font-mono">
                          {stats.assetsBreakdown && stats.assetsBreakdown.length > 0 ? (
                              stats.assetsBreakdown.map((asset: any, idx: number) => (
                                  <tr key={idx} className="border-b border-border/30 last:border-0 hover:bg-white/5 transition-colors">
                                      <td className="py-2.5 font-bold text-white">{asset.symbol}</td>
                                      <td className="py-2.5 text-center text-gray-400">{asset.count}</td>
                                      <td className={`py-2.5 text-center font-black ${Number(asset.winRate) >= 50 ? 'text-primary' : 'text-loss'}`}>{asset.winRate}%</td>
                                      <td className="py-2.5 text-right text-gray-400">{asset.avgRR}</td>
                                      <td className={`py-2.5 text-right font-black ${asset.pnl >= 0 ? 'text-primary' : 'text-loss'}`}>
                                          {formatCurrency(asset.pnl)}
                                      </td>
                                  </tr>
                              ))
                          ) : (
                              <tr>
                                  <td colSpan={5} className="py-10 text-center opacity-30">
                                      <div className="flex flex-col items-center">
                                          <Activity size={24} className="mb-2" />
                                          <span className="text-[10px] font-black uppercase">Sin datos</span>
                                      </div>
                                  </td>
                              </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

           {/* Sesiones - AÑADIDO NUEVAMENTE */}
           <div className="col-span-full bg-surface border border-border rounded-3xl p-8 shadow-2xl mt-2">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                      <Clock size={14} className="text-primary" /> Rendimiento de Sesión
                  </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {stats.sessionBreakdown && stats.sessionBreakdown.map((s: any, i: number) => (
                      <div key={i} className="bg-background/50 p-6 rounded-2xl border border-border/50 hover:border-primary/30 transition-all">
                          <div className="flex items-center justify-between mb-4">
                            <span className="text-[10px] font-black text-white uppercase tracking-widest">{s.name}</span>
                            <span className={`text-xs font-mono font-black ${s.pnl >= 0 ? 'text-primary' : 'text-loss'}`}>
                                {s.pnl >= 0 ? '+' : ''}{formatCurrency(s.pnl)}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-[8px] text-gray-500 font-bold uppercase block mb-1">Trades</span>
                                <span className="text-xs font-mono font-bold text-gray-300">{s.count}</span>
                            </div>
                            <div className="text-right">
                                <span className="text-[8px] text-gray-500 font-bold uppercase block mb-1">Win Rate</span>
                                <span className={`text-xs font-mono font-bold ${Number(s.winRate) >= 50 ? 'text-primary' : 'text-loss'}`}>{s.winRate}%</span>
                            </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};

export default Dashboard;
