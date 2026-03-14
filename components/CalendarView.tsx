import React from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { storageService } from '../services/storageService';
import { Trade } from '../types';

const CalendarView: React.FC = () => {
    const [currentDate, setCurrentDate] = React.useState(new Date());
    const [selectedDay, setSelectedDay] = React.useState<Date | null>(null);
    const dailyStats = storageService.getDailyStats();
    const allTrades = storageService.getTrades();

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
        days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push(new Date(year, month, i));
    }

    const changeMonth = (offset: number) => {
        setCurrentDate(new Date(year, month + offset, 1));
    };

    const getTradesForDay = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        return allTrades.filter(t => t.date.startsWith(dateStr));
    };

    return (
        <div className="bg-surface border border-border rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Calendario de Trades</h3>
                <div className="flex items-center gap-2">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white/5 rounded-full"><ChevronLeft size={16} /></button>
                    <span className="text-sm font-black uppercase tracking-widest">{currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white/5 rounded-full"><ChevronRight size={16} /></button>
                </div>
            </div>
            <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => <div key={d} className="text-[9px] font-bold text-gray-500 text-center uppercase">{d}</div>)}
                {days.map((day, i) => {
                    if (!day) return <div key={i}></div>;
                    const dateStr = day.toISOString().split('T')[0];
                    const stats = dailyStats[dateStr];
                    const winRate = stats ? (stats.wins / stats.count) * 100 : 0;
                    const isProfit = stats && stats.pnl > 0;
                    const isLoss = stats && stats.pnl < 0;

                    return (
                        <div 
                            key={i} 
                            onClick={() => stats && setSelectedDay(day)} 
                            className={`aspect-square p-1 rounded-xl border flex flex-col items-center justify-center text-[9px] transition-all ${
                                stats 
                                ? (isProfit 
                                    ? 'bg-primary/10 border-primary/30 hover:bg-primary/20' 
                                    : isLoss 
                                        ? 'bg-loss/10 border-loss/30 hover:bg-loss/20' 
                                        : 'bg-white/5 border-white/10 hover:bg-white/10') 
                                : 'bg-background/20 border-white/5 opacity-40'
                            } ${stats ? 'cursor-pointer hover:scale-105 active:scale-95' : ''}`}
                        >
                            <span className="font-bold text-gray-400 mb-1">{day.getDate()}</span>
                            {stats && (
                                <div className="flex flex-col items-center leading-none">
                                    <span className="font-black text-white text-[10px]">{stats.count}</span>
                                    <span className={`text-[8px] font-bold ${isProfit ? 'text-primary' : isLoss ? 'text-loss' : 'text-gray-500'}`}>
                                        {winRate.toFixed(0)}%
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {selectedDay && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="bg-surface border border-border rounded-3xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Trades: {selectedDay.toLocaleDateString()}</h3>
                            <button onClick={() => setSelectedDay(null)} className="p-2 hover:bg-white/5 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="space-y-4">
                            {getTradesForDay(selectedDay).map((trade: Trade) => (
                                <div key={trade.id} className="bg-background/40 p-4 rounded-xl border border-white/5 flex justify-between items-center">
                                    <div>
                                        <p className="font-black text-white">{trade.asset}</p>
                                        <p className="text-[10px] text-gray-500">{trade.type} | {new Date(trade.date).toLocaleTimeString()}</p>
                                    </div>
                                    <p className={`font-black font-mono ${trade.pnl >= 0 ? 'text-primary' : 'text-loss'}`}>
                                        {trade.pnl >= 0 ? '+' : ''}{trade.pnl.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarView;
