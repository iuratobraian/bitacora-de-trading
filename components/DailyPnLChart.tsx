
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Calendar } from 'lucide-react';

interface DailyPnLChartProps {
    data: any[];
}

const DailyPnLChart: React.FC<DailyPnLChartProps> = ({ data }) => {
    if (!data || data.length === 0) {
        return (
            <div className="h-full w-full flex flex-col items-center justify-center text-gray-600 border border-dashed border-border rounded-lg">
                <Calendar size={32} className="mb-2 opacity-50"/>
                <p className="text-sm">Sin datos recientes</p>
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
                <XAxis 
                    dataKey="date" 
                    stroke="#555" 
                    tick={{fill: '#555', fontSize: 10}} 
                    axisLine={false} 
                    tickLine={false} 
                />
                <YAxis hide />
                <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                    contentStyle={{ backgroundColor: '#0a0a0a', borderColor: '#262626', color: '#fff', fontSize: '12px', borderRadius: '8px' }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, 'PnL Diario']}
                />
                <ReferenceLine y={0} stroke="#333" />
                <Bar dataKey="value" radius={[4, 4, 4, 4]}>
                    {data.map((entry, index) => (
                        <Cell 
                            key={`cell-${index}`} 
                            fill={entry.value >= 0 ? '#00cc66' : '#ef4444'} 
                            fillOpacity={entry.isToday ? 1 : 0.4}
                            stroke={entry.isToday ? '#fff' : 'none'}
                            strokeWidth={entry.isToday ? 1 : 0}
                        />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    );
};

export default DailyPnLChart;
